package handlers

import (
	"context"

	storagepb "github.com/aesterial/cityideas/backend/internal/api/v1/storage/v1"
	storageservice "github.com/aesterial/cityideas/backend/internal/app/storage"
	storagedomain "github.com/aesterial/cityideas/backend/internal/domain/storage"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type StorageHandler struct {
	storagepb.UnimplementedStorageServiceServer
	auth *Authenticator
	srv  *storageservice.Service
}

func NewStorageHandler(srv *storageservice.Service, auth *Authenticator) *StorageHandler {
	return &StorageHandler{
		auth: auth,
		srv:  srv,
	}
}

func (h *StorageHandler) GetUploadURL(ctx context.Context, req *storagepb.GetUploadURLRequest) (*storagepb.GetUploadURLResponse, error) {
	if h == nil || h.srv == nil || h.auth == nil {
		return nil, errors.ServerError
	}
	if req == nil {
		return nil, errors.InvalidArguments
	}

	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if meta.IsEmpty() {
		return nil, errors.Unauthenticated
	}

	purpose := storagedomain.ParsePurpose(req.GetPurpose())
	if purpose == storagedomain.PurposeUnspecified {
		return nil, errors.InvalidArguments
	}

	url, fileID, err := h.srv.GetUploadURL(ctx, *meta.UserID, purpose, req.GetContentType())
	if err != nil {
		return nil, err
	}

	var resp = &storagepb.GetUploadURLResponse{}
	resp.SetUrl(url)
	resp.SetFileId(fileID)
	return resp, nil
}
