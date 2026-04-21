package rankservice

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	rank ranksdomain.Repository
}

func NewService(rank ranksdomain.Repository) *Service {
	return &Service{rank: rank}
}

func (s *Service) UserRanks(ctx context.Context, user domain.UUID) (ranksdomain.UserRanks, error) {
	list, err := s.rank.User(ctx, user)
	if err != nil {
		logger.Error("rank", "failed to get list of ranks for user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return list, nil
}

func (s *Service) RankInfo(ctx context.Context, rank string) (*ranksdomain.Rank, error) {
	id, err := domain.FromString(rank)
	if err != nil {
		return nil, err
	}
	info, err := s.rank.RankByID(ctx, id)
	if err != nil {
		logger.Error("rank", "failed to get information about rank", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return info, nil
}

func (s *Service) CreateRank(ctx context.Context, name string, description string, color int64, weight int32, perms []string) (*ranksdomain.Rank, error) {
	if name == "" || description == "" {
		return nil, errors.InvalidArguments
	}
	bytes, err := permissionsdomain.FromStrings(perms).ToJson()
	if err != nil {
		return nil, errors.Wrap(err)
	}
	info, err := s.rank.Create(ctx, name, description, color, weight, bytes)
	if err != nil {
		logger.Error("rank", "failed to create rank", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return info, nil
}

func (s *Service) UpdateRank(ctx context.Context, name string, rank ranksdomain.Rank) (*ranksdomain.Rank, error) {
	out, err := s.rank.Update(ctx, name, rank)
	if err != nil {
		logger.Error("rank", "failed to update rank", logger.F("error", err))
		return nil, err
	}
	return out, nil
}

func (s *Service) RanksList(ctx context.Context, limit int32, offset int32) (ranksdomain.Ranks, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := s.rank.Ranks(ctx, limit, offset)
	if err != nil {
		logger.Error("rank", "failed to get list of ranks", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return list, nil
}

func (s *Service) DeleteRank(ctx context.Context, rank string) error {
	if rank == "" {
		return errors.InvalidArguments
	}
	id, err := domain.FromString(rank)
	if err != nil {
		return errors.Wrap(err)
	}
	err = s.rank.Delete(ctx, id)
	if err != nil {
		logger.Error("rank", "failed to delete rank", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}
