package repositories

import (
	"context"
	"time"

	"github.com/aesterial/cityideas/backend/internal/domain"
	maintenancesdomain "github.com/aesterial/cityideas/backend/internal/domain/maintenances"
	"github.com/aesterial/cityideas/backend/internal/infra/database/sqlc"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5/pgtype"
)

type MaintenanceRepository struct {
	conn sqlc.Querier
}

func NewMaintenanceRepository(conn sqlc.Querier) *MaintenanceRepository {
	return &MaintenanceRepository{conn: conn}
}

var _ maintenancesdomain.Repository = (*MaintenanceRepository)(nil)

func (*MaintenanceRepository) parseMaintenance(in sqlc.Maintenance) *maintenancesdomain.Maintenance {
	var plannedStart, actualStart, plannedEnd, actualEnd *time.Time
	if in.PlannedStart.Valid {
		plannedStart = &in.PlannedStart.Time
	}
	if in.PlannedEnd.Valid {
		plannedEnd = &in.PlannedEnd.Time
	}
	if in.ActualStart.Valid {
		actualStart = &in.ActualStart.Time
	}
	if in.ActualEnd.Valid {
		actualEnd = &in.ActualEnd.Time
	}
	return &maintenancesdomain.Maintenance{
		ID:          domain.FromPG(in.ID),
		Description: in.Description,
		Status:      maintenancesdomain.ParseStatus(string(in.Status)),
		Type:        maintenancesdomain.ParseType(string(in.Type)),
		Planned: &maintenancesdomain.TimeRange{
			Start: plannedStart,
			End:   plannedEnd,
		},
		Actual: &maintenancesdomain.TimeRange{
			Start: actualStart,
			End:   actualEnd,
		},
		Created: in.Created.Time,
		Caller:  domain.FromPG(in.Caller),
	}
}

func (m *MaintenanceRepository) parseMaintenances(in []sqlc.Maintenance) maintenancesdomain.Maintenances {
	if in == nil {
		return nil
	}
	var out = make(maintenancesdomain.Maintenances, len(in))
	for i, e := range in {
		out[i] = m.parseMaintenance(e)
	}
	return out
}

func (m *MaintenanceRepository) Create(ctx context.Context, caller domain.UUID, description string, planned maintenancesdomain.TimeRange) (*maintenancesdomain.Maintenance, error) {
	if description == "" {
		return nil, errors.InvalidArguments
	}
	out, err := m.conn.CreateMaintenance(ctx, sqlc.CreateMaintenanceParams{
		Description:  description,
		PlannedStart: pgtype.Timestamptz{Time: planned.GetStart(), Valid: true},
		PlannedEnd:   pgtype.Timestamptz{Time: planned.GetEnd(), Valid: true},
		Caller:       caller.ToPG(),
	})
	return m.parseMaintenance(out), err
}

func (m *MaintenanceRepository) List(ctx context.Context, limit int32, offset int32) (maintenancesdomain.Maintenances, error) {
	if limit <= 0 {
		limit = 10
	}
	out, err := m.conn.MaintenancesHistory(ctx, sqlc.MaintenancesHistoryParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	return m.parseMaintenances(out), nil
}

func (m *MaintenanceRepository) Current(ctx context.Context) (*maintenancesdomain.Maintenance, error) {
	active, err := m.conn.HasActiveMaintenance(ctx)
	if err != nil {
		return nil, err
	}
	if !active {
		return nil, errors.NotFound
	}
	info, err := m.conn.ActiveMaintenance(ctx)
	if err != nil {
		return nil, err
	}
	return m.parseMaintenance(info), nil
}

func (m *MaintenanceRepository) Start(ctx context.Context, id domain.UUID) error {
	return m.conn.StartMaintenance(ctx, id.ToPG())
}

func (m *MaintenanceRepository) Close(ctx context.Context, id domain.UUID) error {
	return m.conn.EndMaintenance(ctx, id.ToPG())
}

func (m *MaintenanceRepository) IsPlanned(ctx context.Context) (*time.Time, string, error) {
	out, err := m.conn.PlannedMaintenance(ctx)
	if err != nil {
		return nil, "", err
	}
	var planned *time.Time
	if out.PlannedStart.Valid {
		planned = &out.PlannedStart.Time
	}
	return planned, out.Description, nil
}
