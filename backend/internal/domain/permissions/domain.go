package permissionsdomain

import (
	"encoding/json"

	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type Permission string

func (p Permission) String() string {
	return string(p)
}

const (
	UserUpdateAll         Permission = "user.update.all"
	UserUpdateDisplayName Permission = "user.update.display_name"
	UserUpdateDescription Permission = "user.update.description"
	UserUpdateAvatar      Permission = "user.update.avatar"
	UserViewAll           Permission = "user.view.all"
	UserDeleteAll         Permission = "user.delete.all"

	RankList   Permission = "rank.list"
	RankInfo   Permission = "rank.info"
	RankCreate Permission = "rank.create"
	RankUpdate Permission = "rank.update"
	RankDelete Permission = "rank.delete"

	TicketCreate           Permission = "ticket.create"
	TicketViewAll          Permission = "ticket.view.all"
	TicketAccept           Permission = "ticket.accept"
	TicketClose            Permission = "ticket.close"
	TicketMessageViewAll   Permission = "ticket.message.view.all"
	TicketMessageCreate    Permission = "ticket.message.create"
	TicketMessageCreateAll Permission = "ticket.message.create.all"

	ProjectCreate           Permission = "project.create"
	ProjectUpdateAll        Permission = "project.update.all"
	ProjectDeleteAll        Permission = "project.delete.all"
	ProjectUpdateClose      Permission = "project.update.close"
	ProjectUpdateApprove    Permission = "project.update.approve"
	ProjectUpdateImplement  Permission = "project.update.implement"
	ProjectSubmissionInfo   Permission = "project.submission.info"
	ProjectSubmissionList   Permission = "project.submission.list"
	ProjectSubmissionReview Permission = "project.submission.review"
	ProjectMessageCreate    Permission = "project.message.create"
	ProjectMessageViewAll   Permission = "project.message.view.all"
	ProjectMessageDeleteAll Permission = "project.message.delete.all"

	MaintenanceStart Permission = "maintenance.start"
	MaintenanceStop  Permission = "maintenance.stop"
)

type Permissions []Permission

func (p Permissions) Strings() []string {
	if p == nil {
		return nil
	}
	var out = make([]string, len(p))
	for i, perm := range p {
		out[i] = perm.String()
	}
	return out
}

var All = Permissions{
	UserUpdateAll,
	UserUpdateDisplayName,
	UserUpdateDescription,
	UserUpdateAvatar,
	UserViewAll,
	UserDeleteAll,

	RankList,
	RankInfo,
	RankCreate,
	RankUpdate,
	RankDelete,

	TicketCreate,
	TicketViewAll,
	TicketAccept,
	TicketClose,
	TicketMessageViewAll,
	TicketMessageCreate,
	TicketMessageCreateAll,

	ProjectCreate,
	ProjectUpdateAll,
	ProjectDeleteAll,
	ProjectUpdateClose,
	ProjectUpdateApprove,
	ProjectUpdateImplement,
	ProjectSubmissionInfo,
	ProjectSubmissionList,
	ProjectSubmissionReview,
	ProjectMessageCreate,
	ProjectMessageViewAll,
	ProjectMessageDeleteAll,

	MaintenanceStart,
	MaintenanceStop,
}

type Set map[Permission]struct{}

var registry = func() Set {
	m := make(Set, len(All))
	for _, e := range All {
		m[e] = struct{}{}
	}
	return m
}()

func IsValid(perm Permission) bool {
	_, ok := registry[perm]
	return ok
}

func NewSet(perms ...Permission) Set {
	var out = make(Set, len(perms))
	for _, e := range perms {
		if !IsValid(e) {
			continue
		}
		out[e] = struct{}{}
	}
	return out
}

func FromJson(bytes []byte) (Set, error) {
	var out Set
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func FromStrings(values []string) Set {
	var out = make(Set, len(values))
	for _, value := range values {
		p := Permission(value)
		if !IsValid(p) {
			continue
		}
		out[p] = struct{}{}
	}
	return out
}

func (s Set) ToJson() ([]byte, error) {
	return json.Marshal(s)
}

func (s Set) Has(p Permission) bool {
	_, ok := s[p]
	return ok
}

func (s Set) Add(p Permission) error {
	if !IsValid(p) {
		return errors.NotFound
	}
	s[p] = struct{}{}
	return nil
}

func (s Set) Remove(p Permission) {
	delete(s, p)
}

func (s Set) Strings() []string {
	out := make([]string, 0, len(s))
	for p := range s {
		out = append(out, p.String())
	}
	return out
}
