package db

import (
	"ascendant/backend/internal/domain/rank"
	"ascendant/backend/internal/domain/user"
	"context"
	"database/sql"
	"errors"
	"time"
)

type UserRepository struct {
	DB *sql.DB
}

type LoggerRepository struct {
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

func (u *UserRepository) getRank(ctx context.Context, uid uint) (*rank.Rank, error) {
	row := u.DB.QueryRowContext(ctx, "SELECT (u.rank).name, (u.rank).expires FROM users u WHERE u.uid = $1", uid)
	if err := row.Err(); err != nil {
		return nil, err
	}
	var r rank.Rank
	if err := row.Scan(&r.Name, &r.Expires); err != nil {
		return nil, err
	}
	return &r, nil
}

func (u *UserRepository) getJoinedAT(ctx context.Context, uid uint) (*time.Time, error) {
	row := u.DB.QueryRowContext(ctx, "SELECT u.joined FROM users u WHERE u.uid = $1", uid)
	if err := row.Err(); err != nil {
		return nil, err
	}
	var t time.Time
	if err := row.Scan(&t); err != nil {
		return nil, err
	}
	return &t, nil
}

func (u *UserRepository) getSettings(ctx context.Context, uid uint) (*user.Settings, error) {
	rowMain := u.DB.QueryRowContext(ctx,
		"SELECT u.settings.session_live_time, u.settings.password, u.settings.display_name FROM users u WHERE u.uid = $1",
		uid)
	if err := rowMain.Err(); err != nil {
		return nil, err
	}
	var s user.Settings
	if err := rowMain.Scan(&s.SessionLiveTime, &s.Password, &s.DisplayName); err != nil {
		return nil, err
	}
	var a user.Avatar
	row := u.DB.QueryRowContext(ctx, " SELECT((u.settings).avatar).content_type, ((u.settings).avatar).data, ((u.settings).avatar).width, ((u.settings).avatar).height, ((u.settings).avatar).size_bytes, ((u.settings).avatar).updated FROM users u WHERE u.uid = $1", uid)
	if err := row.Err(); err != nil {
		return nil, err
	}
	if err := row.Scan(&a.ContentType, &a.Data, &a.Width, &a.Height, &a.SizeBytes, &a.Updated); err != nil {
		return nil, err
	}
	s.Avatar = a
	return &s, nil
}

func (u *UserRepository) getUser(ctx context.Context, uid uint) (*user.User, error) {
	var us user.User
	us.UID = uid
	if exists, err := u.isExists(ctx, uid); err != nil || !exists {
		return nil, err
	}
	var err error
	us.Username, err = u.getUsername(ctx, uid)
	if err != nil {
		return nil, err
	}
	at, err := u.getJoinedAT(ctx, uid)
	if err != nil {
		return nil, err
	}
	if at == nil {
		return nil, errors.New("joined at pointer is null")
	}
	us.Joined = *at
	us.Email, err = u.getEmail(ctx, uid)
	if err != nil {
		return nil, err
	}
	us.Rank, err = u.getRank(ctx, uid)
	if err != nil {
		return nil, err
	}
	us.Settings, err = u.getSettings(ctx, uid)
	if err != nil {
		return nil, err
	}
	return &us, nil
}

func (u *UserRepository) getUserByUsername(ctx context.Context, username string) (*user.User, error) {
	uid, err := u.getUID(ctx, username)
	if err != nil {
		return nil, err
	}
	return u.getUser(ctx, uid)
}

func (u *UserRepository) isExists(ctx context.Context, uid uint) (bool, error) {
	var exists bool
	err := u.DB.QueryRowContext(ctx, "SELECT EXISTS (SELECT 1 FROM users u WHERE u.uid = $1)", uid).Scan(&exists)
	if err != nil {
		return false, err
	}
	if !exists {
		return false, errors.New("user not found")
	}
	return exists, nil
}
