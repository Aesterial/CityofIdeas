package grpcserver

import (
	permissionsapp "ascendant/backend/internal/app/info/permissions"
	sessionsapp "ascendant/backend/internal/app/info/sessions"
	userapp "ascendant/backend/internal/app/info/user"
	"ascendant/backend/internal/app/tickets"
	permsdomain "ascendant/backend/internal/domain/permissions"
	ticketsdomain "ascendant/backend/internal/domain/tickets"
	tickpb "ascendant/backend/internal/gen/tickets/v1"
	"ascendant/backend/internal/infra/logger"
	"context"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type TicketsService struct {
	tickpb.UnimplementedTicketsServiceServer
	auth *Authenticator
	serv *tickets.Service
}

func NewTicketsService(s *tickets.Service, sess *sessionsapp.Service, perms *permissionsapp.Service, us *userapp.Service) *TicketsService {
	return &TicketsService{serv: s, auth: NewAuthenticator(sess, perms, us)}
}

func (t *TicketsService) Create(ctx context.Context, req *tickpb.CreateRequest) (*tickpb.CreateResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	id, err := t.serv.Create(ctx, req.GetName(), req.GetEmail(), ticketsdomain.TicketTopic(req.GetTopic()), req.GetBrief())
	if err != nil {
		logger.Debug("error in creation ticket: "+err.Error(), "")
		return nil, status.Error(codes.Internal, "failed to create ticket")
	}
	if id == nil {
		return nil, status.Error(codes.Internal, "failed to create ticket")
	}
	return &tickpb.CreateResponse{Id: id.String(), Tracing: TraceIDOrNew(ctx)}, nil
}

func (t *TicketsService) Info(ctx context.Context, req *tickpb.TicketInfoRequest) (*tickpb.TicketInfoResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not correct")
	}
	info, err := t.serv.Info(ctx, id)
	if err != nil {
		logger.Debug("failed to get info about ticket: "+err.Error(), "")
		return nil, status.Error(codes.Internal, "failed to get information about ticket")
	}
	return &tickpb.TicketInfoResponse{Ticket: info.ToProto(), Tracing: TraceIDOrNew(ctx)}, nil
}

func (t *TicketsService) Messages(ctx context.Context, req *tickpb.TicketInfoRequest) (*tickpb.TicketMessagesResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not correct")
	}
	list, err := t.serv.Messages(ctx, id)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get messages list")
	}
	return &tickpb.TicketMessagesResponse{List: list.ToProto(), Tracing: TraceIDOrNew(ctx)}, nil
}

func (t *TicketsService) MessageCreate(ctx context.Context, req *tickpb.TicketMessageCreate) (*tickpb.EmptyResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not correct")
	}
	if err := t.serv.CreateMessage(ctx, id, req.Content, 0); err != nil {
		return nil, status.Error(codes.Internal, "failed to create")
	}
	return &tickpb.EmptyResponse{Tracing: TraceIDOrNew(ctx)}, nil
}

func (t *TicketsService) CloseTicket(ctx context.Context, req *tickpb.CloseTicketRequest) (*tickpb.EmptyResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not correct")
	}
	if err := t.serv.Close(ctx, id, ticketsdomain.ClosedBySystem, "some reason"); err != nil {
		return nil, status.Error(codes.Internal, "failed to close tickt")
	}
	return &tickpb.EmptyResponse{Tracing: TraceIDOrNew(ctx)}, nil
}

func (t *TicketsService) List(ctx context.Context, _ *emptypb.Empty) (*tickpb.TicketsListResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	list, err := t.serv.List(ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, "Failed to get")
	}
	return &tickpb.TicketsListResponse{List: list.ToProto(), Tracing: TraceIDOrNew(ctx)}, nil
}

func (t *TicketsService) AcceptTicket(ctx context.Context, req *tickpb.TicketInfoRequest) (*tickpb.EmptyResponse, error) {
	if t == nil || t.serv == nil {
		return nil, status.Error(codes.Internal, "projects service not configured")
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	requestor, err := t.auth.RequireUser(ctx)
	if err != nil || requestor == nil {
		return nil, err
	}
	if err := t.auth.RequirePermissions(ctx, requestor.UID, permsdomain.CreateIdea); err != nil {
		return nil, err
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not correct")
	}
	if err := t.serv.Accept(ctx, id, requestor.UID); err != nil {
		return nil, status.Error(codes.Internal, "Failed to accept")
	}
	return &tickpb.EmptyResponse{Tracing: TraceIDOrNew(ctx)}, nil
}
