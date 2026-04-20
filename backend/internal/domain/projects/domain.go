package projectsdomain

import (
	"net/url"
	"strings"
	"time"

	projectpb "github.com/aesterial/cityideas/backend/internal/api/v1/projects/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Status int

const (
	StatusCancelled Status = iota
	StatusListing
	StatusReviewing
	StatusImplementing
)

func ParseStatus(str string) Status {
	switch strings.ToLower(str) {
	case "cancelled":
		return StatusCancelled
	case "listing":
		return StatusListing
	case "reviewing":
		return StatusReviewing
	case "implementing":
		return StatusImplementing
	default:
		return StatusReviewing
	}
}

func (s Status) String() string {
	switch s {
	case StatusCancelled:
		return "cancelled"
	case StatusListing:
		return "listing"
	case StatusReviewing:
		return "reviewing"
	case StatusImplementing:
		return "implementing"
	default:
		return "reviewing"
	}
}

func (s Status) Protobuf() projectpb.Status {
	switch s {
	case StatusCancelled:
		return projectpb.Status_STATUS_CANCELLED
	case StatusListing:
		return projectpb.Status_STATUS_LISTING
	case StatusReviewing:
		return projectpb.Status_STATUS_REVIEWING
	case StatusImplementing:
		return projectpb.Status_STATUS_IMPLEMENTING
	default:
		return projectpb.Status_STATUS_UNSPECIFIED
	}
}

type Project struct {
	ID          domain.UUID
	Author      domain.UUID
	Title       string
	Description string
	Category    string
	Status      Status
	Link        *url.URL
	Likes       int32
	At          time.Time
	Updated     time.Time
	Cancelled   *time.Time
}

func (p *Project) Protobuf() *projectpb.Project {
	if p == nil {
		return nil
	}
	var link string
	if p.Link != nil {
		link = p.Link.String()
	}
	var cancelled *timestamppb.Timestamp = nil
	if p.Cancelled != nil {
		cancelled = timestamppb.New(*p.Cancelled)
	}
	var out = &projectpb.Project{}
	out.SetId(p.ID.String())
	out.SetTitle(p.Title)
	out.SetDescription(p.Description)
	out.SetCategory(p.Category)
	out.SetAuthor(p.Author.String())
	out.SetImplLink(link)
	out.SetLikes(p.Likes)
	out.SetStatus(p.Status.Protobuf())
	out.SetAt(timestamppb.New(p.At))
	out.SetUpdated(timestamppb.New(p.Updated))
	out.SetDeleted(cancelled)
	return out
}

type Projects []*Project

func (p Projects) Protobuf() []*projectpb.Project {
	if p == nil {
		return nil
	}
	var out = make([]*projectpb.Project, len(p))
	for i, project := range p {
		out[i] = project.Protobuf()
	}
	return out
}

type Message struct {
	ID      domain.UUID
	Project domain.UUID
	Author  domain.UUID
	Parent  *domain.UUID
	Content string
	At      time.Time
	Deleted *time.Time
}

func (m *Message) Protobuf() *projectpb.Message {
	if m == nil {
		return nil
	}
	var parent string
	if m.Parent != nil {
		parent = m.Parent.String()
	}
	var deleted *timestamppb.Timestamp = nil
	if m.Deleted != nil {
		deleted = timestamppb.New(*m.Deleted)
	}
	var out = &projectpb.Message{}
	out.SetId(m.ID.String())
	out.SetContent(m.Content)
	out.SetAt(timestamppb.New(m.At))
	out.SetAuthor(m.Author.String())
	out.SetParent(parent)
	out.SetDeleted(deleted)
	return out
}

type Messages []*Message

func (m Messages) Protobuf() []*projectpb.Message {
	if m == nil {
		return nil
	}
	var out = make([]*projectpb.Message, len(m))
	for i, message := range m {
		out[i] = message.Protobuf()
	}
	return out
}

type Submission struct {
	ID       domain.UUID
	Project  domain.UUID
	Approved bool
	Reason   *string
}

func (s *Submission) Protobuf() *projectpb.Submission {
	if s == nil {
		return nil
	}
	var reason string
	if s.Reason != nil {
		reason = *s.Reason
	}
	var out = &projectpb.Submission{}
	out.SetId(s.ID.String())
	out.SetProject(s.Project.String())
	out.SetApproved(s.Approved)
	out.SetReason(reason)
	return out
}

type Submissions []*Submission

func (s Submissions) Protobuf() []*projectpb.Submission {
	if s == nil {
		return nil
	}
	var out = make([]*projectpb.Submission, len(s))
	for i, submission := range s {
		out[i] = submission.Protobuf()
	}
	return out
}
