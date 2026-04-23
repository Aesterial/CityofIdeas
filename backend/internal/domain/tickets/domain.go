package ticketsdomain

import (
	"strings"
	"time"

	ticketpb "github.com/aesterial/cityideas/backend/internal/api/v1/tickets/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Status int
type Caller int

const (
	StatusClosed Status = iota
	StatusWaiting
	StatusListing
	StatusImplementing
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
	case "listing":
		return StatusListing
	case "implementing":
		return StatusImplementing
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
	case StatusListing:
		return "listing"
	case StatusImplementing:
		return "implementing"
	default:
		return "waiting"
	}
}

func (s Status) Protobuf() ticketpb.Status {
	switch s {
	case StatusClosed:
		return ticketpb.Status_STATUS_CLOSED
	case StatusWaiting:
		return ticketpb.Status_STATUS_WAITING
	case StatusListing:
		return ticketpb.Status_STATUS_LISTING
	case StatusImplementing:
		return ticketpb.Status_STATUS_IMPLEMENTING
	default:
		return ticketpb.Status_STATUS_UNSPECIFIED
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

func (c Caller) Protobuf() ticketpb.Caller {
	switch c {
	case CallerUser:
		return ticketpb.Caller_CALLER_USER
	case CallerStaff:
		return ticketpb.Caller_CALLER_STAFF
	case CallerSystem:
		return ticketpb.Caller_CALLER_SYSTEM
	default:
		return ticketpb.Caller_CALLER_UNSPECIFIED
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
	Closer   *domain.UUID
	Caller   *Caller
	Reason   *string
}

func (t *Ticket) Protobuf() *ticketpb.Ticket {
	if t == nil {
		return nil
	}
	var acceptor string
	if t.Accepted != nil {
		acceptor = t.Acceptor.String()
	}
	var accepted *timestamppb.Timestamp = nil
	if t.Accepted != nil {
		accepted = timestamppb.New(*t.Accepted)
	}
	var closed *timestamppb.Timestamp = nil
	if t.Closed != nil {
		closed = timestamppb.New(*t.Closed)
	}
	var caller ticketpb.Caller
	if t.Caller != nil {
		caller = t.Caller.Protobuf()
	}
	var closer string
	if t.Closer != nil {
		closer = t.Closer.String()
	}
	var reason string
	if t.Reason != nil {
		reason = *t.Reason
	}
	var out = &ticketpb.Ticket{}
	out.SetId(t.ID.String())
	out.SetAuthorId(t.Author.String())
	out.SetAcceptor(acceptor)
	out.SetStatus(t.Status.Protobuf())
	out.SetTopic(t.Topic)
	out.SetTitle(t.Title)
	out.SetCreated(timestamppb.New(t.Created))
	out.SetAccepted(accepted)
	out.SetClosed(closed)
	out.SetCloser(closer)
	out.SetCaller(caller)
	out.SetReason(reason)
	return out
}

type Tickets []*Ticket

func (t Tickets) Protobuf() []*ticketpb.Ticket {
	if t == nil {
		return nil
	}
	var out = make([]*ticketpb.Ticket, len(t))
	for i, ticket := range t {
		out[i] = ticket.Protobuf()
	}
	return out
}

type Message struct {
	ID      domain.UUID
	Ticket  domain.UUID
	Author  domain.UUID
	Content string
	Created time.Time
}

func (m *Message) Protobuf() *ticketpb.Message {
	if m == nil {
		return nil
	}
	var out = &ticketpb.Message{}
	out.SetId(m.ID.String())
	out.SetTicket(m.Ticket.String())
	out.SetAuthor(m.Author.String())
	out.SetContent(m.Content)
	out.SetCreated(timestamppb.New(m.Created))
	return out
}

type Messages []*Message

func (m Messages) Protobuf() []*ticketpb.Message {
	if m == nil {
		return nil
	}
	var out = make([]*ticketpb.Message, len(m))
	for i, message := range m {
		out[i] = message.Protobuf()
	}
	return out
}

type Target struct {
	Ticket domain.UUID
	User   domain.UUID
}
