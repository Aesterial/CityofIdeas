package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	projectpb "github.com/aesterial/cityideas/backend/internal/api/v1/projects/v1"
	projectsservice "github.com/aesterial/cityideas/backend/internal/app/project"
	permissionsdomain "github.com/aesterial/cityideas/backend/internal/domain/permissions"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/protobuf/types/known/emptypb"
)

func (h *ProjectHandler) isRequestValid(req any) error {
	if h == nil || h.proj == nil || h.auth == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

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
