package safe

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

func TestGoAsyncSuccess(t *testing.T) {
	got, err := GoAsync[int](context.Background(), time.Second, func(context.Context) (int, error) {
		return 42, nil
	})
	if err != nil {
		t.Fatalf("GoAsync() error = %v", err)
	}
	if got != 42 {
		t.Fatalf("GoAsync() = %d, want 42", got)
	}
}

func TestGoAsyncTimeout(t *testing.T) {
	_, err := GoAsync[int](context.Background(), 20*time.Millisecond, func(ctx context.Context) (int, error) {
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		case <-time.After(time.Second):
			return 1, nil
		}
	})
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("GoAsync() error = %v, want deadline exceeded", err)
	}
}

func TestGoAsyncPanic(t *testing.T) {
	_, err := GoAsync[int](context.Background(), time.Second, func(context.Context) (int, error) {
		panic("boom")
	})
	if err == nil {
		t.Fatal("GoAsync() expected panic error, got nil")
	}
	if !strings.Contains(err.Error(), "async panic") {
		t.Fatalf("GoAsync() error = %v, want async panic", err)
	}
}
