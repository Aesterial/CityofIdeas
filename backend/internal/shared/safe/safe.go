package safe

import (
	"Aesterial/backend/internal/infra/logger"
	"context"
	"errors"
	"fmt"
	"runtime/debug"
	"time"
)

func Go(name string, fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				msg := fmt.Sprintf("%v", r)
				stack := debug.Stack()
				logger.Debug(string(stack), "safego.crash")
				logger.Error(
					fmt.Sprintf("Goroutine %s crashed: %s", name, msg),
					"safego.crash",
					logger.EventActor{Type: logger.System, ID: 0},
					logger.Failure,
				)
			}
		}()
		fn()
	}()
}

type asyncResult[T any] struct {
	value T
	err   error
}

func GoAsync[T any](ctx context.Context, timeout time.Duration, fn func(context.Context) (T, error)) (T, error) {
	var zero T
	if fn == nil {
		return zero, errors.New("async function is nil")
	}
	if ctx == nil {
		ctx = context.Background()
	}

	runCtx := ctx
	cancel := func() {}
	if timeout > 0 {
		runCtx, cancel = context.WithTimeout(ctx, timeout)
	}
	defer cancel()

	done := make(chan asyncResult[T], 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				msg := fmt.Sprintf("%v", r)
				stack := debug.Stack()
				logger.Debug(string(stack), "safeasync.crash")
				logger.Error(
					fmt.Sprintf("Async task crashed: %s", msg),
					"safeasync.crash",
					logger.EventActor{Type: logger.System, ID: 0},
					logger.Failure,
				)
				done <- asyncResult[T]{err: fmt.Errorf("async panic: %v", r)}
			}
		}()

		value, err := fn(runCtx)
		done <- asyncResult[T]{value: value, err: err}
	}()

	select {
	case res := <-done:
		return res.value, res.err
	case <-runCtx.Done():
		return zero, runCtx.Err()
	}
}
