package tickets

import (
	"ascendant/backend/internal/domain/tickets"
	"context"

	"github.com/google/uuid"
)

type Service struct {
	repo tickets.Repository
}

func New(r tickets.Repository) *Service {
	return &Service{repo: r}
}

func (s *Service) Create(ctx context.Context, requestor tickets.TicketCreationRequestor, topic tickets.TicketTopic, brief string) (*tickets.TicketCreationData, error) {
	return s.repo.Create(ctx, requestor, topic, brief)
}

func (s *Service) CreateMessage(ctx context.Context, id uuid.UUID, content string, req tickets.TicketDataReq) error {
	return s.repo.CreateMessage(ctx, id, content, req)
}

func (s *Service) Accept(ctx context.Context, id uuid.UUID, who uint) error {
	return s.repo.Accept(ctx, id, who)
}

func (s *Service) Info(ctx context.Context, id uuid.UUID) (*tickets.Ticket, error) {
	return s.repo.Info(ctx, id)
}

func (s *Service) List(ctx context.Context) (tickets.Tickets, error) {
	return s.repo.List(ctx)
}

func (s *Service) Messages(ctx context.Context, id uuid.UUID) (tickets.TicketMessages, error) {
	return s.repo.Messages(ctx, id)
}

func (s *Service) Close(ctx context.Context, id uuid.UUID, by tickets.TicketClosedBy, reason string) error {
	return s.repo.Close(ctx, id, by, reason)
}

func (s *Service) IsReqValid(ctx context.Context, id uuid.UUID, req tickets.TicketDataReq) (bool, error) {
	return s.repo.IsReqValid(ctx, id, req)
}
