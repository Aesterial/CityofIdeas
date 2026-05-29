package actionsdomain

import (
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
)

type Purpose string

const (
	PasswordReset   Purpose = "password_reset"
	TotpReset       Purpose = "totp_reset"
	AccountDelete   Purpose = "account_delete"
	EmailVerify     Purpose = "email_verify"
	OauthVkAuth     Purpose = "vk_auth"
	OauthVkLink     Purpose = "vk_link"
	OauthVkRegister Purpose = "vk_register"
	OauthTgLink     Purpose = "tg_link"
	OauthTgAuth     Purpose = "tg_auth"
	OauthTgRegister Purpose = "tg_register"
)

func (p Purpose) String() string {
	return string(p)
}

func (p Purpose) IsValid() bool {
	switch p {
	case PasswordReset, TotpReset, AccountDelete, EmailVerify, OauthTgAuth, OauthVkAuth, OauthVkLink, OauthTgLink, OauthVkRegister, OauthTgRegister:
		return true
	default:
		return false
	}
}

type Action struct {
	ID        domain.UUID
	Owner     *domain.UUID
	Purpose   Purpose
	Hash      string
	CreatedAt time.Time
	ExpiresAt time.Time
	Used      *time.Time
}

type Actions []*Action
