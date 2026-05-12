package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	sharederrors "github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5/pgtype"
)

type ActionsRepository struct {
	conn sqlc.Querier
}

func NewActionsRepository(conn sqlc.Querier) *ActionsRepository {
	return &ActionsRepository{conn: conn}
}

var _ actionsdomain.Repository = (*ActionsRepository)(nil)

func (a *ActionsRepository) Create(ctx context.Context, user domain.UUID, purpose actionsdomain.Purpose, hash string, expires time.Time) (*actionsdomain.Action, error) {
	row, err := a.conn.CreateAction(ctx, sqlc.CreateActionParams{
		Owner:   user.ToPG(),
		Purpose: purpose.String(),
		Hash:    hash,
		Expires: pgtype.Timestamptz{Time: expires, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	var used *time.Time
	if row.Used.Valid {
		used = &row.Used.Time
	}

	return &actionsdomain.Action{
		ID:        domain.FromPG(row.ID),
		Owner:     domain.FromPG(row.Owner),
		Purpose:   actionsdomain.Purpose(row.Purpose),
		Hash:      row.Hash,
		CreatedAt: row.At.Time,
		ExpiresAt: row.Expires.Time,
		Used:      used,
	}, nil
}

func (a *ActionsRepository) Use(ctx context.Context, purpose actionsdomain.Purpose, hash string) error {
	return a.conn.UseAction(ctx, sqlc.UseActionParams{
		Hash:    hash,
		Purpose: purpose.String(),
	})
}

func (a *ActionsRepository) Find(ctx context.Context, purpose actionsdomain.Purpose, hash string) (*actionsdomain.Action, error) {
	row, err := a.conn.FindAction(ctx, sqlc.FindActionParams{
		Hash:    hash,
		Purpose: purpose.String(),
	})
	if err != nil {
		return nil, err
	}

	var used *time.Time
	if row.Used.Valid {
		used = &row.Used.Time
	}

	return &actionsdomain.Action{
		ID:        domain.FromPG(row.ID),
		Owner:     domain.FromPG(row.Owner),
		Purpose:   actionsdomain.Purpose(row.Purpose),
		Hash:      row.Hash,
		CreatedAt: row.At.Time,
		ExpiresAt: row.Expires.Time,
		Used:      used,
	}, nil
}

func (a *ActionsRepository) ByOwner(ctx context.Context, user domain.UUID) (actionsdomain.Actions, error) {
	rows, err := a.conn.ActionsByOwner(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}

	var actions = make(actionsdomain.Actions, 0, len(rows))
	for _, row := range rows {
		var used *time.Time
		if row.Used.Valid {
			used = &row.Used.Time
		}
		actions = append(actions, &actionsdomain.Action{
			ID:        domain.FromPG(row.ID),
			Owner:     domain.FromPG(row.Owner),
			Purpose:   actionsdomain.Purpose(row.Purpose),
			Hash:      row.Hash,
			CreatedAt: row.At.Time,
			ExpiresAt: row.Expires.Time,
			Used:      used,
		})
	}

	return actions, nil
}

func (a *ActionsRepository) IsValid(ctx context.Context, purpose actionsdomain.Purpose, hash string) error {
	valid, err := a.conn.IsActionValid(ctx, sqlc.IsActionValidParams{
		Hash:    hash,
		Purpose: purpose.String(),
	})
	if err != nil {
		return err
	}
	if !valid {
		return sharederrors.DataExpired
	}
	return nil
}
