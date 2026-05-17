package citydomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, name string) (*City, error)
	List(ctx context.Context, limit int32, offset int32) (Cities, error)
	City(ctx context.Context, id domain.UUID) (*City, error)
	Delete(ctx context.Context, id domain.UUID) error
}
