package storagedomain

import (
	"time"

	storagepb "github.com/aesterial/cityideas/backend/internal/api/v1/storage/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Purpose int

const (
	PurposeUnspecified Purpose = iota
	PurposeAvatar
	PurposeProjectImage
)

func (p Purpose) String() string {
	switch p {
	case PurposeAvatar:
		return "avatar"
	case PurposeProjectImage:
		return "project_image"
	default:
		return "unspecified"
	}
}

func (p Purpose) Protobuf() storagepb.Purpose {
	switch p {
	case PurposeAvatar:
		return storagepb.Purpose_PURPOSE_AVATAR
	case PurposeProjectImage:
		return storagepb.Purpose_PURPOSE_PROJECT_IMAGE
	default:
		return storagepb.Purpose_PURPOSE_UNSPECIFIED
	}
}

func ParsePurpose(p storagepb.Purpose) Purpose {
	switch p {
	case storagepb.Purpose_PURPOSE_AVATAR:
		return PurposeAvatar
	case storagepb.Purpose_PURPOSE_PROJECT_IMAGE:
		return PurposeProjectImage
	default:
		return PurposeUnspecified
	}
}

type File struct {
	ID        domain.UUID
	Owner     domain.UUID
	Purpose   Purpose
	MimeType  string
	Size      int64
	Key       string
	Bucket    string
	CreatedAt time.Time
}

func (f *File) Protobuf(url string) *storagepb.File {
	if f == nil {
		return nil
	}
	var out = &storagepb.File{}
	out.SetId(f.ID.String())
	out.SetUrl(url)
	out.SetContentType(f.MimeType)
	out.SetSize(f.Size)
	return out
}
