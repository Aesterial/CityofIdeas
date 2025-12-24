package middlewares

import (
	"ascendant/backend/internal/domain/sessions"

	"github.com/gin-gonic/gin"
)

type MiddleService struct {
	repo sessions.Repository
}

func New(repo sessions.Repository) *MiddleService {
	return &MiddleService{repo}
}

func (s *MiddleService) Register(serv *gin.Engine) *gin.RouterGroup {
	serv.Use(s.Tracing())
	priv := serv.Group("")
	priv.Use(s.Authorize())
	return priv
}
