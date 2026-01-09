package verification

import (
	"ascendant/backend/internal/domain/verification"
	"context"
	"errors"
	"time"
)

type Service struct {
	repo verification.Repository
}

func New(repo verification.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, email string, purpose verification.Purpose, ip string, userAgent string, ttl time.Duration) (token string, err error) {
	if email == "" || ip == "" || userAgent == "" {
		return "", errors.New("params is empty")
	}
	return s.repo.Create(ctx, email, purpose, ip, userAgent, ttl)
}

func (s *Service) Consume(ctx context.Context, purpose verification.Purpose, token string) (*verification.TokenRecord, error) {
	if token == "" || !purpose.IsValid() {
		return nil, errors.New("params is not valid")
	}
	return s.repo.Consume(ctx, purpose, token)
}

func (s *Service) BanEmail(ctx context.Context, email string, reason string) error {
	if email == "" || reason == "" {
		return errors.New("params is empty")
	}
	return s.repo.BanEmail(ctx, email, reason)
}

func (s *Service) IsBanned(ctx context.Context, email string) (bool, error) {
	if email == "" {
		return false, errors.New("params is empty")
	}
	return s.repo.IsBanned(ctx, email)
}

func (s *Service) GetRecord(ctx context.Context, purpose verification.Purpose, token string) (*verification.TokenRecord, error) {
	if !purpose.IsValid() || token == "" {
		return nil, errors.New("params is empty")
	}
	return s.repo.GetRecord(ctx, purpose, token)
}
