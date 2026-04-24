package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type RankRepository struct {
	conn sqlc.Querier
}

func NewRankRepository(conn sqlc.Querier) *RankRepository {
	return &RankRepository{conn: conn}
}

var _ ranksdomain.Repository = (*RankRepository)(nil)

func (*RankRepository) parseRank(rank sqlc.Rank) *ranksdomain.Rank {
	set, err := permissionsdomain.FromJson(rank.Permissions)
	if err != nil {
		set = nil
	}
	return &ranksdomain.Rank{
		ID:          domain.FromPG(rank.ID),
		Name:        rank.Name,
		Description: rank.Description,
		Color:       rank.Color,
		Weight:      rank.Weight,
		Permissions: set,
		At:          rank.AddedAt.Time,
	}
}

func (r *RankRepository) parseRanks(ranks []sqlc.Rank) ranksdomain.Ranks {
	if ranks == nil {
		return nil
	}
	var out = make(ranksdomain.Ranks, len(ranks))
	for i, rank := range ranks {
		out[i] = r.parseRank(rank)
	}
	return out
}

func (r *RankRepository) isExists(ctx context.Context, name string) error {
	exists, err := r.conn.IsRankExists(ctx, name)
	if err != nil {
		return err
	}
	if exists {
		return errors.Conflict
	}
	return nil
}

func (r *RankRepository) Create(ctx context.Context, name string, description string, color int64, weight int32, permissions []byte) (*ranksdomain.Rank, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	if weight < 0 {
		weight = 0
	}
	if err := r.isExists(ctx, name); err != nil {
		return nil, err
	}
	rank, err := r.conn.CreateRank(ctx, sqlc.CreateRankParams{
		Name:        name,
		Permissions: permissions,
		Description: description,
		Color:       color,
		Weight:      weight,
	})
	if err != nil {
		return nil, err
	}
	return r.parseRank(rank), nil
}

func (r *RankRepository) Update(ctx context.Context, name string, rank ranksdomain.Rank) (*ranksdomain.Rank, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	current, err := r.Rank(ctx, name)
	if err != nil {
		return nil, err
	}
	if rank.Name != "" && rank.Name != current.Name {
		err = r.conn.UpdateRankName(ctx, sqlc.UpdateRankNameParams{
			Name: rank.Name,
			ID:   current.ID.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		current.Name = rank.Name
	}
	if rank.Description != "" && rank.Description != current.Description {
		err = r.conn.UpdateRankDescription(ctx, sqlc.UpdateRankDescriptionParams{
			Description: rank.Description,
			ID:          current.ID.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		current.Description = rank.Description
	}
	if rank.Color != 0 && rank.Color != current.Color {
		err = r.conn.UpdateRankColor(ctx, sqlc.UpdateRankColorParams{
			Color: rank.Color,
			ID:    current.ID.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		current.Color = rank.Color
	}
	if rank.Weight != 0 && rank.Weight != current.Weight {
		err = r.conn.UpdateRankWeight(ctx, sqlc.UpdateRankWeightParams{
			Weight: rank.Weight,
			ID:     current.ID.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		current.Weight = rank.Weight
	}
	if rank.Permissions != nil {
		perms, err := rank.Permissions.ToJson()
		if err != nil {
			return nil, err
		}
		err = r.conn.UpdateRankPermissions(ctx, sqlc.UpdateRankPermissionsParams{
			Permissions: perms,
			ID:          current.ID.ToPG(),
		})
		if err != nil {
			return nil, err
		}
		current.Permissions = rank.Permissions
	}
	return current, nil
}

func (r *RankRepository) Delete(ctx context.Context, id domain.UUID) error {
	return r.conn.DeleteRank(ctx, id.ToPG())
}

func (r *RankRepository) Rank(ctx context.Context, name string) (*ranksdomain.Rank, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	info, err := r.conn.RankInfo(ctx, name)
	if err != nil {
		return nil, err
	}
	return r.parseRank(info), nil
}

func (r *RankRepository) RankByID(ctx context.Context, id domain.UUID) (*ranksdomain.Rank, error) {
	info, err := r.conn.RankInfoByID(ctx, id.ToPG())
	if err != nil {
		return nil, err
	}
	return r.parseRank(info), nil
}

func (r *RankRepository) User(ctx context.Context, user domain.UUID) (ranksdomain.UserRanks, error) {
	list, err := r.conn.GetUserRanks(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	var out = make(ranksdomain.UserRanks, len(list))
	for i, e := range list {
		var expires *time.Time = nil
		if e.Expires.Valid {
			expires = &e.Expires.Time
		}
		out[i] = &ranksdomain.UserRank{
			ID:      domain.FromPG(e.ID),
			Name:    e.Name,
			Color:   e.Color,
			Weight:  e.Weight,
			Expires: expires,
		}
	}
	return out, nil
}

func (r *RankRepository) Users(ctx context.Context, name string) ([]*domain.UUID, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	ids, err := r.conn.RankUsers(ctx, name)
	if err != nil {
		return nil, err
	}
	var out = make([]*domain.UUID, len(ids))
	for i, id := range ids {
		out[i] = new(domain.FromPG(id))
	}
	return out, nil
}

func (r *RankRepository) Revoke(ctx context.Context, user domain.UUID, name string) error {
	if name == "" {
		return errors.InvalidArguments
	}
	err := r.conn.RevokeRankFromUser(ctx, sqlc.RevokeRankFromUserParams{
		Name:  name,
		Owner: user.ToPG(),
	})
	if err != nil {
		return err
	}
	return nil
}

func (r *RankRepository) Ranks(ctx context.Context, limit int32, offset int32) (ranksdomain.Ranks, error) {
	if limit <= 0 {
		limit = 10
	}
	out, err := r.conn.RanksList(ctx, sqlc.RanksListParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return r.parseRanks(out), nil
}
