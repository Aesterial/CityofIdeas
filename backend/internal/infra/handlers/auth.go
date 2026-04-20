package handlers

import (
	"context"
	"net/url"
	"strings"

	sessionsservice "github.com/aesterial/cityideas/backend/internal/app/sessions"
	userservice "github.com/aesterial/cityideas/backend/internal/app/user"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

type Authenticator struct {
	usr *userservice.Service
	ses *sessionsservice.Service
}

func NewAuthenticator(usr *userservice.Service, ses *sessionsservice.Service) *Authenticator {
	return &Authenticator{
		usr: usr,
		ses: ses,
	}
}

func (*Authenticator) getToken(md metadata.MD, name string) string {
	for _, value := range md.Get("cookie") {
		for p := range strings.SplitSeq(value, ";") {
			kv := strings.SplitN(strings.TrimSpace(p), "=", 2)
			if len(kv) != 2 {
				continue
			}
			if kv[0] != name {
				continue
			}
			token, err := url.QueryUnescape(kv[1])
			if err != nil {
				return kv[1]
			}
			return token
		}
	}
	return ""
}

func (a *Authenticator) User(ctx context.Context) (*domain.Metadata, error) {
	var meta domain.Metadata
	device, hash := domain.UaFromContext(ctx)
	if !device.IsValid() || hash == "" {
		return nil, errors.AccessDenied
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.NotFound
	}
	cfg := config.Get()
	token := a.getToken(md, cfg.Cookie.Name)
	if token == "" {
		logger.Error("auth", "token is empty")
		return nil, errors.NotFound
	}
	claims, err := domain.ParseClaims(token, cfg.Cookie.Secret)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	sid, err := uuid.Parse(claims.ID)
	if err != nil {
		return nil, errors.InvalidArguments
	}
	meta.SessionID = &domain.UUID{UUID: sid}
	valid, err := a.ses.IsValid(ctx, *meta.SessionID, device, hash)
	if err != nil {
		logger.Error("auth", "error while verifying session", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	if !valid {
		logger.Info("auth", "session is not valid")
		return nil, errors.AccessDenied
	}
	err = a.ses.LastSeen(ctx, *meta.SessionID)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	session, err := a.ses.Info(ctx, *meta.SessionID)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	meta.UserID = &session.Owner
	banned, err := a.usr.IsBanned(ctx, session.Owner)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if banned {
		return &meta, errors.Banned
	}
	return &meta, nil
}
