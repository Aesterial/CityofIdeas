package sessions

import (
	"ascendant/backend/internal/domain/sessions"
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo sessions.Repository
}

func New(repo sessions.Repository) *Service {
	return &Service{repo: repo}
}

func isValid(sessionID uuid.UUID) bool {
	if sessionID == uuid.Nil {
		return false
	}
	if _, err := uuid.Parse(sessionID.String()); err != nil {
		return false
	}
	return true
}

func (s *Service) IsValid(ctx context.Context, sessionID uuid.UUID) (bool, error) {
	if !isValid(sessionID) {
		return false, nil
	}
	return s.repo.IsValid(ctx, sessionID)
}

func (s *Service) GetSession(ctx context.Context, sessionID uuid.UUID) (*sessions.Session, error) {
	if !isValid(sessionID) {
		return nil, errors.New("invalid session id")
	}
	return s.repo.GetSession(ctx, sessionID)
}

func (s *Service) GetSessions(ctx context.Context, uid uint) ([]*sessions.Session, error) {
	if uid == 0 {
		return nil, errors.New("uid is null")
	}
	return s.repo.GetSessions(ctx, uid)
}

func (s *Service) SetRevoked(ctx context.Context, sessionID uuid.UUID) error {
	if !isValid(sessionID) {
		return errors.New("invalid session id")
	}
	return s.repo.SetRevoked(ctx, sessionID)
}

func (s *Service) AddSession(ctx context.Context, sessionID uuid.UUID, agentHash string, expires time.Time, uid uint) error {
	if !isValid(sessionID) {
		return errors.New("invalid session id")
	}
	if uid == 0 {
		return errors.New("uid is null")
	}
	if expires.IsZero() {
		return errors.New("expires is null")
	}
	if agentHash == "" {
		return errors.New("agent_hash is null")
	}
	return s.repo.AddSession(ctx, sessionID, agentHash, expires, uid)
}
func (s *Service) UpdateLastSeen(ctx context.Context, sessionID uuid.UUID) error {
	if !isValid(sessionID) {
		return errors.New("invalid session id")
	}
	return s.repo.UpdateLastSeen(ctx, sessionID)
}
