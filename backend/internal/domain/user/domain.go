package userdomain

import (
	"strings"
	"time"

	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	ranksdomain "github.com/aesterial/cityideas/backend/internal/domain/ranks"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
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

func (o OauthService) SQL() sqlc.OauthService {
	switch o {
	case ServiceVkontakte:
		return sqlc.OauthServiceVk
	case ServiceTelegram:
		return sqlc.OauthServiceTg
	default:
		return sqlc.OauthServiceVk
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
	CityID          *domain.UUID
	CityChanged     *time.Time
	Language        Languages
}

func ParsePreferences(prefs *userpb.UpdatePreferencesRequest) *Preferences {
	if prefs == nil {
		return nil
	}
	p := &Preferences{
		DisplayName:     prefs.GetDisplayName(),
		Description:     prefs.GetDescription(),
		SessionLiveTime: prefs.GetSessionLiveTime(),
	}
	if av := prefs.GetAvatarHash(); av != "" {
		p.Avatar = &av
	}
	if cid := prefs.GetCityId(); cid != "" {
		if id, err := domain.FromString(cid); err == nil {
			p.CityID = &id
		}
	}
	return p
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
	if p.CityID != nil {
		prefs.SetCityId(p.CityID.String())
	}
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

type VkCallbackType int32

const (
	UnknownCallback VkCallbackType = iota
	RegisterCallback
	AuthCallback
	LinkCallback
)

func CallbackFromProto(req loginpb.CallbackType) VkCallbackType {
	switch req {
	case loginpb.CallbackType_CallbackType_AUTH:
		return AuthCallback
	case loginpb.CallbackType_CallbackType_LINK:
		return LinkCallback
	case loginpb.CallbackType_CallbackType_REGISTER:
		return RegisterCallback
	default:
		return UnknownCallback
	}
}

func (v VkCallbackType) ToPurpose(service string) actionsdomain.Purpose {
	switch v {
	case RegisterCallback:
		switch strings.ToLower(service) {
		case "vk":
			return actionsdomain.OauthVkRegister
		case "tg":
			return actionsdomain.OauthTgRegister
		}
	case AuthCallback:
		switch strings.ToLower(service) {
		case "vk":
			return actionsdomain.OauthVkAuth
		case "tg":
			return actionsdomain.OauthTgAuth
		}
	case LinkCallback:
		switch strings.ToLower(service) {
		case "vk":
			return actionsdomain.OauthVkLink
		case "tg":
			return actionsdomain.OauthTgLink
		}
	}
	return actionsdomain.Purpose("")
}

type VkCallbackResponse struct {
	User *User
	Type VkCallbackType
}

func (v *VkCallbackResponse) Protobuf() *loginpb.VkCallbackResponse {
	if v == nil {
		return nil
	}
	var out = &loginpb.VkCallbackResponse{}
	switch v.Type {
	case RegisterCallback:
		out.SetType(loginpb.CallbackType_CallbackType_REGISTER)
		if v.User != nil {
			var info = &loginpb.VkCallbackResponse_RegisterInfo{}
			info.SetUsername(v.User.Username)
			info.SetEmail(v.User.Email)
			if v.User.Prefs != nil {
				info.SetDisplayName(v.User.Prefs.DisplayName)
				info.SetDescription(v.User.Prefs.Description)
				if v.User.Prefs.Avatar != nil {
					info.SetAvatarUrl(*v.User.Prefs.Avatar)
				}
			}
			out.SetRegister(info)
		}
	case AuthCallback:
		out.SetType(loginpb.CallbackType_CallbackType_AUTH)
		if v.User != nil {
			out.SetAuth(v.User.PrivateProtobuf())
		}
	default:
		out.SetType(loginpb.CallbackType_CallbackType_LINK)
	}
	return out
}

type VkToken struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	UserID      int    `json:"user_id"`
	Email       string `json:"email"`
	Error       string `json:"error"`
	ErrorDesc   string `json:"error_description"`
}

type VkUser struct {
	Username    string
	PhotoURL    string
	DisplayName string
	Description string
}

type TgAuthData struct {
	ID        int64
	FirstName string
	LastName  string
	Username  string
	PhotoURL  string
	AuthDate  int64
	Hash      string
}

type TgStartData struct {
	State       string
	BotUsername string
}
