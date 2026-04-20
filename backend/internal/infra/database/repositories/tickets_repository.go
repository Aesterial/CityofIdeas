package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	ticketsdomain "github.com/aesterial/cityideas/backend/internal/domain/tickets"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type TicketsRepository struct {
	conn sqlc.Querier
}

func NewTicketsRepository(conn sqlc.Querier) *TicketsRepository {
	return &TicketsRepository{conn: conn}
}

var _ ticketsdomain.Repository = (*TicketsRepository)(nil)

func (t *TicketsRepository) parseTicket(ticket sqlc.Ticket) *ticketsdomain.Ticket {
	var accepted, closed *time.Time = nil, nil
	var acceptor *domain.UUID = nil
	var closer *ticketsdomain.Caller = nil
	var reason *string = nil
	if ticket.Acceptor.Valid {
		acceptor = &domain.UUID{UUID: ticket.Acceptor.Bytes}
	}
	if ticket.Closed.Valid {
		closed = &ticket.Closed.Time
	}
	if ticket.Accepted.Valid {
		accepted = &ticket.Accepted.Time
	}
	if ticket.Closer.Valid {
		closer = new(ticketsdomain.ParseCaller(string(ticket.Closer.TicketsCaller)))
	}
	if ticket.Reason.Valid {
		reason = &ticket.Reason.String
	}
	return &ticketsdomain.Ticket{
		ID:       domain.UUID{UUID: ticket.ID.Bytes},
		Author:   domain.UUID{UUID: ticket.Author.Bytes},
		Status:   ticketsdomain.ParseStatus(string(ticket.Status)),
		Topic:    ticket.Topic,
		Title:    ticket.Title,
		Created:  ticket.Created.Time,
		Acceptor: acceptor,
		Accepted: accepted,
		Closed:   closed,
		Closer:   closer,
		Reason:   reason,
	}
}

func (t *TicketsRepository) parseTickets(tickets []sqlc.Ticket) ticketsdomain.Tickets {
	var out = make(ticketsdomain.Tickets, len(tickets))
	for i, ticket := range tickets {
		out[i] = t.parseTicket(ticket)
	}
	return out
}

func (t *TicketsRepository) TicketsByUser(ctx context.Context, user domain.UUID, limit int32, offset int32) (ticketsdomain.Tickets, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := t.conn.TicketsByAuthor(ctx, sqlc.TicketsByAuthorParams{
		Author: user.ToPG(),
		Offset: offset,
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	return t.parseTickets(list), nil
}

func (t *TicketsRepository) OpenedTickets(ctx context.Context, limit int32, offset int32) (ticketsdomain.Tickets, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := t.conn.OpenedTickets(ctx, sqlc.OpenedTicketsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return t.parseTickets(list), nil
}

func (t *TicketsRepository) Info(ctx context.Context, ticket domain.UUID) (*ticketsdomain.Ticket, error) {
	info, err := t.conn.TicketInfo(ctx, ticket.ToPG())
	if err != nil {
		return nil, err
	}
	return t.parseTicket(info), nil
}

func (t *TicketsRepository) IsClosed(ctx context.Context, ticket domain.UUID) (bool, error) {
	closed, err := t.conn.IsTicketClosed(ctx, ticket.ToPG())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, errors.NotFound
		}
		return false, err
	}
	return closed, nil
}

func (t *TicketsRepository) isAccepted(ctx context.Context, ticket domain.UUID) (bool, error) {
	accepted, err := t.conn.IsTicketAccepted(ctx, ticket.ToPG())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, errors.NotFound
		}
		return false, err
	}
	return accepted, nil
}

func (t *TicketsRepository) CreateTicket(ctx context.Context, user domain.UUID, topic string, title string) (*ticketsdomain.Ticket, error) {
	if topic == "" || title == "" {
		return nil, errors.InvalidArguments
	}
	out, err := t.conn.CreateTicket(ctx, sqlc.CreateTicketParams{
		Author: user.ToPG(),
		Topic:  topic,
		Title:  title,
	})
	if err != nil {
		return nil, err
	}
	return t.parseTicket(out), nil
}

func (t *TicketsRepository) AcceptTicket(ctx context.Context, target ticketsdomain.Target) error {
	accepted, err := t.isAccepted(ctx, target.Ticket)
	if err != nil {
		return err
	}
	if accepted {
		return errors.Conflict
	}
	return t.conn.AcceptTicket(ctx, sqlc.AcceptTicketParams{
		Acceptor: target.User.ToPG(),
		ID:       target.Ticket.ToPG(),
	})
}

func (t *TicketsRepository) CloseTicket(ctx context.Context, caller ticketsdomain.Caller, reason *string) error {
	var arg sqlc.CloseTicketParams
	arg.Closer = sqlc.NullTicketsCaller{TicketsCaller: caller.SQLC(), Valid: true}
	if caller != ticketsdomain.CallerUser {
		if reason == nil {
			return errors.InvalidArguments
		}
		arg.Reason = pgtype.Text{String: *reason, Valid: true}
	}
	return t.conn.CloseTicket(ctx, arg)
}

func (t *TicketsRepository) ExpiredTickets(ctx context.Context, hours time.Duration) ([]*domain.UUID, error) {
	ids, err := t.conn.ExpiredTickets(ctx, pgtype.Interval{Microseconds: hours.Microseconds(), Valid: true})
	if err != nil {
		return nil, err
	}
	var out = make([]*domain.UUID, len(ids))
	for i, id := range ids {
		out[i] = &domain.UUID{UUID: id.Bytes}
	}
	return out, nil
}

func (*TicketsRepository) parseMessage(src sqlc.TicketsMessage) *ticketsdomain.Message {
	return &ticketsdomain.Message{
		ID:      domain.UUID{UUID: src.ID.Bytes},
		Ticket:  domain.UUID{UUID: src.Ticket.Bytes},
		Author:  domain.UUID{UUID: src.Author.Bytes},
		Content: src.Content,
		Created: src.Created.Time,
	}
}

func (t *TicketsRepository) parseMessages(src []sqlc.TicketsMessage) ticketsdomain.Messages {
	var out = make(ticketsdomain.Messages, len(src))
	for i, e := range src {
		out[i] = t.parseMessage(e)
	}
	return out
}

func (t *TicketsRepository) CreateMessage(ctx context.Context, target ticketsdomain.Target, content string) (*ticketsdomain.Message, error) {
	if content == "" {
		return nil, errors.InvalidArguments
	}
	closed, err := t.IsClosed(ctx, target.Ticket)
	if err != nil {
		return nil, err
	}
	if closed {
		return nil, errors.DataExpired
	}
	message, err := t.conn.CreateTicketMessage(ctx, sqlc.CreateTicketMessageParams{
		Ticket:  target.Ticket.ToPG(),
		Author:  target.User.ToPG(),
		Content: content,
	})
	if err != nil {
		return nil, err
	}
	return t.parseMessage(message), nil
}

func (t *TicketsRepository) MessagesList(ctx context.Context, ticket domain.UUID, limit int32, offset int32) (ticketsdomain.Messages, error) {
	if limit <= 0 {
		limit = 20
	}
	list, err := t.conn.TicketMessages(ctx, sqlc.TicketMessagesParams{
		Ticket: ticket.ToPG(),
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return t.parseMessages(list), nil
}
