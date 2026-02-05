package submissions

import (
	"Aesterial/backend/internal/domain/projects"
	"Aesterial/backend/internal/domain/submissions"
	"Aesterial/backend/internal/domain/user"
	submpb "Aesterial/backend/internal/gen/submissions/v1"
	"Aesterial/backend/internal/infra/logger"
	apperrors "Aesterial/backend/internal/shared/errors"
	"context"
	"strings"
)

type Service struct {
	repo submissions.Repository
	proj projects.Repository
	usrs user.Repository
}

func New(repo submissions.Repository, proj projects.Repository, usrs user.Repository) *Service {
	return &Service{repo: repo, proj: proj, usrs: usrs}
}

func (s *Service) GetList(ctx context.Context) ([]*submpb.ListResponseTarget, error) {
	data, err := s.repo.GetList(ctx)
	if err != nil {
		logger.Debug("error appeared: "+err.Error(), "submissions.get_list")
		return nil, apperrors.Wrap(err)
	}
	var response []*submpb.ListResponseTarget
	for _, v := range data {
		p, err := s.proj.GetProject(ctx, v.ProjectID)
		if err != nil {
			logger.Debug("error appeared: "+err.Error(), "submissions.get_list.project")
			return nil, apperrors.Wrap(err)
		}
		author, err := s.usrs.GetUserByUID(ctx, p.Author.UID)
		if err != nil {
			logger.Debug("error appeared: "+err.Error(), "submissions.get_list.author")
			return nil, apperrors.Wrap(err)
		}
		p.Author = author
		reason := ""
		if v.Reason != nil {
			reason = *v.Reason
		}
		response = append(response, &submpb.ListResponseTarget{
			Id:     int32(v.ID),
			Info:   p.ToProto(),
			State:  v.State,
			Reason: reason,
		})
	}
	return response, nil
}

func (s *Service) GetActive(ctx context.Context) ([]*submpb.ListResponseTarget, error) {
	data, err := s.GetList(ctx)
	if err != nil {
		logger.Debug("error appeared: "+err.Error(), "submissions.get_active")
		return nil, err
	}
	var response []*submpb.ListResponseTarget
	for _, v := range data {
		if strings.ToLower(v.State) == "active" {
			response = append(response, v)
		}
	}
	return response, nil
}

func (s *Service) Approve(ctx context.Context, id int32) error {
	if id == 0 {
		return apperrors.InvalidArguments.AddErrDetails("invalid id")
	}
	if err := s.repo.Approve(ctx, id); err != nil {
		logger.Debug("error appeared: "+err.Error(), "submissions.approve")
		return apperrors.Wrap(err)
	}
	return nil
}

func (s *Service) Decline(ctx context.Context, id int32, reason string) error {
	if id == 0 || reason == "" {
		return apperrors.InvalidArguments.AddErrDetails("invalid data")
	}
	if err := s.repo.Decline(ctx, id, reason); err != nil {
		logger.Debug("error appeared: "+err.Error(), "submissions.decline")
		return apperrors.Wrap(err)
	}
	return nil
}
