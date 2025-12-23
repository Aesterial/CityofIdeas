package sessions

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Repository interface {
	IsValid(ctx context.Context, sessionID uuid.UUID) (bool, error)
	GetSession(ctx context.Context, sessionID uuid.UUID) (*Session, error)
	GetSessions(ctx context.Context, uid uint) ([]*Session, error)
	SetRevoked(ctx context.Context, sessionID uuid.UUID) error
	AddSession(ctx context.Context, sessionID uuid.UUID, agentHash string, expires time.Time, uid uint) error
	UpdateLastSeen(ctx context.Context, sessionID uuid.UUID) error
}
