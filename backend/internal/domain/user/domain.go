package userdomain

import (
	"strings"
	"time"

	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type OauthService int

const (
	ServiceUnknown OauthService = iota
	ServiceVkontakte
	ServiceTelegram
)

func ParseOauthService(str string) OauthService {
	switch strings.ToLower(str) {
	case "vk", "vkontakte":
		return ServiceVkontakte
	case "tg", "telegram":
		return ServiceTelegram
	default:
		return ServiceUnknown
	}
}

func (o OauthService) String() string {
	switch o {
	case ServiceVkontakte:
		return "vk"
	case ServiceTelegram:
		return "tg"
	default:
		return "unknown"
	}
}

type User struct {
	UID      domain.UUID
	Username string
	Email    string
	Joined   time.Time
	Prefs    *Preferences
	Ranks    ranksdomain.UserRanks
	Security *Security
	OAuth    []*OAuth
}

func (u *User) PublicProtobuf() *userpb.PublicUser {
	if u == nil || u.Prefs == nil || u.Ranks == nil {
		return nil
	}
	var usr = userpb.PublicUser{}
	usr.SetId(u.UID.String())
	usr.SetUsername(u.Username)
	usr.SetJoined(timestamppb.New(u.Joined))
	usr.SetPrefs(u.Prefs.Protobuf())
	usr.SetRank(u.Ranks.Head().Protobuf())
	return &usr
}

func (u *User) PrivateProtobuf() *userpb.PrivateUser {
	if u == nil || u.Prefs == nil {
		return nil
	}
	var usr = userpb.PrivateUser{}
	usr.SetSessionLive(u.Prefs.SessionLiveTime)
	usr.SetEmail(u.Email)
	usr.SetInfo(u.PublicProtobuf())
	return &usr
}

type Users []*User

func (u Users) Protobuf() []*userpb.PublicUser {
	var out = make([]*userpb.PublicUser, len(u))
	for i, e := range u {
		out[i] = e.PublicProtobuf()
	}
	return out
}

type Preferences struct {
	DisplayName     string
	Description     string
	Avatar          *string
	SessionLiveTime int32
}

func ParsePreferences(prefs *userpb.UpdatePreferencesRequest) *Preferences {
	if prefs == nil {
		return nil
	}
	return &Preferences{
		DisplayName:     prefs.GetDisplayName(),
		Description:     prefs.GetDescription(),
		Avatar:          new(prefs.GetAvatarHash()),
		SessionLiveTime: prefs.GetSessionLiveTime(),
	}
}

func (p *Preferences) Protobuf() *userpb.UserPreferences {
	if p == nil {
		return nil
	}
	var prefs = userpb.UserPreferences{}
	var avatar string
	if p.Avatar != nil {
		avatar = *p.Avatar
	}
	prefs.SetAvatar(avatar)
	prefs.SetDescription(p.Description)
	prefs.SetDisplayName(p.DisplayName)
	return &prefs
}

type SecurityTotp struct {
	TotpSecret    *string
	TotpConfirmed *time.Time
	TotpPending   *string
	TotpPendingCR *time.Time
	TotpLastStep  *int64
}

type Security struct {
	EmailVerified bool
	TotpEnabled   bool
	Totp          *SecurityTotp
}

type RecoveryCode struct {
	Hash    string
	Used    *time.Time
	Created time.Time
}

type OAuth struct {
	Service OauthService
	ID      string
	At      time.Time
}
