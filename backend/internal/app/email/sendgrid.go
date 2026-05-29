package emailservice

import (
	"context"
	"fmt"
	"sync"

	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/sendgrid/sendgrid-go"
	gridmail "github.com/sendgrid/sendgrid-go/helpers/mail"
)

type SendGrid struct {
	from   *gridmail.Email
	client *sendgrid.Client
	mu     sync.Mutex
}

var _ emaildomain.Repository = (*SendGrid)(nil)

func NewSendgrid() *SendGrid {
	cfg := config.Get()
	service := &SendGrid{}
	service.client = sendgrid.NewSendClient(cfg.Email.API)
	service.from = gridmail.NewEmail(cfg.Email.Name, cfg.Email.Domain)
	return service
}

func (s *SendGrid) Send(ctx context.Context, userName string, userAddress string, subject string, plainText string, htmlText string) (int, error) {
	if s == nil || s.client == nil || s.from == nil {
		return 0, fmt.Errorf("email service is not configured")
	}

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
