package grpcserver

import (
	"ascendant/backend/internal/app/info/permissions"
	"ascendant/backend/internal/app/info/sessions"
	userapp "ascendant/backend/internal/app/info/user"
	"ascendant/backend/internal/app/maintenance"
	maintdomain "ascendant/backend/internal/domain/maintenance"
	maintpb "ascendant/backend/internal/gen/maintenance/v1"
	"ascendant/backend/internal/infra/logger"
	"time"

	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type MaintenanceService struct {
	maintpb.UnimplementedMaintenanceServiceServer
	serv *maintenance.Service
	auth  *Authenticator
}

func NewMaintenanceService(s *maintenance.Service, ses *sessions.Service, perms *permissions.Service, us *userapp.Service) *MaintenanceService {
	return &MaintenanceService{serv: s, auth: NewAuthenticator(ses, perms, us)}
}

func (s *MaintenanceService) IsActive(ctx context.Context, _ *emptypb.Empty) (*maintpb.IsActiveResponse, error) {
	if s == nil || s.serv == nil {
		return nil, status.Error(codes.Internal, "maintenance service is not configured")
	}
	active, err := s.serv.CheckIsActive(ctx)
	if err != nil {
		logger.Debug("failed to check: " + err.Error(), "")
		return nil, status.Error(codes.Internal, "failed to check")
	}
	return &maintpb.IsActiveResponse{Active: active, Tracing: TraceIDOrNew(ctx)}, nil
}

func (s *MaintenanceService) Data(ctx context.Context, _ *emptypb.Empty) (*maintpb.DataResponse, error) {
	if s == nil || s.serv == nil {
		return nil, status.Error(codes.Internal, "maintenance service is not configured")
	}
	data, err := s.serv.GetData(ctx)
	if err != nil {
		if err.Error() == "maintenance is not active" {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		logger.Debug("Failed to get maintenance data: " + err.Error(), "")
		return nil, status.Error(codes.Internal, "failed to get data")
	}
	resp := data.ToProto()
	resp.Tracing = TraceIDOrNew(ctx)
	return resp, nil
}

func (s *MaintenanceService) Start(ctx context.Context, req *maintpb.CreateRequest) (*maintpb.Response, error) {
	if s == nil || s.serv == nil {
		return nil, status.Error(codes.Internal, "maintenance service is not configured")
	}
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil || requestor == nil {
		if err != nil {
			logger.Debug("Error while getting user: " + err.Error(), "")
		}
		return nil, status.Error(codes.PermissionDenied, "user not authentificated")
	}
	// TODO: add permission check
	if err := s.serv.Start(ctx, maintdomain.CreateST{Description: req.Description, Scope: req.Scope, PlannedStart: time.Time{}, PlannedEnd: req.WillEnd.AsTime()}, requestor.UID); err != nil {
		logger.Debug("failed to create maintenance: " + err.Error(), "")
		return nil, status.Error(codes.Internal, "failed to create maintenance")
	}
	return &maintpb.Response{Tracing: TraceIDOrNew(ctx)}, nil
}

func (s *MaintenanceService) StartPlanned(ctx context.Context, req *maintpb.CreateRequest) (*maintpb.Response, error) {
	if s == nil || s.serv == nil {
		return nil, status.Error(codes.Internal, "maintenance service is not configured")
	}
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil || requestor == nil {
		if err != nil {
			logger.Debug("Error while getting user: " + err.Error(), "")
		}
		return nil, status.Error(codes.PermissionDenied, "user not authentificated")
	}
	// TODO: add permission check
	if err := s.serv.Start(ctx, maintdomain.CreateST{Description: req.Description, Scope: req.Scope, PlannedStart: req.WillStart.AsTime(), PlannedEnd: req.WillEnd.AsTime()}, requestor.UID); err != nil {
		return nil, status.Error(codes.Internal, "failed to create maintenance")
	}
	return &maintpb.Response{Tracing: TraceIDOrNew(ctx)}, nil
}

func (s *MaintenanceService) Edit(ctx context.Context, req *maintpb.EditRequest) (*maintpb.Response, error) {
	if s == nil || s.serv == nil {
		return nil, status.Error(codes.Internal, "maintenance service is not configured")
	}
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil || requestor == nil {
		if err != nil {
			logger.Debug("Error while getting user: " + err.Error(), "")
		}
		return nil, status.Error(codes.PermissionDenied, "user not authentificated")
	}
	// TODO: add permission check
	if err := s.serv.Edit(ctx, maintdomain.EditST{Description: req.Description, Scope: req.Scope}); err != nil {
		return nil, status.Error(codes.Internal, "failed to edit maintenance")
	}
	return &maintpb.Response{Tracing: TraceIDOrNew(ctx)}, nil
}

func (s *MaintenanceService) Complete(ctx context.Context, _ *emptypb.Empty) (*maintpb.Response, error) {
	if s == nil || s.serv == nil {
		return nil, status.Error(codes.Internal, "maintenance service is not configured")
	}
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil || requestor == nil {
		if err != nil {
			logger.Debug("Error while getting user: " + err.Error(), "")
		}
		return nil, status.Error(codes.PermissionDenied, "user not authentificated")
	}
	// TODO: add permission check
	if err := s.serv.Complete(ctx); err != nil {
		return nil, status.Error(codes.Internal, "failed to complete maintenance")
	}
	return &maintpb.Response{Tracing: TraceIDOrNew(ctx)}, nil
}