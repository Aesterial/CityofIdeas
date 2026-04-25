package maintenancesdomain

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, caller domain.UUID, description string, planned TimeRange) (*Maintenance, error)
	List(ctx context.Context, limit int32, offset int32) (Maintenances, error)
	Current(ctx context.Context) (*Maintenance, error)
	IsPlanned(ctx context.Context) (*time.Time, string, error)
	Start(ctx context.Context, id domain.UUID) error
	Close(ctx context.Context, id domain.UUID) error
}
