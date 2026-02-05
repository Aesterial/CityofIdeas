package grpcserver

import (
	"Aesterial/backend/internal/domain/user"
	userpb "Aesterial/backend/internal/gen/user/v1"
	"strings"
)

func fromProtoAvatar(a *userpb.Avatar) *user.Avatar {
	if a == nil {
		return nil
	}
	avatar := &user.Avatar{
		ContentType: a.ContentType,
		Key:         a.Key,
		SizeBytes:   0,
	}
	if strings.TrimSpace(a.Key) != "" {
		avatar.Key = strings.TrimSpace(a.Key)
	}
	return avatar
}

func errorContains(err error, req string) bool {
	return strings.Contains(strings.ToLower(strings.TrimSpace(err.Error())), req)
}
