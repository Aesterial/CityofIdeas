package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	userservice "github.com/aesterial/cityideas/backend/internal/app/user"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type UserHandler struct {
	userpb.UnimplementedUserServiceServer
	auth *Authenticator
	srv  *userservice.Service
}

func NewUserHandler(srv *userservice.Service, auth *Authenticator) *UserHandler {
	return &UserHandler{
		auth: auth,
		srv:  srv,
	}
}

func (h *UserHandler) isRequestValid(req any) error {
	if h == nil || h.srv == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func (h *UserHandler) Info(ctx context.Context, req *typespb.RequestWithValue) (*userpb.PublicUser, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}
	_, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	usr, err := h.srv.Username(ctx, req.GetValue())
	if err != nil {
		return nil, err
	}
	return usr.PublicProtobuf(), nil
}

func (h *UserHandler) Self(ctx context.Context, _ *emptypb.Empty) (*userpb.PrivateUser, error) {
	if err := h.isRequestValid("{}"); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if meta.IsEmpty() {
		return nil, errors.Unauthenticated
	}
	usr, err := h.srv.ID(ctx, *meta.UserID)
	if err != nil {
		return nil, err
	}
	return usr.PrivateProtobuf(), nil
}

func (h *UserHandler) List(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*userpb.ListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.UserViewAll); err != nil {
		return nil, err
	}
	list, err := h.srv.List(ctx, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	var resp = &userpb.ListResponse{}
	resp.SetList(list.Protobuf())
	return resp, nil
}

func (h *UserHandler) UpdatePreferences(ctx context.Context, req *userpb.UpdatePreferencesRequest) (*userpb.UserPreferences, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	out, err := h.srv.UpdatePreferences(ctx, *meta.UserID, *userdomain.ParsePreferences(req))
	if err != nil {
		logger.Error("user", "failed to update user preferences", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return out.Protobuf(), nil
}

func (h *UserHandler) Ban(ctx context.Context, req *userpb.BanRequest) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.UserBan); err != nil {
		return nil, err
	}
	err = h.srv.BanUser(ctx, req.GetTarget(), *meta.UserID, req.GetReason(), req.GetUntil())
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *UserHandler) Unban(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.UserUnban); err != nil {
		return nil, err
	}
	err = h.srv.UnbanUser(ctx, req.GetValue(), *meta.UserID)
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}
