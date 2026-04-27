package statisticsservice

import (
	"context"
	"time"

	statpb "github.com/aesterial/cityideas/backend/internal/api/v1/statistics/v1"
	statisticsdomain "github.com/aesterial/cityideas/backend/internal/domain/statistics"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	stat statisticsdomain.Repository
	c    *cache.Store
}

func NewService(stat statisticsdomain.Repository, store ...*cache.Store) *Service {
	var c *cache.Store
	if len(store) > 0 {
		c = store[0]
	}
	if c == nil {
		c = cache.New(cache.DefaultMaxEntries)
	}
	return &Service{stat: stat, c: c}
}

const (
	statisticsCacheTTL = 60 * time.Second
	statisticsCacheTag = "statistics"
)

func request(separator statpb.Separator, city string) statisticsdomain.Request {
	req := statisticsdomain.Request{
		Separator: statisticsdomain.ParseSeparator(separator),
	}
	if city != "" {
		req.City = &city
	}
	return req
}

func (s *Service) Global(ctx context.Context) (*statisticsdomain.Global, error) {
	return cache.GetOrSet(ctx, s.c, cache.Key("statistics.global"), statisticsCacheTTL, []string{statisticsCacheTag}, func(ctx context.Context) (*statisticsdomain.Global, error) {
		out, err := s.stat.Global(ctx)
		if err != nil {
			logger.Error("statistics", "failed to get global statistics", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
}

func (s *Service) Votes(ctx context.Context, separator statpb.Separator, city string) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, city)
	key := cache.Key("statistics.votes", req.Separator.String(), city)
	out, err := cache.GetOrSet(ctx, s.c, key, statisticsCacheTTL, []string{statisticsCacheTag}, func(ctx context.Context) (statisticsdomain.Graph, error) {
		out, err := s.stat.Votes(ctx, req)
		if err != nil {
			logger.Error("statistics", "failed to get project votes graph", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
	if err != nil {
		return nil, req.Separator, err
	}
	return out, req.Separator, nil
}

func (s *Service) Creation(ctx context.Context, separator statpb.Separator, city string) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, city)
	key := cache.Key("statistics.creation", req.Separator.String(), city)
	out, err := cache.GetOrSet(ctx, s.c, key, statisticsCacheTTL, []string{statisticsCacheTag}, func(ctx context.Context) (statisticsdomain.Graph, error) {
		out, err := s.stat.Creation(ctx, req)
		if err != nil {
			logger.Error("statistics", "failed to get project creation graph", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
	if err != nil {
		return nil, req.Separator, err
	}
	return out, req.Separator, nil
}

func (s *Service) Questions(ctx context.Context, separator statpb.Separator) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, "")
	key := cache.Key("statistics.questions", req.Separator.String())
	out, err := cache.GetOrSet(ctx, s.c, key, statisticsCacheTTL, []string{statisticsCacheTag}, func(ctx context.Context) (statisticsdomain.Graph, error) {
		out, err := s.stat.Questions(ctx, req)
		if err != nil {
			logger.Error("statistics", "failed to get questions activity graph", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
	if err != nil {
		return nil, req.Separator, err
	}
	return out, req.Separator, nil
}

func (s *Service) Discussion(ctx context.Context, separator statpb.Separator, city string) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, city)
	key := cache.Key("statistics.discussion", req.Separator.String(), city)
	out, err := cache.GetOrSet(ctx, s.c, key, statisticsCacheTTL, []string{statisticsCacheTag}, func(ctx context.Context) (statisticsdomain.Graph, error) {
		out, err := s.stat.Discussion(ctx, req)
		if err != nil {
			logger.Error("statistics", "failed to get project discussion graph", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
	if err != nil {
		return nil, req.Separator, err
	}
	return out, req.Separator, nil
}
