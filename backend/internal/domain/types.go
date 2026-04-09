package domain

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UUID struct {
	uuid.UUID
}

func (u UUID) ToPG() pgtype.UUID {
	return pgtype.UUID{Bytes: u.UUID, Valid: true}
}
