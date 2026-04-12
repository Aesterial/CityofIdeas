package sessionsdomain

import (
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Session struct {
	ID      domain.UUID
	Owner   domain.UUID
	MFA     bool
	Device  domain.Device
	Hash    string
	At      time.Time
	Seen    time.Time
	Expires time.Time
}

type Sessions []*Session
