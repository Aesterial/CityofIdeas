package loginservice

import (
	"context"
	"fmt"
	"net/url"
	"strconv"
	"time"

	"github.com/SevereCloud/vksdk/v2/api"
	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/vk"
)

func (*Service) getVkToken(ctx context.Context, code string) (*userdomain.VkToken, error) {
	conf := &oauth2.Config{
		ClientID:     config.Get().Oauth.Vk.ID,
		ClientSecret: config.Get().Oauth.Vk.Secret,
		RedirectURL:  config.Get().Oauth.Vk.RedirectURL,
		Scopes:       []string{"email"},
		Endpoint:     vk.Endpoint,
	}
	token, err := conf.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}
	userIDFloat, _ := token.Extra("user_id").(float64)
	email, _ := token.Extra("email").(string)
	return &userdomain.VkToken{
		AccessToken: token.AccessToken,
		UserID:      int(userIDFloat),
		Email:       email,
	}, nil
}

func (*Service) getVkUser(token string, userID int) (*userdomain.VkUser, error) {
	client := api.NewVK(token)
	users, err := client.UsersGet(api.Params{
		"user_ids": userID,
		"fields":   "photo_200,screen_name,about",
	})
	if err != nil {
		return nil, err
	}
	if len(users) < 1 {
		return nil, errors.InvalidArguments
	}
	return &userdomain.VkUser{
		Username:    users[0].ScreenName,
		PhotoURL:    users[0].Photo200,
		DisplayName: users[0].FirstName + " " + users[0].LastName,
		Description: users[0].About,
	}, nil
}

func (s *Service) VkStart(ctx context.Context, callbackType userdomain.VkCallbackType, user *domain.UUID) (*string, error) {
	token, err := s.startOauthAction(ctx, callbackType, user,
		actionsdomain.OauthVkLink,
		actionsdomain.OauthVkAuth,
		actionsdomain.OauthVkRegister,
	)
	if err != nil {
		return nil, err
	}
	cfg := config.Get()
	params := url.Values{}
	params.Add("client_id", cfg.Oauth.Vk.ID)
	params.Add("redirect_uri", cfg.Oauth.Vk.RedirectURL)
	params.Add("display", "page")
	params.Add("scope", "email")
	params.Add("response_type", "code")
	params.Add("v", "5.131")
	params.Add("state", token)
	return new(fmt.Sprintf("%s?%s", "https://oauth.vk.com/authorize", params.Encode())), nil
}

func (s *Service) VkCallback(ctx context.Context, code string, state string) (*userdomain.VkCallbackResponse, error) {
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
	info, err := s.getVkToken(ctx, code)
	if err != nil {
		logger.Error("login", "failed to get info from code", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	usr, err := s.usr.UserByUserMail(ctx, info.Email)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		logger.Error("login", "failed to get user by email", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		vkuser, err := s.getVkUser(info.AccessToken, info.UserID)
		if err != nil {
			return nil, errors.Wrap(err)
		}
		if err = s.actions.Use(ctx, action.Purpose, state); err != nil {
			logger.Error("login", "failed to use action", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return &userdomain.VkCallbackResponse{
			User: &userdomain.User{
				Username: vkuser.Username,
				Email:    info.Email,
				Prefs: &userdomain.Preferences{
					DisplayName: vkuser.DisplayName,
					Description: vkuser.Description,
					Avatar:      &vkuser.PhotoURL,
				},
			},
			Type: userdomain.RegisterCallback,
		}, nil
	}
	if action.Purpose == actionsdomain.OauthVkLink {
		if action.Owner == nil {
			return nil, errors.InvalidArguments
		}
		if err = s.usr.IsUserOauthLinked(ctx, *action.Owner, userdomain.ServiceVkontakte); err == nil {
			return nil, errors.Conflict
		}
		if err = s.usr.InsertOauth(ctx, *action.Owner, strconv.Itoa(info.UserID), userdomain.ServiceVkontakte); err != nil {
			logger.Error("login", "failed to insert oauth", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		if err = s.actions.Use(ctx, action.Purpose, state); err != nil {
			logger.Error("login", "failed to use action", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return &userdomain.VkCallbackResponse{Type: userdomain.LinkCallback}, nil
	}
	if action.Purpose == actionsdomain.OauthVkAuth {
		if err = s.usr.IsUserOauthLinked(ctx, usr.UID, userdomain.ServiceVkontakte); err != nil {
			logger.Error("login", "vk not linked to this account", logger.F("error", err))
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
