package main

import (
	sessionsservice "github.com/aesterial/cityideas/backend/internal/app/sessions"
	userservice "github.com/aesterial/cityideas/backend/internal/app/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/database"
	"github.com/aesterial/cityideas/backend/internal/infra/database/repositories"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/infra/server"
	"github.com/aesterial/cityideas/backend/internal/infra/server/interceptors"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
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
	logger.Info("main", "starting server")
	srv := grpc.NewServer(grpc.ChainUnaryInterceptor(interceptors.FingerPrint(), interceptors.Logging(), recovery.UnaryServerInterceptor(recovery.WithRecoveryHandlerContext(interceptors.Recovery))))
	if !cfg.IsProduction() {
		reflection.Register(srv)
	}
	auth := server.NewAuthenticator(userService, sessionsService)
}
