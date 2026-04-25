package main

import (
	"context"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
	maintenancepb "github.com/aesterial/cityideas/backend/internal/api/v1/maintenances/v1"
	projectpb "github.com/aesterial/cityideas/backend/internal/api/v1/projects/v1"
	rankpb "github.com/aesterial/cityideas/backend/internal/api/v1/ranks/v1"
	sessionpb "github.com/aesterial/cityideas/backend/internal/api/v1/sessions/v1"
	ticketpb "github.com/aesterial/cityideas/backend/internal/api/v1/tickets/v1"
	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	loginservice "github.com/aesterial/cityideas/backend/internal/app/login"
	maintenanceservice "github.com/aesterial/cityideas/backend/internal/app/maintenance"
	projectservice "github.com/aesterial/cityideas/backend/internal/app/project"
	rankservice "github.com/aesterial/cityideas/backend/internal/app/rank"
	sessionservice "github.com/aesterial/cityideas/backend/internal/app/session"
	ticketservice "github.com/aesterial/cityideas/backend/internal/app/ticket"
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
	log := logger.New()
	log.SetDefault()
	if err := config.Ensure(); err != nil {
		logger.Critical("main", "failed to ensure config", logger.F("error", err))
		return
	}
	cfg := config.Get()
	logger.Info("main", "creating database client")
	conn, err := database.NewClient()
	if err != nil {
		logger.Critical("main", "failed to connect to database", logger.F("error", err))
		return
	}
	defer conn.Close()

	userRepository := repositories.NewUserRepository(conn.Querier())
	sessionRepository := repositories.NewSessionsRepository(conn.Querier())
	projectRepository := repositories.NewProjectsRepository(conn.Querier())
	ticketRepository := repositories.NewTicketsRepository(conn.Querier())
	rankRepository := repositories.NewRankRepository(conn.Querier())
	maintenanceRepository := repositories.NewMaintenanceRepository(conn.Querier())
	userService := userservice.NewService(userRepository)
	sessionService := sessionservice.NewService(sessionRepository)
	loginService := loginservice.NewService(userRepository, sessionRepository)
	projectService := projectservice.NewService(projectRepository)
	ticketService := ticketservice.NewService(ticketRepository)
	rankService := rankservice.NewService(rankRepository)
	maintenanceService := maintenanceservice.NewService(maintenanceRepository)
	interceptorService := interceptors.NewService(maintenanceService)

	srv := grpc.NewServer(grpc.ChainUnaryInterceptor(interceptorService.CsrfCheck(), interceptorService.AvailabilityCheck(), interceptorService.FingerPrint(), interceptorService.Logging(), recovery.UnaryServerInterceptor(recovery.WithRecoveryHandlerContext(interceptorService.Recovery))))
	if !cfg.IsProduction() {
		reflection.Register(srv)
	}
	auth := handlers.NewAuthenticator(userService, sessionService, rankService)
	loginHandler := handlers.NewLoginHandler(loginService, auth)
	userHandler := handlers.NewUserHandler(userService, auth)
	sessionHandler := handlers.NewSessionHandler(sessionService, auth)
	projectHandler := handlers.NewProjectHandler(projectService, auth)
	rankHandler := handlers.NewRankHandler(rankService, auth)
	ticketHandler := handlers.NewTicketHandler(ticketService, auth)
	maintenanceHandler := handlers.NewMaintenanceHandler(maintenanceService, auth)

	loginpb.RegisterLoginServiceServer(srv, loginHandler)
	userpb.RegisterUserServiceServer(srv, userHandler)
	sessionpb.RegisterSessionServiceServer(srv, sessionHandler)
	projectpb.RegisterProjectsServiceServer(srv, projectHandler)
	rankpb.RegisterRankServiceServer(srv, rankHandler)
	ticketpb.RegisterTicketServiceServer(srv, ticketHandler)
	maintenancepb.RegisterMaintenanceServiceServer(srv, maintenanceHandler)

	logger.Info("main", "starting listener")
	listener, err := net.Listen("tcp", "0.0.0.0:"+cfg.Port)
	if err != nil {
		logger.Critical("main", "failed to start listener", logger.F("error", err))
		return
	}
	serveErr := make(chan error, 1)

	go func() {
		logger.Info("main", "serving stared", logger.F("port", cfg.Port))
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

		err = <-serveErr
		if err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			logger.Warning("main", "serve returned after shutdown", logger.F("error", err))
		}

		logger.Info("main", "server stopped")

	case err = <-serveErr:
		if err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			logger.Critical("main", "server received error", logger.F("error", err))
		}
	}
}
