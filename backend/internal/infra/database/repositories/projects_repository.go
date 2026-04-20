package repositories

import (
	"context"
	"net/url"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	projectsdomain "github.com/aesterial/cityideas/backend/internal/domain/projects"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5/pgtype"
)

type ProjectsRepository struct {
	conn sqlc.Querier
}

func NewProjectsRepository(conn sqlc.Querier) *ProjectsRepository {
	return &ProjectsRepository{conn: conn}
}

var _ projectsdomain.Repository = (*ProjectsRepository)(nil)

func (*ProjectsRepository) parseProject(project sqlc.Project) *projectsdomain.Project {
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
		Likes:       project.Likes,
		At:          project.At.Time,
		Updated:     project.Updated.Time,
		Cancelled:   cancelled,
	}
}

func (*ProjectsRepository) parseSubmission(submission sqlc.Submission) *projectsdomain.Submission {
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

func (*ProjectsRepository) parseMessage(message sqlc.ProjectMessage) *projectsdomain.Message {
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

func (p *ProjectsRepository) parseMessages(messages []sqlc.ProjectMessage) projectsdomain.Messages {
	if messages == nil {
		return nil
	}
	var out = make(projectsdomain.Messages, len(messages))
	for i, message := range messages {
		out[i] = p.parseMessage(message)
	}
	return out
}

func (p *ProjectsRepository) parseProjects(projects []sqlc.Project) projectsdomain.Projects {
	if projects == nil {
		return nil
	}
	var out = make(projectsdomain.Projects, len(projects))
	for i, project := range projects {
		out[i] = p.parseProject(project)
	}
	return out
}

func (p *ProjectsRepository) parseSubmissions(submissions []sqlc.Submission) projectsdomain.Submissions {
	if submissions == nil {
		return nil
	}
	var out = make(projectsdomain.Submissions, len(submissions))
	for i, submission := range submissions {
		out[i] = p.parseSubmission(submission)
	}
	return out
}

func (p *ProjectsRepository) Projects(ctx context.Context, limit int32, offset int32) (projectsdomain.Projects, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := p.conn.ProjectsList(ctx, sqlc.ProjectsListParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return p.parseProjects(list), nil
}

func (p *ProjectsRepository) Submissions(ctx context.Context, limit int32, offset int32) (projectsdomain.Submissions, error) {
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

func (p *ProjectsRepository) Messages(ctx context.Context, project domain.UUID, limit int32, offset int32) (projectsdomain.Messages, error) {
	if limit <= 0 {
		limit = 10
	}
	list, err := p.conn.MessagesList(ctx, sqlc.MessagesListParams{
		Linked: project.ToPG(),
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return p.parseMessages(list), nil
}

func (p *ProjectsRepository) Project(ctx context.Context, id domain.UUID) (*projectsdomain.Project, error) {
	info, err := p.conn.ProjectInfo(ctx, id.ToPG())
	if err != nil {
		return nil, err
	}
	return p.parseProject(info), nil
}

func (p *ProjectsRepository) CreateProject(ctx context.Context, author domain.UUID, title string, description string, category string) (*projectsdomain.Project, error) {
	info, err := p.conn.CreateProject(ctx, sqlc.CreateProjectParams{
		Author:      author.ToPG(),
		Title:       title,
		Description: description,
	})
	if err != nil {
		return nil, err
	}
	return p.parseProject(info), nil
}

func (p *ProjectsRepository) CreateMessage(ctx context.Context, author domain.UUID, project domain.UUID, parent *domain.UUID, content string) (*projectsdomain.Message, error) {
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

func (p *ProjectsRepository) SetStatus(ctx context.Context, project domain.UUID, status projectsdomain.Status, value ...string) error {
	var link = pgtype.Text{Valid: false}
	if status == projectsdomain.StatusImplementing {
		if len(value) > 0 {
			link = pgtype.Text{String: value[0], Valid: true}
		}
	}
	err := p.conn.SetProjectStatus(ctx, sqlc.SetProjectStatusParams{
		Status:   sqlc.ProjectsStatus(status.String()),
		ImplLink: link,
		ID:       project.ToPG(),
	})
	return err
}

func (p *ProjectsRepository) UpdateDescription(ctx context.Context, project domain.UUID, desc string) error {
	if desc == "" {
		return errors.InvalidArguments
	}
	err := p.conn.UpdateProjectDescription(ctx, sqlc.UpdateProjectDescriptionParams{
		Description: desc,
		ID:          project.ToPG(),
	})
	return err
}

func (p *ProjectsRepository) DeleteMessage(ctx context.Context, message domain.UUID) error {
	return p.conn.DeleteMessage(ctx, message.ToPG())
}
