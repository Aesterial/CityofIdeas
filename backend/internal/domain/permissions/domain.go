package permissions

import (
	"encoding/json"
	"errors"
	"strings"
)

type Permission string

const (
	All Permission = "all"

	ProjectsAll        Permission = "projects.all"
	ProjectsCreate     Permission = "projects.create"
	ProjectsView       Permission = "projects.view"
	ProjectsVote       Permission = "projects.vote"
	ProjectsUpdateAll  Permission = "projects.update.all"
	ProjectsUpdateOwn  Permission = "projects.update.own"
	ProjectsUpdateAny  Permission = "projects.update.any"
	ProjectsArchiveOwn Permission = "projects.archive.own"
	ProjectsArchiveAny Permission = "projects.archive.any"
	ProjectsDeleteAll  Permission = "projects.delete.all"
	ProjectsDeleteOwn  Permission = "projects.delete.own"
	ProjectsDeleteAny  Permission = "projects.delete.any"

	TicketsAll                   Permission = "tickets.all"
	TicketsCreate                Permission = "tickets.create"
	TicketsViewListOwn           Permission = "tickets.view_list.own"
	TicketsViewListAny           Permission = "tickets.view_list.any"
	TicketsAccept                Permission = "tickets.accept"
	TicketsMessageCreateAll      Permission = "tickets.message.create.all"
	TicketsMessageCreateAccepted Permission = "tickets.message.create.accepted"
	TicketsMessageCreateAny      Permission = "tickets.message.create.any"
	TicketsCloseAll              Permission = "tickets.close.all"
	TicketsCloseAccepted         Permission = "tickets.close.accepted"
	TicketsCloseAny              Permission = "tickets.close.any"

	SubmissionsAll     Permission = "submissions.all"
	SubmissionsView    Permission = "submissions.view"
	SubmissionsAccept  Permission = "submissions.accept"
	SubmissionsDecline Permission = "submissions.decline"

	StatisticsAll                 Permission = "statistics.all"
	StatisticsActivityAll         Permission = "statistics.activity.all"
	StatisticsActivityUsersPeriod Permission = "statistics.activity.users.period"
	StatisticsSubmissionsAll      Permission = "statistics.submissions.all"
	StatisticsSubmissionsRecap    Permission = "statistics.submissions.recap"
	StatisticsVotesAll            Permission = "statistics.votes.all"
	StatisticsVotesCategoriesTop  Permission = "statistics.votes.categories.top"
	StatisticsMediaAll            Permission = "statistics.media.all"
	StatisticsMediaQuality        Permission = "statistics.media.quality"
	StatisticsMediaVolume         Permission = "statistics.media.volume"

	UsersAll                          Permission = "users.all"
	UsersViewAll                      Permission = "users.view.all"
	UsersViewProfilePublic            Permission = "users.view.profile.public"
	UsersViewProfilePrivacy           Permission = "users.view.profile.privacy"
	UsersSettingsAll                  Permission = "users.settings.all"
	UsersSettingsChangeNameOwn        Permission = "users.settings.change.name.own"
	UsersSettingsChangeNameAny        Permission = "users.settings.change.name.any"
	UsersSettingsChangeDescriptionOwn Permission = "users.settings.change.description.own"
	UsersSettingsDeleteProfileOwn     Permission = "users.settings.delete.profile.own"
	UsersSettingsDeleteAvatarOwn      Permission = "users.settings.delete.avatar.own"
	UsersSettingsDeleteAvatarAny      Permission = "users.settings.delete.avatar.any"
	UsersSettingsDeleteDescriptionOwn Permission = "users.settings.delete.description.own"
	UsersSettingsDeleteDescriptionAny Permission = "users.settings.delete.description.any"
	UsersSettingsResetAll             Permission = "users.settings.reset.all"
	UsersSettingsResetPasswordOwn     Permission = "users.settings.reset.password.own"
	UsersSettingsResetPasswordAny     Permission = "users.settings.reset.password.any"
	UsersModerationAll                Permission = "users.moderation.all"
	UsersModerationBan                Permission = "users.moderation.ban"
	UsersModerationBanForever         Permission = "users.moderation.ban_forever"
	UsersModerationUnban              Permission = "users.moderation.unban"
	UsersModerationSetAll             Permission = "users.moderation.set.all"
	UsersModerationSetRank            Permission = "users.moderation.set.rank"

	RanksAll               Permission = "ranks.all"
	RanksPermissionsChange Permission = "ranks.permissions_change"
	RanksAdd               Permission = "ranks.add"
	RanksDelete            Permission = "ranks.delete"
	RanksEdit              Permission = "ranks.edit"
)

