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

	hash, err := s.genHash()
	if err != nil {
		return nil, errors.ServerError.SetOriginal(err)
	}

	var expires time.Time
	switch purpose {
	case actionsdomain.PasswordReset, actionsdomain.TotpReset:
		expires = time.Now().Add(1 * time.Hour)
	case actionsdomain.AccountDelete:
		expires = time.Now().Add(24 * time.Hour)
	default:
		expires = time.Now().Add(24 * time.Hour)
	}

	return s.acts.Create(ctx, &user, purpose, hash, expires)
}

func (s *Service) Use(ctx context.Context, purp string, hash string) error {
	var purpose = actionsdomain.Purpose(purp)
	if !purpose.IsValid() {
		return errors.InvalidArguments
	}

	err := s.acts.Use(ctx, purpose, hash)
	if err != nil {
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) Find(ctx context.Context, purp string, hash string) (*actionsdomain.Action, error) {
	var purpose = actionsdomain.Purpose(purp)
	if !purpose.IsValid() {
		return nil, errors.InvalidArguments
	}

	act, err := s.acts.Find(ctx, purpose, hash)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	return act, nil
}

func (s *Service) ByOwner(ctx context.Context, user domain.UUID) (actionsdomain.Actions, error) {
	acts, err := s.acts.ByOwner(ctx, user)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	return acts, nil
}

func (s *Service) IsValid(ctx context.Context, purp string, hash string) error {
	var purpose = actionsdomain.Purpose(purp)
	if !purpose.IsValid() {
		return errors.InvalidArguments
	}

	err := s.acts.IsValid(ctx, purpose, hash)
	if err != nil {
		return errors.Wrap(err)
	}
	return nil
}
