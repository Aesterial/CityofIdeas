package repositories

import (
	"context"
	"net/url"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	projectsdomain "github.com/aesterial/cityideas/backend/internal/domain/projects"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/aesterial/cityideas/backend/internal/shared/safe"
	"github.com/jackc/pgx/v5/pgtype"
)

type ProjectRepository struct {
	conn sqlc.Querier
}

func NewProjectsRepository(conn sqlc.Querier) *ProjectRepository {
	return &ProjectRepository{conn: conn}
}

var _ projectsdomain.Repository = (*ProjectRepository)(nil)

func (p *ProjectRepository) parseProject(project sqlc.Project) *projectsdomain.Project {
	logger.Info("projects", "trying to parse project")
	return p.parseProjectRow(sqlc.ProjectInfoRow{
		ID:          project.ID,
		Author:      project.Author,
		Title:       project.Title,
		Description: project.Description,
		Category:    project.Category,
		Status:      project.Status,
		ImplLink:    project.ImplLink,
		At:          project.At,
		Updated:     project.Updated,
		Deleted:     project.Deleted,
	})
}

func (*ProjectRepository) parseProjectRow(project sqlc.ProjectInfoRow) *projectsdomain.Project {
	logger.Info("projects", "trying to parse project row")
	var link *url.URL
	if project.ImplLink.Valid {
		var err error
		link, err = url.Parse(project.ImplLink.String)
		if err != nil {
			link = nil
		}
	}
	var cancelled *time.Time = nil
	if project.Deleted.Valid {
		cancelled = &project.Deleted.Time
	}
	return &projectsdomain.Project{
		ID:          domain.UUID{UUID: project.ID.Bytes},
		Author:      domain.UUID{UUID: project.Author.Bytes},
		Title:       project.Title,
		Description: project.Description,
		Category:    project.Category,
		Status:      projectsdomain.ParseStatus(string(project.Status)),
		Link:        link,
		Likes:       project.LikesCount,
		At:          project.At.Time,
		Updated:     project.Updated.Time,
		Cancelled:   cancelled,
	}
}

func (*ProjectRepository) parseLocation(location sqlc.ProjectLocation) *projectsdomain.ProjectLocation {
	return &projectsdomain.ProjectLocation{
		City:      location.City,
		Latitude:  location.Lat,
		Longitude: location.Lot,
	}
}

func (*ProjectRepository) parseSubmission(submission sqlc.Submission) *projectsdomain.Submission {
	var reason *string = nil
	if submission.Reason.Valid {
		reason = &submission.Reason.String
	}
	return &projectsdomain.Submission{
		ID:       domain.UUID{UUID: submission.ID.Bytes},
		Project:  domain.UUID{UUID: submission.Linked.Bytes},
		Approved: submission.Approved,
		Reason:   reason,
	}
}

func (*ProjectRepository) parseMessage(message sqlc.ProjectMessage) *projectsdomain.Message {
	var parent *domain.UUID = nil
	if message.Parent.Valid {
		parent = &domain.UUID{UUID: message.Parent.Bytes}
	}
	var deleted *time.Time = nil
	if message.Deleted.Valid {
		deleted = &message.Deleted.Time
	}
	return &projectsdomain.Message{
		ID:      domain.UUID{UUID: message.ID.Bytes},
		Project: domain.UUID{UUID: message.Linked.Bytes},
		Author:  domain.UUID{UUID: message.Author.Bytes},
		Parent:  parent,
		Content: message.Content,
		At:      message.At.Time,
		Deleted: deleted,
	}
}

func (p *ProjectRepository) parseMessages(messages []sqlc.ProjectMessage) projectsdomain.Messages {
	if messages == nil {
		return nil
	}
	var out = make(projectsdomain.Messages, len(messages))
	for i, message := range messages {
		out[i] = p.parseMessage(message)
	}
	return out
}

