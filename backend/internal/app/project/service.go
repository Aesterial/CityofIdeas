package projectservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	projectdomain "github.com/aesterial/cityideas/backend/internal/domain/projects"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	proj projectdomain.Repository
	c    *cache.Store
}

func NewService(proj projectdomain.Repository, store ...*cache.Store) *Service {
	var c *cache.Store
	if len(store) > 0 {
		c = store[0]
	}
	if c == nil {
		c = cache.New(cache.DefaultMaxEntries)
	}
	return &Service{proj: proj, c: c}
}

const (
	projectCacheTTL           = 30 * time.Second
	projectListCacheTag       = "projects:list"
	projectTopCacheTag        = "projects:top"
	projectMessagesListTag    = "projects:messages"
	projectSubmissionCacheTag = "projects:submissions"
	statisticsCacheTag        = "statistics"
)

func (s *Service) CreateProject(ctx context.Context, user domain.UUID, title string, description string, category string, cityID domain.UUID, latitude float64, longitude float64) (*projectdomain.Project, error) {
	if title == "" || category == "" {
		return nil, errors.InvalidArguments
	}
	proj, err := s.proj.CreateProject(ctx, user, title, description, category, cityID, latitude, longitude)
	if err != nil {
		logger.Error("projects", "failed to create project", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	s.c.DeleteTags(projectListCacheTag, projectTopCacheTag, projectSubmissionCacheTag, statisticsCacheTag)
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
	s.c.DeleteTags(projectMessagesListTag, projectMessagesCacheTag(project.String()), statisticsCacheTag)
	return out, nil
}

func (s *Service) ProjectInfo(ctx context.Context, project string) (*projectdomain.Project, error) {
	id, err := domain.FromString(project)
	if err != nil {
		return nil, err
	}
	key := cache.Key("project.info", id.String())
	return cache.GetOrSet(ctx, s.c, key, projectCacheTTL, []string{projectCacheTag(id.String())}, func(ctx context.Context) (*projectdomain.Project, error) {
		info, err := s.proj.Project(ctx, id)
		if err != nil {
			logger.Error("projects", "failed to get information about project", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return info, nil
	})
}

func (s *Service) ProjectsList(ctx context.Context, limit int32, offset int32) (projectdomain.Projects, error) {
	if limit <= 0 {
		limit = 10
	}
	key := cache.Key("projects.list", limit, offset)
	return cache.GetOrSet(ctx, s.c, key, projectCacheTTL, []string{projectListCacheTag}, func(ctx context.Context) (projectdomain.Projects, error) {
		list, err := s.proj.Projects(ctx, limit, offset)
		if err != nil {
			logger.Error("projects", "failed to get list of projects", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
}

func (s *Service) ProjectsTop(ctx context.Context, cityID domain.UUID, limit int32, offset int32) (projectdomain.Projects, error) {
	if limit <= 0 {
		limit = 3
	}
	key := cache.Key("projects.top", cityID.String(), limit, offset)
	return cache.GetOrSet(ctx, s.c, key, projectCacheTTL, []string{projectTopCacheTag}, func(ctx context.Context) (projectdomain.Projects, error) {
		list, err := s.proj.ProjectsTop(ctx, cityID, limit, offset)
		if err != nil {
			logger.Error("projects", "failed to get lis of projects top", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
}

func (s *Service) MessagesList(ctx context.Context, project string, limit int32, offset int32, showDeleted bool) (projectdomain.Messages, error) {
	if limit <= 0 {
		limit = 25
	}
	id, err := domain.FromString(project)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	key := cache.Key("projects.messages", id.String(), limit, offset, showDeleted)
	return cache.GetOrSet(ctx, s.c, key, projectCacheTTL, []string{projectMessagesListTag, projectMessagesCacheTag(id.String())}, func(ctx context.Context) (projectdomain.Messages, error) {
		list, err := s.proj.Messages(ctx, id, limit, offset, showDeleted)
		if err != nil {
			logger.Error("projects", "failed to get list of messages for project", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
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
	s.c.DeleteTags(projectCacheTag(id.String()), projectListCacheTag, projectTopCacheTag, projectSubmissionCacheTag, projectMessagesListTag, projectMessagesCacheTag(id.String()), statisticsCacheTag)
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
	s.c.DeleteTags(projectMessagesListTag, statisticsCacheTag)
	return nil
}

func (s *Service) ProcessLikes(ctx context.Context, project string, user domain.UUID, set bool) error {
	if project == "" {
		return errors.InvalidArguments
	}
	id, err := domain.FromString(project)
	if err != nil {
		return err
	}
	if err = s.proj.IsProjectExists(ctx, id); err != nil {
		return errors.Wrap(err)
	}
	can, err := s.proj.CanLike(ctx, id, user)
	if err != nil {
		logger.Error("projects", "failed to check is user can like project", logger.F("error", err))
		return errors.Wrap(err)
	}
	if !can {
		return errors.AccessDenied
	}
	if set {
		err = s.proj.CreateLike(ctx, id, user)
	} else {
		err = s.proj.RemoveLike(ctx, id, user)
	}
	if err != nil {
		logger.Error("projects", "failed to process like action", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(projectCacheTag(id.String()), projectListCacheTag, projectTopCacheTag, statisticsCacheTag)
	return nil
}

func (s *Service) SubmissionsList(ctx context.Context, limit int32, offset int32) (projectdomain.Submissions, error) {
	if limit <= 0 {
		limit = 10
	}
	key := cache.Key("projects.submissions", limit, offset)
	return cache.GetOrSet(ctx, s.c, key, projectCacheTTL, []string{projectSubmissionCacheTag}, func(ctx context.Context) (projectdomain.Submissions, error) {
		list, err := s.proj.Submissions(ctx, limit, offset)
		if err != nil {
			logger.Error("projects", "failed to get list of submissions", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return list, nil
	})
}

func (s *Service) Submission(ctx context.Context, submission string) (*projectdomain.Submission, error) {
	if submission == "" {
		return nil, errors.InvalidArguments
	}
	id, err := domain.FromString(submission)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	key := cache.Key("projects.submission", id.String())
	return cache.GetOrSet(ctx, s.c, key, projectCacheTTL, []string{projectSubmissionCacheTag}, func(ctx context.Context) (*projectdomain.Submission, error) {
		info, err := s.proj.Submission(ctx, id)
		if err != nil {
			logger.Error("projects", "failed to get submission info", logger.F("error", err))
			return nil, errors.Wrap(err)
		}
		return info, nil
	})
}

func (s *Service) SubmissionReview(ctx context.Context, reviewer domain.UUID, submissionID string, conclusion bool, reason *string) error {
	if !conclusion && reason == nil || submissionID == "" {
		return errors.InvalidArguments
	}
	sid, err := domain.FromString(submissionID)
	if err != nil {
		return errors.Wrap(err)
	}
	submission, err := s.proj.Submission(ctx, sid)
	if err != nil {
		logger.Error("projects", "failed to get submission for review", logger.F("error", err))
		return errors.Wrap(err)
	}
	err = s.proj.SubmissionReview(ctx, submission.Project, reviewer, conclusion, reason)
	if err != nil {
		logger.Error("projects", "failed to review submission", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(projectSubmissionCacheTag, projectListCacheTag, projectTopCacheTag, statisticsCacheTag)
	return nil
}

func (s *Service) ProjectCity(ctx context.Context, project domain.UUID) (domain.UUID, error) {
	return s.proj.ProjectCity(ctx, project)
}

func (s *Service) MarkAsImplementing(ctx context.Context, reviewer domain.UUID, project string, implLink string) error {
	id, err := domain.FromString(project)
	if err != nil {
		return errors.Wrap(err)
	}
	info, err := s.proj.Project(ctx, id)
	if err != nil {
		return errors.Wrap(err)
	}
	if info.Status != projectdomain.StatusListing {
		return errors.InvalidArguments
	}
	if implLink != "" {
		err = s.proj.SetStatus(ctx, id, projectdomain.StatusImplementing, implLink)
	} else {
		err = s.proj.SetStatus(ctx, id, projectdomain.StatusImplementing)
	}
	if err != nil {
		logger.Error("projects", "failed to mark project as implementing", logger.F("error", err))
		return errors.Wrap(err)
	}
	s.c.DeleteTags(projectCacheTag(id.String()), projectListCacheTag, projectTopCacheTag, statisticsCacheTag)
	return nil
}

func projectCacheTag(id string) string {
	return "projects:item:" + id
}

func projectMessagesCacheTag(id string) string {
	return "projects:messages:" + id
}
