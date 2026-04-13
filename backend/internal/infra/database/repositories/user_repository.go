package repositories

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type UserRepository struct {
	conn sqlc.Querier
}

func NewUserRepository(conn sqlc.Querier) *UserRepository {
	return &UserRepository{conn: conn}
}

var _ userdomain.Repository = (*UserRepository)(nil)

func (u *UserRepository) parseUser(usr sqlc.User) *userdomain.User {
	return &userdomain.User{
		UID:      domain.UUID{UUID: usr.Uid.Bytes},
		Username: usr.Username,
		Email:    usr.Email,
		Joined:   usr.Joined.Time,
	}
}

func (u *UserRepository) parseUsers(users []sqlc.User) userdomain.Users {
	var out = make(userdomain.Users, len(users))
	for _, usr := range users {
		out = append(out, u.parseUser(usr))
	}
	return out
}

func (u *UserRepository) parseSecurity(sec sqlc.UsersSecurity) *userdomain.Security {
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

func (u *UserRepository) parsePreferences(prefs sqlc.UsersPreference) *userdomain.Preferences {
	return &userdomain.Preferences{
		DisplayName:     prefs.DisplayName,
		Description:     prefs.Description,
		Avatar:          &prefs.AvatarHash.String,
		SessionLiveTime: prefs.SessionLive,
	}
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
	return u.parseUser(usr), nil
}

func (u *UserRepository) UserPassword(ctx context.Context, email string) (string, error) {
	id, err := u.conn.GetUserId(ctx, email)
	if err != nil {
		return "", err
	}
	password, err := u.conn.GetUserPassword(ctx, id)
	if err != nil {
		return "", err
	}
	return password, nil
}

func (u *UserRepository) List(ctx context.Context, limit int32, offset int32) (userdomain.Users, error) {
	if limit <= 0 {
		limit = 100
	}
	list, err := u.conn.GetUsers(ctx, sqlc.GetUsersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return u.parseUsers(list), nil
}

func (u *UserRepository) Preferences(ctx context.Context, user domain.UUID) (*userdomain.Preferences, error) {
	prefs, err := u.conn.GetUserPreferences(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	return u.parsePreferences(prefs), nil
}

func (u *UserRepository) UpdatePreferences(ctx context.Context, user domain.UUID, prefs userdomain.Preferences) (*userdomain.Preferences, error) {
	return nil, nil
}

func (u *UserRepository) UpdatePassword(ctx context.Context, user domain.UUID, passHash string) error {
	return nil
}

func (u *UserRepository) VerifyEmail(ctx context.Context, user domain.UUID) error {
	return nil
}

func (u *UserRepository) StartTotp(ctx context.Context, user domain.UUID, secret string) error {
	return nil
}

func (u *UserRepository) ConfirmTotp(ctx context.Context, user domain.UUID) error {
	return nil
}

func (u *UserRepository) Security(ctx context.Context, user domain.UUID) (*userdomain.Security, error) {
	return nil, nil
}

func (u *UserRepository) RecoveryCodes(ctx context.Context, user domain.UUID) ([]*userdomain.RecoveryCode, error) {
	return nil, nil
}

func (u *UserRepository) UseRecovery(ctx context.Context, hash string) error {
	return nil
}

func (u *UserRepository) InsertRecovery(ctx context.Context, user domain.UUID, hashes []string) error {
	return nil
}
