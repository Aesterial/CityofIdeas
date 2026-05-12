package handlers

import (
	"context"

	actionspb "github.com/aesterial/cityideas/backend/internal/api/v1/actions/v1"
	actionsservice "github.com/aesterial/cityideas/backend/internal/app/actions"
	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type ActionsHandler struct {
	actionspb.UnimplementedActionsServiceServer
	auth *Authenticator
	srv  *actionsservice.Service
}

func NewActionsHandler(srv *actionsservice.Service, auth *Authenticator) *ActionsHandler {
	return &ActionsHandler{
		auth: auth,
		srv:  srv,
	}
}

func (h *ActionsHandler) isRequestValid(req any) error {
	if h == nil || h.srv == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func mapActionToPb(act *actionsdomain.Action) *actionspb.Action {
	if act == nil {
		return nil
	}
	var pbAct = new(actionspb.Action)
	pbAct.SetId(act.ID.String())
	pbAct.SetOwner(act.Owner.String())
	pbAct.SetPurpose(act.Purpose.String())
	pbAct.SetHash(act.Hash)
	pbAct.SetCreatedAt(timestamppb.New(act.CreatedAt))
	pbAct.SetExpiresAt(timestamppb.New(act.ExpiresAt))
	if act.Used != nil {
		pbAct.SetUsed(timestamppb.New(*act.Used))
	}
	return pbAct
}

func (h *ActionsHandler) CreateAction(ctx context.Context, req *actionspb.CreateActionRequest) (*actionspb.CreateActionResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}

	userUUID, err := domain.FromString(req.GetUser())
	if err != nil {
		return nil, errors.InvalidArguments
	}

	act, err := h.srv.Create(ctx, req.GetPurpose(), userUUID)
	if err != nil {
		return nil, errors.Wrap(err)
	}

	var resp = new(actionspb.CreateActionResponse)
	resp.SetAction(mapActionToPb(act))
	return resp, nil
}

func (h *ActionsHandler) UseAction(ctx context.Context, req *actionspb.UseActionRequest) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}

	err := h.srv.Use(ctx, req.GetPurpose(), req.GetHash())
	if err != nil {
		return nil, errors.Wrap(err)
	}

	return &emptypb.Empty{}, nil
}

func (h *ActionsHandler) FindAction(ctx context.Context, req *actionspb.FindActionRequest) (*actionspb.FindActionResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}

	act, err := h.srv.Find(ctx, req.GetPurpose(), req.GetHash())
	if err != nil {
		return nil, errors.Wrap(err)
	}

	var resp = new(actionspb.FindActionResponse)
	resp.SetAction(mapActionToPb(act))
	return resp, nil
}

func (h *ActionsHandler) GetActionsByOwner(ctx context.Context, req *actionspb.GetActionsByOwnerRequest) (*actionspb.GetActionsByOwnerResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}

	userUUID, err := domain.FromString(req.GetUser())
	if err != nil {
		return nil, errors.InvalidArguments
	}

	acts, err := h.srv.ByOwner(ctx, userUUID)
	if err != nil {
		return nil, errors.Wrap(err)
	}

	var pbActs = make([]*actionspb.Action, 0, len(acts))
	for _, act := range acts {
		pbActs = append(pbActs, mapActionToPb(act))
	}

	var resp = new(actionspb.GetActionsByOwnerResponse)
	resp.SetActions(pbActs)
	return resp, nil
}

func (h *ActionsHandler) CheckAction(ctx context.Context, req *actionspb.CheckActionRequest) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}

	err := h.srv.IsValid(ctx, req.GetPurpose(), req.GetHash())
	if err != nil {
		return nil, errors.Wrap(err)
	}

	return &emptypb.Empty{}, nil
}
