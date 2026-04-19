package userservice

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"golang.org/x/crypto/bcrypt"
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

func (s *Service) Username(ctx context.Context, username string) (*userdomain.User, error) {
	if username == "" {
		return nil, errors.InvalidArguments
	}
	usr, err := s.usr.UserByUsername(ctx, username)
	if err != nil {
		logger.Error("user", "failed to get info about user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return usr, nil
}

func (s *Service) ID(ctx context.Context, id domain.UUID) (*userdomain.User, error) {
	usr, err := s.usr.User(ctx, id)
	if err != nil {
		logger.Error("user", "failed to get info about user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return usr, nil
}

func (s *Service) ChangePassword(ctx context.Context, id domain.UUID, password string) error {
	if password == "" {
		return errors.InvalidArguments
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("user", "failed to generate password through bcrypt", logger.F("error", err))
		return errors.Wrap(err)
	}
	err = s.usr.UpdatePassword(ctx, id, string(hash))
	if err != nil {
		logger.Error("user", "failed to update password")
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) List(ctx context.Context, limit int32, offset int32) (userdomain.Users, error) {
	list, err := s.usr.List(ctx, limit, offset)
	if err != nil {
		logger.Error("user", "failed to get list of users", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return list, nil
}

func (s *Service) UpdatePreferences(ctx context.Context, user domain.UUID, prefs userdomain.Preferences) (*userdomain.Preferences, error) {
	out, err := s.usr.UpdatePreferences(ctx, user, prefs)
	if err != nil {
		logger.Error("user", "failed to update preferences for user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return out, nil
}
