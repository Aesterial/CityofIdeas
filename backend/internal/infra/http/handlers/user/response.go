package user

import (
	"ascendant/backend/internal/domain/rank"
	domainuser "ascendant/backend/internal/domain/user"
	"time"
)

type PublicSettings struct {
	DisplayName     *string            `json:"display_name,omitempty"`
	Avatar          *domainuser.Avatar `json:"avatar,omitempty"`
	SessionLiveTime *int               `json:"session_live_time,omitempty"`
}

type PublicUser struct {
	UID      uint              `json:"uid"`
	Username string            `json:"username"`
	Email    *domainuser.Email `json:"email,omitempty"`
	Settings *PublicSettings   `json:"settings,omitempty"`
	Rank     *rank.Rank        `json:"rank,omitempty"`
	Joined   time.Time         `json:"joined"`
}

func toPublic(u *domainuser.User) *PublicUser {
	if u == nil {
		return nil
	}

	var settings *PublicSettings
	if u.Settings != nil {
		settings = &PublicSettings{
			DisplayName:     u.Settings.DisplayName,
			Avatar:          u.Settings.Avatar,
			SessionLiveTime: &u.Settings.SessionLiveTime,
		}
	}

	return &PublicUser{
		UID:      u.UID,
		Username: u.Username,
		Email:    u.Email,
		Settings: settings,
		Rank:     u.Rank,
		Joined:   u.Joined,
	}
}
