package submissions

import (
	"context"
)

type Repository interface {
	GetList(ctx context.Context) ([]*Submission, error)
	GetByID(ctx context.Context, id int32) (*Submission, error)
	AlreadySetted(ctx context.Context, id int32) (bool, error)
	Approve(ctx context.Context, id int32) error
	Decline(ctx context.Context, id int32, reason string) error
}
