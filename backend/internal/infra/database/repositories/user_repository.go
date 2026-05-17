package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/aesterial/cityideas/backend/internal/shared/safe"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type UserRepository struct {
	conn sqlc.Querier
}

func NewUserRepository(conn sqlc.Querier) *UserRepository {
	return &UserRepository{conn: conn}
}

var _ userdomain.Repository = (*UserRepository)(nil)

func (*UserRepository) parseUser(usr sqlc.User) *userdomain.User {
	return &userdomain.User{
		UID:      domain.UUID{UUID: usr.Uid.Bytes},
		Username: usr.Username,
		Email:    usr.Email,
		Joined:   usr.Joined.Time,
	}
}

func (u *UserRepository) parseUsers(users []sqlc.User) userdomain.Users {
	var out = make(userdomain.Users, len(users))
	for i, usr := range users {
		out[i] = u.parseUser(usr)
	}
	return out
}

func (*UserRepository) parseSecurity(sec sqlc.UsersSecurity) *userdomain.Security {
	return &userdomain.Security{
		EmailVerified: sec.EmailVerified,
		TotpEnabled:   sec.TotpEnabled,
		Totp: &userdomain.SecurityTotp{
			TotpSecret:    &sec.TotpSecret.String,
			TotpConfirmed: &sec.TotpConfirmed.Time,
			TotpPending:   &sec.TotpPending.String,
			TotpPendingCR: &sec.TotpPendingCreated.Time,
			TotpLastStep:  &sec.TotpLastStep.Int64,
		},
	}
}

func (*UserRepository) parsePreferences(prefs sqlc.UsersPreference) *userdomain.Preferences {
	var city *string = nil
	if prefs.City.Valid {
		city = &prefs.City.String
	}
	var cityChanged *time.Time = nil
	if prefs.CityChanged.Valid {
		cityChanged = &prefs.CityChanged.Time
	}
	return &userdomain.Preferences{
		DisplayName:     prefs.DisplayName,
		Description:     prefs.Description,
		Avatar:          &prefs.AvatarHash.String,
		SessionLiveTime: prefs.SessionLive,
		Language:        userdomain.ParseLanguage(string(prefs.Language)),
		City:            city,
		CityChanged:     cityChanged,
	}
}

