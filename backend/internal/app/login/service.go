package loginservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	sessionsdomain "github.com/aesterial/cityideas/backend/internal/domain/sessions"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	usr userdomain.Repository
	ses sessionsdomain.Repository
}

func NewService(usr userdomain.Repository, ses sessionsdomain.Repository) *Service {
	return &Service{
		usr: usr,
		ses: ses,
	}
}

func (s *Service) Register(ctx context.Context, username string, email string, password string) (*userdomain.User, *sessionsdomain.Session, error) {
	if username == "" || email == "" || password == "" {
		return nil, nil, errors.InvalidArguments
	}
	device, hash := domain.UaFromContext(ctx)
	if !device.IsValid() || hash == "" {
		return nil, nil, errors.InvalidArguments
	}
	exists, err := s.usr.IsUserExists(ctx, username, email)
	if err != nil {
		return nil, nil, errors.Wrap(err)
	}
	if exists {
		return nil, nil, errors.Conflict
	}
	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, errors.Wrap(err)
	}
	user, err := s.usr.Create(ctx, username, email, string(passHash))
	if err != nil {
		logger.Error("login", "failed to create user", logger.F("error", err))
		return nil, nil, errors.Wrap(err)
	}
	session, err := s.ses.Create(ctx, user.UID, time.Now().Add(7*24*time.Hour), device, hash)
	if err != nil {
		return nil, nil, errors.Wrap(err)
	}
	return user, session, nil
}
