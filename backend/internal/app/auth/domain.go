package login

import (
	"ascendant/backend/internal/app/info/sessions"
	"ascendant/backend/internal/app/info/user"
	domain "ascendant/backend/internal/domain/login"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo     domain.Repository
	Sessions *sessions.Service
	User     *user.Service
}

func New(repo domain.Repository, sess *sessions.Service, usr *user.Service) *Service {
	return &Service{repo: repo, Sessions: sess, User: usr}
}

func GeneratePassword(v string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(v), bcrypt.DefaultCost)
	return string(hash), err
}
