package login

import (
	"context"
)

type Repository interface {
	Register(ctx context.Context, user RegisterRequire) (*uint, error)
	Authorization(ctx context.Context, user AuthorizationRequire) (*uint, error)
}
