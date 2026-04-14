package sessionsservice

import sessionsdomain "github.com/aesterial/cityideas/backend/internal/domain/sessions"

type Service struct {
	ses sessionsdomain.Repository
}

func NewService(ses sessionsdomain.Repository) *Service {
	return &Service{ses: ses}
}
