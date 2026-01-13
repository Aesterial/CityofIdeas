package tickets

import (
	"ascendant/backend/internal/domain/user"
	tickpb "ascendant/backend/internal/gen/tickets/v1"
	"ascendant/backend/internal/infra/logger"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type TicketStatus string
type TicketTopic string
type TicketClosedBy string

func (t TicketStatus) String() string {
	return string(t)
}

func (t TicketStatus) Valid() bool {
	switch t {
	case InProcessStatus, ClosedStatus, WaitingStatus:
		return true
	default:
		return false
	}
}

func (t TicketTopic) String() string {
	return string(t)
}

func (t TicketTopic) Valid() bool {
	logger.Debug(fmt.Sprintf("checking topic is valid for: %s", t.String()), "")
	switch t {
	case AccountTopic, ProjectTopic, TechnicalTopic, OtherTopic:
		logger.Debug("topic is valid", "")
		return true
	default:
		logger.Debug("topic is not valid", "")
		return false
	}
}

func (t TicketClosedBy) String() string {
	return string(t)
}

func (t TicketClosedBy) Valid() bool {
	switch t {
	case ClosedByUser, ClosedByStaff, ClosedBySystem:
		return true
	default:
		return false
	}
}

const (
	InProcessStatus TicketStatus   = "в обработке"
	ClosedStatus    TicketStatus   = "закрыт"
	WaitingStatus   TicketStatus   = "ожидает"
	AccountTopic    TicketTopic    = "аккаунт и доступ"
	ProjectTopic    TicketTopic    = "проект и заявка"
	TechnicalTopic  TicketTopic    = "техническая проблема"
	OtherTopic      TicketTopic    = "другое"
	ClosedByUser    TicketClosedBy = "user"
	ClosedByStaff   TicketClosedBy = "staff"
	ClosedBySystem  TicketClosedBy = "system"
)

type TicketCreator struct {
	Name  string
	Email string
}

type Ticket struct {
	Id          uuid.UUID
	Creator     TicketCreator
	Mcount      int
	Acceptor    *user.User
	Status      TicketStatus
	Topic       TicketTopic
	Brief       string
	CreatedAt   time.Time
	AcceptedAt  *time.Time
	ClosedAt    *time.Time
	CloseBy     TicketClosedBy
	CloseReason string
}

func (t Ticket) ToProto() *tickpb.TicketInfo {
	return &tickpb.TicketInfo{}
}

type Tickets []*Ticket

func (t Tickets) ToProto() []*tickpb.TicketInfo {
	var a []*tickpb.TicketInfo
	for _, b := range t {
		a = append(a, b.ToProto())
	}
	return a
}

type TicketMessage struct {
	ID      int
	Author  uint
	Content string
	At      time.Time
}

func (tm TicketMessage) ToProto() *tickpb.TicketMessage {
	return &tickpb.TicketMessage{}
}

type TicketMessages []*TicketMessage

func (tm TicketMessages) ToProto() []*tickpb.TicketMessage {
	var a []*tickpb.TicketMessage
	for _, b := range tm {
		a = append(a, b.ToProto())
	}
	return a
}

type TicketCreationData struct {
	ID    uuid.UUID
	Token *string
}

type TicketCreationRequestor struct {
	Authorized bool
	UID        *uint
	Name       string
	Email      string
	Token      *string
}

type TicketDataReq struct {
	UID *uint
	Token *string
	Staff bool
}

type TicketUserData struct {
	Authorized bool
	UID *uint
	Name string
	Email string
}
