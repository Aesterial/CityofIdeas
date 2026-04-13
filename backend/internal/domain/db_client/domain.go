package dbclientdomain

import (
	"github.com/aesterial/cityideas/backend/infra/db/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Client struct {
	Pool    *pgxpool.Pool
	Queries *sqlc.Queries
}
