package handlers

import (
	"ascendant/backend/internal/shared/config"
	"ascendant/backend/internal/shared/types"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func GetTraceID(req *gin.Context) string {
	trace, exists := req.Get("traceID")
	if !exists {
		return ""
	}
	return trace.(string)
}

func GetCookie(req *gin.Context, name string) (string, error) {
	cookie, err := req.Cookie(name)
	if err != nil {
		return "", err
	}
	return cookie, nil
}

func IssueSessionCookie(c *gin.Context, sessionID string, ttl time.Duration) (string, error) {
	if sessionID == "" {
		return "", errors.New("sessionID is empty")
	}
	if ttl <= 0 {
		return "", errors.New("ttl must be > 0")
	}

	val, err := compileClaims(sessionID, ttl)
	if err != nil {
		return "", err
	}

	c.SetSameSite(parseSameSite(config.ENV.Cookies.SameSite))

	secure := config.ENV.Cookies.Secure
	if !secure {
		secure = isSecureRequest(c.Request)
	}

	domain := config.ENV.Cookies.Domain
	path := "/"
	maxAge := int(ttl.Seconds())

	c.SetCookie(
		config.ENV.Cookies.Name,
		val,
		maxAge,
		path,
		domain,
		secure,
		true,
	)

	return val, nil
}

func ParseClaims(tokenString string) (*types.CookieClaims, error) {
	claims := &types.CookieClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS384 {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(config.ENV.Cookies.Secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("token is invalid")
	}
	return claims, nil
}

func compileClaims(sessionID string, ttl time.Duration) (string, error) {
	now := time.Now()

	claims := &types.CookieClaims{
		ID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "ascendant",
			Subject:   "session",
			Audience:  jwt.ClaimStrings{"ascendant-web"},
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS384, claims)
	return t.SignedString([]byte(config.ENV.Cookies.Secret))
}

func parseSameSite(v string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	case "lax", "":
		return http.SameSiteLaxMode
	default:
		return http.SameSiteLaxMode
	}
}

func isSecureRequest(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	return strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
}
