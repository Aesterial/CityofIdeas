package cache

import (
	"context"
	"testing"
	"time"
)

func TestGetOrSetReturnsCachedValue(t *testing.T) {
	store := New(10)
	calls := 0
	fn := func(context.Context) (string, error) {
		calls++
		return "value", nil
	}

	first, err := GetOrSet(context.Background(), store, Key("test", 1), time.Minute, nil, fn)
	if err != nil {
		t.Fatal(err)
	}
	second, err := GetOrSet(context.Background(), store, Key("test", 1), time.Minute, nil, fn)
	if err != nil {
		t.Fatal(err)
	}
	if first != "value" || second != "value" {
		t.Fatalf("unexpected values: %q %q", first, second)
	}
	if calls != 1 {
		t.Fatalf("expected one loader call, got %d", calls)
	}
}

func TestDeleteTagsRemovesTaggedItems(t *testing.T) {
	store := New(10)
	Set(store, Key("keep"), "keep", time.Minute, "keep")
	Set(store, Key("delete"), "delete", time.Minute, "delete")

	store.DeleteTags("delete")

	if _, ok := Get[string](store, Key("delete")); ok {
		t.Fatal("expected tagged value to be deleted")
	}
	if value, ok := Get[string](store, Key("keep")); !ok || value != "keep" {
		t.Fatalf("expected keep value to remain, got %q", value)
	}
}

func TestExpiredItemsAreNotReturned(t *testing.T) {
	store := New(10)
	Set(store, Key("expired"), "value", time.Nanosecond)
	time.Sleep(time.Millisecond)

	if _, ok := Get[string](store, Key("expired")); ok {
		t.Fatal("expected expired value to miss")
	}
}
