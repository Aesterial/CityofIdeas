package safe

import (
	"context"
	"fmt"
	"reflect"
	"sync"
	"time"

	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func Go(name string, fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				msg := fmt.Sprintf("%v", r)
				logger.Error("safeGo",
					fmt.Sprintf("Goroutine %s crashed: %s", name, msg),
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
				logger.Error(
					"goAsync",
					fmt.Sprintf("Async task crashed: %s", msg),
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

func skippableForHydration(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return true
	}
	if status.Code(err) == codes.NotFound {
		return true
	}
	var appErr errors.T
	if errors.As(err, &appErr) {
		return appErr.GRPCStatus().Code() == codes.NotFound
	}
	return false
}

func Hydration[R any, E any](timeout time.Duration, fn func(context.Context, ...any) (R, error), sFn []func(context.Context, E) (E, error), count int) (R, error) {
	var empty R
	if count < 0 {
		return empty, errors.New("invalid args")
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	var wg sync.WaitGroup
	var once sync.Once
	var fErr error
	logErr := func(err error, logTag string) {
		if err == nil {
			return
		}
		once.Do(func() {
			fErr = err
			cancel()
		})
	}
	data, err := fn(ctx)
	if err != nil {
		return empty, err
	}
	v := reflect.ValueOf(data)
	t := reflect.TypeOf(data)
	switch {
	case !v.IsValid() || t == nil:
		return empty, errors.New("empty response")
	case t.Kind() == reflect.Slice:
		if len(sFn) == 0 {
			return data, nil
		}
		if count == 0 {
			count = v.Len()
		}
		if count <= 0 {
			count = 1
		}
		response := reflect.MakeSlice(t, v.Len(), v.Len())
		sem := make(chan struct{}, count)
		for i := range v.Len() {
			element := v.Index(i).Interface()
			elem, ok := element.(E)
			if !ok {
				return empty, fmt.Errorf("invalid element type at index %d: %T", i, element)
			}
			wg.Go(func() {
				select {
				case sem <- struct{}{}:
				case <-ctx.Done():
					return
				}
				defer func() { <-sem }()
				current := elem
				for _, hydrateFn := range sFn {
					if hydrateFn == nil {
						continue
					}
					current, err = hydrateFn(ctx, current)
					if err != nil {
						if skippableForHydration(err) {
							return
						}
						logErr(err, "safe.hydration")
						return
					}
				}
				response.Index(i).Set(reflect.ValueOf(current))
			})
		}
		wg.Wait()
		if fErr != nil {
			return empty, fErr
		}
		filtered := reflect.MakeSlice(t, 0, response.Len())
		for i := range response.Len() {
			item := response.Index(i)
			if !item.IsZero() {
				filtered = reflect.Append(filtered, item)
			}
		}
		result, ok := filtered.Interface().(R)
		if !ok {
			return empty, errors.New("cast error")
		}
		return result, nil
	default:
		if len(sFn) == 0 {
			return data, nil
		}
		elem, ok := any(data).(E)
		if !ok {
			return empty, fmt.Errorf("invalid data type: %T", data)
		}
		current := elem
		for _, hydrateFn := range sFn {
			if hydrateFn == nil {
				continue
			}
			current, err = hydrateFn(ctx, current)
			if err != nil {
				if skippableForHydration(err) {
					return empty, nil
				}
				return empty, err
			}
		}
		result, ok := any(current).(R)
		if !ok {
			return empty, errors.New("cast error")
		}
		return result, nil
	}
}
