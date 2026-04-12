package ranksdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, name string, description *string, color int, weight int, permissions []byte) (*Rank, error)
	Update(ctx context.Context, name string, rank Rank) (*Rank, error)
	Delete(ctx context.Context, name string) error
	Rank(ctx context.Context, name string) (*Rank, error)
	User(ctx context.Context, user domain.UUID) (UserRanks, error)
	Users(ctx context.Context, name string) ([]*domain.UUID, error)
	Revoke(ctx context.Context, user domain.UUID, name string) error
}
