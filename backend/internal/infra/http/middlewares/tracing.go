package middlewares

import (
	"ascendant/backend/internal/infra/logger"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func Tracing() gin.HandlerFunc {
	return func(req *gin.Context) {
		at := time.Now()
		id, err := uuid.NewRandom()
		if err != nil {
			logger.Error("Failed to generate traceID. "+err.Error(), "middleware.tracing", logger.EventActor{Type: logger.System, ID: 0}, logger.Failure)
			req.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		logger.Info("Received new request: "+req.ClientIP(), "middleware.tracing", logger.EventActor{Type: logger.System, ID: 0}, logger.Failure, id.String())
		req.Next()
		end := time.Now()
		duration := end.Sub(at)
		logger.Info(fmt.Sprintf("Response to %s: code %d, method %s, elapsed %s", req.ClientIP(), req.Writer.Status(), req.Request.Method, duration), "middleware.tracing", logger.EventActor{Type: logger.System, ID: 0}, logger.Failure, id.String())
	}
}
