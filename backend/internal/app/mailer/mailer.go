package mailer

import (
	"ascendant/backend/internal/app/config"
	"context"
	"fmt"
	"net/url"

	brevo "github.com/getbrevo/brevo-go/lib"
)

type Service struct {
	client    *brevo.APIClient
	fromName  string
	fromEmail string
}

func New(apiKey string, serviceName, serviceEmail string) *Service {
	cfg := brevo.NewConfiguration()
	cfg.AddDefaultHeader("api-key", apiKey)
	return &Service{client: brevo.NewAPIClient(cfg)}
}

func (s *Service) SendEmailVerify(ctx context.Context, email string, token string) (string, error) {
	cfg := config.Get()
	verifyURL := fmt.Sprintf(
		"https://%s/login/email-verify#token=%s",
		cfg.Cookies.Domain,
		url.QueryEscape(token),
	)

	em := brevo.SendSmtpEmail{
		Sender: &brevo.SendSmtpEmailSender{
			Name:  s.fromName,
			Email: s.fromEmail,
		},
		To: []brevo.SendSmtpEmailTo{{Email: email}},
		Subject: "Подтверждение почты на "+cfg.Cookies.Domain,
		HtmlContent: fmt.Sprintf(
			`<p>Подтвердите почту по ссылке:</p><p><a href="%s">Открыть подтверждение</a></p>`,
			verifyURL,
		),
		TextContent: "Подтвердите почту по ссылке: " + verifyURL,
		Headers: map[string]any{
			"idempotencyKey": "verify:" + email + ":" + token,
		},
		Tags: []string{"auth", "verify_email"},
	}

	resp, _, err := s.client.TransactionalEmailsApi.SendTransacEmail(ctx, em)
	if err != nil {
		return "", err
	}
	return resp.MessageId, nil
}

func (s *Service) SendPasswordReset(ctx context.Context, email string, token string) (string, error) {
	cfg := config.Get()
	resetUrl := fmt.Sprintf("https://%s/login/reset-password#token=%s", cfg.Cookies.Domain, url.QueryEscape(token))
	
	em := brevo.SendSmtpEmail{
		Sender: &brevo.SendSmtpEmailSender{
			Name: s.fromName,
			Email: s.fromEmail,
		},
		To: []brevo.SendSmtpEmailTo{{Email: email}},
		Subject: "Сброс пароля на " + cfg.Cookies.Domain,
		HtmlContent: fmt.Sprintf(
			`<p>Сбросьте пароль по ссылке:</p><p><a href="%s">Сбросить пароль</a></p>`,
			resetUrl,
		),
		TextContent: "Сбросьте пароль по ссылке: " + resetUrl,
		Headers: map[string]any{
			"idempotencyKey": "reset:" + email + ":" + token,
		},
		Tags: []string{"auth", "reset_password"},
	}
	resp, _, err := s.client.TransactionalEmailsApi.SendTransacEmail(ctx, em)
	if err != nil {
		return "", err
	}
	return resp.MessageId, nil
}
