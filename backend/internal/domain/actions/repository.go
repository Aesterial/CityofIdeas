package actionsdomain

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, user domain.UUID, purpose Purpose, hash string, expires time.Time) (*Action, error)
	Use(ctx context.Context, purpose Purpose, hash string) error
	Find(ctx context.Context, purpose Purpose, hash string) (*Action, error)
	ByOwner(ctx context.Context, user domain.UUID) (Actions, error)
	IsValid(ctx context.Context, purpose Purpose, hash string) error
}
