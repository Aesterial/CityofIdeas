package logger

import (
	"log"
	"os"
	"time"

	loggerdomain "github.com/aesterial/cityideas/backend/internal/domain/logger"
)

type Logger struct {
	logger *log.Logger
}

var _ loggerdomain.Repository = (*Logger)(nil)

var def *Logger

func New() *Logger {
	return &Logger{
		logger: log.New(os.Stdout, "", 0),
	}
}

func (l *Logger) SetDefault() {
	def = l
}

func (l *Logger) Info(service string, content string, fields loggerdomain.Fields) {
	l.log(loggerdomain.LevelInfo, service, content, fields)
}

func (l *Logger) Warning(service string, content string, fields loggerdomain.Fields) {
	l.log(loggerdomain.LevelWarning, service, content, fields)
}

func (l *Logger) Error(service string, content string, fields loggerdomain.Fields) {
	l.log(loggerdomain.LevelError, service, content, fields)
}

func (l *Logger) Critical(service string, content string, fields loggerdomain.Fields) {
	l.log(loggerdomain.LevelCritical, service, content, fields)
}

func (l *Logger) log(level loggerdomain.Level, service string, content string, fields loggerdomain.Fields) {
	l.logger.Println(loggerdomain.NewEntry(service, content, level, time.Now(), fields).Render())
}

func Info(service string, content string, fields ...loggerdomain.Field) {
	if def == nil {
		return
	}
	def.Info(service, content, fields)
}

func Warning(service string, content string, fields ...loggerdomain.Field) {
	if def == nil {
		return
	}
	def.Warning(service, content, fields)
}

func Error(service string, content string, fields ...loggerdomain.Field) {
	if def == nil {
		return
	}
	def.Error(service, content, fields)
}

func Critical(service string, content string, fields ...loggerdomain.Field) {
	if def == nil {
		return
	}
	def.Critical(service, content, fields)
}

var F = loggerdomain.F
