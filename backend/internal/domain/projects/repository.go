package projectsdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	ProjectsTop(ctx context.Context, city string, limit int32, offset int32) (Projects, error)
	Projects(ctx context.Context, limit int32, offset int32) (Projects, error)
	Submissions(ctx context.Context, limit int32, offset int32) (Submissions, error)
	Submission(ctx context.Context, id domain.UUID) (*Submission, error)
	SubmissionReview(ctx context.Context, project domain.UUID, conclusion bool, reason *string) error
	Messages(ctx context.Context, project domain.UUID, limit int32, offset int32, showDeleted bool) (Messages, error)
	MessageAuthor(ctx context.Context, message domain.UUID) (*domain.UUID, error)
	Project(ctx context.Context, id domain.UUID) (*Project, error)
	ProjectAuthor(ctx context.Context, project domain.UUID) (*domain.UUID, error)
	CreateProject(ctx context.Context, author domain.UUID, title string, description string, category string, city string, lat float64, lot float64) (*Project, error)
	CreateMessage(ctx context.Context, author domain.UUID, project domain.UUID, parent *domain.UUID, content string) (*Message, error)
	SetStatus(ctx context.Context, project domain.UUID, status Status, value ...string) error
	UpdateDescription(ctx context.Context, project domain.UUID, desc string) error
	DeleteMessage(ctx context.Context, message domain.UUID) error
	DeleteProject(ctx context.Context, project domain.UUID) error
	IsProjectExists(ctx context.Context, project domain.UUID) error
	CanLike(ctx context.Context, project domain.UUID, user domain.UUID) (bool, error)
	CreateLike(ctx context.Context, project domain.UUID, user domain.UUID) error
	RemoveLike(ctx context.Context, project domain.UUID, user domain.UUID) error
}
