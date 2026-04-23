package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	ticketpb "github.com/aesterial/cityideas/backend/internal/api/v1/tickets/v1"
	ticketservice "github.com/aesterial/cityideas/backend/internal/app/ticket"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	ticketsdomain "github.com/aesterial/cityideas/backend/internal/domain/tickets"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type TicketHandler struct {
	ticketpb.UnimplementedTicketServiceServer
	ticket *ticketservice.Service
	auth   *Authenticator
}

func (h *TicketHandler) isRequestValid(req any) error {
	if h == nil || h.ticket == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func NewTicketHandler(ticket *ticketservice.Service, auth *Authenticator) *TicketHandler {
	return &TicketHandler{
		ticket: ticket,
		auth:   auth,
	}
}

func (*TicketHandler) listResponse(list []*ticketpb.Ticket) *ticketpb.TicketListResponse {
	if list == nil {
		return nil
	}
	var out = &ticketpb.TicketListResponse{}
	out.SetList(list)
	return out
}

func (h *TicketHandler) CreateTicket(ctx context.Context, req *ticketpb.CreateTicketRequest) (*ticketpb.Ticket, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.TicketCreate); err != nil {
		return nil, err
	}
	ticket, err := h.ticket.CreateTicket(ctx, *meta.UserID, req.GetTopic(), req.GetTitle(), req.GetMessage())
	if err != nil {
		return nil, err
	}
	return ticket.Protobuf(), nil
}

func (h *TicketHandler) SelfTickets(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*ticketpb.TicketListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	out, err := h.ticket.TicketsList(ctx, meta.UserID, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	return h.listResponse(out.Protobuf()), nil
}

func (h *TicketHandler) TicketsList(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*ticketpb.TicketListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.TicketViewAll); err != nil {
		return nil, err
	}
	out, err := h.ticket.TicketsList(ctx, nil, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	return h.listResponse(out.Protobuf()), nil
}

func (h *TicketHandler) Info(ctx context.Context, req *typespb.RequestWithValue) (*ticketpb.Ticket, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	var access = h.auth.Permissions(ctx, *meta, permissionsdomain.TicketViewAll) == nil
	var out *ticketsdomain.Ticket
	if access {
		out, err = h.ticket.Ticket(ctx, req.GetValue(), nil)
	} else {
		out, err = h.ticket.Ticket(ctx, req.GetValue(), meta.UserID)
	}
	if err != nil {
		return nil, err
	}
	if out == nil {
		return nil, errors.NotFound
	}
	return out.Protobuf(), nil
}

func (h *TicketHandler) Accept(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.TicketAccept); err != nil {
		return nil, err
	}
	err = h.ticket.Accept(ctx, req.GetValue(), *meta.UserID)
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *TicketHandler) Close(ctx context.Context, req *typespb.RequestWithValues) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	var access = h.auth.Permissions(ctx, *meta, permissionsdomain.TicketClose) == nil
	if access {
		if len(req.GetValues()) < 2 {
			return nil, errors.InvalidArguments
		}
		err = h.ticket.Close(ctx, req.GetValues()[0], meta.UserID, new(req.GetValues()[1]))
		if err != nil {
			return nil, err
		}
	} else {
		err = h.ticket.Close(ctx, req.GetValues()[0], meta.UserID, nil)
		if err != nil {
			return nil, err
		}
	}
	return &emptypb.Empty{}, nil
}

func (h *TicketHandler) CreateMessage(ctx context.Context, req *typespb.RequestWithValues) (*ticketpb.Message, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	var access = h.auth.Permissions(ctx, *meta, permissionsdomain.TicketMessageCreateAll) == nil
	if len(req.GetValues()) < 2 {
		return nil, errors.InvalidArguments
	}
	message, err := h.ticket.CreateMessage(ctx, req.GetValues()[0], req.GetValues()[1], *meta.UserID, access)
	if err != nil {
		return nil, err
	}
	return message.Protobuf(), nil
}

func (h *TicketHandler) Messages(ctx context.Context, req *typespb.RequestWithLimitAndOffsetAndValue) (*ticketpb.MessageListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	var messages ticketsdomain.Messages
	if err := h.auth.Permissions(ctx, *meta, permissionsdomain.TicketMessageViewAll); err != nil {
		messages, err = h.ticket.Messages(ctx, req.GetValue(), meta.UserID, req.GetLimit(), req.GetOffset())
		if err != nil {
			logger.Error("tickets", "failed to get list of messages for ticket", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
	} else {
		messages, err = h.ticket.Messages(ctx, req.GetValue(), nil, req.GetLimit(), req.GetOffset())
		if err != nil {
			logger.Error("tickets", "failed to get list of messages for ticket", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
	}
	var out = &ticketpb.MessageListResponse{}
	out.SetList(messages.Protobuf())
	return out, nil
}
