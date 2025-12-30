package db

import (
	"ascendant/backend/internal/app/config"
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

func NewConnection() (*sql.DB, error) {
	host := config.Get().Database
	return sql.Open("postgres", fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host.Host, host.Port, host.User, host.Password, host.Name))
}
