package actions

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Service struct {
	acts actionsdomain.Repository
}

func NewService(acts actionsdomain.Repository) *Service {
	return &Service{acts: acts}
}

func (*Service) genHash() (string, error) {
	var list = make([]byte, 64)
	if _, err := rand.Read(list); err != nil {
		return "", err
	}
	return hex.EncodeToString(list), nil
}

func (s *Service) Create(ctx context.Context, purp string, user domain.UUID) (*actionsdomain.Action, error) {
	var purpose = actionsdomain.Purpose(purp)
	if !purpose.IsValid() {
		return nil, errors.InvalidArguments
	}
	var _ time.Time
	return nil, nil
}
