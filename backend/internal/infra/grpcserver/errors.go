package grpcserver

import (
	apperrors "Aesterial/backend/internal/shared/errors"
	"errors"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func statusFromError(err error) error {
	if err == nil {
		return nil
	}

	var appErr apperrors.Error
	if errors.As(err, &appErr) {
		code := strings.TrimSpace(appErr.Code)
		switch code {
		case "InvalidUserID", "InvalidName":
			return status.Error(codes.InvalidArgument, appErr.Message)
		case "UserNotFound":
			return status.Error(codes.NotFound, appErr.Message)
		default:
			if httpCode, convErr := strconv.Atoi(code); convErr == nil {
				switch httpCode {
				case 400:
					return status.Error(codes.InvalidArgument, appErr.Message)
				case 401:
					return status.Error(codes.Unauthenticated, appErr.Message)
				case 403:
					return status.Error(codes.PermissionDenied, appErr.Message)
				case 404:
					return status.Error(codes.NotFound, appErr.Message)
				default:
					return status.Error(codes.Internal, appErr.Message)
				}
			}
			return status.Error(codes.Internal, appErr.Message)
		}
	}

	if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
		return status.Error(codes.PermissionDenied, "invalid password")
	}

	lower := strings.ToLower(err.Error())
	switch {
	case strings.Contains(lower, "not found"):
		return status.Error(codes.NotFound, err.Error())
	case strings.Contains(lower, "invalid") || strings.Contains(lower, "empty"):
		return status.Error(codes.InvalidArgument, err.Error())
	}

	return status.Error(codes.Internal, err.Error())
}
