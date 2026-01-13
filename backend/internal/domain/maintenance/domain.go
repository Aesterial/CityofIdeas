package maintenance

import (
	"time"

	"ascendant/backend/internal/domain/user"
	"ascendant/backend/internal/gen/maintenance/v1"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Status string
type Scope string
type Type string

const (
	ScheduledStatus Status = "scheduled"
	ProgressStatus  Status = "in progress"
	CompletedStatus Status = "completed"
	CancelledStatus Status = "cancelled"
	AllScope        Scope  = "all"
	AuthScope       Scope  = "auth"
	ProjectsScope   Scope  = "projects"
	EmergencyType   Type   = "emergency"
	PlannedType     Type   = "planned"
)

type PlannedAt struct {
	Start time.Time
	End   time.Time
}

type Actual struct {
	Start time.Time
	End   time.Time
}

type Information struct {
	ID          uuid.UUID
	Description string
	Status      Status
	Scope       Scope
	Type        Type
	Planned     PlannedAt
	Actual      Actual
	CreatedAt   time.Time
	CalledBy    *user.User
}

type Informations []*Information

func (i Information) ToProto() *maintenance.DataResponse {
	return &maintenance.DataResponse{
		Id:          i.ID.String(),
		Description: i.Description,
		WillEnd:     timestamppb.New(i.Planned.End),
	}
}

func (i Informations) ToProto() []*maintenance.DataResponse {
	var list []*maintenance.DataResponse
	for _, element := range i {
		list = append(list, element.ToProto())
	}
	return list
}

func (i Informations) CanStart(mark time.Time) (uuid.UUID, bool) {
	var found bool
	var id uuid.UUID
	for _, element := range i {
		if element.Planned.Start.Before(mark) {
			if element.Status == ScheduledStatus {
				id = element.ID
				found = true
			}
		}
		if found {
			break
		}
	}
	return id, found
}

type CreateST struct {
	Description  string
	Scope        *string
	PlannedStart time.Time
	PlannedEnd   time.Time
}

type EditST struct {
	Description *string
	Scope       *string
}
