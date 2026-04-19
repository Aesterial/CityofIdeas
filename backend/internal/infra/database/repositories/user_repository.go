package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
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
	return &userdomain.Preferences{
		DisplayName:     prefs.DisplayName,
		Description:     prefs.Description,
		Avatar:          &prefs.AvatarHash.String,
		SessionLiveTime: prefs.SessionLive,
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

func (u *UserRepository) getRanks(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
	if user == nil {
		return nil, errors.InvalidArguments
	}
	list, err := u.conn.GetUserRanks(ctx, user.UID.ToPG())
	if err != nil {
		return nil, err
	}
	var out = make(ranksdomain.UserRanks, len(list))
	for i, e := range list {
		var expires *time.Time = nil
		if e.Expires.Valid {
			expires = &e.Expires.Time
		}
		out[i] = &ranksdomain.UserRank{
			Name:    e.Name,
			Color:   e.Color,
			Weight:  e.Weight,
			Expires: expires,
		}
	}
	user.Ranks = out
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
	usr := u.parseUser(user)
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

	listFn := func(ctx context.Context, args ...any) (userdomain.Users, error) {
		l, err := u.conn.GetUsers(ctx, sqlc.GetUsersParams{
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return nil, err
		}
		return u.parseUsers(l), nil
	}

	prefsFn := func(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
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
	ranksFn := func(ctx context.Context, user *userdomain.User) (*userdomain.User, error) {
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
	if v == nil {
		return false
	}
	if e == nil {
		return false
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
		ps.SessionLiveTime = prefs.SessionLiveTime
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

func (u *UserRepository) UseRecovery(ctx context.Context, hash string) error {
	return u.conn.UseRecoveryCode(ctx, hash)
}

func (u *UserRepository) InsertRecovery(ctx context.Context, user domain.UUID, hashes []string) error {
	var req = make([]sqlc.InsertRecoveryCodesParams, len(hashes))
	for i, hash := range hashes {
		req[i] = sqlc.InsertRecoveryCodesParams{
			Owner: user.ToPG(),
			Hash:  hash,
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
