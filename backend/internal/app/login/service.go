package loginservice

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
	"time"

	emailservice "github.com/aesterial/cityideas/backend/internal/app/email"
	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	sessionsdomain "github.com/aesterial/cityideas/backend/internal/domain/sessions"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

type pendingOAuthEntry struct {
	Service userdomain.OauthService
	ID      string
	Purpose actionsdomain.Purpose
	Expires time.Time
}

type Service struct {
	usr          userdomain.Repository
	ses          sessionsdomain.Repository
	actions      actionsdomain.Repository
	email        *emailservice.Service
	c            *cache.Store
	pendingMu    sync.Mutex
	pendingAuths map[string]*pendingOAuthEntry
}

func NewService(usr userdomain.Repository, ses sessionsdomain.Repository, email *emailservice.Service, acts actionsdomain.Repository, store ...*cache.Store) *Service {
	var c *cache.Store
	if len(store) > 0 {
		c = store[0]
	}
	return &Service{
		usr:          usr,
		ses:          ses,
		c:            c,
		actions:      acts,
		email:        email,
		pendingAuths: make(map[string]*pendingOAuthEntry),
	}
}

func (s *Service) storePendingOAuth(state string, svc userdomain.OauthService, id string, purpose actionsdomain.Purpose) {
	s.pendingMu.Lock()
	defer s.pendingMu.Unlock()
	s.pendingAuths[state] = &pendingOAuthEntry{
		Service: svc,
		ID:      id,
		Purpose: purpose,
		Expires: time.Now().Add(15 * time.Minute),
	}
}

func (s *Service) consumePendingOAuth(state string) *pendingOAuthEntry {
	s.pendingMu.Lock()
	defer s.pendingMu.Unlock()
	entry, ok := s.pendingAuths[state]
	if !ok {
		return nil
	}
	delete(s.pendingAuths, state)
	if time.Now().After(entry.Expires) {
		return nil
	}
	return entry
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

func (s *Service) addOauthCookie(ctx context.Context, token string) error {
	var ttl = time.Minute * 20
	cookie := (&http.Cookie{Name: config.Get().Oauth.Key, Value: token, Path: "/", HttpOnly: true, Secure: config.Get().IsProduction(), SameSite: http.SameSiteLaxMode, MaxAge: int(ttl.Seconds())}).String()
	return s.addHeader(ctx, "set-cookie", cookie)
}

func (*Service) addHeader(ctx context.Context, headerName string, value string) error {
	return grpc.SendHeader(ctx, metadata.Pairs(headerName, value))
}

func loginNotificationData(ctx context.Context, username string, device domain.Device) emaildomain.LoginNotification {
	ua := domain.UserAgentFromContext(ctx)
	return emaildomain.LoginNotification{
		UserName:  username,
		LoginAt:   time.Now().Format(time.RFC1123),
		IPAddress: domain.ClientIPFromContext(ctx),
		Device:    domain.DeviceName(device, ua),
		Browser:   domain.BrowserName(ua),
	}
}

func (s *Service) Register(ctx context.Context, username string, email string, password string, oauthState string) (*userdomain.User, error) {
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
	if exists {
		return nil, errors.Conflict
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
	if s.c != nil {
		s.c.DeleteTags("users:list")
	}
	if oauthState != "" {
		if pending := s.consumePendingOAuth(oauthState); pending != nil {
			if err = s.usr.InsertOauth(ctx, user.UID, pending.ID, pending.Service); err != nil {
				logger.Error("login", "failed to link oauth on register", logger.F("error", err))
			} else if err = s.actions.Use(ctx, pending.Purpose, oauthState); err != nil {
				logger.Error("login", "failed to consume oauth action on register", logger.F("error", err))
			}
		}
	}
	if err = s.startSession(ctx, user, device, hash); err != nil {
		return nil, err
	}
	if !config.Get().Email.Enabled {
		if err = s.usr.VerifyEmail(ctx, user.UID); err != nil {
			logger.Error("login", "Failed to set user as verified", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
	}
	s.email.SendWelcomeEmail(emaildomain.UserInfo{
		Username: username,
		Address:  email,
		Language: user.Prefs.Language,
	}, emaildomain.Welcome{
		UserName: username,
	})
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
	user, err := s.usr.UserByUserMail(ctx, userMail)
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
	if err = s.loginUser(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *Service) Logout(ctx context.Context, session domain.UUID) error {
	return s.ses.Revoke(ctx, session)
}

func genToken(length int) string {
	secretRaw := make([]byte, length)
	if _, err := rand.Read(secretRaw); err != nil {
		return ""
	}
	return hex.EncodeToString(secretRaw)
}

func (s *Service) startOauthAction(ctx context.Context, callbackType userdomain.VkCallbackType, user *domain.UUID, linkPurpose, authPurpose, registerPurpose actionsdomain.Purpose) (string, error) {
	token := genToken(32)
	if token == "" {
		return "", errors.ServerError
	}
	expires := time.Now().Add(5 * time.Minute)
	switch callbackType {
	case userdomain.LinkCallback:
		if user == nil {
			return "", errors.InvalidArguments
		}
		if _, err := s.actions.Create(ctx, user, linkPurpose, token, expires); err != nil {
			return "", err
		}
	case userdomain.AuthCallback:
		if _, err := s.actions.Create(ctx, nil, authPurpose, token, expires); err != nil {
			return "", err
		}
	case userdomain.RegisterCallback:
		if _, err := s.actions.Create(ctx, nil, registerPurpose, token, expires); err != nil {
			return "", err
		}
	default:
		return "", errors.InvalidArguments
	}
    // не ругайся ванек
	if err := s.addOauthCookie(ctx, token); err != nil {
		logger.Error("login", "failed to set oauth cookie (non-fatal)", logger.F("error", err))
	}
	return token, nil
}

func (s *Service) startSession(ctx context.Context, usr *userdomain.User, device domain.Device, hash string) error {
	session, err := s.ses.Create(ctx, usr.UID, time.Now().Add(7*24*time.Hour), device, hash)
	if err != nil {
		return errors.Wrap(err)
	}
	if err = s.addCookie(ctx, usr.Username, session.ID, usr.Prefs.SessionLiveTime); err != nil {
		logger.Error("login", "failed to add cookie to context", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) loginUser(ctx context.Context, usr *userdomain.User) error {
	device, hash := domain.UaFromContext(ctx)
	if !device.IsValid() || hash == "" {
		return errors.InvalidArguments
	}
	if err := s.startSession(ctx, usr, device, hash); err != nil {
		return err
	}
	s.email.SendLoginNotificationEmail(emaildomain.UserInfo{
		Username: usr.Username,
		Address:  usr.Email,
		Language: usr.Prefs.Language,
	}, loginNotificationData(ctx, usr.Username, device))
	return nil
}
