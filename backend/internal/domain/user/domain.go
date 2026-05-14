package userdomain

import (
	"strings"
	"time"

	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
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

type Languages int

const (
	RussianLang Languages = 0
	EnglishLang Languages = 1
)

func (l Languages) Protobuf() userpb.Languages {
	switch l {
	case RussianLang:
		return userpb.Languages_LANGUAGES_RUSSIAN
	case EnglishLang:
		return userpb.Languages_LANGUAGES_ENGLISH
	default:
		return userpb.Languages_LANGUAGES_UNSPECIFIED
	}
}

func (l Languages) String() string {
	switch l {
	case RussianLang:
		return "russian"
	case EnglishLang:
		return "english"
	default:
		return "russian"
	}
}

func ParseLanguage(str string) Languages {
	switch strings.ToLower(str) {
	case "russian":
		return RussianLang
	case "english":
		return EnglishLang
	default:
		return RussianLang
	}
}

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

type ResetKind int

const (
	EmailReset ResetKind = iota
	RecoveryReset
)

func ParseResetKind(kind loginpb.Reset) ResetKind {
	switch kind {
	case loginpb.Reset_RESET_EMAIL:
		return EmailReset
	case loginpb.Reset_RESET_RECOVERY:
		return RecoveryReset
	default:
		return RecoveryReset
	}
}

func (r ResetKind) IsEmail() bool {
	return r == EmailReset
}

func (r ResetKind) IsRecovery() bool {
	return r == RecoveryReset
}

type User struct {
	UID         domain.UUID
	Username    string
	Email       string
	Joined      time.Time
	Prefs       *Preferences
	Ranks       ranksdomain.UserRanks
	Security    *Security
	OAuth       []*OAuth
	Permissions []string
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
	usr.SetSecurity(u.Security.Protobuf(u.Email))
	usr.SetPublic(u.PublicProtobuf())
	usr.SetPermissions(u.Permissions)
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
	Language        Languages
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

type TotpData struct {
	QR     string
	URL    string
	Secret string
}

func (t *TotpData) Protobuf() *loginpb.CreateTotpResponse {
	if t == nil {
		return nil
	}
	var out = &loginpb.CreateTotpResponse{}
	out.SetQr(t.QR)
	out.SetUrl(t.URL)
	return out
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

func (s *Security) Protobuf(email string) *userpb.Security {
	if s == nil {
		return nil
	}
	var out = &userpb.Security{}
	out.SetEmail(email)
	out.SetEmailVerified(s.EmailVerified)
	out.SetTotpEnabled(s.TotpEnabled)
	return out
}

type RecoveryCode struct {
	Selector string
	Hash     string
	Used     *time.Time
	Created  time.Time
}

type OAuth struct {
	Service OauthService
	ID      string
	At      time.Time
}

type Ban struct {
	ID       domain.UUID
	Executor domain.UUID
	Target   domain.UUID
	Remove   *domain.UUID
	Reason   string
	At       time.Time
	Expires  *time.Time
}
