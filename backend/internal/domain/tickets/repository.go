package ticketsdomain

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	// TicketsByUser returns list of tickets where provided user is author
	TicketsByUser(ctx context.Context, user domain.UUID, limit int32, offset int32) (Tickets, error)
	// OpenedTickets list of opened tickets in range of limit
	OpenedTickets(ctx context.Context, limit int32, offset int32) (Tickets, error)
	// Info returns information about requested ticket
	Info(ctx context.Context, ticket domain.UUID) (*Ticket, error)
	// IsClosed returns status of ticket
	IsClosed(ctx context.Context, ticket domain.UUID) (bool, error)
	// CreateTicket creates new ticket, sets user as author, topic and title set to their own fields
	CreateTicket(ctx context.Context, user domain.UUID, topic string, title string) (*Ticket, error)
	// AcceptTicket sets provided user as acceptor to given ticket record
	AcceptTicket(ctx context.Context, target Target) error
	// CloseTicket reason can be nil only if caller is author of ticket
	CloseTicket(ctx context.Context, caller Caller, reason *string) error
	// ExpiredTickets returns list of tickets ids where last message sent is older than provided hours
	ExpiredTickets(ctx context.Context, hours time.Duration) ([]*domain.UUID, error)

	// CreateMessage creates message record and links it to ticket
	CreateMessage(ctx context.Context, target Target, content string) (*Message, error)
	// MessagesList returns list of messages by ticket
	MessagesList(ctx context.Context, ticket domain.UUID, limit int32, offset int32) (Messages, error)
}
