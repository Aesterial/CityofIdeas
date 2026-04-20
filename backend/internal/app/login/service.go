package loginservice

import (
	"context"
	"net/http"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	sessionsdomain "github.com/aesterial/cityideas/backend/internal/domain/sessions"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
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

func (s *Service) addCookie(ctx context.Context, username string, session domain.UUID, sessionLiveTime int32) error {
	cfg := config.Get()
	var ttl = time.Hour * 24 * time.Duration(sessionLiveTime)
	claims := domain.NewClaims(session.String(), cfg.Cookie.Issuer, username, "login", ttl)
	token, err := claims.Issue(cfg.Cookie.Secret)
	if err != nil {
		return err
	}
	cookie := (&http.Cookie{
		Name:     cfg.Cookie.Name,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   cfg.IsProduction(),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(ttl.Seconds()),
	}).String()
	return s.addHeader(ctx, "set-cookie", cookie)
}

func (*Service) addHeader(ctx context.Context, headerName string, value string) error {
	return grpc.SendHeader(ctx, metadata.Pairs(headerName, value))
}

func (s *Service) Register(ctx context.Context, username string, email string, password string) (*userdomain.User, error) {
	if username == "" || email == "" || password == "" {
		return nil, errors.InvalidArguments
	}
	device, hash := domain.UaFromContext(ctx)
	if !device.IsValid() || hash == "" {
		return nil, errors.InvalidArguments
	}
	exists, err := s.usr.IsUserExists(ctx, username)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	exists, err = s.usr.IsUserExists(ctx, email)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if exists {
		return nil, errors.Conflict
	}
	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	user, err := s.usr.Create(ctx, username, email, string(passHash))
	if err != nil {
		logger.Error("login", "failed to create user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	session, err := s.ses.Create(ctx, user.UID, time.Now().Add(7*24*time.Hour), device, hash)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = s.addCookie(ctx, user.Username, session.ID, user.Prefs.SessionLiveTime); err != nil {
		logger.Error("login", "failed to add cookie to context", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return user, nil
}

func (s *Service) Authorize(ctx context.Context, userMail string, password string) (*userdomain.User, error) {
	if userMail == "" || password == "" {
		return nil, errors.InvalidArguments
	}
	device, hash := domain.UaFromContext(ctx)
	if !device.IsValid() || hash == "" {
		return nil, errors.InvalidArguments
	}
	exists, err := s.usr.IsUserExists(ctx, userMail)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if !exists {
		return nil, errors.NotFound
	}
	user, err := s.usr.UserByUsername(ctx, userMail)
	if err != nil {
		logger.Error("login", "failed to get user by username or email", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	passHash, err := s.usr.UserPassword(ctx, user.UID)
	if err != nil {
		logger.Error("login", "failed to get user password", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	if err = bcrypt.CompareHashAndPassword([]byte(passHash), []byte(password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, errors.NotMatch
		}
		return nil, errors.Wrap(err)
	}
	session, err := s.ses.Create(ctx, user.UID, time.Now().Add(7*24*time.Hour), device, hash)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = s.addCookie(ctx, user.Username, session.ID, user.Prefs.SessionLiveTime); err != nil {
		logger.Error("login", "failed to add cookie to context", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return user, nil
}

func (s *Service) Logout(ctx context.Context, session domain.UUID) error {
	return s.ses.Revoke(ctx, session)
}
