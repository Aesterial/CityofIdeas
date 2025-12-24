package login

import (
	login "ascendant/backend/internal/app/auth"
	logindomain "ascendant/backend/internal/domain/login"
	"ascendant/backend/internal/infra/http/handlers"
	"ascendant/backend/internal/infra/http/send"
	"ascendant/backend/internal/infra/logger"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *login.Service
}

func New(service *login.Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) issueAndStoreSession(req *gin.Context, uid uint) error {
	logger.Debug("getting user session live time", "handler.login.issueAndStoreSession")
	live, err := h.service.User.GetUserSessionLiveTime(req.Request.Context(), uid)
	if err != nil {
		logger.Debug("Error on gathering session live time", "handler.login.issueAndStoreSession")
		return err
	}

	ttl := live.Duration
	if ttl <= 0 {
		ttl = 7 * 24 * time.Hour
	}

	sessionID := uuid.New()
	logger.Debug("generating cookie", "handler.login.issueAndStoreSession")
	_, err = handlers.IssueSessionCookie(req, sessionID.String(), ttl)
	if err != nil {
		logger.Debug("Error on cookie", "handler.login.issueAndStoreSession")
		return err
	}

	return h.service.Sessions.AddSession(
		req.Request.Context(),
		sessionID,
		userAgentHash(req),
		time.Now().Add(ttl),
		uid,
	)
}

func userAgentHash(req *gin.Context) string {
	data := req.GetHeader("User-Agent")
	if data == "" {
		data = req.ClientIP()
	}
	sum := sha256.Sum256([]byte(data))
	return hex.EncodeToString(sum[:])
}

func (h *Handler) Register(req *gin.Context) {
	var require logindomain.RegisterRequire
	if err := req.ShouldBindJSON(&require); err != nil {
		send.Error(req, http.StatusBadRequest, "bad request")
		return
	}

	uid, err := h.service.Register(req.Request.Context(), require)
	if err != nil {
		send.Error(req, http.StatusInternalServerError, "failed to register")
		return
	}

	if err = h.issueAndStoreSession(req, *uid); err != nil {
		send.Error(req, http.StatusInternalServerError, "failed to issue session")
		return
	}

	send.OK(req, gin.H{"data": "success"})
}

func (h *Handler) Authorization(req *gin.Context) {
	var require logindomain.AuthorizationRequire
	if err := req.ShouldBindJSON(&require); err != nil {
		send.Error(req, http.StatusBadRequest, "bad request")
		return
	}

	uid, err := h.service.Authorization(req.Request.Context(), require)
	if err != nil {
		send.Error(req, http.StatusInternalServerError, "failed to authenticate")
		return
	}

	if err = h.issueAndStoreSession(req, *uid); err != nil {
		send.Error(req, http.StatusInternalServerError, "failed to issue session")
		return
	}

	send.OK(req, gin.H{"data": "success"})
}
