package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
)

type ActionsRepository struct {
	conn sqlc.Querier
}

func NewActionsRepository(conn sqlc.Querier) *ActionsRepository {
	return &ActionsRepository{conn: conn}
}

var _ actionsdomain.Repository = (*ActionsRepository)(nil)

func (a *ActionsRepository) Create(ctx context.Context, user domain.UUID, purpose actionsdomain.Purpose, expires time.Time) (*actionsdomain.Action, error) {
	//TODO implement me
	panic("implement me")
}

func (a *ActionsRepository) Use(ctx context.Context, purpose actionsdomain.Purpose, hash string) error {
	//TODO implement me
	panic("implement me")
}

func (a *ActionsRepository) Find(ctx context.Context, purpose actionsdomain.Purpose, hash string) (*actionsdomain.Action, error) {
	//TODO implement me
	panic("implement me")
}

func (a *ActionsRepository) ByOwner(ctx context.Context, user domain.UUID) (actionsdomain.Actions, error) {
	//TODO implement me
	panic("implement me")
}

func (a *ActionsRepository) IsValid(ctx context.Context, purpose actionsdomain.Purpose, hash string) error {
	//TODO implement me
	panic("implement me")
}
