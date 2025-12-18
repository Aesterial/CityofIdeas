package db

import (
	"ascendant/backend/internal/shared/config"
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

func NewConnection() (*sql.DB, error) {
	dbHost := config.ENV.Database
	return sql.Open("postgres", fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost.Host, dbHost.Port, dbHost.User, dbHost.Pass, dbHost.Name))
}
