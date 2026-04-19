package handlers

import (
	"context"

	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
	loginservice "github.com/aesterial/cityideas/backend/internal/app/login"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type LoginHandler struct {
	loginpb.UnimplementedLoginServiceServer
	auth *Authenticator
	srv  *loginservice.Service
}

func NewLoginHandler(srv *loginservice.Service, auth *Authenticator) *LoginHandler {
	return &LoginHandler{
		auth: auth,
		srv:  srv,
	}
}

func (h *LoginHandler) response(usr *userdomain.User) *loginpb.LoginResponse {
	var resp = &loginpb.LoginResponse{}
	resp.SetInfo(usr.PrivateProtobuf())
	return resp
}

func (h *LoginHandler) Register(ctx context.Context, req *loginpb.RegisterRequest) (*loginpb.LoginResponse, error) {
	if h == nil || h.srv == nil {
		return nil, errors.ServerError
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}
	usr, err := h.srv.Register(ctx, req.GetUsername(), req.GetEmail(), req.GetPassword())
	if err != nil {
		logger.Error("login", "failed to register user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return h.response(usr), nil
}

func (h *LoginHandler) Authorize(ctx context.Context, req *loginpb.AuthorizeRequest) (*loginpb.LoginResponse, error) {
	if h == nil || h.srv == nil {
		return nil, errors.ServerError
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}
	usr, err := h.srv.Authorize(ctx, req.GetUserMail(), req.GetPassword())
	if err != nil {
		logger.Error("login", "failed to authorize user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return h.response(usr), nil
}

func (h *LoginHandler) Logout(ctx context.Context, _ *emptypb.Empty) (*emptypb.Empty, error) {
	if h == nil || h.auth == nil || h.srv == nil {
		return nil, errors.ServerError
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if meta.IsEmpty() {
		return nil, errors.Unauthenticated
	}
	err = h.srv.Logout(ctx, *meta.SessionID)
	if err != nil {
		logger.Error("login", "failed to logout user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return &emptypb.Empty{}, nil
}
