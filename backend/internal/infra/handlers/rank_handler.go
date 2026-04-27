package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	rankpb "github.com/aesterial/cityideas/backend/internal/api/v1/ranks/v1"
	rankservice "github.com/aesterial/cityideas/backend/internal/app/rank"
	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type RankHandler struct {
	rankpb.UnimplementedRankServiceServer
	rank *rankservice.Service
	auth *Authenticator
}

func NewRankHandler(rank *rankservice.Service, auth *Authenticator) *RankHandler {
	return &RankHandler{
		rank: rank,
		auth: auth,
	}
}

func (h *RankHandler) isRequestValid(req any) error {
	if h == nil || h.rank == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func (h *RankHandler) Create(ctx context.Context, req *rankpb.CreateRequest) (*rankpb.Rank, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.RankCreate); err != nil {
		return nil, err
	}
	out, err := h.rank.CreateRank(ctx, req.GetName(), req.GetDescription(), req.GetColor(), req.GetWeight(), req.GetPerms())
	if err != nil {
		return nil, err
	}
	return out.Protobuf(), nil
}

func (h *RankHandler) Rank(ctx context.Context, req *typespb.RequestWithValue) (*rankpb.Rank, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.RankInfo); err != nil {
		return nil, err
	}
	out, err := h.rank.RankInfo(ctx, req.GetValue())
	if err != nil {
		return nil, err
	}
	return out.Protobuf(), nil
}

func (h *RankHandler) Permissions(ctx context.Context, _ *emptypb.Empty) (*rankpb.Permissions, error) {
	if err := h.isRequestValid(""); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.RankList); err != nil {
		return nil, err
	}
	var out = &rankpb.Permissions{}
	out.SetPerms(permissionsdomain.All.Strings())
	return out, nil
}

func (h *RankHandler) List(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*rankpb.ListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.RankList); err != nil {
		return nil, err
	}
	list, err := h.rank.RanksList(ctx, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	var out = &rankpb.ListResponse{}
	out.SetList(list.Protobuf())
	return out, nil
}

func (h *RankHandler) Edit(ctx context.Context, req *rankpb.Rank) (*rankpb.Rank, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.RankUpdate); err != nil {
		return nil, err
	}
	id, err := domain.FromString(req.GetId())
	if err != nil {
		return nil, err
	}
	out, err := h.rank.UpdateRank(ctx, req.GetName(), ranksdomain.Rank{
		ID:          id,
		Name:        req.GetName(),
		Description: req.GetDescription(),
		Color:       req.GetColor(),
		Weight:      req.GetWeight(),
		Permissions: permissionsdomain.FromStrings(req.GetPermissions()),
	})
	if err != nil {
		return nil, err
	}
	return out.Protobuf(), nil
}

func (h *RankHandler) Delete(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.RankDelete); err != nil {
		return nil, err
	}
	err = h.rank.DeleteRank(ctx, req.GetValue())
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}
