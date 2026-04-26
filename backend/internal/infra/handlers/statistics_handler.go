package handlers

import (
	"context"

	statpb "github.com/aesterial/cityideas/backend/internal/api/v1/statistics/v1"
	statisticsservice "github.com/aesterial/cityideas/backend/internal/app/statistics"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type StatisticsHandler struct {
	statpb.UnimplementedStatisticServiceServer
	stat *statisticsservice.Service
	auth *Authenticator
}

func NewStatisticsHandler(stat *statisticsservice.Service, auth *Authenticator) *StatisticsHandler {
	return &StatisticsHandler{
		stat: stat,
		auth: auth,
	}
}

func (h *StatisticsHandler) isRequestValid(req any) error {
	if h == nil || h.stat == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func (h *StatisticsHandler) checkPermission(ctx context.Context, permission permissionsdomain.Permission) error {
	meta, err := h.auth.User(ctx)
	if err != nil {
		return errors.Wrap(err)
	}
	return h.auth.Permissions(ctx, *meta, permission)
}

func (h *StatisticsHandler) Global(ctx context.Context, req *emptypb.Empty) (*statpb.Global, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	out, err := h.stat.Global(ctx)
	if err != nil {
		return nil, err
	}
	return out.Protobuf(), nil
}

func (h *StatisticsHandler) ProjectVotes(ctx context.Context, req *statpb.RequestByCity) (*statpb.Graph, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if err := h.checkPermission(ctx, permissionsdomain.StatisticsVotes); err != nil {
		return nil, err
	}
	out, separator, err := h.stat.Votes(ctx, req.GetSeparator(), req.GetCity())
	if err != nil {
		return nil, err
	}
	return out.Protobuf(separator), nil
}

func (h *StatisticsHandler) ProjectCreation(ctx context.Context, req *statpb.RequestByCity) (*statpb.Graph, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if err := h.checkPermission(ctx, permissionsdomain.StatisticsCreation); err != nil {
		return nil, err
	}
	out, separator, err := h.stat.Creation(ctx, req.GetSeparator(), req.GetCity())
	if err != nil {
		return nil, err
	}
	return out.Protobuf(separator), nil
}

func (h *StatisticsHandler) ProjectDiscussion(ctx context.Context, req *statpb.RequestByCity) (*statpb.Graph, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if err := h.checkPermission(ctx, permissionsdomain.StatisticsDiscussion); err != nil {
		return nil, err
	}
	out, separator, err := h.stat.Discussion(ctx, req.GetSeparator(), req.GetCity())
	if err != nil {
		return nil, err
	}
	return out.Protobuf(separator), nil
}

func (h *StatisticsHandler) QuestionsActivity(ctx context.Context, req *statpb.SeparatorValue) (*statpb.Graph, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if err := h.checkPermission(ctx, permissionsdomain.StatisticsQuestions); err != nil {
		return nil, err
	}
	out, separator, err := h.stat.Questions(ctx, req.GetValue())
	if err != nil {
		return nil, err
	}
	return out.Protobuf(separator), nil
}
