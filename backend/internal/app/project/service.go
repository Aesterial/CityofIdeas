package projectservice

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	projectdomain "github.com/aesterial/cityideas/backend/internal/domain/projects"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	proj projectdomain.Repository
}

func NewService(proj projectdomain.Repository) *Service {
	return &Service{proj: proj}
}

func (s *Service) CreateProject(ctx context.Context, user domain.UUID, title string, description string, category string) (*projectdomain.Project, error) {
	if title == "" || category == "" {
		return nil, errors.InvalidArguments
	}
	proj, err := s.proj.CreateProject(ctx, user, title, description, category)
	if err != nil {
		logger.Error("projects", "failed to create project", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return proj, nil
}

func (s *Service) ProjectInfo(ctx context.Context, project string) (*projectdomain.Project, error) {
	id, err := domain.FromString(project)
	if err != nil {
		return nil, err
	}
	info, err := s.proj.Project(ctx, id)
	if err != nil {
		logger.Error("projects", "failed to get information about project", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return info, nil
}

func (s *Service) ProjectsList(ctx context.Context, limit int32, offset int32) (projectdomain.Projects, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := s.proj.Projects(ctx, limit, offset)
	if err != nil {
		logger.Error("projects", "failed to get list of projects", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return list, nil
}

func (s *Service) DeleteProject(ctx context.Context, user domain.UUID, project string, hasRights bool) error {
	id, err := domain.FromString(project)
	if err != nil {
		return err
	}
	if !hasRights {
		author, err := s.proj.ProjectAuthor(ctx, id)
		if err != nil {
			logger.Error("projects", "failed to get project author", logger.F("error", err))
			return errors.Wrap(err)
		}
		if *author != user {
			return errors.AccessDenied
		}
	}
	err = s.proj.DeleteProject(ctx, id)
	if err != nil {
		logger.Error("projects", "failed to delete project", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}
