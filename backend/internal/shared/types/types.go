package types

import "github.com/golang-jwt/jwt/v5"

type CookieClaims struct {
	ID string `json:"id"`
	jwt.RegisteredClaims
}
