package statisticsdomain

import (
	"time"

	statpb "github.com/aesterial/cityideas/backend/internal/api/v1/statistics/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Separator int

const (
	HourlySeparator = iota
	DailySeparator
	WeeklySeparator
)

func (s Separator) Protobuf() statpb.Separator {
	switch s {
	case HourlySeparator:
		return statpb.Separator_SEPARATOR_HOURLY
	case DailySeparator:
		return statpb.Separator_SEPARATOR_DAILY
	case WeeklySeparator:
		return statpb.Separator_SEPARATOR_WEEKLY
	default:
		return statpb.Separator_SEPARATOR_UNSPECIFIED
	}
}

func ParseSeparator(value statpb.Separator) Separator {
	switch value {
	case statpb.Separator_SEPARATOR_HOURLY:
		return HourlySeparator
	case statpb.Separator_SEPARATOR_WEEKLY:
		return WeeklySeparator
	default:
		return DailySeparator
	}
}

func (s Separator) String() string {
	switch s {
	case HourlySeparator:
		return "hourly"
	case DailySeparator:
		return "daily"
	case WeeklySeparator:
		return "weekly"
	default:
		return "daily"
	}
}

type Global struct {
	Ideas       int64
	Implemented int64
	Votes       int64
	City        string
}

func (g *Global) Protobuf() *statpb.Global {
	if g == nil {
		return nil
	}
	var out = &statpb.Global{}
	out.SetIdeas(g.Ideas)
	out.SetImplemented(g.Implemented)
	out.SetVotes(g.Votes)
	out.SetCity(g.City)
	return out
}

type Point struct {
	At    time.Time
	Value int32
}

func (p *Point) Protobuf() *statpb.GraphPoint {
	if p == nil {
		return nil
	}
	var out = &statpb.GraphPoint{}
	out.SetAt(timestamppb.New(p.At))
	out.SetValue(p.Value)
	return out
}

type Graph []*Point

func (g Graph) Protobuf(separator Separator) *statpb.Graph {
	if g == nil {
		return nil
	}
	var list []*statpb.GraphPoint
	for _, point := range g {
		list = append(list, point.Protobuf())
	}
	var out = &statpb.Graph{}
	out.SetList(list)
	out.SetSeparator(separator.Protobuf())
	return out
}

type Request struct {
	City      *string
	Separator Separator
}
