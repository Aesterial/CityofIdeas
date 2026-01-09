package verification

import "time"

type Purpose string

const EmailVerification Purpose = "verify_email"
const PasswordReset Purpose = "reset_password"

func (p Purpose) IsValid() bool {
	return p == EmailVerification || p == PasswordReset
}

func (p Purpose) String() string {
	return string(p)
}

type TokenRecord struct {
	ID        int64
	Email     string
	Purpose   Purpose
	ExpiresAt time.Time
	UsedAt    *time.Time
}
