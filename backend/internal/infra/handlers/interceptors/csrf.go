package interceptors

import (
	"context"
	"strings"

	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func first(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return strings.TrimSpace(values[0])
}

func isBrowser(meta metadata.MD) bool {
	return len(meta.Get("origin")) > 0 || len(meta.Get("sec-fetch-site")) > 0
}

func inList(list []string, arg string) bool {
	if len(list) == 0 {
		return false
	}
	var found bool
	for _, e := range list {
		if e == arg {
			found = true
		}
		if found {
			break
		}
	}
	return found
}

func (s *Service) CsrfCheck() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		meta, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, errors.InvalidArguments
		}
		if !isBrowser(meta) {
			return handler(ctx, req)
		}
		if site := first(meta.Get("sec-fetch-site")); site == "cross-site" {
			return nil, errors.AccessDenied
		}
		origin := first(meta.Get("origin"))
		if origin == "" {
			return nil, errors.InvalidArguments
		}
		if !inList(config.Get().AllowedOrigins, origin) {
			return nil, errors.AccessDenied
		}
		return handler(ctx, req)
	}
}
