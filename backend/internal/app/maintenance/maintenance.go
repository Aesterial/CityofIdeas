package maintenance

import (
	scheduler "Aesterial/backend/internal/app/maintenance/scheduler"
	"Aesterial/backend/internal/domain/maintenance"
	"context"
	"errors"
	"time"
)

type Service struct {
	repo maintenance.Repository
}

func New(r maintenance.Repository) *Service {
	scheduler.Start(r, time.Second * 10)
	return &Service{repo: r}
}

func (s *Service) CheckIsActive(ctx context.Context) (bool, error) {
	return s.repo.CheckIsActive(ctx)
}

func (s *Service) IsPlanned(ctx context.Context) (bool, error) {
	return s.repo.IsPlanned(ctx)
}

func (s *Service) GetData(ctx context.Context) (*maintenance.Information, error) {
	return s.repo.GetData(ctx)
}

func (s *Service) Start(ctx context.Context, req maintenance.CreateST, by uint) error {
	if by == 0 {
		return errors.New("requestor is not provided")
	}
	return s.repo.Start(ctx, req, by)
}

func (s *Service) Edit(ctx context.Context, req maintenance.EditST) error {
	return s.repo.Edit(ctx, req)
}

func (s *Service) Complete(ctx context.Context) error {
	return s.repo.Complete(ctx)
}