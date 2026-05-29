package loginservice

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	actionsdomain "github.com/aesterial/cityideas/backend/internal/domain/actions"
	emaildomain "github.com/aesterial/cityideas/backend/internal/domain/email"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

func (s *Service) SendEmailVerification(ctx context.Context, userID domain.UUID) error {
	sec, err := s.usr.Security(ctx, userID)
	if err != nil {
		return errors.Wrap(err)
	}
	if sec.EmailVerified {
		return errors.Conflict
	}
	user, err := s.usr.User(ctx, userID)
	if err != nil {
		return errors.Wrap(err)
	}
	if user == nil {
		return errors.NotFound
	}
	token := genToken(32)
	if token == "" {
		return errors.ServerError
	}
	if _, err = s.actions.Create(ctx, &userID, actionsdomain.EmailVerify, token, time.Now().Add(40*time.Minute)); err != nil {
		return errors.Wrap(err)
	}
	s.email.SendVerifyEmail(emaildomain.UserInfo{
		Username: user.Username,
		Address:  user.Email,
		Language: user.Prefs.Language,
	}, emaildomain.VerifyEmail{
		VerificationCode: token,
	})
	return nil
}

func (s *Service) VerifyEmailByToken(ctx context.Context, token string) error {
	if token == "" {
		return errors.InvalidArguments
	}
	if err := s.actions.IsValid(ctx, actionsdomain.EmailVerify, token); err != nil {
		return errors.Wrap(err)
	}
	action, err := s.actions.Info(ctx, token)
	if err != nil {
		return errors.Wrap(err)
	}
	if action.Purpose != actionsdomain.EmailVerify || action.Owner == nil {
		return errors.InvalidArguments
	}
	if err = s.usr.VerifyEmail(ctx, *action.Owner); err != nil {
		return errors.Wrap(err)
	}
	return s.actions.Use(ctx, actionsdomain.EmailVerify, token)
}
