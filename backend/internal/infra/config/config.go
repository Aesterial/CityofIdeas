package config

import (
	"os"
	"slices"
	"strconv"
	"strings"

	configdomain "github.com/aesterial/cityideas/backend/internal/domain/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
	"github.com/aesterial/cityideas/backend/internal/shared/errors"
	"github.com/joho/godotenv"
)

var cfg configdomain.Config

func parseType[T any](tag string, def T) T {
	value := os.Getenv(tag)
	if value == "" {
		return def
	}
	switch any(def).(type) {
	case int:
		i, err := strconv.Atoi(value)
		if err != nil {
			return def
		}
		return any(i).(T)
	case bool:
		b, err := strconv.ParseBool(value)
		if err != nil {
			return def
		}
		return any(b).(T)
	case string:
		return any(value).(T)
	case float64:
		f, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return def
		}
		return any(f).(T)
	case []string:
		return any(slices.Collect(strings.SplitSeq(value, ","))).(T)
	default:
		return def
	}
}

func Ensure() error {
	_ = godotenv.Load(".env")
	cfg = configdomain.Config{
		Database: configdomain.Database{
			Host:     parseType("POSTGRES_HOST", "127.0.0.1"),
			Port:     parseType("POSTGRES_PORT", "5432"),
			Name:     parseType("POSTGRES_NAME", "postgres"),
			TlsMode:  configdomain.ParseTls(parseType("POSTGRES_TLS", "require")),
			User:     parseType("POSTGRES_USER", "postgres"),
			Password: parseType("POSTGRES_PASSWORD", "postgres"),
		},
		Cookie: configdomain.Cookie{
			Name:   parseType("COOKIE_NAME", "session"),
			Secret: parseType("COOKIE_SECRET", ""),
			Issuer: parseType("COOKIE_ISSUER", "https://aesterial.xyz"),
		},
		Email: configdomain.Email{
			API:    parseType("EMAIL_API_KEY", ""),
			Name:   parseType("EMAIL_NAME", "Aesterial Support"),
			Domain: parseType("EMAIL_DOMAIN", "support@aesterial.xyz"),
		},
		Security:       configdomain.Security{ActionsDuration: parseType("SECURITY_DURATION", 20)},
		AllowedOrigins: parseType("ALLOWED_ORIGINS", []string{"https://aesterial.xyz"}),
		Domain:         parseType("DOMAIN", "https://aesterial.xyz"),
		Host:           parseType("HOST", "0.0.0.0"),
		Debug:          parseType("DEBUG", false),
		Port:           parseType("PORT", "8080"),
		Loaded:         true,
	}
	if !cfg.Database.TlsMode.IsValid() || ((cfg.Database.TlsMode == configdomain.TlsDisable) && cfg.IsProduction()) {
		return errors.InvalidArguments
	}
	if cfg.Cookie.Secret == "" {
		return errors.InvalidArguments
	}
	cfg.Email.Enabled = strings.TrimSpace(cfg.Email.API) != ""
	return nil
}

func Get() configdomain.Config {
	if !cfg.Loaded {
		if err := Ensure(); err != nil {
			logger.Error("config", "failed to load config", logger.F("error", err))
		}
	}
	return cfg
}
