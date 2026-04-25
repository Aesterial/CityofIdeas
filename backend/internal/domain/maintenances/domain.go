package maintenancesdomain

import (
	"strings"
	"time"

	maintenancepb "github.com/aesterial/cityideas/backend/internal/api/v1/maintenances/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Status int
type Type int

const (
	StatusExpected Status = iota
	StatusRunning
	StatusCompleted
)

const (
	TypeEmergency Type = iota
	TypePlanned
)

func ParseStatus(str string) Status {
	switch strings.ToLower(str) {
	case "expected":
		return StatusExpected
	case "running":
		return StatusRunning
	case "completed":
		return StatusCompleted
	default:
		return StatusExpected
	}
}

func ParseType(str string) Type {
	switch str {
	case "emergency":
		return TypeEmergency
	case "planned":
		return TypePlanned
	default:
		return TypeEmergency
	}
}

func (s Status) String() string {
	switch s {
	case StatusRunning:
		return "running"
	case StatusExpected:
		return "expected"
	case StatusCompleted:
		return "completed"
	default:
		return "expected"
	}
}

func (s Status) Protobuf() maintenancepb.Status {
	switch s {
	case StatusRunning:
		return maintenancepb.Status_STATUS_RUNNING
	case StatusCompleted:
		return maintenancepb.Status_STATUS_COMPLETED
	case StatusExpected:
		return maintenancepb.Status_STATUS_EXPECTED
	default:
		return maintenancepb.Status_STATUS_UNSPECIFIED
	}
}

func (t Type) String() string {
	switch t {
	case TypePlanned:
		return "planned"
	case TypeEmergency:
		return "emergency"
	default:
		return "emergency"
	}
}

func (t Type) Protobuf() maintenancepb.Type {
	switch t {
	case TypePlanned:
		return maintenancepb.Type_TYPE_PLANNED
	case TypeEmergency:
		return maintenancepb.Type_TYPE_EMERGENCY
	default:
		return maintenancepb.Type_TYPE_UNSPECIFIED
	}
}

type TimeRange struct {
	Start *time.Time
	End   *time.Time
}

func (t *TimeRange) GetStart() time.Time {
	if t == nil {
		return time.Time{}
	}
	if t.Start == nil {
		return time.Time{}
	}
	return *t.Start
}

func (t *TimeRange) GetEnd() time.Time {
	if t == nil {
		return time.Time{}
	}
	if t.End == nil {
		return time.Time{}
	}
	return *t.End
}

func (t *TimeRange) Protobuf() *maintenancepb.TimeRange {
	if t == nil {
		return nil
	}
	var out = &maintenancepb.TimeRange{}
	var start, end *timestamppb.Timestamp
	if t.Start != nil {
		start = timestamppb.New(*t.Start)
	}
	if t.End != nil {
		end = timestamppb.New(*t.End)
	}
	out.SetStart(start)
	out.SetEnd(end)
	return out
}

type Maintenance struct {
	ID          domain.UUID
	Description string
	Status      Status
	Type        Type
	Planned     *TimeRange
	Actual      *TimeRange
	Created     time.Time
	Caller      domain.UUID
}

func (m *Maintenance) Protobuf() *maintenancepb.Maintenance {
	if m == nil {
		return nil
	}
	var out = &maintenancepb.Maintenance{}
	out.SetId(m.ID.String())
	out.SetDescription(m.Description)
	out.SetStatus(m.Status.Protobuf())
	out.SetType(m.Type.Protobuf())
	if m.Planned != nil {
		out.SetPlanned(m.Planned.Protobuf())
	}
	if m.Actual != nil {
		out.SetActual(m.Actual.Protobuf())
	}
	out.SetAt(timestamppb.New(m.Created))
	out.SetCallerId(m.Caller.String())
	return out
}

type Maintenances []*Maintenance

func (m Maintenances) Protobuf() []*maintenancepb.Maintenance {
	if m == nil {
		return nil
	}
	var out = make([]*maintenancepb.Maintenance, len(m))
	for i, maintenance := range m {
		out[i] = maintenance.Protobuf()
	}
	return out
}
