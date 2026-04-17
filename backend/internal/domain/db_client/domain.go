package dbclientdomain

import (
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Client struct {
	Pool    *pgxpool.Pool
	Queries *sqlc.Queries
}

func (c *Client) Close() {
	if c != nil && c.Pool != nil {
		c.Pool.Close()
	}
}

func (c *Client) Querier() sqlc.Querier {
	if c != nil && c.Pool != nil {
		return c.Queries
	}
	return nil
}
