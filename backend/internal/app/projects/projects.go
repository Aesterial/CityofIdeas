package projects

import (
	"ascendant/backend/internal/domain/projects"
	"context"
	"errors"
	"strings"
)

type Service struct {
	repo projects.Repository
}

func New(repo projects.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, project projects.Project) error {
	if s == nil || s.repo == nil {
		return errors.New("projects service not configured")
	}
	if project.Author == 0 {
		return errors.New("author is empty")
	}

	title := strings.TrimSpace(project.Info.Title)
	if title == "" {
		return errors.New("title is empty")
	}
	project.Info.Title = title

	project.Info.Description = strings.TrimSpace(project.Info.Description)
	project.Info.Category = strings.TrimSpace(project.Info.Category)
	if project.Info.Category == "" {
		return errors.New("category is empty")
	}

	project.Info.Location.City = strings.TrimSpace(project.Info.Location.City)
	project.Info.Location.Street = strings.TrimSpace(project.Info.Location.Street)
	project.Info.Location.House = strings.TrimSpace(project.Info.Location.House)

	return s.repo.CreateProject(ctx, project)
}
