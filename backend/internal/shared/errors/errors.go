package errors

import (
	stderrors "errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/protoadapt"
)

var Is = stderrors.Is
var New = stderrors.New
var As = stderrors.As

func AsType[E error](err error) (E, bool) {
	return stderrors.AsType[E](err)
}

var Join = stderrors.Join
var ErrUnsupported = stderrors.ErrUnsupported
var Unwrap = stderrors.Unwrap

type T struct {
	st      *status.Status
	content string
}

func (e T) Error() string {
	if e.content != "" {
		return e.content
	}
	if e.st != nil {
		return e.st.Message()
	}
	return "unknown error"
}

func (e T) GRPCStatus() *status.Status {
	if e.st == nil {
		return status.New(codes.Internal, "unknown error")
	}
	return e.st
}

func (e T) AddErrDetails(dat string) T {
	e.content += " " + dat
	return e
}

func (e T) Is(err error) bool {
	return e.content == err.Error()
}

func (e T) IsErr(err error) bool {
	return stderrors.Is(err, e)
}

func (e T) WithDetails(details ...proto.Message) T {
	st := e.GRPCStatus()

	v1 := make([]protoadapt.MessageV1, 0, len(details))
	for _, d := range details {
		v1 = append(v1, protoadapt.MessageV1Of(d))
	}

	st2, err := st.WithDetails(v1...)
	if err != nil {
		return T{st: status.New(codes.Internal, "invalid error details"), content: e.content}
	}
	return T{st: st2, content: e.content}
}

func Wrap(err error) error {
	if err == nil {
		return nil
	}
	if _, ok := stderrors.AsType[T](err); ok {
		return err
	}
	return ServerError.AddErrDetails(err.Error())
}

var (
	NotFound         = T{st: status.New(codes.NotFound, "record not found"), content: "requested record not found"}
	NotMatch         = T{st: status.New(codes.InvalidArgument, "arguments not equals with ")}
	InvalidArguments = T{st: status.New(codes.InvalidArgument, "invalid arguments"), content: "some argument missing"}
	Conflict         = T{st: status.New(codes.AlreadyExists, "data collides with exists one"), content: "conflict error"}
	ServerError      = T{st: status.New(codes.Internal, "server error while progress"), content: "server error appeared"}
	NotConfigured    = T{st: status.New(codes.Unimplemented, "server error while progress"), content: "service not configured"}
	AccessDenied     = T{st: status.New(codes.PermissionDenied, "denied"), content: "permissions denied"}
	Unauthenticated  = T{st: status.New(codes.Unauthenticated, "failed to authorize"), content: "user unauthenticated"}
	DataExpired      = T{st: status.New(codes.DeadlineExceeded, "passed data expired"), content: "accepted data expired"}
	NotImplemented   = T{st: status.New(codes.Unimplemented, "not implemented"), content: "not implemented"}
	Unavailable      = T{st: status.New(codes.Unavailable, "unavailable"), content: "service unavailable"}
	Banned           = T{st: status.New(codes.PermissionDenied, "user is banned"), content: "user is banned"}
	NeedVerify       = T{st: status.New(codes.PermissionDenied, "mfa required"), content: "mfa required"}
)
