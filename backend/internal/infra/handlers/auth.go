package handlers

import (
	"context"
	"net/url"
	"strings"

	rankservice "github.com/aesterial/cityideas/backend/internal/app/rank"
	sessionsservice "github.com/aesterial/cityideas/backend/internal/app/session"
	userservice "github.com/aesterial/cityideas/backend/internal/app/user"
	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/google/uuid"
	"google.golang.org/grpc/metadata"
)

type Authenticator struct {
	usr  *userservice.Service
	ses  *sessionsservice.Service
	rank *rankservice.Service
}

func NewAuthenticator(usr *userservice.Service, ses *sessionsservice.Service, rank *rankservice.Service) *Authenticator {
	return &Authenticator{
		usr:  usr,
		ses:  ses,
		rank: rank,
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

func (a *Authenticator) User(ctx context.Context, skip ...bool) (*domain.Metadata, error) {
	var skipMFa = false
	if len(skip) >= 1 {
		skipMFa = skip[0]
	}
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
	valid, err := a.ses.IsValid(ctx, *meta.SessionID, device, hash, skipMFa)
	if err != nil {
		if errors.Is(err, errors.NotFound) {
			return nil, errors.Unauthenticated
		}
		return nil, errors.Wrap(err)
	}
	if !valid {
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
	metaRanks, err := a.rank.UserRanksWithScope(ctx, session.Owner)
	if err != nil {
		return nil, err
	}
	meta.Ranks = metaRanks
	meta.UserID = &session.Owner
	banned, err := a.usr.IsBanned(ctx, session.Owner)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if banned {
		return &meta, errors.Banned
	}
	if meta.IsEmpty() {
		return nil, errors.InvalidArguments
	}
	return &meta, nil
}

func (a *Authenticator) Permissions(ctx context.Context, meta domain.Metadata, permissions ...permissionsdomain.Permission) error {
	if meta.UserID == nil {
		return errors.InvalidArguments
	}
	for _, perm := range permissions {
		granted := false
		for _, r := range meta.Ranks {
			if r.CityID == nil && r.Permissions.Has(perm) {
				granted = true
				break
			}
		}
		if !granted {
			return errors.AccessDenied
		}
	}
	return nil
}

func (a *Authenticator) CityPermissions(ctx context.Context, meta domain.Metadata, cityID domain.UUID, permissions ...permissionsdomain.Permission) error {
	if meta.UserID == nil {
		return errors.InvalidArguments
	}
	for _, perm := range permissions {
		granted := false
		for _, r := range meta.Ranks {
			if (r.CityID == nil || *r.CityID == cityID) && r.Permissions.Has(perm) {
				granted = true
				break
			}
		}
		if !granted {
			return errors.AccessDenied
		}
	}
	return nil
}
