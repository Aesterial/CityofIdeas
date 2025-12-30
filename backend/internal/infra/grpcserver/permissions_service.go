package grpcserver

import (
	permissionsapp "ascendant/backend/internal/app/info/permissions"
	sessionsapp "ascendant/backend/internal/app/info/sessions"
	"ascendant/backend/internal/domain/permissions"
	permspb "ascendant/backend/internal/gen/permissions/v1"
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type PermissionsService struct {
	permspb.UnimplementedPermissionsServiceServer
	permissions *permissionsapp.Service
	auth        *Authenticator
}

func NewPermissionsService(perms *permissionsapp.Service, sessions *sessionsapp.Service) *PermissionsService {
	return &PermissionsService{
		permissions: perms,
		auth:        NewAuthenticator(sessions, perms),
	}
}

func (s *PermissionsService) Get(ctx context.Context, _ *emptypb.Empty) (*permspb.PermissionsResponse, error) {
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		return nil, err
	}
	if s.permissions == nil {
		return nil, status.Error(codes.Internal, "permissions service not configured")
	}
	perms, err := s.permissions.GetForUser(ctx, requestor.UID)
	if err != nil {
		return nil, statusFromError(err)
	}
	traceID := TraceIDOrNew(ctx)
	return &permspb.PermissionsResponse{Data: toProtoPermissions(perms), Tracing: traceID}, nil
}

func (s *PermissionsService) ForUser(ctx context.Context, req *permspb.RequestForUser) (*permspb.PermissionsResponse, error) {
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		return nil, err
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	if s.permissions == nil {
		return nil, status.Error(codes.Internal, "permissions service not configured")
	}
	if err := s.auth.RequireViewPermissions(ctx, requestor.UID); err != nil {
		return nil, err
	}
	perms, err := s.permissions.GetForUser(ctx, uint(req.UserID))
	if err != nil {
		return nil, statusFromError(err)
	}
	traceID := TraceIDOrNew(ctx)
	return &permspb.PermissionsResponse{Data: toProtoPermissions(perms), Tracing: traceID}, nil
}

func (s *PermissionsService) ForRank(ctx context.Context, req *permspb.RequestForRank) (*permspb.PermissionsResponse, error) {
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		return nil, err
	}
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is empty")
	}
	if s.permissions == nil {
		return nil, status.Error(codes.Internal, "permissions service not configured")
	}
	if err := s.auth.RequireViewPermissions(ctx, requestor.UID); err != nil {
		return nil, err
	}
	perms, err := s.permissions.GetForRank(ctx, req.Name)
	if err != nil {
		return nil, statusFromError(err)
	}
	traceID := TraceIDOrNew(ctx)
	return &permspb.PermissionsResponse{Data: toProtoPermissions(perms), Tracing: traceID}, nil
}

func (s *PermissionsService) ChangeForUser(ctx context.Context, req *permspb.RequestForUserChange) (*permspb.EmptyResponse, error) {
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		return nil, err
	}
	if s.permissions == nil {
		return nil, status.Error(codes.Internal, "permissions service not configured")
	}
	if err := s.auth.RequirePermissions(ctx, requestor.UID, permissions.ManagePermissions); err != nil {
		return nil, err
	}
	if req == nil || req.Permissions == nil {
		return nil, status.Error(codes.InvalidArgument, "permissions is required")
	}
	current, err := s.permissions.GetForUser(ctx, uint(req.UserID))
	if err != nil {
		return nil, statusFromError(err)
	}
	merged := mergePermissions(current, req.Permissions)
	if err := s.permissions.SetForUser(ctx, uint(req.UserID), merged); err != nil {
		return nil, statusFromError(err)
	}
	traceID := TraceIDOrNew(ctx)
	return &permspb.EmptyResponse{Tracing: traceID}, nil
}

func (s *PermissionsService) ChangeForRank(ctx context.Context, req *permspb.RequestForRankChange) (*permspb.EmptyResponse, error) {
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		return nil, err
	}
	if s.permissions == nil {
		return nil, status.Error(codes.Internal, "permissions service not configured")
	}
	if err := s.auth.RequirePermissions(ctx, requestor.UID, permissions.ManagePermissions); err != nil {
		return nil, err
	}
	if req == nil || req.Permissions == nil {
		return nil, status.Error(codes.InvalidArgument, "permissions is required")
	}
	current, err := s.permissions.GetForRank(ctx, req.Name)
	if err != nil {
		return nil, statusFromError(err)
	}
	merged := mergePermissions(current, req.Permissions)
	if err := s.permissions.SetForRank(ctx, req.Name, merged); err != nil {
		return nil, statusFromError(err)
	}
	traceID := TraceIDOrNew(ctx)
	return &permspb.EmptyResponse{Tracing: traceID}, nil
}