type ProjectsUpdatePermissions struct {
	All bool `json:"all"`
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type ProjectsArchivePermissions struct {
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type ProjectsDeletePermissions struct {
	All bool `json:"all"`
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type ProjectsPermissions struct {
	All     bool                       `json:"all"`
	Create  bool                       `json:"create"`
	View    bool                       `json:"view"`
	Vote    bool                       `json:"vote"`
	Update  ProjectsUpdatePermissions  `json:"update"`
	Archive ProjectsArchivePermissions `json:"archive"`
	Delete  ProjectsDeletePermissions  `json:"delete"`
}

type TicketsViewListPermissions struct {
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type TicketsMessageCreatePermissions struct {
	All      bool `json:"all"`
	Accepted bool `json:"accepted"`
	Any      bool `json:"any"`
}

type TicketsMessagePermissions struct {
	Create TicketsMessageCreatePermissions `json:"create"`
}

type TicketsClosePermissions struct {
	All      bool `json:"all"`
	Accepted bool `json:"accepted"`
	Any      bool `json:"any"`
}

type TicketsPermissions struct {
	All      bool                       `json:"all"`
	Create   bool                       `json:"create"`
	ViewList TicketsViewListPermissions `json:"view_list"`
	Accept   bool                       `json:"accept"`
	Message  TicketsMessagePermissions  `json:"message"`
	Close    TicketsClosePermissions    `json:"close"`
}

type SubmissionsPermissions struct {
	All     bool `json:"all"`
	View    bool `json:"view"`
	Accept  bool `json:"accept"`
	Decline bool `json:"decline"`
}

type StatisticsActivityUsersPermissions struct {
	Period bool `json:"period"`
}

type StatisticsActivityPermissions struct {
	All   bool                               `json:"all"`
	Users StatisticsActivityUsersPermissions `json:"users"`
}

type StatisticsSubmissionsPermissions struct {
	All   bool `json:"all"`
	Recap bool `json:"recap"`
}

type StatisticsVotesCategoriesPermissions struct {
	Top bool `json:"top"`
}

type StatisticsVotesPermissions struct {
	All        bool                                 `json:"all"`
	Categories StatisticsVotesCategoriesPermissions `json:"categories"`
}

type StatisticsMediaPermissions struct {
	All     bool `json:"all"`
	Quality bool `json:"quality"`
	Volume  bool `json:"volume"`
}

type StatisticsPermissions struct {
	All         bool                             `json:"all"`
	Activity    StatisticsActivityPermissions    `json:"activity"`
	Submissions StatisticsSubmissionsPermissions `json:"submissions"`
	Votes       StatisticsVotesPermissions       `json:"votes"`
	Media       StatisticsMediaPermissions       `json:"media"`
}

type UsersViewProfilePermissions struct {
	Public  bool `json:"public"`
	Privacy bool `json:"privacy"`
}

type UsersViewPermissions struct {
	All     bool                        `json:"all"`
	Profile UsersViewProfilePermissions `json:"profile"`
}

type UsersSettingsChangeNamePermissions struct {
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type UsersSettingsChangeDescriptionPermissions struct {
	Own bool `json:"own"`
}

type UsersSettingsChangePermissions struct {
	Name        UsersSettingsChangeNamePermissions        `json:"name"`
	Description UsersSettingsChangeDescriptionPermissions `json:"description"`
}

type UsersSettingsDeleteProfilePermissions struct {
	Own bool `json:"own"`
}

type UsersSettingsDeleteAvatarPermissions struct {
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type UsersSettingsDeleteDescriptionPermissions struct {
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type UsersSettingsDeletePermissions struct {
	Profile     UsersSettingsDeleteProfilePermissions     `json:"profile"`
	Avatar      UsersSettingsDeleteAvatarPermissions      `json:"avatar"`
	Description UsersSettingsDeleteDescriptionPermissions `json:"description"`
}

type UsersSettingsResetPasswordPermissions struct {
	Own bool `json:"own"`
	Any bool `json:"any"`
}

type UsersSettingsResetPermissions struct {
	All      bool                                  `json:"all"`
	Password UsersSettingsResetPasswordPermissions `json:"password"`
}

type UsersSettingsPermissions struct {
	All    bool                           `json:"all"`
	Change UsersSettingsChangePermissions `json:"change"`
	Delete UsersSettingsDeletePermissions `json:"delete"`
	Reset  UsersSettingsResetPermissions  `json:"reset"`
}

type UsersModerationSetPermissions struct {
	All  bool `json:"all"`
	Rank bool `json:"rank"`
}

type UsersModerationPermissions struct {
	All        bool                          `json:"all"`
	Ban        bool                          `json:"ban"`
	BanForever bool                          `json:"ban_forever"`
	Unban      bool                          `json:"unban"`
	Set        UsersModerationSetPermissions `json:"set"`
}

type UsersPermissions struct {
	All        bool                       `json:"all"`
	View       UsersViewPermissions       `json:"view"`
	Settings   UsersSettingsPermissions   `json:"settings"`
	Moderation UsersModerationPermissions `json:"moderation"`
}

type RanksPermissions struct {
	All               bool `json:"all"`
	PermissionsChange bool `json:"permissions_change"`
	Add               bool `json:"add"`
	Delete            bool `json:"delete"`
	Edit              bool `json:"edit"`
}

type Permissions struct {
	All         bool                   `json:"all"`
	Projects    ProjectsPermissions    `json:"projects"`
	Tickets     TicketsPermissions     `json:"tickets"`
	Submissions SubmissionsPermissions `json:"submissions"`
	Statistics  StatisticsPermissions  `json:"statistics"`
	Users       UsersPermissions       `json:"users"`
	Ranks       RanksPermissions       `json:"ranks"`
}

func (p *Permissions) Allowed(perm Permission) bool {
	if p == nil {
		return false
	}
	path, err := normalizePath(string(perm))
	if err != nil || len(path) == 0 {
		return false
	}
	if p.All {
		return true
	}
	tree := p.toMap()
	if len(tree) == 0 {
		return false
	}
	for i := 1; i <= len(path); i++ {
		prefix := make([]string, 0, i+1)
		prefix = append(prefix, path[:i]...)
		prefix = append(prefix, "all")
		if pathValueTrue(tree, prefix) {
			return true
		}
	}
	return pathValueTrue(tree, path)
}

func normalizePath(raw string) ([]string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, errors.New("permission path is empty")
	}
	trimmed = strings.ToLower(trimmed)
	if trimmed == "*" || trimmed == ".*" {
		return []string{"all"}, nil
	}
	parts := strings.Split(trimmed, ".")
	if len(parts) == 0 {
		return nil, errors.New("permission path is empty")
	}
	if parts[len(parts)-1] == "*" {
		parts[len(parts)-1] = "all"
	}
	return parts, nil
}

func (p *Permissions) toMap() map[string]any {
	raw, err := json.Marshal(p)
	if err != nil {
		return nil
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil
	}
	return out
}

func pathValueTrue(tree any, path []string) bool {
	current := tree
	for _, part := range path {
		obj, ok := current.(map[string]any)
		if !ok {
			return false
		}
		next, ok := obj[part]
		if !ok {
			return false
		}
		current = next
	}
	val, ok := current.(bool)
	return ok && val
}
