package loggerdomain

import (
	"fmt"
	"strings"
	"time"
)

type Field struct {
	Key   string
	Value any
}

func F(key string, value any) Field {
	return Field{
		Key:   key,
		Value: value,
	}
}

type Fields []Field

func (f Field) GetValue() string {
	switch v := f.Value.(type) {
	case nil:
		return ""
	case string:
		return any(v).(string)
	case fmt.Stringer:
		return v.String()
	case error:
		return v.Error()
	default:
		return fmt.Sprintf("%v", v)
	}
}

func (f Fields) Map() map[string]string {
	if f == nil {
		return nil
	}
	var m = make(map[string]string, len(f))
	for _, v := range f {
		key := strings.TrimSpace(v.Key)
		if len(key) == 0 {
			continue
		}
		m[key] = v.GetValue()
	}
	if len(m) == 0 {
		return nil
	}
	return m
}

type Level int

const (
	LevelInfo Level = iota
	LevelWarning
	LevelError
	LevelCritical
)

func (l Level) String() string {
	switch l {
	case LevelInfo:
		return "info"
	case LevelWarning:
		return "warning"
	case LevelError:
		return "error"
	case LevelCritical:
		return "critical"
	default:
		return "warning"
	}
}

type Entry struct {
	Service string
	Content string
	Level   Level
	Fields  map[string]string
	At      time.Time
}

func NewEntry(service string, content string, level Level, at time.Time, fields Fields) Entry {
	service = strings.TrimSpace(service)
	if service == "" {
		service = "unspecified"
	}
	if at.IsZero() {
		at = time.Now().UTC()
	} else {
		at = at.UTC()
	}
	return Entry{service, content, level, fields.Map(), at}
}

func (e Entry) Render() string {
	var layout = "[%s]: %s | %s | %s"
	pairs := make([]string, 0, len(e.Fields))
	for k, v := range e.Fields {
		pairs = append(pairs, fmt.Sprintf("%s=%s", k, v))
	}
	return fmt.Sprintf(layout, strings.ToUpper(e.Level.String()), e.Service, e.Content, e.At.String()) + " | " + strings.Join(pairs, ", ")
}
