package rankservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	rank ranksdomain.Repository
	c    *cache.Store
}

func NewService(rank ranksdomain.Repository, store ...*cache.Store) *Service {
	var c *cache.Store
	if len(store) > 0 {
		c = store[0]
	}
	if c == nil {
		c = cache.New(cache.DefaultMaxEntries)
	}
	return &Service{rank: rank, c: c}
}

const (
	rankCacheTTL     = 60 * time.Second
	rankCacheTag     = "ranks"
	rankListCacheTag = "ranks:list"
)

func (s *Service) UserRanks(ctx context.Context, user domain.UUID) (ranksdomain.UserRanks, error) {
	key := cache.Key("ranks.user", user.String())
	return cache.GetOrSet(ctx, s.c, key, rankCacheTTL, []string{rankCacheTag, rankUserCacheTag(user.String())}, func(ctx context.Context) (ranksdomain.UserRanks, error) {
		list, err := s.rank.User(ctx, user)
		if err != nil {
			logger.Error("rank", "failed to get list of ranks for user", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
}

func (s *Service) UserRanksWithScope(ctx context.Context, user domain.UUID) ([]domain.MetaRank, error) {
	key := cache.Key("ranks.user.scope", user.String())
	return cache.GetOrSet(ctx, s.c, key, rankCacheTTL, []string{rankCacheTag, rankUserCacheTag(user.String())}, func(ctx context.Context) ([]domain.MetaRank, error) {
		list, err := s.rank.UserWithScope(ctx, user)
		if err != nil {
			logger.Error("rank", "failed to get scoped ranks for user", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
}

func (s *Service) AssignRank(ctx context.Context, user domain.UUID, rankName string, cityID *domain.UUID, expires *time.Time) error {
	if rankName == "" {
		return errors.InvalidArguments
	}
	err := s.rank.Assign(ctx, user, rankName, cityID, expires)
	if err != nil {
		logger.Error("rank", "failed to assign rank", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(rankUserCacheTag(user.String()))
	return nil
}

func (s *Service) RevokeScoped(ctx context.Context, user domain.UUID, rankName string, cityID *domain.UUID) error {
	if rankName == "" {
		return errors.InvalidArguments
	}
	err := s.rank.RevokeScoped(ctx, user, rankName, cityID)
	if err != nil {
		logger.Error("rank", "failed to revoke scoped rank", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(rankUserCacheTag(user.String()))
	return nil
}

func (s *Service) RankInfo(ctx context.Context, rank string) (*ranksdomain.Rank, error) {
	id, err := domain.FromString(rank)
	if err != nil {
		return nil, err
	}
	key := cache.Key("ranks.info", id.String())
	return cache.GetOrSet(ctx, s.c, key, rankCacheTTL, []string{rankCacheTag, rankInfoCacheTag(id.String())}, func(ctx context.Context) (*ranksdomain.Rank, error) {
		info, err := s.rank.RankByID(ctx, id)
		if err != nil {
			logger.Error("rank", "failed to get information about rank", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return info, nil
	})
}

func (s *Service) RankByName(ctx context.Context, name string) (*ranksdomain.Rank, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	key := cache.Key("ranks.info.name", name)
	return cache.GetOrSet(ctx, s.c, key, rankCacheTTL, []string{rankCacheTag}, func(ctx context.Context) (*ranksdomain.Rank, error) {
		info, err := s.rank.Rank(ctx, name)
		if err != nil {
			logger.Error("rank", "failed to get information about rank by name", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return info, nil
	})
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
	s.c.DeleteTags(rankCacheTag, rankListCacheTag)
	return info, nil
}

func (s *Service) UpdateRank(ctx context.Context, name string, rank ranksdomain.Rank) (*ranksdomain.Rank, error) {
	out, err := s.rank.Update(ctx, name, rank)
	if err != nil {
		logger.Error("rank", "failed to update rank", logger.F("error", err))
		return nil, err
	}
	s.c.DeleteTags(rankCacheTag, rankListCacheTag, rankInfoCacheTag(rank.ID.String()))
	return out, nil
}

func (s *Service) RanksList(ctx context.Context, limit int32, offset int32) (ranksdomain.Ranks, error) {
	if limit <= 0 {
		limit = 10
	}
	key := cache.Key("ranks.list", limit, offset)
	return cache.GetOrSet(ctx, s.c, key, rankCacheTTL, []string{rankCacheTag, rankListCacheTag}, func(ctx context.Context) (ranksdomain.Ranks, error) {
		list, err := s.rank.Ranks(ctx, limit, offset)
		if err != nil {
			logger.Error("rank", "failed to get list of ranks", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
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
	s.c.DeleteTags(rankCacheTag, rankListCacheTag, rankInfoCacheTag(id.String()))
	return nil
}

func (s *Service) SetUserRank(ctx context.Context, userID domain.UUID, rankName string, expiresAt *time.Time) error {
	if rankName == "" {
		return errors.InvalidArguments
	}
	if err := s.rank.Set(ctx, userID, rankName, expiresAt); err != nil {
		logger.Error("rank", "failed to set user rank", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(rankUserCacheTag(userID.String()))
	return nil
}

func rankInfoCacheTag(id string) string {
	return "ranks:item:" + id
}

func rankUserCacheTag(id string) string {
	return "ranks:user:" + id
}
