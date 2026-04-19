<h1 align="center">CityofIdeas-RSV</h1>

<p align="center">
  <img src="./.github/assets/logo.svg" alt="CityofIdeas-RSV logo" width="96" />
</p>

<p align="center">
  <i>Civic participation platform with a Next.js web client, a Go gRPC backend, and Buf-based API contracts.</i>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-3e4c75.svg?style=flat-square" alt="AGPL-3.0 license" /></a>
  <img src="https://img.shields.io/badge/stack-Next.js%20%2B%20TypeScript%20%2B%20Go%20%2B%20gRPC%20%2B%20PostgreSQL-222?style=flat-square" alt="Tech stack" />
  <img src="https://img.shields.io/badge/contracts-Buf%20%2B%20Protobuf-0F766E?style=flat-square" alt="Buf and Protobuf" />
  <br />
  <a href="https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/go-link-static.yml"><img src="https://img.shields.io/github/actions/workflow/status/Aesterial/CityofIdeas-RSV/go-link-static.yml?branch=main&style=flat-square&label=Go%20CI" alt="Go CI status" /></a>
  <a href="https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/web-link-typecheck.yml"><img src="https://img.shields.io/github/actions/workflow/status/Aesterial/CityofIdeas-RSV/web-link-typecheck.yml?branch=main&style=flat-square&label=Web%20CI" alt="Web CI status" /></a>
  <a href="https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/buf-lint.yml"><img src="https://img.shields.io/github/actions/workflow/status/Aesterial/CityofIdeas-RSV/buf-lint.yml?branch=main&style=flat-square&label=Buf%20Lint" alt="Buf Lint status" /></a>
</p>

## Overview

`CityofIdeas-RSV` is a monorepo for a city engagement platform with three main parts:

- `frontend/`: Next.js application for citizens, moderators, support staff, and administrators
- `backend/`: Go backend with layered `domain/app/infra/shared` structure and a gRPC entrypoint
- `api/`: protobuf contracts plus Buf configuration for generated backend stubs

## Documentation

- [api/buf.yaml](./api/buf.yaml) - Buf module and lint configuration
- [api/buf.gen.yaml](./api/buf.gen.yaml) - Go generation targets for protobuf and gRPC stubs
- [backend/migrations/scheme/scheme.sql](./backend/migrations/scheme/scheme.sql) - PostgreSQL schema bootstrap
- [docker-compose.yml](./docker-compose.yml) - deployment-oriented service wiring for backend, frontend, and proxy

## Current State

### Web application

- Public landing and navigation flow built on the Next.js app router
- Idea submission, voting, project pages, support flows, authentication, and user pages
- Admin areas for users, support, submissions, and maintenance
- Built with `Next.js 16`, `React 19`, `TypeScript`, Tailwind CSS, and Radix UI primitives

### Backend and API

- Main backend entrypoint at `backend/cmd/city-ideasd`
- Layered Go packages under `backend/internal/domain`, `backend/internal/app`, and `backend/internal/infra`
- gRPC services currently registered for login, user, and session flows
- PostgreSQL access via `pgx` + `sqlc`, with checked-in schema and query files
- Generated protobuf stubs committed in `backend/internal/api`

### Delivery scaffolding

- Multi-stage Dockerfiles for `backend/` and `frontend/`
- Root Docker workflow that publishes backend and frontend images to Docker Hub
- Root `docker-compose.yml` that wires published images behind Caddy and expects deployment-specific environment variables

## Repository Layout

```text
CityofIdeas-RSV/
|-- frontend/
|   |-- app/                 # Next.js app router pages
|   |-- components/          # shared UI and feature components
|   |-- lib/                 # API helpers and shared frontend utilities
|   `-- public/              # static assets
|-- backend/
|   |-- cmd/city-ideasd/     # main backend entrypoint
|   |-- internal/            # domain, app, infra, generated API stubs
|   |-- migrations/          # schema and sqlc query sources
|   `-- Dockerfile           # backend container build
|-- api/
|   |-- xyz.city_ideas.v1/   # protobuf contracts
|   `-- third_party/         # protobuf dependencies
|-- .github/                 # workflows and repository assets
|-- docker-compose.yml       # deployment stack based on published images
`-- run.bat                  
```

## Prerequisites

- `Node.js 20+` with `npm`
- `Go 1.26`
- `Git` with submodule support
- `PostgreSQL` for local backend development
- `Docker` if you want to build images or use the deployment stack
- `Buf` if you want to lint or regenerate protobuf artifacts locally

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/Aesterial/CityofIdeas-RSV.git
cd CityofIdeas-RSV
```

2. Initialize protobuf dependencies:

```bash
git submodule update --init --recursive api/third_party/googleapis
```

3. Install frontend dependencies:

```bash
cd frontend
npm ci
cd ..
```

4. Download backend dependencies:

```bash
cd backend
go mod download
cd ..
```

5. Export the minimum backend environment.

```powershell
$env:POSTGRES_HOST = "127.0.0.1"
$env:POSTGRES_PORT = "5432"
$env:POSTGRES_NAME = "postgres"
$env:POSTGRES_USER = "postgres"
$env:POSTGRES_PASSWORD = "postgres"
$env:POSTGRES_TLS = "disable"
$env:COOKIE_SECRET = "change-me"
$env:PORT = "8080"
```

6. Start the backend:

```bash
cd backend
go run ./cmd/city-ideasd
```

7. Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

## Local Quality Checks

### Go

```bash
cd backend
gofmt -w .
go vet ./...
go test ./... -run '^$'
```

### Web

```bash
cd frontend
npm run typecheck
npm run build
```

### API contracts

```bash
cd api
buf lint
buf generate
```

Generated Go outputs are written into `backend/internal/api/...`.

## License

This project is licensed under the [GNU AGPL-3.0](./LICENSE).
