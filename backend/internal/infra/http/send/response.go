package send

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error any `json:"error"`
}

func OK(ctx *gin.Context, data any) {
	ctx.JSON(http.StatusOK, data)
}

func Error(ctx *gin.Context, status int, err string) {
	if err == "" {
		ctx.JSON(status, ErrorResponse{Error: nil})
		return
	}

	ctx.JSON(status, ErrorResponse{Error: gin.H{"error": err}})
}
