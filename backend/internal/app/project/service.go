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

func (s *Service) CreateMessage(ctx context.Context, user domain.UUID, project domain.UUID, parent *domain.UUID, content string) (*projectdomain.Message, error) {
	if content == "" {
		return nil, errors.InvalidArguments
	}
	out, err := s.proj.CreateMessage(ctx, user, project, parent, content)
	if err != nil {
		logger.Error("projects", "failed to create message", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return out, nil
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

func (s *Service) MessagesList(ctx context.Context, project string, limit int32, offset int32, showDeleted bool) (projectdomain.Messages, error) {
	if limit <= 0 {
		limit = 25
	}
	id, err := domain.FromString(project)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	list, err := s.proj.Messages(ctx, id, limit, offset, showDeleted)
	if err != nil {
		logger.Error("projects", "failed to get list of messages for project", logger.F("error", err))
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

func (s *Service) DeleteMessage(ctx context.Context, user domain.UUID, message string, skipAuthor bool) error {
	if message == "" {
		return errors.InvalidArguments
	}
	id, err := domain.FromString(message)
	if err != nil {
		return errors.Wrap(err)
	}
	if !skipAuthor {
		author, err := s.proj.MessageAuthor(ctx, id)
		if err != nil {
			return err
		}
		if user != *author {
			return errors.AccessDenied
		}
	}
	err = s.proj.DeleteMessage(ctx, id)
	if err != nil {
		logger.Error("projects", "failed to delete message", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) SubmissionsList(ctx context.Context, limit int32, offset int32) (projectdomain.Submissions, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := s.proj.Submissions(ctx, limit, offset)
	if err != nil {
		logger.Error("projects", "failed to get list of submissions", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return list, nil
}

func (s *Service) Submission(ctx context.Context, submission string) (*projectdomain.Submission, error) {
	if submission == "" {
		return nil, errors.InvalidArguments
	}
	id, err := domain.FromString(submission)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	info, err := s.proj.Submission(ctx, id)
	if err != nil {
		logger.Error("projects", "failed to get submission info", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return info, nil
}

func (s *Service) SubmissionReview(ctx context.Context, project string, conclusion bool, reason *string) error {
	if conclusion == false && reason == nil || project == "" {
		return errors.InvalidArguments
	}
	id, err := domain.FromString(project)
	if err != nil {
		return errors.Wrap(err)
	}
	err = s.proj.SubmissionReview(ctx, id, conclusion, reason)
	if err != nil {
		logger.Error("projects", "failed to review submission", logger.F("error", err))
		return errors.Wrap(err)
	}
	return nil
}
