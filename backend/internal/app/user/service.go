package userservice

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
)

type Service struct {
	usr userdomain.Repository
}

func NewService(usr userdomain.Repository) *Service {
	return &Service{usr: usr}
}

func (s *Service) IsBanned(ctx context.Context, user domain.UUID) (bool, error) {
	banned, err := s.usr.IsBanned(ctx, user)
	if err != nil {
		logger.Error("user", "failed to check is user banned", logger.F("error", err))
		return false, err
	}
	return banned, nil
}
