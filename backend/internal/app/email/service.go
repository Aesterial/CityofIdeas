package emailservice

import (
	"context"
	"fmt"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	configdomain "github.com/aesterial/cityideas/backend/internal/domain/config"
	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
)

type Service struct {
	client  emaildomain.Repository
	users   userdomain.Repository
	enabled bool
}

func NewService(users userdomain.Repository) *Service {
	cfg := config.Get()
	service := &Service{
		users:   users,
		enabled: cfg.Email.Enabled,
	}
	if !service.enabled {
		return service
	}
	if cfg.Email.Provider == configdomain.SendGridProvider {
		service.client = NewSendgrid()
		return service
	}
	if cfg.Email.Provider == configdomain.SmtpProvider {
		smtp := NewSmtp()
		service.client = smtp
		if service.client == nil {
			service.enabled = false
			return service
		}
		return service
	}
	service.enabled = false
	return service
}

func (s *Service) isEnabled() bool {
	return s != nil && s.enabled
}

func (s *Service) sendInBackground(kind string, user emaildomain.UserInfo, fn func(context.Context) error) {
	if s == nil {
		return
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("email", "background email panic", logger.F("kind", kind), logger.F("email", user.Address), logger.F("username", user.Username), logger.F("panic", r))
			}
		}()

		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()

		if err := fn(ctx); err != nil {
			logger.Error("email", "failed to send background email", logger.F("kind", kind), logger.F("email", user.Address), logger.F("username", user.Username), logger.F("error", err))
		}
	}()
}

func (s *Service) userInfo(ctx context.Context, id domain.UUID) (emaildomain.UserInfo, error) {
	if s == nil || s.users == nil {
		return emaildomain.UserInfo{}, fmt.Errorf("user repository is not configured")
	}
	user, err := s.users.User(ctx, id)
	if err != nil {
		return emaildomain.UserInfo{}, err
	}
	if user == nil {
		return emaildomain.UserInfo{}, fmt.Errorf("user not found")
	}
	return emaildomain.UserInfo{
		Username: user.Username,
		Address:  user.Email,
		Language: user.Prefs.Language,
	}, nil
}

func subject(language userdomain.Languages, english string, russian string) string {
	if language == userdomain.EnglishLang {
		return english
	}
	return russian
}

func (s *Service) sendWelcomeEmail(ctx context.Context, user emaildomain.UserInfo, data emaildomain.Welcome) error {
	var d = config.Get().Domain
	data.ProfileSettingsURL = d + "/profile"
	data.Public = emaildomain.FillPublic(d)
	html, text, err := emaildomain.RenderTemplates("welcome", data, user.Language)
	if err != nil {
		return err
	}
	_, err = s.client.Send(ctx, user.Username, user.Address, subject(user.Language, "Welcome to City of Ideas", "Добро пожаловать в Город Идей"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendWelcomeEmail(user emaildomain.UserInfo, data emaildomain.Welcome) {
	if !s.isEnabled() {
		return
	}
	s.sendInBackground("welcome", user, func(ctx context.Context) error {
		return s.sendWelcomeEmail(ctx, user, data)
	})
}

func (s *Service) sendLoginNotificationEmail(ctx context.Context, user emaildomain.UserInfo, data emaildomain.LoginNotification, language userdomain.Languages) error {
	var d = config.Get().Domain
	data.SecurityURL = d + "/profile"
	data.Public = emaildomain.FillPublic(d)
	html, text, err := emaildomain.RenderTemplates("login_notification", data, language)
	if err != nil {
		return err
	}
	_, err = s.client.Send(ctx, user.Username, user.Address, subject(language, "New sign-in to your account", "Новый вход в аккаунт"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendLoginNotificationEmail(user emaildomain.UserInfo, data emaildomain.LoginNotification) {
	if !s.isEnabled() {
		return
	}
	s.sendInBackground("login_notification", user, func(ctx context.Context) error {
		return s.sendLoginNotificationEmail(ctx, user, data, user.Language)
	})
}

func (s *Service) sendTicketCreateEmail(ctx context.Context, user emaildomain.UserInfo, data emaildomain.TicketCreation, language userdomain.Languages) error {
	var d = config.Get().Domain
	data.Public = emaildomain.FillPublic(d)
	html, text, err := emaildomain.RenderTemplates("support_ticket_created", data, language)
	if err != nil {
		return err
	}
	_, err = s.client.Send(ctx, user.Username, user.Address, subject(language, "Support ticket created", "Обращение в поддержку создано"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendTicketCreateEmail(author domain.UUID, data emaildomain.TicketCreation) {
	if !s.isEnabled() {
		return
	}
	s.sendInBackground("ticket_creation", emaildomain.UserInfo{}, func(ctx context.Context) error {
		user, err := s.userInfo(ctx, author)
		if err != nil {
			return err
		}
		return s.sendTicketCreateEmail(ctx, user, data, user.Language)
	})
}

func (s *Service) sendTicketReplyEmail(ctx context.Context, user emaildomain.UserInfo, data emaildomain.TicketReply) error {
	var d = config.Get().Domain
	data.Public = emaildomain.FillPublic(d)
	html, text, err := emaildomain.RenderTemplates("support_ticket_reply", data, user.Language)
	if err != nil {
		return err
	}
	_, err = s.client.Send(ctx, user.Username, user.Address, subject(user.Language, "New message in your ticket", "Новое сообщение в обращении"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendTicketReplyEmail(admin domain.UUID, user domain.UUID, data emaildomain.TicketReply) {
	if !s.isEnabled() {
		return
	}
	s.sendInBackground("ticket_reply", emaildomain.UserInfo{}, func(ctx context.Context) error {
		adm, err := s.userInfo(ctx, admin)
		if err != nil {
			return err
		}
		usr, err := s.userInfo(ctx, user)
		if err != nil {
			return err
		}
		data.AdminName = adm.Username
		return s.sendTicketReplyEmail(ctx, usr, data)
	})
}
