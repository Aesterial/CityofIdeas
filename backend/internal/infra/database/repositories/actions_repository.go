package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5/pgtype"
)

type ActionsRepository struct {
	conn sqlc.Querier
}

func NewActionsRepository(conn sqlc.Querier) *ActionsRepository {
	return &ActionsRepository{conn: conn}
}

var _ actionsdomain.Repository = (*ActionsRepository)(nil)

func (a *ActionsRepository) Create(ctx context.Context, user *domain.UUID, purpose actionsdomain.Purpose, hash string, expires time.Time) (*actionsdomain.Action, error) {
	var usr = pgtype.UUID{Valid: false}
	if user != nil {
		usr.Valid = true
		usr.Bytes = user.UUID
	}
	row, err := a.conn.CreateAction(ctx, sqlc.CreateActionParams{
		Owner:   usr,
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
		Owner:     new(domain.FromPG(row.Owner)),
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
		Owner:     new(domain.FromPG(row.Owner)),
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
			Owner:     new(domain.FromPG(row.Owner)),
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
	if hash == "" {
		return errors.InvalidArguments
	}
	valid, err := a.conn.IsActionValid(ctx, sqlc.IsActionValidParams{
		Hash:    hash,
		Purpose: purpose.String(),
	})
	if err != nil {
		return err
	}
	if !valid {
		return errors.DataExpired
	}
	return nil
}

func (a *ActionsRepository) IsExists(ctx context.Context, hash string) error {
	if hash == "" {
		return errors.InvalidArguments
	}
	exists, err := a.conn.IsActionExists(ctx, hash)
	if err != nil {
		return err
	}
	if !exists {
		return errors.NotFound
	}
	return nil
}

func (a *ActionsRepository) Info(ctx context.Context, hash string) (*actionsdomain.Action, error) {
	if hash == "" {
		return nil, errors.InvalidArguments
	}
	action, err := a.conn.ActionInfo(ctx, hash)
	if err != nil {
		return nil, err
	}
	var used *time.Time = nil
	if action.Used.Valid {
		used = new(action.Used.Time)
	}
	return &actionsdomain.Action{
		ID:        domain.FromPG(action.ID),
		Owner:     new(domain.FromPG(action.Owner)),
		Purpose:   actionsdomain.Purpose(action.Purpose),
		Hash:      action.Hash,
		CreatedAt: action.At.Time,
		ExpiresAt: action.Expires.Time,
		Used:      used,
	}, nil
}
