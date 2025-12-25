package routes

import (
	"ascendant/backend/internal/infra/http/handlers/login"
	userhandler "ascendant/backend/internal/infra/http/handlers/user"

	"github.com/gin-gonic/gin"
)

func RegisterUser(r *gin.Engine, userHandler *userhandler.Handler, group *gin.RouterGroup) {
	group.GET("/api/user", userHandler.GetSelf)
	group.GET("/api/user/:id", userHandler.GetByID)
	group.PATCH("/api/user/:id/name", userHandler.UpdateName)
}

func RegisterLogin(r *gin.Engine, loginHandler *login.Handler, group *gin.RouterGroup) {
	group.POST("/api/login/register", loginHandler.Register)
	group.POST("/api/login/authorization", loginHandler.Authorization)
}
