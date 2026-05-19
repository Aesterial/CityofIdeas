package handlers

import (
	"context"

	typespb "github.com/aesterial/cityideas/backend/internal/api/v1"
	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
	loginservice "github.com/aesterial/cityideas/backend/internal/app/login"
	"github.com/aesterial/cityideas/backend/internal/domain"
	userdomain "github.com/aesterial/cityideas/backend/internal/domain/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/emptypb"
)

type LoginHandler struct {
	loginpb.UnimplementedLoginServiceServer
	auth *Authenticator
	srv  *loginservice.Service
}

func NewLoginHandler(srv *loginservice.Service, auth *Authenticator) *LoginHandler {
	return &LoginHandler{
		auth: auth,
		srv:  srv,
	}
}

func (h *LoginHandler) response(usr *userdomain.User) *loginpb.LoginResponse {
	var resp = &loginpb.LoginResponse{}
	resp.SetInfo(usr.PrivateProtobuf())
	return resp
}

func (h *LoginHandler) isRequestValid(req any) error {
	if h == nil || h.auth == nil || h.srv == nil {
		return errors.ServerError
	}
	if req == nil {
		return errors.InvalidArguments
	}
	return nil
}

func (h *LoginHandler) Register(ctx context.Context, req *loginpb.RegisterRequest) (*loginpb.LoginResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	usr, err := h.srv.Register(ctx, req.GetUsername(), req.GetEmail(), req.GetPassword())
	if err != nil {
		logger.Error("login", "failed to register user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return h.response(usr), nil
}

func (h *LoginHandler) Authorize(ctx context.Context, req *loginpb.AuthorizeRequest) (*loginpb.LoginResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	usr, err := h.srv.Authorize(ctx, req.GetUserMail(), req.GetPassword())
	if err != nil {
		logger.Error("login", "failed to authorize user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return h.response(usr), nil
}

func (h *LoginHandler) Logout(ctx context.Context, _ *emptypb.Empty) (*emptypb.Empty, error) {
	if err := h.isRequestValid("{}"); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	err = h.srv.Logout(ctx, *meta.SessionID)
	if err != nil {
		logger.Error("login", "failed to logout user", logger.F("error", err))
		return nil, errors.Wrap(err)
	}
	return &emptypb.Empty{}, nil
}

func (h *LoginHandler) CreateTotp(ctx context.Context, _ *emptypb.Empty) (*loginpb.CreateTotpResponse, error) {
	if err := h.isRequestValid("{}"); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	out, err := h.srv.SetupTotp(ctx, *meta.UserID)
	if err != nil {
		return nil, err
	}
	return out.Protobuf(), nil
}

func (h *LoginHandler) ConfirmTotp(ctx context.Context, req *typespb.RequestWithValue) (*loginpb.ConfirmTotpResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	logger.Info("login", "received value is"+req.GetValue())
	out, err := h.srv.ConfirmTotp(ctx, *meta.UserID, req.GetValue())
	if err != nil {
		return nil, err
	}
	var resp = &loginpb.ConfirmTotpResponse{}
	resp.SetCodes(out)
	return resp, nil
}

func (h *LoginHandler) CheckTotp(ctx context.Context, req *typespb.RequestWithValue) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx, true)
	if err != nil {
		return nil, err
	}
	err = h.srv.CheckTotp(ctx, *meta.UserID, req.GetValue())
	if err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *LoginHandler) ResetTotp(ctx context.Context, req *loginpb.ResetTotpRequest) (*emptypb.Empty, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, err := h.auth.User(ctx)
	if err != nil {
		return nil, err
	}
	if err = h.srv.ResetTotp(ctx, *meta.UserID, req.GetCode(), userdomain.ParseResetKind(req.GetKind())); err != nil {
		return nil, err
	}
	return &emptypb.Empty{}, nil
}

func (h *LoginHandler) VkStart(ctx context.Context, req *loginpb.VkStartRequest) (*typespb.RequestWithValue, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, _ := h.auth.User(ctx)
	var userID *domain.UUID = nil
	if meta != nil {
		userID = meta.UserID
	}
	link, err := h.srv.VkStart(ctx, userdomain.CallbackFromProto(req.GetType()), userID)
	if err != nil {
		return nil, err
	}
	return typespb.RequestWithValue_builder{Value: link}.Build(), nil
}

func (h *LoginHandler) VkCallback(ctx context.Context, req *loginpb.VkCallbackRequest) (*loginpb.VkCallbackResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.InvalidArguments
	}
	token := h.auth.getToken(md, config.Get().Oauth.Key)
	if token == "" {
		return nil, errors.InvalidArguments
	}
	callback, err := h.srv.VkCallback(ctx, req.GetCode(), req.GetState())
	if err != nil {
		return nil, err
	}
	return callback.Protobuf(), nil
}

func (h *LoginHandler) TgStart(ctx context.Context, req *loginpb.TgStartRequest) (*loginpb.TgStartResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	meta, _ := h.auth.User(ctx)
	var userID *domain.UUID = nil
	if meta != nil {
		userID = meta.UserID
	}
	data, err := h.srv.TgStart(ctx, userdomain.CallbackFromProto(req.GetType()), userID)
	if err != nil {
		return nil, err
	}
	out := &loginpb.TgStartResponse{}
	out.SetState(data.State)
	out.SetBotUsername(data.BotUsername)
	return out, nil
}

func (h *LoginHandler) TgCallback(ctx context.Context, req *loginpb.TgCallbackRequest) (*loginpb.VkCallbackResponse, error) {
	if err := h.isRequestValid(req); err != nil {
		return nil, err
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.InvalidArguments
	}
	token := h.auth.getToken(md, config.Get().Oauth.Key)
	if token == "" {
		return nil, errors.InvalidArguments
	}
	callback, err := h.srv.TgCallback(ctx, req.GetState(), userdomain.TgAuthData{
		ID:        req.GetId(),
		FirstName: req.GetFirstName(),
		LastName:  req.GetLastName(),
		Username:  req.GetUsername(),
		PhotoURL:  req.GetPhotoUrl(),
		AuthDate:  req.GetAuthDate(),
		Hash:      req.GetHash(),
	})
	if err != nil {
		return nil, err
	}
	return callback.Protobuf(), nil
}
