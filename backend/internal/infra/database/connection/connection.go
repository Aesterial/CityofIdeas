package connection

import (
	"context"
	"fmt"

	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewConnection() (*pgxpool.Pool, error) {
	cfg := config.Get()
	return pgxpool.New(context.Background(), fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.Name, cfg.Database.TlsMode.String()))
}
