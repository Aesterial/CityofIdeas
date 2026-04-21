package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	sessionpb "github.com/aesterial/cityideas/backend/internal/api/v1/sessions/v1"
	sessionsservice "github.com/aesterial/cityideas/backend/internal/app/session"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/emptypb"
)

type SessionHandler struct {
	sessionpb.UnimplementedSessionServiceServer
	auth *Authenticator
	ses  *sessionsservice.Service
}

func NewSessionHandler(ses *sessionsservice.Service, auth *Authenticator) *SessionHandler {
	return &SessionHandler{
		auth: auth,
		ses:  ses,
	}
}

func (h *SessionHandler) List(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*sessionpb.ListResponse, error) {
	if h == nil || h.ses == nil || h.auth == nil {
		return nil, errors.ServerError
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if meta.IsEmpty() {
		return nil, errors.Unauthenticated
	}
	list, err := h.ses.List(ctx, *meta.UserID, req.GetLimit(), req.GetOffset())
	if err != nil {
		logger.Error("sessions", "failed to get list of sessions", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	var resp = &sessionpb.ListResponse{}
	resp.SetList(list.Protobuf())
	return resp, nil
}

func (h *SessionHandler) Revoke(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if h == nil || h.ses == nil || h.auth == nil {
		return nil, errors.ServerError
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if meta.IsEmpty() {
		return nil, errors.Unauthenticated
	}
	idP, err := uuid.Parse(req.GetValue())
	if err != nil {
		return nil, errors.InvalidArguments
	}
	if meta.SessionID.UUID == idP {
		return nil, errors.Conflict
	}
	id := domain.UUID{UUID: idP}
	info, err := h.ses.Info(ctx, id)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if info.Owner != *meta.UserID {
		return nil, errors.AccessDenied
	}
	err = h.ses.Revoke(ctx, id)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	return &emptypb.Empty{}, nil
}
