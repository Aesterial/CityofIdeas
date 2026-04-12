package main

import (
	"github.com/aesterial/cityideas/backend/internal/infra/config"
	"github.com/aesterial/cityideas/backend/internal/infra/logger"
)

func main() {
	if err := config.Ensure(); err != nil {
		logger.Critical("main", "failed to ensure config", logger.F("error", err))
		return
	}
	log := logger.New()
	log.SetDefault()
}
