package userservice

import userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"

type Service struct {
	usr userdomain.Repository
}

func NewService(usr userdomain.Repository) *Service {
	return &Service{usr: usr}
}
