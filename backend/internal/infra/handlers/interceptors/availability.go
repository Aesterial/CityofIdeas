package interceptors

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/grpc"
)

var (
	availabilityMu         sync.Mutex
	noMaintenanceUntilUnix atomic.Int64
)

func (s *Service) AvailabilityCheck() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		now := time.Now()
		if now.UnixNano() < noMaintenanceUntilUnix.Load() {
			return handler(ctx, req)
		}
		availabilityMu.Lock()
		now = time.Now()
		if now.UnixNano() < noMaintenanceUntilUnix.Load() {
			availabilityMu.Unlock()
			return handler(ctx, req)
		}
		active, err := s.mt.IsActive(ctx)
		if err != nil {
			availabilityMu.Unlock()
			logger.Error("interceptors", "failed to check is maintenance valid", logger.F("error", err))
			return nil, errors.Unavailable
		}

		if active == nil {
			noMaintenanceUntilUnix.Store(time.Now().Add(30 * time.Second).UnixNano())
			availabilityMu.Unlock()
			return handler(ctx, req)
		}
		availabilityMu.Unlock()
		return active.Protobuf(), errors.Unavailable
	}
}
