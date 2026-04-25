package interceptors

import (
	"context"
	"log/slog"

	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

func (s *Service) Recovery(ctx context.Context, p any) error {
	slog.ErrorContext(ctx, "panic received", "panic", p)
	return errors.ServerError
}
