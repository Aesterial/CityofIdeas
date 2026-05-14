package storagedomain

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Provider interface {
	PresignedPutURL(ctx context.Context, bucket, key, contentType string, expiry time.Duration) (string, error)
	PresignedGetURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error)
}

type Repository interface {
	Create(ctx context.Context, file *File) (*File, error)
	Get(ctx context.Context, id domain.UUID) (*File, error)
	ByOwner(ctx context.Context, owner domain.UUID) ([]*File, error)
}
