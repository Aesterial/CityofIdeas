package safe

import (
	"ascendant/backend/internal/infra/logger"
	"fmt"
	"runtime/debug"
)

func Go(name string, fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				msg := fmt.Sprintf("%v", r)
				stack := debug.Stack()
				logger.Debug(string(stack), "safego.crash")
				logger.Error(
					fmt.Sprintf("Goroutine %s crashed: %s", name, msg),
					"safego.crash",
					logger.EventActor{Type: logger.System, ID: 0},
					logger.Failure,
				)
			}
		}()
		fn()
	}()
}
