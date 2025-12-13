package db

import (
	"ascendant/backend/internal/domain/user"
	"context"
	"database/sql"
)

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

func (u *UserRepository) getUID(ctx context.Context, name string) (uint, error) {
	row := u.DB.QueryRowContext(ctx, "SELECT u.uid FROM users u WHERE u.username = $1", name)
	if err := row.Err(); err != nil {
		return 0, err
	}
	var uid uint
	if err := row.Scan(&uid); err != nil {
		return 0, err
	}
	return uid, nil
}

func (u *UserRepository) getUsername(ctx context.Context, uid uint) (string, error) {
	row := u.DB.QueryRowContext(ctx, "SELECT u.username FROM users u WHERE u.uid = $1", uid)
	if err := row.Err(); err != nil {
		return "", nil
	}
	var username string
	if err := row.Scan(&username); err != nil {
		return "", nil
	}
	return username, nil
}

func (u *UserRepository) getEmail(ctx context.Context, uid uint) (*user.Email, error) {
	row := u.DB.QueryRowContext(ctx, "SELECT (u.email).address, (u.email).verified FROM users u WHERE u.uid = $1", uid)
	if err := row.Err(); err != nil {
		return nil, err
	}
	var email user.Email
	if err := row.Scan(&email.Address, &email.Verified); err != nil {
		return nil, err
	}
	return &email, nil
}
