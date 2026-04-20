package domain

import (
	"context"
	"strings"
	"time"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mileusna/useragent"
)

type UUID struct {
	uuid.UUID
}

func (u UUID) ToPG() pgtype.UUID {
	return pgtype.UUID{Bytes: u.UUID, Valid: true}
}

type Device int

const (
	DeviceUnknown Device = iota
	DeviceDesktop
	DeviceMobile
	DeviceTablet
)

func (d Device) String() string {
	switch d {
	case DeviceDesktop:
		return "desktop"
	case DeviceMobile:
		return "mobile"
	case DeviceTablet:
		return "tablet"
	default:
		return "unknown"
	}
}

func (d Device) SQLC() sqlc.DeviceT {
	switch d {
	case DeviceDesktop:
		return sqlc.DeviceTDesktop
	case DeviceMobile:
		return sqlc.DeviceTMobile
	case DeviceTablet:
		return sqlc.DeviceTTablet
	default:
		return sqlc.DeviceTDesktop
	}
}

func (d Device) IsValid() bool {
	switch d {
	case DeviceMobile, DeviceDesktop, DeviceTablet:
		return true
	default:
		return false
	}
}

func (d Device) Protobuf() typespb.Device {
	switch d {
	case DeviceUnknown:
		return typespb.Device_DEVICE_UNSPECIFIED
	case DeviceMobile:
		return typespb.Device_DEVICE_MOBILE
	case DeviceDesktop:
		return typespb.Device_DEVICE_DESKTOP
	case DeviceTablet:
		return typespb.Device_DEVICE_TABLET
	default:
		return typespb.Device_DEVICE_UNSPECIFIED
	}
}

func ParseDevice(str string) Device {
	switch strings.ToLower(str) {
	case "desktop":
		return DeviceDesktop
	case "mobile":
		return DeviceMobile
	case "tablet":
		return DeviceTablet
	default:
		return DeviceUnknown
	}
}

func ParseDeviceUa(ua useragent.UserAgent) Device {
	if ua.Bot {
		return DeviceUnknown
	}
	switch {
	case ua.Mobile:
		return DeviceMobile
	case ua.Tablet:
		return DeviceTablet
	case ua.Desktop:
		return DeviceDesktop
	default:
		return DeviceUnknown
	}
}

type ctxValue string

const (
	UaDeviceKey ctxValue = "device_ctx"
	UaHashKey   ctxValue = "hash_ctx"
)

func UaFromContext(ctx context.Context) (Device, string) {
	dev, ok := ctx.Value(UaDeviceKey).(Device)
	if !ok {
		return DeviceUnknown, ""
	}
	hash, ok := ctx.Value(UaHashKey).(string)
	if !ok {
		return DeviceUnknown, ""
	}
	return dev, hash
}

type Metadata struct {
	UserID    *UUID
	SessionID *UUID
}

func (m *Metadata) IsEmpty() bool {
	if m == nil {
		return true
	}
	return m.UserID == nil && m.SessionID == nil
}

type Claims struct {
	jwt.RegisteredClaims
}

func NewClaims(id string, issuer string, subject string, audience string, duration time.Duration) *Claims {
	now := time.Now()
	return &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			Subject:   subject,
			Audience:  jwt.ClaimStrings{audience},
			ExpiresAt: jwt.NewNumericDate(now.Add(duration)),
			NotBefore: jwt.NewNumericDate(now),
			IssuedAt:  jwt.NewNumericDate(now),
			ID:        id,
		},
	}
}

func ParseClaims(token string, secret string) (*Claims, error) {
	var claims = &Claims{}
	tk, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS384 {
			return nil, errors.InvalidArguments
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !tk.Valid {
		return nil, errors.InvalidArguments
	}
	return claims, nil
}

func (c *Claims) Issue(secret string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS384, c)
	return token.SignedString([]byte(secret))
}
