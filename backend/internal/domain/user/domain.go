package userdomain

import (
	"strings"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
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
	Security *Security
	OAuth    []*OAuth
}

type Users []*User

type Preferences struct {
	DisplayName     string
	Description     string
	Avatar          *string
	SessionLiveTime int
}

type SecurityTotp struct {
	TotpSecret    *string
	TotpConfirmed *time.Time
	TotpPending   *string
	TotpPendingCR *time.Time
	TotpLastStep  int64
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
