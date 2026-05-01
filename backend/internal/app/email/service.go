package emailservice

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/sendgrid/sendgrid-go"
	gridmail "github.com/sendgrid/sendgrid-go/helpers/mail"
)

type Service struct {
	from   *gridmail.Email
	client *sendgrid.Client
	users  userdomain.Repository
	mu     sync.Mutex
}

func NewService(users userdomain.Repository) *Service {
	return &Service{
		client: sendgrid.NewSendClient(config.Get().Email.API),
		from:   gridmail.NewEmail(config.Get().Email.Name, config.Get().Email.Domain),
		users:  users,
	}
}

func (s *Service) send(ctx context.Context, userName string, userAddress string, subject string, plainText string, htmlText string) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	resp, err := s.client.SendWithContext(ctx, gridmail.NewSingleEmail(s.from, subject, gridmail.NewEmail(userName, userAddress), plainText, htmlText))
	if err != nil {
		return 0, err
	}
	if resp == nil {
		return 0, fmt.Errorf("sendgrid returned empty response")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return resp.StatusCode, fmt.Errorf("sendgrid rejected email: status=%d body=%s", resp.StatusCode, resp.Body)
	}
	return resp.StatusCode, nil
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
	_, err = s.send(ctx, user.Username, user.Address, subject(user.Language, "Welcome to City of Ideas", "Добро пожаловать в Город Идей"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendWelcomeEmail(user emaildomain.UserInfo, data emaildomain.Welcome) {
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
	_, err = s.send(ctx, user.Username, user.Address, subject(language, "New sign-in to your account", "Новый вход в аккаунт"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendLoginNotificationEmail(user emaildomain.UserInfo, data emaildomain.LoginNotification) {
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
	_, err = s.send(ctx, user.Username, user.Address, subject(language, "Support ticket created", "Обращение в поддержку создано"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendTicketCreateEmail(author domain.UUID, data emaildomain.TicketCreation) {
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
	_, err = s.send(ctx, user.Username, user.Address, subject(user.Language, "New message in your ticket", "Новое сообщение в обращении"), text, html)
	if err != nil {
		return err
	}
	return nil
}

func (s *Service) SendTicketReplyEmail(admin domain.UUID, user domain.UUID, data emaildomain.TicketReply) {
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
