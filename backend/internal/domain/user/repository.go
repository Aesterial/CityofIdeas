package userdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, username string, email string, passHash string) (*User, error)
	IsUserExists(ctx context.Context, userMail string) (bool, error)
	IsBanned(ctx context.Context, user domain.UUID) (bool, error)
	User(ctx context.Context, user domain.UUID) (*User, error)
	UserByUsername(ctx context.Context, userMail string) (*User, error)
	UserPassword(ctx context.Context, user domain.UUID) (string, error)
	List(ctx context.Context, limit int32, offset int32) (Users, error)
	Preferences(ctx context.Context, user domain.UUID) (*Preferences, error)
	UpdatePreferences(ctx context.Context, user domain.UUID, prefs Preferences) (*Preferences, error)
	UpdatePassword(ctx context.Context, user domain.UUID, passHash string) error
	VerifyEmail(ctx context.Context, user domain.UUID) error
	StartTotp(ctx context.Context, user domain.UUID, secret string) error
	ConfirmTotp(ctx context.Context, user domain.UUID) error
	Security(ctx context.Context, user domain.UUID) (*Security, error)
	RecoveryCodes(ctx context.Context, user domain.UUID) ([]*RecoveryCode, error)
	UseRecovery(ctx context.Context, hash string) error
	InsertRecovery(ctx context.Context, user domain.UUID, hashes []string) error
}
