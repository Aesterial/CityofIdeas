package ticketservice

import (
	"context"
	"time"

	emailservice "github.com/aesterial/cityideas/backend/internal/app/email"
	"github.com/aesterial/cityideas/backend/internal/domain"
	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	ticketsdomain "github.com/aesterial/cityideas/backend/internal/domain/tickets"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	ticket ticketsdomain.Repository
	email  *emailservice.Service
	c      *cache.Store
}

func NewService(ticket ticketsdomain.Repository, email *emailservice.Service, store ...*cache.Store) *Service {
	var c *cache.Store
	if len(store) > 0 {
		c = store[0]
	}
	if c == nil {
		c = cache.New(cache.DefaultMaxEntries)
	}
	return &Service{ticket: ticket, email: email, c: c}
}

const (
	ticketCacheTTL         = 10 * time.Second
	ticketListCacheTag     = "tickets:list"
	ticketMessagesCacheTag = "tickets:messages"
)

func (s *Service) CreateTicket(ctx context.Context, author domain.UUID, topic string, title string, message string) (*ticketsdomain.Ticket, error) {
	if topic == "" || title == "" {
		return nil, errors.InvalidArguments
	}
	ticket, err := s.ticket.CreateTicket(ctx, author, topic, title)
	if err != nil {
		logger.Error("tickets", "failed to create ticket", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	_, err = s.ticket.CreateMessage(ctx, ticketsdomain.Target{
		Ticket: ticket.ID,
		User:   author,
	}, message)
	if err != nil {
		logger.Error("tickets", "failed to create message", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	s.email.SendTicketCreateEmail(author, emaildomain.TicketCreation{
		Date:      ticket.Created,
		Topic:     ticket.Topic,
		TicketURL: config.Get().Domain + "/support/tickets/" + ticket.ID.String(),
	})
	s.c.DeleteTags(ticketListCacheTag, ticketUserListCacheTag(author.String()), ticketMessagesByTicketCacheTag(ticket.ID.String()))
	return ticket, nil
}

func (s *Service) TicketsList(ctx context.Context, user *domain.UUID, limit int32, offset int32) (ticketsdomain.Tickets, error) {
	if limit <= 0 {
		limit = 10
	}
	userKey := ""
	tags := []string{ticketListCacheTag}
	if user != nil {
		userKey = user.String()
		tags = append(tags, ticketUserListCacheTag(userKey))
	}
	key := cache.Key("tickets.list", userKey, limit, offset)
	out, err := cache.GetOrSet(ctx, s.c, key, ticketCacheTTL, tags, func(ctx context.Context) (ticketsdomain.Tickets, error) {
		var out ticketsdomain.Tickets
		var err error
		if user != nil {
			out, err = s.ticket.TicketsByUser(ctx, *user, limit, offset)
		} else {
			out, err = s.ticket.Tickets(ctx, limit, offset)
		}
		if err != nil {
			logger.Error("tickets", "failed to get list of tickets", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, errors.NotFound
	}
	return out, nil
}

func (s *Service) Ticket(ctx context.Context, ticket string, requestor *domain.UUID) (*ticketsdomain.Ticket, error) {
	id, err := domain.FromString(ticket)
	if err != nil {
		return nil, err
	}
	if requestor != nil {
		author, err := s.ticket.Owner(ctx, id)
		if err != nil {
			logger.Error("tickets", "failed to get owner of ticket", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		if *author != *requestor {
			return nil, errors.AccessDenied
		}
	}
	key := cache.Key("tickets.info", id.String())
	return cache.GetOrSet(ctx, s.c, key, ticketCacheTTL, []string{ticketInfoCacheTag(id.String())}, func(ctx context.Context) (*ticketsdomain.Ticket, error) {
		out, err := s.ticket.Info(ctx, id)
		if err != nil {
			logger.Error("tickets", "failed to get info about ticket", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return out, nil
	})
}

func (s *Service) Accept(ctx context.Context, ticket string, by domain.UUID) error {
	id, err := domain.FromString(ticket)
	if err != nil {
		return err
	}
	err = s.ticket.AcceptTicket(ctx, ticketsdomain.Target{
		Ticket: id,
		User:   by,
	})
	if err != nil {
		logger.Error("tickets", "failed to accept ticket", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(ticketListCacheTag, ticketInfoCacheTag(id.String()))
	return nil
}

func (s *Service) Close(ctx context.Context, ticket string, by *domain.UUID, reason *string) error {
	id, err := domain.FromString(ticket)
	if err != nil {
		return err
	}
	var caller = ticketsdomain.CallerSystem
	if by != nil {
		if reason != nil {
			caller = ticketsdomain.CallerStaff
		} else {
			owner, err := s.ticket.Owner(ctx, id)
			if err != nil {
				return err
			}
			if *owner != *by {
				return errors.AccessDenied
			}
			caller = ticketsdomain.CallerUser
		}
	}
	err = s.ticket.CloseTicket(ctx, id, by, caller, reason)
	if err != nil {
		logger.Error("tickets", "failed to close ticket", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(ticketListCacheTag, ticketInfoCacheTag(id.String()))
	return nil
}

func (s *Service) CreateMessage(ctx context.Context, ticket string, content string, by domain.UUID, access bool) (*ticketsdomain.Message, error) {
	if content == "" {
		return nil, errors.InvalidArguments
	}
	id, err := domain.FromString(ticket)
	if err != nil {
		return nil, err
	}
	author, err := s.ticket.Owner(ctx, id)
	if err != nil {
		logger.Error("tickets", "failed to get owner of ticket", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	if !access && *author != by {
		return nil, errors.AccessDenied
	}
	message, err := s.ticket.CreateMessage(ctx, ticketsdomain.Target{
		Ticket: id,
		User:   by,
	}, content)
	if err != nil {
		logger.Error("tickets", "failed to create message for ticket", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	if access && by != *author {
		s.email.SendTicketReplyEmail(by, *author, emaildomain.TicketReply{
			TicketID:  ticket,
			Message:   content,
			Public:    emaildomain.Public{},
			ThreadURL: config.Get().Domain + "/support/tickets/" + ticket,
		})
	}
	s.c.DeleteTags(ticketMessagesCacheTag, ticketMessagesByTicketCacheTag(id.String()))
	return message, nil
}

func (s *Service) Messages(ctx context.Context, ticket string, caller *domain.UUID, limit int32, offset int32) (ticketsdomain.Messages, error) {
	id, err := domain.FromString(ticket)
	if err != nil {
		return nil, err
	}
	if caller != nil {
		author, err := s.ticket.Owner(ctx, id)
		if err != nil {
			return nil, errors.Wrap(err)
		}
		if *author != *caller {
			return nil, errors.AccessDenied
		}
	}
	if limit <= 0 {
		limit = 10
	}
	key := cache.Key("tickets.messages", id.String(), limit, offset)
	return cache.GetOrSet(ctx, s.c, key, ticketCacheTTL, []string{ticketMessagesCacheTag, ticketMessagesByTicketCacheTag(id.String())}, func(ctx context.Context) (ticketsdomain.Messages, error) {
		messages, err := s.ticket.MessagesList(ctx, id, limit, offset)
		if err != nil {
			logger.Error("tickets", "failed to get list of messages for ticket", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return messages, nil
	})
}

func ticketInfoCacheTag(id string) string {
	return "tickets:item:" + id
}

func ticketUserListCacheTag(id string) string {
	return "tickets:user:" + id
}

func ticketMessagesByTicketCacheTag(id string) string {
	return "tickets:messages:" + id
}
