package domain

import (
	"strings"

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
	DeviveMobile
)

func (d Device) String() string {
	switch d {
	case DeviceDesktop:
		return "desktop"
	case DeviveMobile:
		return "mobile"
	default:
		return "unknown"
	}
}

func ParseDevice(str string) Device {
	switch strings.ToLower(str) {
	case "desktop":
		return DeviceDesktop
	case "mobile":
		return DeviveMobile
	default:
		return DeviceUnknown
	}
}
