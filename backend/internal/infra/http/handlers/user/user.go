package user

import (
	userinfo "ascendant/backend/internal/app/info/user"
	modifier "ascendant/backend/internal/app/modifier/user"
	"ascendant/backend/internal/infra/http/send"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	info     *userinfo.Service
	modifier *modifier.Service
}

func New(infoService *userinfo.Service, modifierService *modifier.Service) *Handler {
	return &Handler{
		info:     infoService,
		modifier: modifierService,
	}
}

func (h *Handler) GetByID(req *gin.Context) {
	id, err := parseIDParam(req)
	if err != nil {
		send.Error(req, http.StatusBadRequest, "bad request")
		return
	}

	u, err := h.info.GetByID(req.Request.Context(), id)
	if err != nil {
		h.handleError(req, errors.New("failed to receive"))
		return
	}

	send.OK(req, u)
}

type updateNameRequest struct {
	Name string `json:"name"`
}

func (h *Handler) UpdateName(c *gin.Context) {
	id, err := parseIDParam(c)
	if err != nil {
		send.Error(c, http.StatusBadRequest, "bad request")
		return
	}

	var req updateNameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		send.Error(c, http.StatusBadRequest, "bad request")
		return
	}

	u, err := h.modifier.UpdateName(c.Request.Context(), id, req.Name)
	if err != nil {
		h.handleError(c, errors.New("failed to update name"))
		return
	}

	send.OK(c, u)
}

func (h *Handler) handleError(c *gin.Context, err error) {
	if err == nil {
		send.Error(c, http.StatusInternalServerError, "")
		return
	}

	send.Error(c, http.StatusInternalServerError, err.Error())
}

func statusForCode(code string) int {
	switch code {
	case "InvalidUserID", "InvalidName":
		return http.StatusBadRequest
	case "UserNotFound":
		return http.StatusNotFound
	default:
		return http.StatusBadRequest
	}
}

func parseIDParam(c *gin.Context) (uint, error) {
	raw := c.Param("id")
	id, err := strconv.ParseUint(raw, 10, 0)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}
