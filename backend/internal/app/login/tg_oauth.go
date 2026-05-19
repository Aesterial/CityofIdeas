package loginservice

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type tgAuthJSON struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
	PhotoURL  string `json:"photo_url"`
	AuthDate  int64  `json:"auth_date"`
	Hash      string `json:"hash"`
}

func parseTgAuthResult(raw string) (userdomain.TgAuthData, error) {
	decoded, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		decoded, err = base64.URLEncoding.DecodeString(raw)
		if err != nil {
			return userdomain.TgAuthData{}, errors.InvalidArguments
		}
	}
	var v tgAuthJSON
	if err = json.Unmarshal(decoded, &v); err != nil {
		return userdomain.TgAuthData{}, errors.InvalidArguments
	}
	return userdomain.TgAuthData{
		ID:        v.ID,
		FirstName: v.FirstName,
		LastName:  v.LastName,
		Username:  v.Username,
		PhotoURL:  v.PhotoURL,
		AuthDate:  v.AuthDate,
		Hash:      v.Hash,
	}, nil
}

func verifyTgHash(data userdomain.TgAuthData, botToken string) error {
	fields := map[string]string{
		"auth_date":  strconv.FormatInt(data.AuthDate, 10),
		"first_name": data.FirstName,
		"id":         strconv.FormatInt(data.ID, 10),
	}
	if data.LastName != "" {
		fields["last_name"] = data.LastName
	}
	if data.PhotoURL != "" {
		fields["photo_url"] = data.PhotoURL
	}
	if data.Username != "" {
		fields["username"] = data.Username
	}

	keys := make([]string, 0, len(fields))
	for k := range fields {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(fields))
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf("%s=%s", k, fields[k]))
	}
	dataCheckString := strings.Join(parts, "\n")

	secretKey := sha256.Sum256([]byte(botToken))
	mac := hmac.New(sha256.New, secretKey[:])
	mac.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expectedHash), []byte(data.Hash)) {
		return errors.InvalidArguments
	}
	return nil
}

func (s *Service) TgStart(ctx context.Context, callbackType userdomain.VkCallbackType, user *domain.UUID) (*string, error) {
	token, err := s.startOauthAction(ctx, callbackType, user,
		actionsdomain.OauthTgLink,
		actionsdomain.OauthTgAuth,
		actionsdomain.OauthTgRegister,
	)
	if err != nil {
		return nil, err
	}
	cfg := config.Get()
	returnTo := fmt.Sprintf("%s?state=%s", cfg.Oauth.Tg.RedirectURL, token)
	params := url.Values{}
	params.Set("bot_id", cfg.Oauth.Tg.BotID)
	params.Set("origin", cfg.Domain)
	params.Set("return_to", returnTo)
	result := fmt.Sprintf("https://oauth.telegram.org/auth?%s", params.Encode())
	return &result, nil
}

func (s *Service) TgCallback(ctx context.Context, state string, tgAuthResult string) (*userdomain.VkCallbackResponse, error) {
	if err := s.actions.IsExists(ctx, state); err != nil {
		return nil, errors.Wrap(err)
	}
	action, err := s.actions.Info(ctx, state)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if action.ExpiresAt.Before(time.Now()) {
		return nil, errors.DataExpired
	}
	tgData, err := parseTgAuthResult(tgAuthResult)
	if err != nil {
		return nil, err
	}
	if err = verifyTgHash(tgData, config.Get().Oauth.Tg.BotToken); err != nil {
		return nil, errors.InvalidArguments
	}
	if time.Now().Unix()-tgData.AuthDate > 86400 {
		return nil, errors.DataExpired
	}

	tgIDStr := strconv.FormatInt(tgData.ID, 10)

	if action.Purpose == actionsdomain.OauthTgLink {
		if action.Owner == nil {
			return nil, errors.InvalidArguments
		}
		if err = s.usr.InsertOauth(ctx, *action.Owner, tgIDStr, userdomain.ServiceTelegram); err != nil {
			logger.Error("login", "failed to insert telegram oauth", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		if err = s.actions.Use(ctx, action.Purpose, state); err != nil {
			logger.Error("login", "failed to use action", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return &userdomain.VkCallbackResponse{Type: userdomain.LinkCallback}, nil
	}

	ownerID, oauthErr := s.usr.IsOauthExists(ctx, tgIDStr, userdomain.ServiceTelegram)

	if action.Purpose == actionsdomain.OauthTgRegister {
		if oauthErr == nil && ownerID != nil {
			return nil, errors.Conflict
		}
		displayName := tgData.FirstName
		if tgData.LastName != "" {
			displayName += " " + tgData.LastName
		}
		if err = s.actions.Use(ctx, action.Purpose, state); err != nil {
			logger.Error("login", "failed to use action", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return &userdomain.VkCallbackResponse{
			User: &userdomain.User{
				Username: tgData.Username,
				Prefs: &userdomain.Preferences{
					DisplayName: displayName,
					Avatar:      &tgData.PhotoURL,
				},
			},
			Type: userdomain.RegisterCallback,
		}, nil
	}

	if action.Purpose == actionsdomain.OauthTgAuth {
		if oauthErr != nil || ownerID == nil {
			logger.Error("login", "telegram account not linked to any user")
			return nil, errors.NotFound
		}
		usr, err := s.usr.User(ctx, *ownerID)
		if err != nil {
			logger.Error("login", "failed to get user by telegram oauth", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		if err = s.loginUser(ctx, usr); err != nil {
			return nil, err
		}
		if err = s.actions.Use(ctx, action.Purpose, state); err != nil {
			logger.Error("login", "failed to use action", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return &userdomain.VkCallbackResponse{
			User: usr,
			Type: userdomain.AuthCallback,
		}, nil
	}

	return nil, errors.NotFound
}
