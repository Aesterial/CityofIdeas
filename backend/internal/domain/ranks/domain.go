package ranksdomain

import (
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Rank struct {
	Name        string
	Description string
	Color       int
	Weight      int
	Permissions []byte
	At          time.Time
}

type Ranks []*Rank

type UserRank struct {
	ID      domain.UUID
	At      domain.UUID
	Expires *domain.UUID
}

type UserRanks []*UserRank
