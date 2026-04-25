package interceptors

import (
	"context"
	"time"

	loggerdomain "github.com/aesterial/cityideas/backend/internal/domain/logger"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Service) Logging() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
		at := time.Now()
		result, err := handler(ctx, req)

		fs := []loggerdomain.Field{
			logger.F("method", info.FullMethod),
			logger.F("duration", time.Since(at).Milliseconds()),
		}
		if err == nil {
			logger.Info("logging", "request handle", fs...)
			return result, nil
		}
		st, ok := status.FromError(err)
		if !ok {
			st = status.New(codes.Unknown, "unexpected error")
		}
		fs = append(fs, logger.F("code", st.Code().String()), logger.F("error", err))
		switch st.Code() {
		case codes.Internal, codes.Unknown, codes.Unimplemented, codes.Unavailable:
			logger.Error("logging", "request failed with errors", fs...)
		default:
			logger.Warning("logging", "request failed", fs...)
		}
		return result, err
	}
}
