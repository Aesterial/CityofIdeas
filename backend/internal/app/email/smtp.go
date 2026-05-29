package emailservice

import (
	"context"

	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	"github.com/aesterial/cityideas/backend/internal/infra/config"

	"github.com/wneessen/go-mail"
)

type Smtp struct {
	Client   *mail.Client
	From     string
	Password string
}

func (s *Smtp) Send(ctx context.Context, _ string, userAddress string, subject string, plainText string, htmlText string) (int, error) {
	msg := mail.NewMsg()
	if err := msg.From(s.From); err != nil {
		return 0, err
	}
	if err := msg.To(userAddress); err != nil {
		return 0, err
	}
	msg.Subject(subject)
	msg.SetBodyString(mail.TypeTextPlain, plainText)
	msg.AddAlternativeString(mail.TypeTextHTML, htmlText)
	if err := s.Client.DialAndSendWithContext(ctx, msg); err != nil {
		return 0, err
	}
	return 200, nil
}

var _ emaildomain.Repository = (*Smtp)(nil)

func NewSmtp() *Smtp {
	cfg := config.Get()
	var service = &Smtp{}
	if !cfg.Email.Enabled {
		return service
	}
	var err error
	service.From = cfg.Email.Domain
	service.Password = cfg.Email.Password
	service.Client, err = mail.NewClient(cfg.Email.SmtpProviderUrl, mail.WithPort(587), mail.WithSMTPAuth(mail.SMTPAuthPlain), mail.WithUsername(cfg.Email.Domain), mail.WithPassword(cfg.Email.Password))
	if err != nil {
		cfg.Email.SetEnabled(false)
		return service
	}
	return service
}
