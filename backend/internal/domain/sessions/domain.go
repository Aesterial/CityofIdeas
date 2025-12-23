package sessions

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID          uuid.UUID
	UID         uint
	Created     time.Time
	LastSeenAt  time.Time
	Expires     time.Time
	Revoked     bool
	MfaComplete bool
	AgentHash   string
}

type Cookie struct {
	ID uuid.UUID
}
