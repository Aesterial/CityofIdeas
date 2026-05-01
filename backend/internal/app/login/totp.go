package loginservice

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"strings"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	code "github.com/skip2/go-qrcode"
)

func (s *Service) genTOTP(issuer string, email string) (*userdomain.TotpData, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: email,
		Period:      30,
		Digits:      otp.DigitsSix,
		Algorithm:   otp.AlgorithmSHA256,
	})
	if err != nil {
		return nil, err
	}
	authURL := key.URL()
	pic, err := code.Encode(authURL, code.High, 256)
	if err != nil {
		return nil, err
	}
	return &userdomain.TotpData{
		QR:     "data:image/png;base64," + base64.StdEncoding.EncodeToString(pic),
		URL:    authURL,
		Secret: key.Secret(),
	}, nil
}

func (s *Service) genRecoveryCodes(length int) ([]string, []userdomain.RecoveryCode, error) {
	recovery := make([]string, 0, length)
	codes := make([]userdomain.RecoveryCode, 0, length)
	for i := 0; i < length; i++ {
		selectorRaw := make([]byte, 4)
		secretRaw := make([]byte, 16)
		if _, err := rand.Read(selectorRaw); err != nil {
			return nil, nil, err
		}
		if _, err := rand.Read(secretRaw); err != nil {
			return nil, nil, err
		}
		selector := hex.EncodeToString(selectorRaw)
		secret := hex.EncodeToString(secretRaw)
		recovery = append(recovery, selector+"-"+secret)
		codes = append(codes, userdomain.RecoveryCode{
			Selector: selector,
			Hash:     s.hashCode(selector, secret),
			Created:  time.Now().UTC(),
		})
	}
	return recovery, codes, nil
}

func (s *Service) hashCode(selector string, secret string) string {
	mac := hmac.New(sha256.New, []byte(config.Get().Cookie.Secret))
	mac.Write([]byte(selector))
	mac.Write([]byte(":"))
	mac.Write([]byte(secret))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (s *Service) verifyRecoveryCode(ctx context.Context, user domain.UUID, input string) error {
	selector, secret, ok := strings.Cut(input, "-")
	if !ok {
		return errors.InvalidArguments
	}
	cd, err := s.usr.RecoveryCodesWithSelector(ctx, user, selector)
	if err != nil {
		return errors.InvalidArguments
	}
	if cd.Used != nil {
		return errors.InvalidArguments
	}
	expected := s.hashCode(selector, secret)
	if subtle.ConstantTimeCompare([]byte(expected), []byte(cd.Hash)) != 1 {
		return errors.InvalidArguments
	}
	return s.usr.UseRecovery(ctx, selector)
}

func (s *Service) validateCode(code string, secret string) error {
	ok, err := totp.ValidateCustom(strings.ToLower(strings.TrimSpace(code)), secret, time.Now(), totp.ValidateOpts{
		Period:    30,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA256,
	})
	if err != nil {
		return err
	}
	if !ok {
		return errors.Unauthenticated
	}
	return nil
}

func (s *Service) SetupTotp(ctx context.Context, user domain.UUID) (*userdomain.TotpData, error) {
	usr, err := s.usr.User(ctx, user)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	logger.Info("login", "user received")
	if usr.Security.TotpEnabled {
		return nil, errors.Conflict
	}
	logger.Info("login", "checked is totp enabled")
	out, err := s.genTOTP(config.Get().Domain, usr.Email)
	if err != nil {
		logger.Error("login", "failed to generate totp for user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	logger.Info("login", "trying to start totp process")
	if err = s.usr.StartTotp(ctx, user, out.Secret); err != nil {
		logger.Error("login", "failed to start totp process", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return out, nil
}

func (s *Service) ConfirmTotp(ctx context.Context, user domain.UUID, code string) ([]string, error) {
	security, err := s.usr.Security(ctx, user)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if security.Totp.TotpPending == nil {
		return nil, errors.NotFound
	}
	if err = s.validateCode(code, *security.Totp.TotpPending); err != nil {
		return nil, errors.Wrap(err)
	}
	usr, codes, err := s.genRecoveryCodes(12)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = s.usr.ConfirmTotp(ctx, user); err != nil {
		return nil, errors.Wrap(err)
	}
	if err = s.usr.InsertRecovery(ctx, user, codes); err != nil {
		return nil, errors.Wrap(err)
	}
	if err = s.usr.SetTotpLastStep(ctx, user, time.Now().Unix()/30); err != nil {
		return nil, errors.Wrap(err)
	}
	return usr, nil
}

func (s *Service) CheckTotp(ctx context.Context, user domain.UUID, code string) error {
	now := time.Now()
	security, err := s.usr.Security(ctx, user)
	if err != nil {
		return errors.Wrap(err)
	}
	if !security.TotpEnabled {
		return errors.NotFound
	}
	if err = s.validateCode(code, *security.Totp.TotpSecret); err != nil {
		return errors.Wrap(err)
	}
	if now.Unix() <= *security.Totp.TotpLastStep {
		return errors.Conflict
	}
	if err = s.usr.SetTotpLastStep(ctx, user, time.Now().Unix()/30); err != nil {
		return errors.Wrap(err)
	}
	return nil
}

func (s *Service) ResetTotp(ctx context.Context, user domain.UUID, code string, kind userdomain.ResetKind) error {
	usr, err := s.usr.Security(ctx, user)
	if err != nil {
		return errors.Wrap(err)
	}
	if !usr.TotpEnabled {
		return errors.NotFound
	}
	if kind.IsRecovery() {
		if err = s.verifyRecoveryCode(ctx, user, code); err != nil {
			return errors.InvalidArguments
		}
		if err = s.usr.ResetTotp(ctx, user); err != nil {
			logger.Error("login", "failed to reset totp", logger.F("error", err))
			return errors.Wrap(err)
		}
	}
	return nil
}
