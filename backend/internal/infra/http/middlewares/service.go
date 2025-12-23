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

func (s *MiddleService) Register(serv *gin.Engine, group *gin.RouterGroup) {
	serv.Use(s.Tracing())
	group.Use(s.Authorize())
}
