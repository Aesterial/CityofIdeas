package projectsdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Projects(ctx context.Context, limit int32, offset int32) (Projects, error)
	Submissions(ctx context.Context, limit int32, offset int32) (Submissions, error)
	Messages(ctx context.Context, project domain.UUID, limit int32, offset int32) (Messages, error)
	Project(ctx context.Context, id domain.UUID) (*Project, error)
	ProjectAuthor(ctx context.Context, project domain.UUID) (*domain.UUID, error)
	CreateProject(ctx context.Context, author domain.UUID, title string, description string, category string) (*Project, error)
	CreateMessage(ctx context.Context, author domain.UUID, project domain.UUID, parent *domain.UUID, content string) (*Message, error)
	SetStatus(ctx context.Context, project domain.UUID, status Status, value ...string) error
	UpdateDescription(ctx context.Context, project domain.UUID, desc string) error
	DeleteMessage(ctx context.Context, message domain.UUID) error
	DeleteProject(ctx context.Context, project domain.UUID) error
}
