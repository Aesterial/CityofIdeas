package mailer

import (
	"fmt"
	"net/url"
	"context"

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
	verifyURL := fmt.Sprintf(
		"https://aesterial.xyz/login/email-verify#token=%s",
		url.QueryEscape(token),
	)

	em := brevo.SendSmtpEmail{
		Sender: &brevo.SendSmtpEmailSender{
			Name:  s.fromName,
			Email: s.fromEmail,
		},
		To: []brevo.SendSmtpEmailTo{{Email: email}},
		Subject: "Подтверждение почты на aesterial.xyz",
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


// func (s *Service) SendPasswordReset() error {

// }
