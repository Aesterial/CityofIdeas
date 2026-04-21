package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	projectpb "github.com/aesterial/cityideas/backend/internal/api/v1/projects/v1"
	projectsservice "github.com/aesterial/cityideas/backend/internal/app/project"
	"github.com/aesterial/cityideas/backend/internal/domain"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

type ProjectHandler struct {
	projectpb.UnimplementedProjectsServiceServer
	proj *projectsservice.Service
	auth *Authenticator
}

func NewProjectHandler(proj *projectsservice.Service, auth *Authenticator) *ProjectHandler {
	return &ProjectHandler{
		proj: proj,
		auth: auth,
	}
}

func (h *ProjectHandler) isRequestValid(req any) error {
	if h == nil || h.proj == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func (h *ProjectHandler) CreateProject(ctx context.Context, req *projectpb.CreateProjectRequest) (*projectpb.Project, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectCreate); err != nil {
		return nil, err
	}
	project, err := h.proj.CreateProject(ctx, *meta.UserID, req.GetTitle(), req.GetDescription(), req.GetCategory())
	if err != nil {
		return nil, err
	}
	return project.Protobuf(), nil
}

func (h *ProjectHandler) Project(ctx context.Context, req *typespb.RequestWithValue) (*projectpb.Project, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	_, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	project, err := h.proj.ProjectInfo(ctx, req.GetValue())
	if err != nil {
		return nil, err
	}
	return project.Protobuf(), nil
}

func (h *ProjectHandler) ProjectsList(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*projectpb.ProjectsListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	_, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	projects, err := h.proj.ProjectsList(ctx, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	var resp = &projectpb.ProjectsListResponse{}
	resp.SetList(projects.Protobuf())
	return resp, nil
}

func (h *ProjectHandler) DeleteProject(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	var rights bool
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectDeleteAll); err != nil {
		rights = false
	} else {
		rights = true
	}
	err = h.proj.DeleteProject(ctx, *meta.UserID, req.GetValue(), rights)
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *ProjectHandler) CreateMessage(ctx context.Context, req *projectpb.CreateMessageRequest) (*projectpb.Message, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, errors.Wrap(err)
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectMessageCreate); err != nil {
		return nil, err
	}
	projectID, err := domain.FromString(req.GetProject())
	if err != nil {
		return nil, errors.Wrap(err)
	}
	var parentID *domain.UUID
	if req.GetParent() != "" {
		var id domain.UUID
		id, err = domain.FromString(req.GetParent())
		if err != nil {
			return nil, errors.Wrap(err)
		}
		parentID = &id
	}
	message, err := h.proj.CreateMessage(ctx, *meta.UserID, projectID, parentID, req.GetContent())
	if err != nil {
		return nil, err
	}
	return message.Protobuf(), nil
}

func (h *ProjectHandler) MessagesList(ctx context.Context, req *typespb.RequestWithLimitAndOffsetAndValue) (*projectpb.MessagesListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	var showDeleted = false
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectMessageViewAll); err == nil {
		showDeleted = true
	}
	list, err := h.proj.MessagesList(ctx, req.GetValue(), req.GetLimit(), req.GetOffset(), showDeleted)
	if err != nil {
		return nil, err
	}
	var out = &projectpb.MessagesListResponse{}
	out.SetList(list.Protobuf())
	return out, nil
}

func (h *ProjectHandler) DeleteMessage(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	var skipAuthor = false
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectMessageDeleteAll); err == nil {
		skipAuthor = true
	}
	err = h.proj.DeleteMessage(ctx, *meta.UserID, req.GetValue(), skipAuthor)
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *ProjectHandler) SubmissionsList(ctx context.Context, req *typespb.RequestWithLimitAndOffset) (*projectpb.SubmissionsListResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectSubmissionList); err != nil {
		return nil, err
	}
	list, err := h.proj.SubmissionsList(ctx, req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, err
	}
	var out = &projectpb.SubmissionsListResponse{}
	out.SetList(list.Protobuf())
	return out, nil
}

func (h *ProjectHandler) Submission(ctx context.Context, req *typespb.RequestWithValue) (*projectpb.Submission, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectSubmissionInfo); err != nil {
		return nil, err
	}
	submission, err := h.proj.Submission(ctx, req.GetValue())
	if err != nil {
		return nil, err
	}
	return submission.Protobuf(), nil
}

func (h *ProjectHandler) AcceptSubmission(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectSubmissionReview); err != nil {
		return nil, err
	}
	err = h.proj.SubmissionReview(ctx, req.GetValue(), true, nil)
	if err != nil {
		logger.Error("projects", "failed to review submission", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return &emptypb.Empty{}, nil
}

func (h *ProjectHandler) DenySubmission(ctx context.Context, req *typespb.RequestWithValues) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	if len(req.GetValues()) < 2 {
		return nil, errors.InvalidArguments
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.auth.Permissions(ctx, *meta, permissionsdomain.ProjectSubmissionReview); err != nil {
		return nil, err
	}
	err = h.proj.SubmissionReview(ctx, req.GetValues()[0], false, new(req.GetValues()[1]))
	if err != nil {
		return nil, errors.Wrap(err)
	}
	return &emptypb.Empty{}, nil
}
