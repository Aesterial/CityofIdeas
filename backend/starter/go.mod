module ascendant/backend/start

go 1.25

require (
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.27.4
	github.com/improbable-eng/grpc-web v0.15.0
	golang.org/x/net v0.48.0
	google.golang.org/grpc v1.78.0
)

require (
	github.com/cenkalti/backoff/v4 v4.3.0 // indirect
	github.com/desertbit/timer v1.0.1 // indirect
	github.com/klauspost/compress v1.18.2 // indirect
	github.com/rs/cors v1.11.1 // indirect
	golang.org/x/sys v0.39.0 // indirect
	golang.org/x/text v0.32.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20251222181119-0a764e51fe1b // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251222181119-0a764e51fe1b // indirect
	google.golang.org/protobuf v1.36.11 // indirect
	nhooyr.io/websocket v1.8.17 // indirect
)

replace github.com/improbable-eng/grpc-web => ../internal/proto/third_party/grpc-web
