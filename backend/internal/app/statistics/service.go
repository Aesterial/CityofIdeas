package statisticsservice

import (
	"context"

	statpb "github.com/aesterial/cityideas/backend/internal/api/v1/statistics/v1"
	statisticsdomain "github.com/aesterial/cityideas/backend/internal/domain/statistics"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	stat statisticsdomain.Repository
}

func NewService(stat statisticsdomain.Repository) *Service {
	return &Service{stat: stat}
}

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
	out, err := s.stat.Global(ctx)
	if err != nil {
		logger.Error("statistics", "failed to get global statistics", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return out, nil
}

func (s *Service) Votes(ctx context.Context, separator statpb.Separator, city string) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, city)
	out, err := s.stat.Votes(ctx, req)
	if err != nil {
		logger.Error("statistics", "failed to get project votes graph", logger.F("error", err))
		return nil, req.Separator, errors.Wrap(err)
	}
	return out, req.Separator, nil
}

func (s *Service) Creation(ctx context.Context, separator statpb.Separator, city string) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, city)
	out, err := s.stat.Creation(ctx, req)
	if err != nil {
		logger.Error("statistics", "failed to get project creation graph", logger.F("error", err))
		return nil, req.Separator, errors.Wrap(err)
	}
	return out, req.Separator, nil
}

func (s *Service) Questions(ctx context.Context, separator statpb.Separator) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, "")
	out, err := s.stat.Questions(ctx, req)
	if err != nil {
		logger.Error("statistics", "failed to get questions activity graph", logger.F("error", err))
		return nil, req.Separator, errors.Wrap(err)
	}
	return out, req.Separator, nil
}

func (s *Service) Discussion(ctx context.Context, separator statpb.Separator, city string) (statisticsdomain.Graph, statisticsdomain.Separator, error) {
	req := request(separator, city)
	out, err := s.stat.Discussion(ctx, req)
	if err != nil {
		logger.Error("statistics", "failed to get project discussion graph", logger.F("error", err))
		return nil, req.Separator, errors.Wrap(err)
	}
	return out, req.Separator, nil
}
