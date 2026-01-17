package scheduler

import (
	"Aesterial/backend/internal/domain/statistics"
	"Aesterial/backend/internal/infra/logger"
	"Aesterial/backend/internal/shared/safe"
	"context"
	"time"
)

func Run(repo statistics.Repository, loc *time.Location) (stop func()) {
	if loc == nil {
		loc = time.Local
	}

	ctx, cancel := context.WithCancel(context.Background())

	nextMidnight := func(now time.Time) time.Time {
		n := now.In(loc)
		y, m, d := n.Date()
		return time.Date(y, m, d+1, 0, 0, 0, 0, loc)
	}

	resetTimer := func(t *time.Timer, d time.Duration) {
		if !t.Stop() {
			select {
			case <-t.C:
			default:
			}
		}
		t.Reset(d)
	}

	safe.Go("statistics recap scheduler", func() {
		timer := time.NewTimer(time.Hour)
		defer timer.Stop()

		resetTimer(timer, time.Until(nextMidnight(time.Now())))

		for {
			select {
			case <-ctx.Done():
				return
			case <-timer.C:
				if err := repo.SaveStatisticsRecap(ctx); err != nil {
					logger.Error(
						"Failed to save statistics recap: "+err.Error(),
						"system.statistics.scheduler",
						logger.EventActor{Type: logger.System, ID: 0},
						logger.Failure,
					)
				}
				resetTimer(timer, time.Until(nextMidnight(time.Now())))
			}
		}
	})

	return cancel
}
