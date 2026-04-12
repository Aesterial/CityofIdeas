package sessionsdomain

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, user domain.UUID, expires time.Time, device domain.Device, hash string) (*Session, error)
	ByOwner(ctx context.Context, user domain.UUID) (Sessions, error)
	Revoke(ctx context.Context, session domain.UUID) error
	Extend(ctx context.Context, session domain.UUID, duration time.Duration) error
}
