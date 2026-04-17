package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	sessionsdomain "github.com/aesterial/cityideas/backend/internal/domain/sessions"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5/pgtype"
)

type SessionsRepository struct {
	conn sqlc.Querier
}

func NewSessionsRepository(conn sqlc.Querier) *SessionsRepository {
	return &SessionsRepository{conn: conn}
}

var _ sessionsdomain.Repository = (*SessionsRepository)(nil)

func (*SessionsRepository) parseSession(session sqlc.Session) *sessionsdomain.Session {
	var device = domain.DeviceDesktop
	if session.Device.Valid() {
		device = domain.ParseDevice(string(session.Device))
	}
	return &sessionsdomain.Session{
		ID:      domain.UUID{UUID: session.ID.Bytes},
		Owner:   domain.UUID{UUID: session.Owner.Bytes},
		MFA:     session.Mfa,
		Device:  device,
		Hash:    session.Hash,
		At:      session.At.Time,
		Seen:    session.SeenAt.Time,
		Expires: session.Expires.Time,
	}
}

func (s *SessionsRepository) parseSessions(sessions []sqlc.Session) sessionsdomain.Sessions {
	var out = make(sessionsdomain.Sessions, len(sessions))
	for i, session := range sessions {
		out[i] = s.parseSession(session)
	}
	return out
}

func (s *SessionsRepository) Create(ctx context.Context, user domain.UUID, expires time.Time, device domain.Device, hash string) (*sessionsdomain.Session, error) {
	if expires.IsZero() || hash == "" || device.String() == "" {
		return nil, errors.InvalidArguments
	}
	session, err := s.conn.CreateSession(ctx, sqlc.CreateSessionParams{
		Owner:   user.ToPG(),
		Expires: pgtype.Timestamptz{Time: expires, Valid: true},
		Device:  device.SQLC(),
		Hash:    hash,
	})
	if err != nil {
		return nil, err
	}
	return s.parseSession(session), nil
}

func (s *SessionsRepository) ByOwner(ctx context.Context, user domain.UUID) (sessionsdomain.Sessions, error) {
	list, err := s.conn.SessionsByOwner(ctx, user.ToPG())
	if err != nil {
		return nil, err
	}
	return s.parseSessions(list), nil
}

func (s *SessionsRepository) Revoke(ctx context.Context, session domain.UUID) error {
	return s.conn.RevokeSession(ctx, session.ToPG())
}

func (s *SessionsRepository) Extend(ctx context.Context, session domain.UUID, duration time.Duration) error {
	sess, err := s.Info(ctx, session)
	if err != nil {
		return err
	}
	return s.conn.ExtendSession(ctx, sqlc.ExtendSessionParams{
		Expires: pgtype.Timestamptz{Time: sess.Expires.Add(duration), Valid: true},
		ID:      session.ToPG(),
	})
}

func (s *SessionsRepository) IsValid(ctx context.Context, session domain.UUID, device domain.Device, hash string) (bool, error) {
	if !device.IsValid() || hash == "" {
		return false, errors.InvalidArguments
	}
	b, err := s.conn.IsSessionValid(ctx, sqlc.IsSessionValidParams{
		Device: device.SQLC(),
		Hash:   hash,
		Owner:  session.ToPG(),
	})
	if err != nil {
		return false, err
	}
	return b.Bool, nil
}

func (s *SessionsRepository) Info(ctx context.Context, session domain.UUID) (*sessionsdomain.Session, error) {
	sess, err := s.conn.SessionInfo(ctx, session.ToPG())
	if err != nil {
		return nil, err
	}
	return s.parseSession(sess), nil
}
