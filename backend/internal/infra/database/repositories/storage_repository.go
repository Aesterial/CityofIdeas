package repositories

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	storagedomain "github.com/aesterial/cityideas/backend/internal/domain/storage"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
)

type StorageRepository struct {
	conn sqlc.Querier
}

func NewStorageRepository(conn sqlc.Querier) *StorageRepository {
	return &StorageRepository{conn: conn}
}

var _ storagedomain.Repository = (*StorageRepository)(nil)

func (r *StorageRepository) parseFile(f sqlc.File) *storagedomain.File {
	return &storagedomain.File{
		ID:        domain.FromPG(f.ID),
		Owner:     domain.FromPG(f.Owner),
		Purpose:   storagedomain.PurposeUnspecified,
		MimeType:  f.MimeType,
		Size:      f.Size,
		Key:       f.Key,
		Bucket:    f.Bucket,
		CreatedAt: f.CreatedAt.Time,
	}
}

func (r *StorageRepository) mapPurpose(p string) storagedomain.Purpose {
	switch p {
	case "avatar":
		return storagedomain.PurposeAvatar
	case "project_image":
		return storagedomain.PurposeProjectImage
	default:
		return storagedomain.PurposeUnspecified
	}
}

func (r *StorageRepository) Create(ctx context.Context, file *storagedomain.File) (*storagedomain.File, error) {
	f, err := r.conn.CreateFile(ctx, sqlc.CreateFileParams{
		Owner:    file.Owner.ToPG(),
		Purpose:  file.Purpose.String(),
		MimeType: file.MimeType,
		Size:     file.Size,
		Key:      file.Key,
		Bucket:   file.Bucket,
	})
	if err != nil {
		return nil, err
	}
	res := r.parseFile(f)
	res.Purpose = r.mapPurpose(f.Purpose)
	return res, nil
}

func (r *StorageRepository) Get(ctx context.Context, id domain.UUID) (*storagedomain.File, error) {
	f, err := r.conn.GetFile(ctx, id.ToPG())
	if err != nil {
		return nil, err
	}
	res := r.parseFile(f)
	res.Purpose = r.mapPurpose(f.Purpose)
	return res, nil
}

func (r *StorageRepository) ByOwner(ctx context.Context, owner domain.UUID) ([]*storagedomain.File, error) {
	files, err := r.conn.GetFilesByOwner(ctx, owner.ToPG())
	if err != nil {
		return nil, err
	}
	var out = make([]*storagedomain.File, len(files))
	for i, f := range files {
		out[i] = r.parseFile(f)
		out[i].Purpose = r.mapPurpose(f.Purpose)
	}
	return out, nil
}
