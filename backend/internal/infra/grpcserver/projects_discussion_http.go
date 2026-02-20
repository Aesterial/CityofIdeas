package grpcserver

import (
	"Aesterial/backend/internal/domain/permissions"
	projectsdomain "Aesterial/backend/internal/domain/projects"
	userpb "Aesterial/backend/internal/gen/user/v1"
	apperrors "Aesterial/backend/internal/shared/errors"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

type projectDiscussionCreateRequest struct {
	Content       string `json:"content"`
	Message       string `json:"message"`
	Comment       string `json:"comment"`
	Text          string `json:"text"`
	ReplyTo       *int64 `json:"replyTo"`
	ReplyToID     *int64 `json:"replyToId"`
	ReplyToLegacy *int64 `json:"reply_to"`
	ParentID      *int64 `json:"parentId"`
	ParentLegacy  *int64 `json:"parent_id"`
}

func (r projectDiscussionCreateRequest) contentValue() string {
	for _, value := range []string{r.Content, r.Message, r.Comment, r.Text} {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func (r projectDiscussionCreateRequest) replyToMessageID() *int64 {
	candidates := []*int64{
		r.ReplyToID,
		r.ReplyTo,
		r.ReplyToLegacy,
		r.ParentID,
		r.ParentLegacy,
	}
	for _, candidate := range candidates {
		if candidate == nil {
			continue
		}
		if *candidate <= 0 {
			return candidate
		}
		id := *candidate
		return &id
	}
	return nil
}

type projectDiscussionMessageResponse struct {
	ID        string             `json:"id"`
	Message   string             `json:"message"`
	Content   string             `json:"content"`
	Author    *userpb.UserPublic `json:"author,omitempty"`
	At        *time.Time         `json:"at,omitempty"`
	ReplyTo   *string            `json:"replyTo,omitempty"`
	ReplyToID *string            `json:"replyToId,omitempty"`
	ParentID  *string            `json:"parentId,omitempty"`
}

type projectDiscussionListResponse struct {
	List    []projectDiscussionMessageResponse `json:"list"`
	Tracing string                             `json:"tracing"`
}

type projectDiscussionTracingResponse struct {
	Tracing string `json:"tracing"`
}

func (s *ProjectService) ServeDiscussionHTTP(w http.ResponseWriter, r *http.Request) bool {
	if s == nil || r == nil {
		return false
	}
	parts := splitPath(r.URL.Path)
	if len(parts) < 5 || parts[0] != "api" || parts[1] != "projects" {
		return false
	}
	if parts[3] != "discussion" && parts[3] != "comments" && parts[3] != "messages" {
		return false
	}

	switch {
	case len(parts) == 5 && parts[4] == "list":
		if r.Method != http.MethodGet {
			writeDiscussionMethodNotAllowed(w, http.MethodGet)
			return true
		}
		s.handleProjectDiscussionList(w, r, parts[2])
		return true
	case len(parts) == 5 && (parts[4] == "create" || parts[4] == "send"):
		if r.Method != http.MethodPost {
			writeDiscussionMethodNotAllowed(w, http.MethodPost)
			return true
		}
		s.handleProjectDiscussionCreate(w, r, parts[2])
		return true
	default:
		return false
	}
}

func (s *ProjectService) handleProjectDiscussionList(w http.ResponseWriter, r *http.Request, rawProjectID string) {
	id, err := parseProjectDiscussionProjectID(rawProjectID)
	if err != nil {
		writeDiscussionError(w, r.Context(), apperrors.InvalidArguments.AddErrDetails("id is not correct"))
		return
	}

	ctx := withIncomingHTTPMetadata(r.Context(), r)
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		writeDiscussionError(w, ctx, err)
		return
	}
	if requestor == nil {
		writeDiscussionError(w, ctx, apperrors.Unauthenticated)
		return
	}
	if err := s.ensureProjectDiscussionAccess(ctx, id, requestor.UID, false); err != nil {
		writeDiscussionError(w, ctx, err)
		return
	}

	list, err := s.projects.Messages(ctx, id)
	if err != nil {
		writeDiscussionError(w, ctx, err)
		return
	}
	authors := s.hydrateProjectDiscussionAuthors(ctx, list)
	payload := make([]projectDiscussionMessageResponse, 0, len(list))
	for _, message := range list {
		if message == nil {
			continue
		}
		item := projectDiscussionMessageResponse{
			ID:      strconv.FormatInt(message.ID, 10),
			Message: message.Content,
			Content: message.Content,
			Author:  authors[message.AuthorUID],
		}
		if !message.At.IsZero() {
			at := message.At
			item.At = &at
		}
		if message.ReplyToID != nil {
			replyID := strconv.FormatInt(*message.ReplyToID, 10)
			item.ReplyTo = &replyID
			item.ReplyToID = &replyID
			item.ParentID = &replyID
		}
		payload = append(payload, item)
	}

	writeDiscussionJSON(w, http.StatusOK, projectDiscussionListResponse{
		List:    payload,
		Tracing: TraceIDOrNew(ctx),
	})
}

func (s *ProjectService) handleProjectDiscussionCreate(w http.ResponseWriter, r *http.Request, rawProjectID string) {
	id, req, err := parseProjectDiscussionCreateRequest(r, rawProjectID)
	if err != nil {
		writeDiscussionError(w, r.Context(), err)
		return
	}
	content := req.contentValue()
	if content == "" {
		writeDiscussionError(w, r.Context(), apperrors.RequiredDataMissing.AddErrDetails("content is required"))
		return
	}

	ctx := withIncomingHTTPMetadata(r.Context(), r)
	requestor, err := s.auth.RequireUser(ctx)
	if err != nil {
		writeDiscussionError(w, ctx, err)
		return
	}
	if requestor == nil {
		writeDiscussionError(w, ctx, apperrors.Unauthenticated)
		return
	}
	if err := s.ensureProjectDiscussionAccess(ctx, id, requestor.UID, true); err != nil {
		writeDiscussionError(w, ctx, err)
		return
	}

	replyToID := req.replyToMessageID()
	if replyToID != nil && *replyToID <= 0 {
		writeDiscussionError(w, ctx, apperrors.InvalidArguments.AddErrDetails("reply message id is incorrect"))
		return
	}
	if err := s.projects.CreateMessage(ctx, id, requestor.UID, content, replyToID); err != nil {
		writeDiscussionError(w, ctx, err)
		return
	}

	writeDiscussionJSON(w, http.StatusOK, projectDiscussionTracingResponse{Tracing: TraceIDOrNew(ctx)})
}

func (s *ProjectService) ensureProjectDiscussionAccess(ctx context.Context, projectID uuid.UUID, uid uint, forWrite bool) error {
	if err := s.auth.RequirePermissions(ctx, uid, permissions.ProjectsView); err != nil {
		return err
	}
	if forWrite {
		if err := s.auth.RequirePermissions(ctx, uid, permissions.ProjectsVote); err != nil &&
			s.auth.RequirePermissions(ctx, uid, permissions.ProjectsAll) != nil {
			return err
		}
	}

	project, err := s.projects.GetProject(ctx, projectID)
	if err != nil {
		return err
	}
	if project == nil || project.Author == nil {
		return apperrors.RecordNotFound
	}

	if project.Status.IsPublic() || project.Author.UID == uid {
		return nil
	}
	if s.auth.RequirePermissions(ctx, uid, permissions.ProjectsAll) == nil {
		return nil
	}
	if s.auth.RequirePermissions(ctx, uid, permissions.ProjectsUpdateAny) == nil {
		return nil
	}
	return apperrors.AccessDenied
}

func (s *ProjectService) hydrateProjectDiscussionAuthors(ctx context.Context, list projectsdomain.ProjectMessages) map[uint]*userpb.UserPublic {
	authors := make(map[uint]*userpb.UserPublic, len(list))
	if len(list) == 0 {
		return authors
	}
	for _, message := range list {
		if message == nil || message.AuthorUID == 0 {
			continue
		}
		if _, ok := authors[message.AuthorUID]; ok {
			continue
		}

		uid := message.AuthorUID
		public := &userpb.UserPublic{UserID: uint32(uid)}
		if s != nil && s.auth != nil && s.auth.User != nil {
			author, err := s.auth.User.GetByID(ctx, uid)
			if err == nil && author != nil {
				public = author.ToPublic()
			}
		}
		applyPresignedUserAvatarURL(ctx, s.storage, public)
		authors[uid] = public
	}
	return authors
}

func parseProjectDiscussionCreateRequest(r *http.Request, rawProjectID string) (uuid.UUID, projectDiscussionCreateRequest, error) {
	var req projectDiscussionCreateRequest
	projectID, err := parseProjectDiscussionProjectID(rawProjectID)
	if err != nil {
		return uuid.UUID{}, req, apperrors.InvalidArguments.AddErrDetails("id is not correct")
	}
	decoded, err := decodeProjectDiscussionBody(r)
	if err != nil {
		return uuid.UUID{}, req, apperrors.InvalidArguments.AddErrDetails("request body is invalid")
	}
	return projectID, decoded, nil
}

func parseProjectDiscussionProjectID(raw string) (uuid.UUID, error) {
	decoded, err := url.PathUnescape(strings.TrimSpace(raw))
	if err != nil {
		return uuid.UUID{}, err
	}
	return uuid.Parse(decoded)
}

func decodeProjectDiscussionBody(r *http.Request) (projectDiscussionCreateRequest, error) {
	var req projectDiscussionCreateRequest
	if r == nil || r.Body == nil {
		return req, nil
	}
	defer func() {
		_ = r.Body.Close()
	}()
	data := io.LimitReader(r.Body, 1<<20)
	decoder := json.NewDecoder(data)
	if err := decoder.Decode(&req); err != nil {
		if errors.Is(err, io.EOF) {
			return projectDiscussionCreateRequest{}, nil
		}
		return projectDiscussionCreateRequest{}, err
	}
	return req, nil
}
