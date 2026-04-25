package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	maintenancepb "github.com/aesterial/cityideas/backend/internal/api/v1/maintenances/v1"
	maintenanceservice "github.com/aesterial/cityideas/backend/internal/app/maintenance"
	maintenancesdomain "github.com/aesterial/cityideas/backend/internal/domain/maintenances"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type MaintenanceHandler struct {
	maintenancepb.UnimplementedMaintenanceServiceServer
	mt   *maintenanceservice.Service
	auth *Authenticator
}

func (h *MaintenanceHandler) isRequestValid(req any) error {
	if h == nil || h.mt == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func NewMaintenanceHandler(mt *maintenanceservice.Service, auth *Authenticator) *MaintenanceHandler {
	return &MaintenanceHandler{
		mt:   mt,
		auth: auth,
	}
}

func (h *MaintenanceHandler) History(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*maintenancepb.HistoryResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.MaintenanceHistory); err != nil {
		return nil, err
	}
	list, err := h.mt.History(ctx, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	var out = &maintenancepb.HistoryResponse{}
	out.SetList(list.Protobuf())
	return out, nil
}

func (h *MaintenanceHandler) IsPlanned(ctx context.Context, _ *emptypb.Empty) (*maintenancepb.IsPlannedResponse, error) {
	at, desc, err := h.mt.IsPlanned(ctx)
	if err != nil {
		return nil, err
	}
	var out = &maintenancepb.IsPlannedResponse{}
	out.SetDescription(desc)
	out.SetAt(timestamppb.New(*at))
	return out, nil
}

func (h *MaintenanceHandler) Create(ctx context.Context, req *maintenancepb.CreateRequest) (*maintenancepb.Maintenance, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.MaintenanceCreate); err != nil {
		return nil, err
	}
	out, err := h.mt.Create(ctx, *meta.UserID, req.GetDescription(), maintenancesdomain.TimeRange{
		Start: new(req.GetTime().GetStart().AsTime()),
		End:   new(req.GetTime().GetEnd().AsTime()),
	})
	if err != nil {
		return nil, err
	}
	return out.Protobuf(), nil
}

func (h *MaintenanceHandler) Start(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.MaintenanceStart); err != nil {
		return nil, err
	}
	err = h.mt.SetStatus(ctx, req.GetValue(), true)
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *MaintenanceHandler) End(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.MaintenanceStop); err != nil {
		return nil, err
	}
	err = h.mt.SetStatus(ctx, req.GetValue(), false)
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}
