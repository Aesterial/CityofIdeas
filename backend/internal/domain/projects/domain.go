package projectsdomain

import (
	"net/url"
	"strings"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
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

type Project struct {
	ID          domain.UUID
	Author      domain.UUID
	Title       string
	Description string
	Category    string
	Status      Status
	Link        *url.URL
	Likes       int
	At          time.Time
}

type Projects []*Project

type Message struct {
	ID      domain.UUID
	Project domain.UUID
	Author  domain.UUID
	Parent  domain.UUID
	Content string
	At      time.Time
	Deleted *time.Time
}

type Messages []*Message

type Submission struct {
	ID       domain.UUID
	Project  domain.UUID
	Approved bool
	Reason   *string
}

type Submissions []*Submission
