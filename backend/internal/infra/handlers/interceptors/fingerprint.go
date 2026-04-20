package interceptors

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"

	"github.com/aesterial/cityideas/backend/internal/domain"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/mileusna/useragent"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func userAgentContext(md metadata.MD) string {
	values := md.Get("user-agent")
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

func normalize(str string) string {
	return strings.ToLower(strings.TrimSpace(str))
}

func userAgentHash(ua useragent.UserAgent) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(strings.Join([]string{
		normalize(ua.Device),
		normalize(ua.OSVersion),
		normalize(ua.OS),
	}, "|"))))
}

func FingerPrint() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, errors.InvalidArguments
		}
		parsed := useragent.Parse(userAgentContext(md))
		device := domain.ParseDeviceUa(parsed)
		if !device.IsValid() {
			return nil, errors.AccessDenied
		}
		hash := userAgentHash(parsed)
		ctx = context.WithValue(ctx, domain.UaDeviceKey, device)
		ctx = context.WithValue(ctx, domain.UaHashKey, hash)
		return handler(ctx, req)
	}
}
