package userdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, username string, email string, passHash string) (*User, error)
	User(ctx context.Context, user domain.UUID) (*User, error)
	UserPassword(ctx context.Context, email string) (string, error)
	List(ctx context.Context, limit int, offset int) (Users, error)
	Preferences(ctx context.Context, user domain.UUID) (*Preferences, error)
	UpdatePreferences(ctx context.Context, user domain.UUID, prefs Preferences) (*Preferences, error)
	UpdatePassword(ctx context.Context, user domain.UUID, passHash string) error
	VerifyEmail(ctx context.Context, user domain.UUID) error
	StartTotp(ctx context.Context, user domain.UUID, secret string) error
	Security(ctx context.Context, user domain.UUID) (*Security, error)
	RecoveryCodes(ctx context.Context, user domain.UUID) ([]*RecoveryCode, error)
	InsertRecovery(ctx context.Context, user domain.UUID, hashes []string) error
}
