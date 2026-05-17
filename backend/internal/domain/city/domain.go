package citydomain

import (
	"time"

	citypb "github.com/aesterial/cityideas/backend/internal/api/v1/cities/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type City struct {
	ID   domain.UUID
	Name string
	At   time.Time
}

func (c *City) Protobuf() *citypb.City {
	if c == nil {
		return nil
	}
	var out = &citypb.City{}
	out.SetId(c.ID.String())
	out.SetName(c.Name)
	out.SetAt(timestamppb.New(c.At))
	return out
}

type Cities []*City

func (c Cities) Protobuf() []*citypb.City {
	if c == nil {
		return nil
	}
	out := make([]*citypb.City, len(c))
	for i, city := range c {
		out[i] = city.Protobuf()
	}
	return out
}