func (p *ProjectRepository) parseProjects(projects []sqlc.ProjectsListRow) projectsdomain.Projects {
	if projects == nil {
		return nil
	}
	var out = make(projectsdomain.Projects, len(projects))
	for i, project := range projects {
		var link *url.URL
		var err error
		if project.ImplLink.Valid {
			link, err = url.Parse(project.ImplLink.String)
			if err != nil {
				continue
			}
		}
		var cancelled *time.Time
		if project.Deleted.Valid {
			cancelled = &project.Deleted.Time
		}
		out[i] = &projectsdomain.Project{
			ID:          domain.FromPG(project.ID),
			Author:      domain.FromPG(project.Author),
			Title:       project.Title,
			Description: project.Description,
			Category:    project.Category,
			Status:      projectsdomain.ParseStatus(string(project.Status)),
			Link:        link,
			Likes:       project.LikesCount,
			At:          project.At.Time,
			Updated:     project.Updated.Time,
			Cancelled:   cancelled,
		}
	}
	return out
}

func (p *ProjectRepository) parseSubmissions(submissions []sqlc.Submission) projectsdomain.Submissions {
	if submissions == nil {
		return nil
	}
	var out = make(projectsdomain.Submissions, len(submissions))
	for i, submission := range submissions {
		out[i] = p.parseSubmission(submission)
	}
	return out
}

