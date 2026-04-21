package ranksdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, name string, description string, color int64, weight int32, permissions []byte) (*Rank, error)
	Update(ctx context.Context, name string, rank Rank) (*Rank, error)
	Delete(ctx context.Context, name domain.UUID) error
	Rank(ctx context.Context, name string) (*Rank, error)
	RankByID(ctx context.Context, id domain.UUID) (*Rank, error)
	Ranks(ctx context.Context, limit int32, offset int32) (Ranks, error)
	User(ctx context.Context, user domain.UUID) (UserRanks, error)
	Users(ctx context.Context, name string) ([]*domain.UUID, error)
	Revoke(ctx context.Context, user domain.UUID, name string) error
}
