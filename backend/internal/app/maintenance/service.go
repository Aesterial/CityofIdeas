package maintenanceservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	maintenancesdomain "github.com/aesterial/cityideas/backend/internal/domain/maintenances"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5"
)

type Service struct {
	mt maintenancesdomain.Repository
}

func NewService(mt maintenancesdomain.Repository) *Service {
	return &Service{mt: mt}
}

func (s *Service) IsActive(ctx context.Context) (*maintenancesdomain.Maintenance, error) {
	out, err := s.mt.Current(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, errors.Wrap(err)
	}
	return out, nil
}

func (s *Service) IsPlanned(ctx context.Context) (*time.Time, string, error) {
	at, desc, err := s.mt.IsPlanned(ctx)
	if err != nil {
		logger.Error("maintenance", "failed to get planned", logger.F("error", err))
		return nil, "", errors.Wrap(err)
	}
	return at, desc, nil
}

func (s *Service) History(ctx context.Context, limit int32, offset int32) (maintenancesdomain.Maintenances, error) {
	if limit <= 0 {
		limit = 10
	}
	out, err := s.mt.List(ctx, limit, offset)
	if err != nil {
		logger.Error("maintenance", "failed to get list", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return out, nil
}

func (s *Service) Create(ctx context.Context, caller domain.UUID, description string, date maintenancesdomain.TimeRange) (*maintenancesdomain.Maintenance, error) {
	if description == "" {
		return nil, errors.InvalidArguments
	}
	out, err := s.mt.Create(ctx, caller, description, date)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	return out, nil
}

func (s *Service) SetStatus(ctx context.Context, id string, state bool) error {
	maintenance, err := domain.FromString(id)
	if err != nil {
		return err
	}
	if state {
		err = s.mt.Start(ctx, maintenance)
		if err != nil {
			logger.Error("maintenance", "failed to start maintenance", logger.F("error", err))
			return errors.Wrap(err)
		}
	} else {
		err = s.mt.Close(ctx, maintenance)
		if err != nil {
			logger.Error("maintenance", "failed to end maintenance", logger.F("error", err))
			return errors.Wrap(err)
		}
	}
	return nil
}
