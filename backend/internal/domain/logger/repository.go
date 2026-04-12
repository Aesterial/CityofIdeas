package loggerdomain

type Repository interface {
	Info(service string, content string, fields Fields)
	Warning(service string, content string, fields Fields)
	Error(service string, content string, fields Fields)
	Critical(service string, content string, fields Fields)
}
