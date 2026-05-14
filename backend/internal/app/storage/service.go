package storageservice

import (
	"context"
	"fmt"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	"github.com/aesterial/cityideas/backend/internal/domain/config"
	storagedomain "github.com/aesterial/cityideas/backend/internal/domain/storage"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/google/uuid"
)

type Service struct {
	repo     storagedomain.Repository
	provider storagedomain.Provider
	config   configdomain.S3
}

func NewService(repo storagedomain.Repository, provider storagedomain.Provider, cfg configdomain.S3) *Service {
	return &Service{
		repo:     repo,
		provider: provider,
		config:   cfg,
	}
}

const (
	uploadExpiry = 15 * time.Minute
	getExpiry    = 24 * time.Hour
)

func (s *Service) GetUploadURL(ctx context.Context, owner domain.UUID, purpose storagedomain.Purpose, contentType string) (string, string, error) {
	if !s.config.Enabled {
		return "", "", errors.Unavailable
	}

	fileID := uuid.New()
	key := fmt.Sprintf("%s/%s", purpose.String(), fileID.String())

	url, err := s.provider.PresignedPutURL(ctx, s.config.Bucket, key, contentType, uploadExpiry)
	if err != nil {
		logger.Error("storage", "failed to generate presigned put url", logger.F("error", err))
		return "", "", err
	}

	_, err = s.repo.Create(ctx, &storagedomain.File{
		ID:       domain.FromUUID(fileID),
		Owner:    owner,
		Purpose:  purpose,
		MimeType: contentType,
		Key:      key,
		Bucket:   s.config.Bucket,
	})
	if err != nil {
		logger.Error("storage", "failed to save file metadata to db", logger.F("error", err))
		return "", "", errors.Wrap(err)
	}

	return url, fileID.String(), nil
}

func (s *Service) GetURL(ctx context.Context, id domain.UUID) (string, error) {
	if !s.config.Enabled {
		return "", errors.Unavailable
	}

	file, err := s.repo.Get(ctx, id)
	if err != nil {
		return "", err
	}

	url, err := s.provider.PresignedGetURL(ctx, file.Bucket, file.Key, getExpiry)
	if err != nil {
		logger.Error("storage", "failed to generate presigned get url", logger.F("error", err))
		return "", err
	}

	return url, nil
}
