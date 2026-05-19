package userservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Service struct {
	usr userdomain.Repository
	c   *cache.Store
}

func NewService(usr userdomain.Repository, store ...*cache.Store) *Service {
	var c *cache.Store
	if len(store) > 0 {
		c = store[0]
	}
	if c == nil {
		c = cache.New(cache.DefaultMaxEntries)
	}
	return &Service{usr: usr, c: c}
}

const (
	userCacheTTL     = 30 * time.Second
	userCacheTag     = "users"
	userListCacheTag = "users:list"
)

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
	key := cache.Key("user.username", username)
	return cache.GetOrSet(ctx, s.c, key, userCacheTTL, []string{userCacheTag, userUsernameCacheTag(username)}, func(ctx context.Context) (*userdomain.User, error) {
		usr, err := s.usr.UserByUserMail(ctx, username)
		if err != nil {
			logger.Error("user", "failed to get info about user", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return usr, nil
	})
}

func (s *Service) ID(ctx context.Context, id domain.UUID) (*userdomain.User, error) {
	key := cache.Key("user.id", id.String())
	return cache.GetOrSet(ctx, s.c, key, userCacheTTL, []string{userCacheTag, userIDCacheTag(id.String())}, func(ctx context.Context) (*userdomain.User, error) {
		usr, err := s.usr.User(ctx, id)
		if err != nil {
			logger.Error("user", "failed to get info about user", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return usr, nil
	})
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
	s.c.DeleteTags(userIDCacheTag(id.String()))
	return nil
}

func (s *Service) List(ctx context.Context, limit int32, offset int32) (userdomain.Users, error) {
	key := cache.Key("users.list", limit, offset)
	return cache.GetOrSet(ctx, s.c, key, userCacheTTL, []string{userListCacheTag}, func(ctx context.Context) (userdomain.Users, error) {
		list, err := s.usr.List(ctx, limit, offset)
		if err != nil {
			logger.Error("user", "failed to get list of users", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
}

func (s *Service) UpdatePreferences(ctx context.Context, user domain.UUID, prefs userdomain.Preferences) (*userdomain.Preferences, error) {
	out, err := s.usr.UpdatePreferences(ctx, user, prefs)
	if err != nil {
		logger.Error("user", "failed to update preferences for user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	s.c.DeleteTags(userCacheTag, userIDCacheTag(user.String()), userListCacheTag)
	return out, nil
}

func (s *Service) BanUser(ctx context.Context, user string, executor domain.UUID, reason string, until *timestamppb.Timestamp) error {
	if reason == "" {
		return errors.InvalidArguments
	}
	userID, err := domain.FromString(user)
	if err != nil {
		return err
	}
	banned, err := s.usr.IsBanned(ctx, userID)
	if err != nil {
		return errors.Wrap(err)
	}
	if banned {
		return errors.Conflict
	}
	var banUntil *time.Time = nil
	if until.IsValid() {
		banUntil = new(until.AsTime())
	}
	err = s.usr.Ban(ctx, userID, executor, reason, banUntil)
	if err != nil {
		logger.Error("user", "failed to ban user", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) UnbanUser(ctx context.Context, user string, executor domain.UUID) error {
	userID, err := domain.FromString(user)
	if err != nil {
		return err
	}
	banned, err := s.usr.IsBanned(ctx, userID)
	if err != nil {
		return errors.Wrap(err)
	}
	if !banned {
		return errors.NotFound
	}
	err = s.usr.Unban(ctx, userID, executor)
	if err != nil {
		logger.Error("user", "failed to unban user", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}

func userIDCacheTag(id string) string {
	return "users:id:" + id
}

func userUsernameCacheTag(username string) string {
	return "users:username:" + username
}
