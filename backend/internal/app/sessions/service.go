package sessionsservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	sessionsdomain "github.com/aesterial/cityideas/backend/internal/domain/sessions"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	ses sessionsdomain.Repository
}

func NewService(ses sessionsdomain.Repository) *Service {
	return &Service{ses: ses}
}

func (s *Service) Create(ctx context.Context, user domain.UUID, sessionLiveTime int, device domain.Device, hash string) (*sessionsdomain.Session, error) {
	if sessionLiveTime == 0 || !device.IsValid() || hash == "" {
		return nil, errors.InvalidArguments
	}
	session, err := s.ses.Create(ctx, user, time.Now().Add(time.Duration(sessionLiveTime)*24*time.Hour), device, hash)
	if err != nil {
		logger.Error("sessions", "failed to create session", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return session, nil
}

func (s *Service) List(ctx context.Context, user domain.UUID) (sessionsdomain.Sessions, error) {
	list, err := s.ses.ByOwner(ctx, user)
	if err != nil {
		logger.Error("sessions", "failed to get sessions list by owner", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	if len(list) == 0 {
		return nil, errors.NotFound
	}
	return list, nil
}

func (s *Service) Revoke(ctx context.Context, session domain.UUID) error {
	if err := s.ses.Revoke(ctx, session); err != nil {
		logger.Error("sessions", "failed to revoke session", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) Extend(ctx context.Context, session domain.UUID, duration time.Duration) error {
	if duration.Seconds() == 0 {
		return errors.InvalidArguments
	}
	if err := s.ses.Extend(ctx, session, duration); err != nil {
		logger.Error("sessions", "failed to extend sessions", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) IsValid(ctx context.Context, session domain.UUID, device domain.Device, hash string) (bool, error) {
	valid, err := s.ses.IsValid(ctx, session, device, hash)
	if err != nil {
		logger.Error("sessions", "failed to check is session valid", logger.F("error", err))
		return false, errors.Wrap(err)
	}
	return valid, nil
}

func (s *Service) Info(ctx context.Context, session domain.UUID) (*sessionsdomain.Session, error) {
	info, err := s.ses.Info(ctx, session)
	if err != nil {
		logger.Error("sessions", "failed to get information about session", logger.F("error", err))
		return nil, err
	}
	return info, nil
}
