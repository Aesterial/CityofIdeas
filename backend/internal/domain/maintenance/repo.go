package maintenance

import (
	"context"

	"github.com/google/uuid"
)

type Repository interface {
	CheckIsActive(ctx context.Context) (bool, error)
	SetActive(ctx context.Context, id uuid.UUID) error
	IsPlanned(ctx context.Context) (bool, error)
	GetData(ctx context.Context) (*Information, error)
	GetList(ctx context.Context) (Informations, error)
	Start(ctx context.Context, req CreateST, by uint) error
	Edit(ctx context.Context, req EditST) error
	Complete(ctx context.Context) error
}
