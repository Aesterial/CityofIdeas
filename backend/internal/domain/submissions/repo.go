package submissions

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	GetList(ctx context.Context) ([]*Submission, error)
	Approve(ctx context.Context, id uuid.UUID) error
	Decline(ctx context.Context, id uuid.UUID, reason string) error
}
