package repositories

import (
	"context"

	"github.com/aesterial/cityideas/backend/internal/domain"
	citydomain "github.com/aesterial/cityideas/backend/internal/domain/city"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
)

type CityRepository struct {
	conn sqlc.Querier
}

func NewCityRepository(conn sqlc.Querier) *CityRepository {
	return &CityRepository{conn: conn}
}

var _ citydomain.Repository = (*CityRepository)(nil)

func (*CityRepository) parseCity(c sqlc.City) *citydomain.City {
	return &citydomain.City{
		ID:   domain.FromPG(c.ID),
		Name: c.Name,
		At:   c.At.Time,
	}
}

func (r *CityRepository) Create(ctx context.Context, name string) (*citydomain.City, error) {
	if name == "" {
		return nil, errors.InvalidArguments
	}
	c, err := r.conn.CreateCity(ctx, name)
	if err != nil {
		return nil, err
	}
	return r.parseCity(c), nil
}

func (r *CityRepository) List(ctx context.Context, limit int32, offset int32) (citydomain.Cities, error) {
	if limit <= 0 {
		limit = 100
	}
	list, err := r.conn.ListCities(ctx, sqlc.ListCitiesParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	out := make(citydomain.Cities, len(list))
	for i, c := range list {
		out[i] = r.parseCity(c)
	}
	return out, nil
}

func (r *CityRepository) City(ctx context.Context, id domain.UUID) (*citydomain.City, error) {
	c, err := r.conn.CityInfo(ctx, id.ToPG())
	if err != nil {
		return nil, err
	}
	return r.parseCity(c), nil
}

func (r *CityRepository) Delete(ctx context.Context, id domain.UUID) error {
	return r.conn.DeleteCity(ctx, id.ToPG())
}
