package ranksdomain

import (
	"time"

	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
)

type Rank struct {
	Name        string
	Description string
	Color       int64
	Weight      int32
	Permissions []byte
	At          time.Time
}

type Ranks []*Rank

type UserRank struct {
	Name    string
	Color   int64
	Weight  int32
	Expires *time.Time
}

func (r *UserRank) Protobuf() *userpb.UserRank {
	if r == nil {
		return nil
	}
	var rank = userpb.UserRank{}
	rank.SetName(r.Name)
	rank.SetColor(r.Color)
	return &rank
}

type UserRanks []*UserRank

func (r *UserRanks) Head() *UserRank {
	if r == nil {
		return nil
	}
	var rank *UserRank
	for _, e := range *r {
		if e == nil {
			continue
		}
		if rank == nil {
			rank = e
		}
		if rank.Weight < e.Weight {
			rank = e
		}
	}
	return rank
}
