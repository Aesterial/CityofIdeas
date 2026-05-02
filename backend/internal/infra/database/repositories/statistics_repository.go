package repositories

import (
	"context"

	statisticsdomain "github.com/aesterial/cityideas/backend/internal/domain/statistics"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type StatisticsRepository struct {
	conn sqlc.Querier
}

func NewStatisticsRepository(conn sqlc.Querier) *StatisticsRepository {
	return &StatisticsRepository{conn: conn}
}

var _ statisticsdomain.Repository = (*StatisticsRepository)(nil)

func (s *StatisticsRepository) Global(ctx context.Context) (*statisticsdomain.Global, error) {
	out, err := s.conn.GlobalStats(ctx)
	if err != nil {
		return nil, err
	}
	return &statisticsdomain.Global{
		Ideas:       out.IdeasCount,
		Implemented: out.ImplementedCount,
		Votes:       out.LikesCount,
		City:        out.MostPopularCity,
		Hours:       out.AvgTicketsResponse,
	}, nil
}

func statisticCityParam(city *string) pgtype.Text {
	if city == nil || *city == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *city, Valid: true}
}

func statisticGraph[T any](rows []T, values func(T) (pgtype.Timestamptz, int64)) statisticsdomain.Graph {
	graph := make(statisticsdomain.Graph, len(rows))
	for i, row := range rows {
		at, value := values(row)
		graph[i] = &statisticsdomain.Point{
			At:    at.Time,
			Value: int32(value),
		}
	}
	return graph
}

func (s *StatisticsRepository) Votes(ctx context.Context, req statisticsdomain.Request) (statisticsdomain.Graph, error) {
	rows, err := s.conn.ProjectVotesGraph(ctx, sqlc.ProjectVotesGraphParams{
		Separator: req.Separator.String(),
		City:      statisticCityParam(req.City),
	})
	if err != nil {
		return nil, err
	}
	return statisticGraph(rows, func(row sqlc.ProjectVotesGraphRow) (pgtype.Timestamptz, int64) {
		return row.At, row.Value
	}), nil
}

func (s *StatisticsRepository) Creation(ctx context.Context, req statisticsdomain.Request) (statisticsdomain.Graph, error) {
	rows, err := s.conn.ProjectCreationGraph(ctx, sqlc.ProjectCreationGraphParams{
		Separator: req.Separator.String(),
		City:      statisticCityParam(req.City),
	})
	if err != nil {
		return nil, err
	}
	return statisticGraph(rows, func(row sqlc.ProjectCreationGraphRow) (pgtype.Timestamptz, int64) {
		return row.At, row.Value
	}), nil
}

func (s *StatisticsRepository) Questions(ctx context.Context, req statisticsdomain.Request) (statisticsdomain.Graph, error) {
	rows, err := s.conn.QuestionsGraph(ctx, req.Separator.String())
	if err != nil {
		return nil, err
	}
	return statisticGraph(rows, func(row sqlc.QuestionsGraphRow) (pgtype.Timestamptz, int64) {
		return row.At, row.Value
	}), nil
}

func (s *StatisticsRepository) Discussion(ctx context.Context, req statisticsdomain.Request) (statisticsdomain.Graph, error) {
	rows, err := s.conn.ProjectDiscussionGraph(ctx, sqlc.ProjectDiscussionGraphParams{
		Separator: req.Separator.String(),
		City:      statisticCityParam(req.City),
	})
	if err != nil {
		return nil, err
	}
	return statisticGraph(rows, func(row sqlc.ProjectDiscussionGraphRow) (pgtype.Timestamptz, int64) {
		return row.At, row.Value
	}), nil
}
