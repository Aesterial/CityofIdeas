package projectservice

import (
	"context"
	"testing"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	projectdomain "github.com/aesterial/cityideas/backend/internal/domain/projects"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/google/uuid"
)

type projectRepoStub struct {
	projectID domain.UUID
	userID    domain.UUID
	likes     int64
}

func (r *projectRepoStub) ProjectsTop(context.Context, string, int32, int32) (projectdomain.Projects, error) {
	return r.projects(), nil
}

func (r *projectRepoStub) Projects(context.Context, int32, int32) (projectdomain.Projects, error) {
	return r.projects(), nil
}

func (r *projectRepoStub) Submissions(context.Context, int32, int32) (projectdomain.Submissions, error) {
	return nil, nil
}

func (r *projectRepoStub) Submission(context.Context, domain.UUID) (*projectdomain.Submission, error) {
	return nil, nil
}

func (r *projectRepoStub) SubmissionReview(context.Context, domain.UUID, bool, *string) error {
	return nil
}

func (r *projectRepoStub) Messages(context.Context, domain.UUID, int32, int32, bool) (projectdomain.Messages, error) {
	return nil, nil
}

func (r *projectRepoStub) MessageAuthor(context.Context, domain.UUID) (*domain.UUID, error) {
	return &r.userID, nil
}

func (r *projectRepoStub) Project(context.Context, domain.UUID) (*projectdomain.Project, error) {
	return r.project(), nil
}

func (r *projectRepoStub) ProjectAuthor(context.Context, domain.UUID) (*domain.UUID, error) {
	return &r.userID, nil
}

func (r *projectRepoStub) CreateProject(context.Context, domain.UUID, string, string, string, string, float64, float64) (*projectdomain.Project, error) {
	return r.project(), nil
}

func (r *projectRepoStub) CreateMessage(context.Context, domain.UUID, domain.UUID, *domain.UUID, string) (*projectdomain.Message, error) {
	return nil, nil
}

func (r *projectRepoStub) SetStatus(context.Context, domain.UUID, projectdomain.Status, ...string) error {
	return nil
}

func (r *projectRepoStub) UpdateDescription(context.Context, domain.UUID, string) error {
	return nil
}

func (r *projectRepoStub) DeleteMessage(context.Context, domain.UUID) error {
	return nil
}

func (r *projectRepoStub) DeleteProject(context.Context, domain.UUID) error {
	return nil
}

func (r *projectRepoStub) IsProjectExists(context.Context, domain.UUID) error {
	return nil
}

func (r *projectRepoStub) CreateLike(context.Context, domain.UUID, domain.UUID) error {
	r.likes++
	return nil
}

func (r *projectRepoStub) RemoveLike(context.Context, domain.UUID, domain.UUID) error {
	r.likes--
	return nil
}

func (r *projectRepoStub) projects() projectdomain.Projects {
	return projectdomain.Projects{r.project()}
}

func (r *projectRepoStub) project() *projectdomain.Project {
	now := time.Now()
	return &projectdomain.Project{
		ID:          r.projectID,
		Author:      r.userID,
		Title:       "title",
		Description: "description",
		Category:    "category",
		Status:      projectdomain.StatusListing,
		Likes:       r.likes,
		At:          now,
		Updated:     now,
	}
}

func TestProcessLikesInvalidatesProjectListCache(t *testing.T) {
	projectID := domain.FromUUID(uuid.New())
	userID := domain.FromUUID(uuid.New())
	repo := &projectRepoStub{
		projectID: projectID,
		userID:    userID,
	}
	service := NewService(repo, cache.New(cache.DefaultMaxEntries))

	first, err := service.ProjectsList(context.Background(), 10, 0)
	if err != nil {
		t.Fatal(err)
	}
	if got := first[0].Likes; got != 0 {
		t.Fatalf("expected initial likes to be 0, got %d", got)
	}

	if err := service.ProcessLikes(context.Background(), projectID.String(), userID, true); err != nil {
		t.Fatal(err)
	}

	second, err := service.ProjectsList(context.Background(), 10, 0)
	if err != nil {
		t.Fatal(err)
	}
	if got := second[0].Likes; got != 1 {
		t.Fatalf("expected project list cache to be invalidated after like, got %d likes", got)
	}
}
