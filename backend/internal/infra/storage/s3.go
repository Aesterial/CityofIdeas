package storage

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain/config"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type S3Provider struct {
	client *minio.Client
	config configdomain.S3
}

func NewS3Provider(cfg configdomain.S3) (*S3Provider, error) {
	if !cfg.Enabled {
		return &S3Provider{config: cfg}, nil
	}

	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, errors.Wrap(err)
	}

	return &S3Provider{
		client: client,
		config: cfg,
	}, nil
}

func (s *S3Provider) PresignedPutURL(ctx context.Context, bucket, key, contentType string, expiry time.Duration) (string, error) {
	if !s.config.Enabled {
		return "", errors.Unavailable
	}

	url, err := s.client.PresignedPutObject(ctx, bucket, key, expiry)
	if err != nil {
		return "", errors.Wrap(err)
	}

	return url.String(), nil
}

func (s *S3Provider) PresignedGetURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error) {
	if !s.config.Enabled {
		return "", errors.Unavailable
	}

	url, err := s.client.PresignedGetObject(ctx, bucket, key, expiry, nil)
	if err != nil {
		return "", errors.Wrap(err)
	}

	return url.String(), nil
}
