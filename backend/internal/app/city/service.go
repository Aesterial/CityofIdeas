package cityservice

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	citydomain "github.com/aesterial/cityideas/backend/internal/domain/city"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	city citydomain.Repository
}

func NewService(city citydomain.Repository) *Service {
	return &Service{city: city}
}

func (s *Service) Create(ctx context.Context, name string) (*citydomain.City, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	city, err := s.city.Create(ctx, name)
	if err != nil {
		logger.Error("city", "failed to create city", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return city, nil
}

func (s *Service) List(ctx context.Context, limit int32, offset int32) (citydomain.Cities, error) {
	if limit <= 0 {
		limit = 100
	}
	list, err := s.city.List(ctx, limit, offset)
	if err != nil {
		logger.Error("city", "failed to list cities", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return list, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	uid, err := domain.FromString(id)
	if err != nil {
		return errors.InvalidArguments
	}
	if err = s.city.Delete(ctx, uid); err != nil {
		logger.Error("city", "failed to delete city", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}
