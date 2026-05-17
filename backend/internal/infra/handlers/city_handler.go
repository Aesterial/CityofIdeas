package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	citypb "github.com/aesterial/cityideas/backend/internal/api/v1/cities/v1"
	cityservice "github.com/aesterial/cityideas/backend/internal/app/city"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type CityHandler struct {
	citypb.UnimplementedCitiesServiceServer
	city *cityservice.Service
	auth *Authenticator
}

func NewCityHandler(city *cityservice.Service, auth *Authenticator) *CityHandler {
	return &CityHandler{
		city: city,
		auth: auth,
	}
}

func (h *CityHandler) isRequestValid(req any) error {
	if h == nil || h.city == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func (h *CityHandler) List(ctx context.Context, _ *emptypb.Empty) (*citypb.ListResponse, error) {
	if h == nil || h.city == nil {
		return nil, errors.ServerError
	}
	list, err := h.city.List(ctx, 200, 0)
	if err != nil {
		return nil, err
	}
	out := &citypb.ListResponse{}
	out.SetList(list.Protobuf())
	return out, nil
}

func (h *CityHandler) Create(ctx context.Context, req *citypb.CreateCityRequest) (*citypb.City, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.CityCreate); err != nil {
		return nil, err
	}
	city, err := h.city.Create(ctx, req.GetName())
	if err != nil {
		return nil, err
	}
	return city.Protobuf(), nil
}

func (h *CityHandler) Delete(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.CityDelete); err != nil {
		return nil, err
	}
	if err = h.city.Delete(ctx, req.GetValue()); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}
