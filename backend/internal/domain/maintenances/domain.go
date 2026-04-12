package maintenancesdomain

import (
	"strings"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
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

type Planned struct {
	Start time.Time
	End   *time.Time
}

type Actual struct {
	Start *time.Time
	End   *time.Time
}

type Maintenance struct {
	ID          domain.UUID
	Description string
	Status      Status
	Type        Type
	Planned     Planned
	Actual      Actual
	Created     time.Time
	Caller      domain.UUID
}

type Maintenances []*Maintenance
