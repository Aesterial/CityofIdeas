package main

import (
	"context"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	actionspb "github.com/aesterial/cityideas/backend/internal/api/v1/actions/v1"
	citypb "github.com/aesterial/cityideas/backend/internal/api/v1/cities/v1"
	loginpb "github.com/aesterial/cityideas/backend/internal/api/v1/login/v1"
	maintenancepb "github.com/aesterial/cityideas/backend/internal/api/v1/maintenances/v1"
	projectpb "github.com/aesterial/cityideas/backend/internal/api/v1/projects/v1"
	rankpb "github.com/aesterial/cityideas/backend/internal/api/v1/ranks/v1"
	sessionpb "github.com/aesterial/cityideas/backend/internal/api/v1/sessions/v1"
	statpb "github.com/aesterial/cityideas/backend/internal/api/v1/statistics/v1"
	storagepb "github.com/aesterial/cityideas/backend/internal/api/v1/storage/v1"
	ticketpb "github.com/aesterial/cityideas/backend/internal/api/v1/tickets/v1"
	userpb "github.com/aesterial/cityideas/backend/internal/api/v1/user/v1"
	actionsservice "github.com/aesterial/cityideas/backend/internal/app/actions"
	cityservice "github.com/aesterial/cityideas/backend/internal/app/city"
	emailservice "github.com/aesterial/cityideas/backend/internal/app/email"
	loginservice "github.com/aesterial/cityideas/backend/internal/app/login"
	maintenanceservice "github.com/aesterial/cityideas/backend/internal/app/maintenance"
	projectservice "github.com/aesterial/cityideas/backend/internal/app/project"
	rankservice "github.com/aesterial/cityideas/backend/internal/app/rank"
	sessionservice "github.com/aesterial/cityideas/backend/internal/app/session"
	statisticsservice "github.com/aesterial/cityideas/backend/internal/app/statistics"
	storageservice "github.com/aesterial/cityideas/backend/internal/app/storage"
	ticketservice "github.com/aesterial/cityideas/backend/internal/app/ticket"
	userservice "github.com/aesterial/cityideas/backend/internal/app/user"
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/database"
	"github.com/aesterial/cityideas/backend/internal/infra/database/repositories"
	"github.com/aesterial/cityideas/backend/internal/infra/handlers"
	"github.com/aesterial/cityideas/backend/internal/infra/handlers/interceptors"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/infra/storage"
	"github.com/aesterial/cityideas/backend/internal/shared/cache"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/recovery"
	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
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
	statisticsRepository := repositories.NewStatisticsRepository(conn.Querier())
	actionsRepository := repositories.NewActionsRepository(conn.Querier())
	storageRepository := repositories.NewStorageRepository(conn.Querier())
	cityRepository := repositories.NewCityRepository(conn.Querier())

	storageProvider, err := storage.NewS3Provider(cfg.S3)
	if err != nil {
		logger.Critical("main", "failed to create s3 provider", logger.F("error", err))
		return
	}

	appCache := cache.New(cache.DefaultMaxEntries)
	emailService := emailservice.NewService(userRepository)
	userService := userservice.NewService(userRepository, appCache)
	sessionService := sessionservice.NewService(sessionRepository)
	loginService := loginservice.NewService(userRepository, sessionRepository, emailService, actionsRepository, appCache)
	projectService := projectservice.NewService(projectRepository, appCache)
	ticketService := ticketservice.NewService(ticketRepository, emailService, appCache)
	rankService := rankservice.NewService(rankRepository, appCache)
	maintenanceService := maintenanceservice.NewService(maintenanceRepository, appCache)
	statisticsService := statisticsservice.NewService(statisticsRepository, appCache)
	actionsService := actionsservice.NewService(actionsRepository)
	storageService := storageservice.NewService(storageRepository, storageProvider, cfg.S3)
	cityService := cityservice.NewService(cityRepository)
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
	statisticsHandler := handlers.NewStatisticsHandler(statisticsService, auth)
	actionsHandler := handlers.NewActionsHandler(actionsService, auth)
	storageHandler := handlers.NewStorageHandler(storageService, auth)
	cityHandler := handlers.NewCityHandler(cityService, auth)

	loginpb.RegisterLoginServiceServer(srv, loginHandler)
	userpb.RegisterUserServiceServer(srv, userHandler)
	sessionpb.RegisterSessionServiceServer(srv, sessionHandler)
	projectpb.RegisterProjectsServiceServer(srv, projectHandler)
	rankpb.RegisterRankServiceServer(srv, rankHandler)
	ticketpb.RegisterTicketServiceServer(srv, ticketHandler)
	maintenancepb.RegisterMaintenanceServiceServer(srv, maintenanceHandler)
	statpb.RegisterStatisticServiceServer(srv, statisticsHandler)
	actionspb.RegisterActionsServiceServer(srv, actionsHandler)
	storagepb.RegisterStorageServiceServer(srv, storageHandler)
	citypb.RegisterCitiesServiceServer(srv, cityHandler)

	wrappedSrv := grpcweb.WrapServer(srv,
		grpcweb.WithOriginFunc(func(origin string) bool {
			for _, allowed := range cfg.AllowedOrigins {
				if allowed == "*" || allowed == origin {
					return true
				}
			}
			return false
		}),
	)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"grpc-status", "grpc-message"},
		AllowCredentials: true,
	})

	handler := corsHandler.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if wrappedSrv.IsGrpcWebRequest(r) {
			wrappedSrv.ServeHTTP(w, r)
			return
		}
		srv.ServeHTTP(w, r)
	}))

	logger.Info("main", "starting listener")
	listener, err := net.Listen("tcp", cfg.Host+":"+cfg.Port)
	if err != nil {
		logger.Critical("main", "failed to start listener", logger.F("error", err))
		return
	}
	serveErr := make(chan error, 1)

	h2s := &http2.Server{}
	httpSrv := &http.Server{
		Handler: h2c.NewHandler(handler, h2s),
	}

	go func() {
		logger.Info("main", "serving started", logger.F("port", cfg.Port))
		serveErr <- httpSrv.Serve(listener)
	}()

	select {
	case <-ctx.Done():
		logger.Warning("main", "received interrupt signal")

		done := make(chan struct{})
		go func() {
			_ = httpSrv.Shutdown(context.Background())
			srv.GracefulStop()
			close(done)
		}()

		select {
		case <-done:
		case <-time.After(10 * time.Second):
			srv.Stop()
		}

		err = <-serveErr
		if err != nil && !errors.Is(err, grpc.ErrServerStopped) && !errors.Is(err, http.ErrServerClosed) {
			logger.Warning("main", "serve returned after shutdown", logger.F("error", err))
		}

		logger.Info("main", "server stopped")

	case err = <-serveErr:
		if err != nil && !errors.Is(err, grpc.ErrServerStopped) {
			logger.Critical("main", "server received error", logger.F("error", err))
		}
	}
}
