package ranksdomain

import (
	"time"

	rankpb "github.com/aesterial/cityideas/backend/internal/api/v1/ranks/v1"
	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Rank struct {
	ID          domain.UUID
	Name        string
	Description string
	Color       int64
	Weight      int32
	Permissions permissionsdomain.Set
	At          time.Time
}

func (r *Rank) Protobuf() *rankpb.Rank {
	if r == nil {
		return nil
	}
	var out = &rankpb.Rank{}
	out.SetId(r.ID.String())
	out.SetName(r.Name)
	out.SetDescription(r.Description)
	out.SetColor(r.Color)
	out.SetWeight(r.Weight)
	out.SetPermissions(r.Permissions.Strings())
	out.SetAt(timestamppb.New(r.At))
	return out
}

type Ranks []*Rank

func (r Ranks) Protobuf() []*rankpb.Rank {
	if r == nil {
		return nil
	}
	var out = make([]*rankpb.Rank, len(r))
	for i, rank := range r {
		out[i] = rank.Protobuf()
	}
	return out
}

type UserRank struct {
	ID          domain.UUID
	Name        string
	Color       int64
	Weight      int32
	Expires     *time.Time
	CityID      *domain.UUID
	Permissions permissionsdomain.Set
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
