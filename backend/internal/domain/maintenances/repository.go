package maintenancesdomain

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, caller domain.UUID, description string, status Status, planned Planned) (*Maintenance, error)
	List(ctx context.Context, limit int, offset int) (Maintenances, error)
	Current(ctx context.Context) (*Maintenance, error)
	Start(ctx context.Context, id domain.UUID) error
	Close(ctx context.Context, id domain.UUID) error
}