func (u *UserRepository) getPreferences(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
	if user == nil {
		return nil, errors.InvalidArguments
	}
	var err error
	user.Prefs, err = u.Preferences(ctx, user.UID)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (u *UserRepository) getSecurity(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
	if user == nil {
		return nil, errors.InvalidArguments
	}
	var err error
	user.Security, err = u.Security(ctx, user.UID)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (u *UserRepository) getRanks(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
	if user == nil {
		return nil, errors.InvalidArguments
	}
	rows, err := u.conn.GetUserRanks(ctx, user.UID.ToPG())
	if err != nil {
		return nil, err
	}
	ranks := make(ranksdomain.UserRanks, 0, len(rows))
	maxIndex := -1

	for i, row := range rows {
		if maxIndex == -1 || row.Weight > rows[maxIndex].Weight {
			maxIndex = i
		}
		var expires *time.Time
		if row.Expires.Valid {
			t := row.Expires.Time
			expires = &t
		}
		ranks = append(ranks, &ranksdomain.UserRank{
			Name:    row.Name,
			Color:   row.Color,
			Weight:  row.Weight,
			Expires: expires,
		})
	}
	user.Ranks = ranks
	if maxIndex == -1 {
		user.Permissions = nil
		return user, nil
	}
	permissions, err := permissionsdomain.FromJson(rows[maxIndex].Permissions)
	if err != nil {
		return nil, err
	}
	user.Permissions = permissions.Strings()
	return user, nil
}

func (u *UserRepository) completeUser(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
	if user == nil {
		return nil, errors.InvalidArguments
	}
	var err error
	user, err = u.getPreferences(ctx, user)
	if err != nil {
		return nil, err
	}
	user, err = u.getRanks(ctx, user)
	if err != nil {
		return nil, err
	}
	user, err = u.getSecurity(ctx, user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (u *UserRepository) Create(ctx context.Context, username string, email string, passHash string) (*userdomain.User, error) {
	if username == "" || email == "" || passHash == "" {
		return nil, errors.InvalidArguments
	}
	user, err := u.conn.CreateUser(ctx, sqlc.CreateUserParams{
		Username: username,
		Email:    email,
	})
	if err != nil {
		return nil, err
	}
	security, err := u.conn.CreateUserSecurity(ctx, sqlc.CreateUserSecurityParams{
		Owner:    user.Uid,
		Password: passHash,
	})
	if err != nil {
		return nil, err
	}
	prefs, err := u.conn.CreateUserPreferences(ctx, user.Uid)
	if err != nil {
		return nil, err
	}
	rank, err := u.conn.CreateUserDefaultRank(ctx, user.Uid)
	if err != nil {
		return nil, err
	}
	usr := u.parseUser(user)
	var expires *time.Time = nil
	if rank.Expires.Valid {
		expires = &rank.Expires.Time
	}
	usr.Ranks = append(usr.Ranks, &ranksdomain.UserRank{
		Name:    rank.Name,
		Color:   rank.Color,
		Weight:  rank.Weight,
		Expires: expires,
	})
	usr.Security = u.parseSecurity(security)
	usr.Prefs = u.parsePreferences(prefs)
	return usr, nil
}

func (u *UserRepository) User(ctx context.Context, user domain.UUID) (*userdomain.User, error) {
	usr, err := u.conn.GetUser(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	return u.completeUser(ctx, u.parseUser(usr))
}

func (u *UserRepository) UserByUsername(ctx context.Context, userMail string) (*userdomain.User, error) {
	usr, err := u.conn.GetUserByUserMail(ctx, userMail)
	if err != nil {
		return nil, err
	}
	return u.completeUser(ctx, u.parseUser(usr))
}

func (u *UserRepository) UserPassword(ctx context.Context, user domain.UUID) (string, error) {
	password, err := u.conn.GetUserPassword(ctx, user.ToPG())
	if err != nil {
		return "", err
	}
	return password, nil
}

func (u *UserRepository) List(ctx context.Context, limit int32, offset int32) (userdomain.Users, error) {
	if limit <= 0 {
		limit = 100
	}

	listFn := func(_ context.Context, args ...any) (userdomain.Users, error) {
		l, err := u.conn.GetUsers(ctx, sqlc.GetUsersParams{
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return nil, err
		}
		return u.parseUsers(l), nil
	}

	prefsFn := func(_ context.Context, user *userdomain.User) (*userdomain.User, error) {
		if user == nil {
			return nil, errors.InvalidArguments
		}

		var err error
		user, err = u.getPreferences(ctx, user)
		if err != nil {
			return nil, err
		}
		return user, nil
	}
	ranksFn := func(_ context.Context, user *userdomain.User) (*userdomain.User, error) {
		if user == nil {
			return nil, errors.InvalidArguments
		}
		var err error
		user, err = u.getRanks(ctx, user)
		if err != nil {
			return nil, err
		}
		return user, nil
	}

	return safe.Hydration[userdomain.Users, *userdomain.User](
		5*time.Second,
		listFn,
		[]func(context.Context, *userdomain.User) (*userdomain.User, error){
			prefsFn,
			ranksFn,
		},
		2,
	)
}

func (u *UserRepository) Preferences(ctx context.Context, user domain.UUID) (*userdomain.Preferences, error) {
	prefs, err := u.conn.GetUserPreferences(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	return u.parsePreferences(prefs), nil
}

func isPointerChanged[T comparable](v, e *T) bool {
	if v == nil || e == nil {
		return v != e
	}
	return *v != *e
}

func isChanged[T comparable](v, e T) bool {
	return v != e
}

func (u *UserRepository) UpdatePreferences(ctx context.Context, user domain.UUID, prefs userdomain.Preferences) (*userdomain.Preferences, error) {
	ps, err := u.Preferences(ctx, user)
	if err != nil {
		return nil, err
	}
	logger.Info("user", "received city to change: ", logger.F("city", prefs.City))
	logger.Info("user", "saved city", logger.F("city", ps.City))
	if isPointerChanged(ps.City, prefs.City) {
		if ps.CityChanged == nil || ps.CityChanged.Add(30*24*time.Hour).Before(time.Now()) {
			logger.Info("user", "updating city")
			err = u.conn.UpdateUserCity(ctx, sqlc.UpdateUserCityParams{
				City: pgtype.Text{
					String: *prefs.City,
					Valid:  true,
				},
				Owner: user.ToPG(),
			})
			if err != nil {
				return nil, err
			}
		} else {
			return nil, errors.AccessDenied
		}
		ps.City = prefs.City
	}
	if isPointerChanged(ps.Avatar, prefs.Avatar) {
		err = u.conn.UpdateUserAvatar(ctx, sqlc.UpdateUserAvatarParams{
			AvatarHash: pgtype.Text{
				String: *prefs.Avatar,
				Valid:  true,
			},
			Owner: user.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		ps.Avatar = prefs.Avatar
	}
	if isChanged(ps.DisplayName, prefs.DisplayName) {
		err = u.conn.UpdateUserDisplayName(ctx, sqlc.UpdateUserDisplayNameParams{
			DisplayName: prefs.DisplayName,
			Owner:       user.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		ps.DisplayName = prefs.DisplayName
	}
	if isChanged(ps.Description, prefs.Description) {
		err = u.conn.UpdateUserDescription(ctx, sqlc.UpdateUserDescriptionParams{
			Description: prefs.Description,
			Owner:       user.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		ps.Description = prefs.Description
	}
	if isChanged(ps.SessionLiveTime, prefs.SessionLiveTime) {
		err = u.conn.UpdateUserSessionLive(ctx, sqlc.UpdateUserSessionLiveParams{
			SessionLive: prefs.SessionLiveTime,
			Owner:       user.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		ps.SessionLiveTime = prefs.SessionLiveTime
	}
	if isChanged(ps.Language, prefs.Language) {
		err = u.conn.UpdateUserLanguage(ctx, sqlc.UpdateUserLanguageParams{
			Language: sqlc.PreferencesLanguages(prefs.Language.String()),
			Owner:    user.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		ps.Language = prefs.Language
	}
	return ps, nil

}

func (u *UserRepository) UpdatePassword(ctx context.Context, user domain.UUID, passHash string) error {
	if len(passHash) <= 59 {
		return errors.InvalidArguments
	}
	return u.conn.UpdateUserPassword(ctx, sqlc.UpdateUserPasswordParams{
		Password: passHash,
		Owner:    user.ToPG(),
	})
}

func (u *UserRepository) VerifyEmail(ctx context.Context, user domain.UUID) error {
	return u.conn.SetUserSecurityEmailVerified(ctx, user.ToPG())
}

func (u *UserRepository) StartTotp(ctx context.Context, user domain.UUID, secret string) error {
	return u.conn.StartUserSecurityTotp(ctx, sqlc.StartUserSecurityTotpParams{
		Owner:       user.ToPG(),
		TotpPending: pgtype.Text{String: secret, Valid: true},
	})
}

func (u *UserRepository) ConfirmTotp(ctx context.Context, user domain.UUID) error {
	return u.conn.EndUserSecurityTotp(ctx, user.ToPG())
}

func (u *UserRepository) Security(ctx context.Context, user domain.UUID) (*userdomain.Security, error) {
	security, err := u.conn.GetUserSecurity(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	return u.parseSecurity(security), nil
}

func (*UserRepository) parseSecurityCode(row sqlc.UsersSecurityCode) *userdomain.RecoveryCode {
	var used *time.Time = nil
	if row.Used.Valid {
		used = &row.Used.Time
	}
	return &userdomain.RecoveryCode{
		Hash:    row.Hash,
		Used:    used,
		Created: row.Created.Time,
	}
}

func (u *UserRepository) parseSecurityCodes(rows []sqlc.UsersSecurityCode) []*userdomain.RecoveryCode {
	var list = make([]*userdomain.RecoveryCode, len(rows))
	for i, row := range rows {
		list[i] = u.parseSecurityCode(row)
	}
	return list
}

func (u *UserRepository) RecoveryCodes(ctx context.Context, user domain.UUID) ([]*userdomain.RecoveryCode, error) {
	codes, err := u.conn.GetUserRecoveryCodes(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	return u.parseSecurityCodes(codes), nil
}

func (u *UserRepository) RecoveryCodesWithSelector(ctx context.Context, user domain.UUID, selector string) (*userdomain.RecoveryCode, error) {
	codes, err := u.conn.GetUserRecoveryCodesWithSelector(ctx, sqlc.GetUserRecoveryCodesWithSelectorParams{
		Owner:    user.ToPG(),
		Selector: selector,
	})
	if err != nil {
		return nil, err
	}
	return u.parseSecurityCode(codes), nil
}

func (u *UserRepository) UseRecovery(ctx context.Context, selector string) error {
	return u.conn.UseRecoveryCode(ctx, selector)
}

func (u *UserRepository) InsertRecovery(ctx context.Context, user domain.UUID, hashes []userdomain.RecoveryCode) error {
	var req = make([]sqlc.InsertRecoveryCodesParams, len(hashes))
	for i, hash := range hashes {
		req[i] = sqlc.InsertRecoveryCodesParams{
			Owner:    user.ToPG(),
			Hash:     hash.Hash,
			Selector: hash.Selector,
		}
	}
	count, err := u.conn.InsertRecoveryCodes(ctx, req)
	if err != nil {
		return err
	}
	if count != int64(len(hashes)) {
		return errors.NotMatch
	}
	return nil
}

func (u *UserRepository) IsUserExists(ctx context.Context, userMail string) (bool, error) {
	if userMail == "" {
		return false, errors.InvalidArguments
	}
	exists, err := u.conn.IsUserExists(ctx, userMail)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, errors.NotFound
		}
		return false, err
	}
	return exists, nil
}

func (u *UserRepository) IsBanned(ctx context.Context, user domain.UUID) (bool, error) {
	banned, err := u.conn.IsUserBanned(ctx, user.ToPG())
	if err != nil {
		return false, err
	}
	return banned, nil
}

func (u *UserRepository) SetTotpLastStep(ctx context.Context, user domain.UUID, step int64) error {
	err := u.conn.SetTotpLastSeen(ctx, sqlc.SetTotpLastSeenParams{
		TotpLastStep: pgtype.Int8{
			Int64: step,
			Valid: true,
		},
		Owner: user.ToPG(),
	})
	if err != nil {
		return err
	}
	return nil
}

func (u *UserRepository) ResetTotp(ctx context.Context, user domain.UUID) error {
	err := u.conn.ResetTotp(ctx, user.ToPG())
	if err != nil {
		return err
	}
	err = u.conn.ResetTotpCodes(ctx, user.ToPG())
	if err != nil {
		return err
	}
	return nil
}

func (u *UserRepository) Ban(ctx context.Context, user domain.UUID, executor domain.UUID, reason string, until *time.Time) error {
	if reason == "" {
		return errors.InvalidArguments
	}
	var expires = pgtype.Timestamptz{Valid: false}
	if until != nil {
		expires = pgtype.Timestamptz{Time: *until, Valid: true}
	}
	err := u.conn.BanUser(ctx, sqlc.BanUserParams{
		Executor: executor.ToPG(),
		Target:   user.ToPG(),
		Reason:   reason,
		Expires:  expires,
	})
	if err != nil {
		return err
	}
	return nil
}

func (u *UserRepository) Unban(ctx context.Context, user domain.UUID, executor domain.UUID) error {
	err := u.conn.UnbanUser(ctx, sqlc.UnbanUserParams{
		Remove: executor.ToPG(),
		Target: user.ToPG(),
	})
	if err != nil {
		return err
	}
	return nil
}
