package ticketsdomain

import (
	"strings"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
)

type Status int
type Caller int

const (
	StatusClosed Status = iota
	StatusWaiting
	StatusInWork
)

const (
	_ Caller = iota
	CallerUser
	CallerStaff
	CallerSystem
)

func ParseStatus(str string) Status {
	switch strings.TrimSpace(strings.ToLower(str)) {
	case "closed":
		return StatusClosed
	case "waiting":
		return StatusWaiting
	case "inwork":
		return StatusInWork
	default:
		return StatusWaiting
	}
}

func ParseCaller(str string) Caller {
	switch strings.ToLower(str) {
	case "user":
		return CallerUser
	case "staff":
		return CallerStaff
	case "system":
		return CallerSystem
	default:
		return CallerStaff
	}
}

func (s Status) String() string {
	switch s {
	case StatusClosed:
		return "closed"
	case StatusWaiting:
		return "waiting"
	case StatusInWork:
		return "in work"
	default:
		return "waiting"
	}
}

func (c Caller) String() string {
	switch c {
	case CallerUser:
		return "user"
	case CallerSystem:
		return "system"
	case CallerStaff:
		return "staff"
	default:
		return "staff"
	}
}

func (c Caller) SQLC() sqlc.TicketsCaller {
	switch c {
	case CallerUser:
		return sqlc.TicketsCallerUser
	case CallerStaff:
		return sqlc.TicketsCallerStaff
	case CallerSystem:
		return sqlc.TicketsCallerSystem
	default:
		return sqlc.TicketsCallerSystem
	}
}

type Ticket struct {
	ID       domain.UUID
	Author   domain.UUID
	Status   Status
	Topic    string
	Title    string
	Created  time.Time
	Acceptor *domain.UUID
	Accepted *time.Time
	Closed   *time.Time
	Closer   *Caller
	Reason   *string
}

type Tickets []*Ticket

type Message struct {
	ID      domain.UUID
	Ticket  domain.UUID
	Author  domain.UUID
	Content string
	Created time.Time
}

type Messages []*Message

type Target struct {
	Ticket domain.UUID
	User   domain.UUID
}
