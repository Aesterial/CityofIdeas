package interceptors

import (
	"context"
	"testing"

	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestLoggingInterceptorReturnsHandlerError(t *testing.T) {
	t.Parallel()

	interceptor := NewService(nil).Logging()
	expected := errors.AccessDenied

	resp, err := interceptor(
		context.Background(),
		struct{}{},
		&grpc.UnaryServerInfo{FullMethod: "/xyz.city_ideas.v1.user.v1.UserService/Self"},
		func(context.Context, any) (any, error) {
			return nil, expected
		},
	)
	if resp != nil {
		t.Fatalf("expected nil response, got %#v", resp)
	}
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if status.Code(err) != codes.PermissionDenied {
		t.Fatalf("expected %s, got %s", codes.PermissionDenied, status.Code(err))
	}
}