func (p *ProjectRepository) Projects(ctx context.Context, limit int32, offset int32) (projectsdomain.Projects, error) {
	if limit <= 0 {
		limit = 10
	}
	logger.Info("projects", "trying to get list of projects")
	listFn := func(context.Context, ...any) (projectsdomain.Projects, error) {
		list, err := p.conn.ProjectsList(ctx, sqlc.ProjectsListParams{
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return nil, err
		}
		return p.parseProjects(list), nil
	}
	locFn := func(_ context.Context, proj *projectsdomain.Project) (*projectsdomain.Project, error) {
		if proj == nil {
			return nil, errors.InvalidArguments
		}
		loc, err := p.conn.ProjectLocationInfo(ctx, proj.ID.ToPG())
		if err != nil {
			return nil, err
		}
		proj.Location = p.parseLocation(loc)
		return proj, nil
	}
	logger.Info("projects", "requesting list of projects")
	list, err := safe.Hydration[projectsdomain.Projects, *projectsdomain.Project](
		5*time.Second, listFn,
		[]func(context.Context, *projectsdomain.Project) (*projectsdomain.Project, error){
			locFn,
		},
		1,
	)
	logger.Info("projects", "count of projects", logger.F("count", len(list)))
	if err != nil {
		return nil, err
	}
	return list, nil
}

func (p *ProjectRepository) Submissions(ctx context.Context, limit int32, offset int32) (projectsdomain.Submissions, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := p.conn.SubmissionsList(ctx, sqlc.SubmissionsListParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return p.parseSubmissions(list), nil
}

func (p *ProjectRepository) Submission(ctx context.Context, id domain.UUID) (*projectsdomain.Submission, error) {
	info, err := p.conn.SubmissionInfo(ctx, id.ToPG())
	if err != nil {
		return nil, err
	}
	return p.parseSubmission(info), nil
}

func (p *ProjectRepository) Messages(ctx context.Context, project domain.UUID, limit int32, offset int32, showDeleted bool) (projectsdomain.Messages, error) {
	if limit <= 0 {
		limit = 10
	}
	var list []sqlc.ProjectMessage
	var err error
	if showDeleted {
		list, err = p.conn.MessagesListWithDeleted(ctx, sqlc.MessagesListWithDeletedParams{
			Linked: project.ToPG(),
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return nil, err
		}
	} else {
		list, err = p.conn.MessagesList(ctx, sqlc.MessagesListParams{
			Linked: project.ToPG(),
			Limit:  limit,
			Offset: offset,
		})
		if err != nil {
			return nil, err
		}
	}
	return p.parseMessages(list), nil
}

func (p *ProjectRepository) Project(ctx context.Context, id domain.UUID) (*projectsdomain.Project, error) {
	info, err := p.conn.ProjectInfo(ctx, id.ToPG())
	if err != nil {
		return nil, err
	}
	return p.parseProjectRow(info), nil
}

func (p *ProjectRepository) CreateProject(ctx context.Context, author domain.UUID, title string, description string, category string, city string, latitude float64, longitude float64) (*projectsdomain.Project, error) {
	info, err := p.conn.CreateProject(ctx, sqlc.CreateProjectParams{
		Author:      author.ToPG(),
		Title:       title,
		Description: description,
		Category:    category,
	})
	if err != nil {
		return nil, err
	}
	_, err = p.conn.CreateSubmission(ctx, info.ID)
	if err != nil {
		return nil, err
	}
	location, err := p.conn.CreateProjectLocation(ctx, sqlc.CreateProjectLocationParams{
		ID:   info.ID,
		City: city,
		Lat:  latitude,
		Lot:  longitude,
	})
	proj := p.parseProject(info)
	proj.Location = p.parseLocation(location)
	return proj, nil
}

func (p *ProjectRepository) CreateMessage(ctx context.Context, author domain.UUID, project domain.UUID, parent *domain.UUID, content string) (*projectsdomain.Message, error) {
	var pr = pgtype.UUID{Valid: false}
	if parent != nil {
		pr = pgtype.UUID{Bytes: parent.UUID, Valid: true}
	}
	info, err := p.conn.CreateMessage(ctx, sqlc.CreateMessageParams{
		Linked:  project.ToPG(),
		Author:  author.ToPG(),
		Parent:  pr,
		Content: content,
	})
	if err != nil {
		return nil, err
	}
	return p.parseMessage(info), nil
}

func (p *ProjectRepository) SetStatus(ctx context.Context, project domain.UUID, status projectsdomain.Status, value ...string) error {
	var link = pgtype.Text{Valid: false}
	if status == projectsdomain.StatusImplementing {
		if len(value) > 0 {
			link = pgtype.Text{String: value[0], Valid: true}
		}
	}
	logger.Info("projects", "setting status", logger.F("project", project.String()), logger.F("status", status.String()))
	err := p.conn.SetProjectStatus(ctx, sqlc.SetProjectStatusParams{
		Status:   sqlc.ProjectsStatus(status.String()),
		ImplLink: link,
		ID:       project.ToPG(),
	})
	return err
}

func (p *ProjectRepository) UpdateDescription(ctx context.Context, project domain.UUID, desc string) error {
	if desc == "" {
		return errors.InvalidArguments
	}
	err := p.conn.UpdateProjectDescription(ctx, sqlc.UpdateProjectDescriptionParams{
		Description: desc,
		ID:          project.ToPG(),
	})
	return err
}

func (p *ProjectRepository) DeleteMessage(ctx context.Context, message domain.UUID) error {
	return p.conn.DeleteMessage(ctx, message.ToPG())
}

func (p *ProjectRepository) DeleteProject(ctx context.Context, project domain.UUID) error {
	return p.conn.DeleteProject(ctx, project.ToPG())
}

func (p *ProjectRepository) ProjectAuthor(ctx context.Context, project domain.UUID) (*domain.UUID, error) {
	id, err := p.conn.ProjectAuthor(ctx, project.ToPG())
	if err != nil {
		return nil, err
	}
	return new(domain.FromPG(id)), nil
}

func (p *ProjectRepository) MessageAuthor(ctx context.Context, message domain.UUID) (*domain.UUID, error) {
	id, err := p.conn.MessageAuthor(ctx, message.ToPG())
	if err != nil {
		return nil, err
	}
	return new(domain.FromPG(id)), nil
}

func (p *ProjectRepository) isReviewed(ctx context.Context, project domain.UUID) error {
	reviewed, err := p.conn.IsSubmissionReviewed(ctx, project.ToPG())
	if err != nil {
		return err
	}
	if reviewed {
		return errors.Conflict
	}
	return nil
}

func (p *ProjectRepository) SubmissionReview(ctx context.Context, project domain.UUID, conclusion bool, reason *string) error {
	if err := p.isReviewed(ctx, project); err != nil {
		return err
	}
	if conclusion {
		err := p.conn.AcceptSubmission(ctx, project.ToPG())
		if err != nil {
			return err
		}
		err = p.SetStatus(ctx, project, projectsdomain.StatusListing)
		if err != nil {
			return err
		}
		return nil
	}
	if reason == nil {
		return errors.InvalidArguments
	}
	err := p.conn.DenySubmission(ctx, sqlc.DenySubmissionParams{
		Reason: pgtype.Text{String: *reason, Valid: true},
		Linked: project.ToPG(),
	})
	if err != nil {
		return err
	}
	err = p.SetStatus(ctx, project, projectsdomain.StatusCancelled)
	if err != nil {
		return err
	}
	return nil
}
