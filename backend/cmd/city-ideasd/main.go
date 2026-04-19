package main

import (
	"context"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
	sessionpb "github.com/aesterial/cityideas/backend/internal/api/v1/sessions/v1"
	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	loginservice "github.com/aesterial/cityideas/backend/internal/app/login"
	sessionsservice "github.com/aesterial/cityideas/backend/internal/app/sessions"
	userservice "github.com/aesterial/cityideas/backend/internal/app/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/database"
	"github.com/aesterial/cityideas/backend/internal/infra/database/repositories"
	"github.com/aesterial/cityideas/backend/internal/infra/handlers"
	"github.com/aesterial/cityideas/backend/internal/infra/handlers/interceptors"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	if err := config.Ensure(); err != nil {
		logger.Critical("main", "failed to ensure config", logger.F("error", err))
		return
	}
	cfg := config.Get()
	log := logger.New()
	log.SetDefault()
	logger.Info("main", "creating database client")
	conn, err := database.NewClient()
	if err != nil {
		logger.Critical("main", "failed to connect to database", logger.F("error", err))
		return
	}
	defer conn.Close()
	logger.Info("main", "initialising repositories")
	userRepository := repositories.NewUserRepository(conn.Querier())
	sessionsRepository := repositories.NewSessionsRepository(conn.Querier())
	logger.Info("main", "initialising services")
	userService := userservice.NewService(userRepository)
	sessionsService := sessionsservice.NewService(sessionsRepository)
	loginService := loginservice.NewService(userRepository, sessionsRepository)
	logger.Info("main", "starting server")
	srv := grpc.NewServer(grpc.ChainUnaryInterceptor(interceptors.FingerPrint(), interceptors.Logging(), recovery.UnaryServerInterceptor(recovery.WithRecoveryHandlerContext(interceptors.Recovery))))
	if !cfg.IsProduction() {
		reflection.Register(srv)
	}
	auth := handlers.NewAuthenticator(userService, sessionsService)
	loginHandler := handlers.NewLoginHandler(loginService, auth)
	userHandler := handlers.NewUserHandler(userService, auth)
	sessionHandler := handlers.NewSessionHandler(sessionsService, auth)

	loginpb.RegisterLoginServiceServer(srv, loginHandler)
	userpb.RegisterUserServiceServer(srv, userHandler)
	sessionpb.RegisterSessionServiceServer(srv, sessionHandler)

	logger.Info("main", "starting listener")
	serveErr := make(chan error, 1)
	listener, err := net.Listen("tcp", "0.0.0.0"+cfg.Port)
	if err != nil {
		logger.Critical("main", "failed to start listener", logger.F("error", err))
		return
	}
	defer func() {
		serveErr <- listener.Close()
	}()
	go func() {
		logger.Info("main", "serve at port", logger.F("port", cfg.Port))
		serveErr <- srv.Serve(listener)
	}()
	select {
	case <-ctx.Done():
		logger.Warning("main", "received interrupt signal")
		done := make(chan struct{})
		go func() {
			srv.GracefulStop()
			close(done)
		}()
		select {
		case <-done:
		case <-time.After(10 * time.Second):
			srv.Stop()
		}
		logger.Info("main", "server stopped")
	case err = <-serveErr:
		if err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			logger.Critical("main", "server received error", logger.F("error", err))
		}
	}
}
