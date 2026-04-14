package domain

import (
	"context"
	"strings"

	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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

const UaDeviceKey = "device_ctx"
const UaHashKey = "hash_ctx"

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
