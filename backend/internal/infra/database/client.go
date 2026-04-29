package database

import (
	"context"

	dbclientdomain "github.com/aesterial/cityideas/backend/internal/domain/db_client"
	"github.com/aesterial/cityideas/backend/internal/infra/database/connection"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
)

func NewClient() (*dbclientdomain.Client, error) {
	pool, err := connection.NewConnection()
	if err != nil {
		return nil, err
	}
	if err = pool.Ping(context.Background()); err != nil {
		return nil, err
	}
	return &dbclientdomain.Client{
		Pool:    pool,
		Queries: sqlc.New(pool),
	}, nil
}
