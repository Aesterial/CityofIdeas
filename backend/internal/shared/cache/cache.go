package cache

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

const DefaultMaxEntries = 1024

type entry struct {
	value   any
	expires time.Time
	tags    []string
}

type Store struct {
	mu         sync.RWMutex
	items      map[string]entry
	group      singleflight.Group
	maxEntries int
}

func New(maxEntries int) *Store {
	if maxEntries <= 0 {
		maxEntries = DefaultMaxEntries
	}
	return &Store{
		items:      make(map[string]entry),
		maxEntries: maxEntries,
	}
}

func Key(parts ...any) string {
	var b strings.Builder
	for _, part := range parts {
		value := fmt.Sprint(part)
		b.WriteString(strconv.Itoa(len(value)))
		b.WriteString(":")
		b.WriteString(value)
		b.WriteString("|")
	}
	return b.String()
}

func Get[T any](store *Store, key string) (T, bool) {
	var zero T
	if store == nil || key == "" {
		return zero, false
	}
	store.mu.RLock()
	item, ok := store.items[key]
	store.mu.RUnlock()
	if !ok {
		return zero, false
	}
	if time.Now().After(item.expires) {
		store.Delete(key)
		return zero, false
	}
	value, ok := item.value.(T)
	if !ok {
		return zero, false
	}
	return value, true
}

func Set(store *Store, key string, value any, ttl time.Duration, tags ...string) {
	if store == nil || key == "" || ttl <= 0 {
		return
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	store.items[key] = entry{
		value:   value,
		expires: time.Now().Add(ttl),
		tags:    tags,
	}
	if len(store.items) > store.maxEntries {
		store.pruneLocked()
	}
}

func GetOrSet[T any](ctx context.Context, store *Store, key string, ttl time.Duration, tags []string, fn func(context.Context) (T, error)) (T, error) {
	if value, ok := Get[T](store, key); ok {
		return value, nil
	}
	var zero T
	if fn == nil {
		return zero, nil
	}
	if store == nil {
		return fn(ctx)
	}
	out, err, _ := store.group.Do(key, func() (any, error) {
		if value, ok := Get[T](store, key); ok {
			return value, nil
		}
		value, err := fn(ctx)
		if err != nil {
			return zero, err
		}
		Set(store, key, value, ttl, tags...)
		return value, nil
	})
	if err != nil {
		return zero, err
	}
	value, ok := out.(T)
	if !ok {
		return zero, nil
	}
	return value, nil
}

func (store *Store) Delete(key string) {
	if store == nil || key == "" {
		return
	}
	store.mu.Lock()
	delete(store.items, key)
	store.mu.Unlock()
}

func (store *Store) DeleteTags(tags ...string) {
	if store == nil || len(tags) == 0 {
		return
	}
	targets := make(map[string]struct{}, len(tags))
	for _, tag := range tags {
		targets[tag] = struct{}{}
	}
	store.mu.Lock()
	defer store.mu.Unlock()
	for key, item := range store.items {
		for _, tag := range item.tags {
			if _, ok := targets[tag]; ok {
				delete(store.items, key)
				break
			}
		}
	}
}

func (store *Store) pruneLocked() {
	now := time.Now()
	for key, item := range store.items {
		if now.After(item.expires) {
			delete(store.items, key)
		}
	}
	for key := range store.items {
		if len(store.items) <= store.maxEntries {
			return
		}
		delete(store.items, key)
	}
}
