# CityofIdeas-RSV

![Aesterial logo](.github/assets/logo.svg)

Aesterial civic engagement platform with a Next.js web client, a Go backend, and deployment scaffolding for map-driven idea collection, moderation, voting, and support workflows.

[![License](https://img.shields.io/badge/license-AGPL--3.0-2ea44f)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
[![Tests](https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/auto-test.yml/badge.svg)](https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/auto-test.yml)
[![Lint](https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/auto-lint.yml/badge.svg)](https://github.com/Aesterial/CityofIdeas-RSV/actions/workflows/auto-lint.yml)

## Overview

`CityofIdeas-RSV` is a monorepo for a city participation platform with five main parts:

- `frontend/web/`: Next.js web application for citizens, moderators, and administrators
- `backend/internal/`: core Go packages organized into `domain/app/infra/shared`
- `backend/starter/`: HTTP, gRPC, and gRPC-Web bootstrap for the main backend service
- `backend/mail-proxy/`: optional Go mail proxy service used for outbound delivery flows
- `backend/gen/openapi/`: generated OpenAPI output for API consumers and tooling

## Documentation

- [backend/starter/.env.example](backend/starter/.env.example) - local backend environment template
- [backend/gen/openapi/openapi.yaml](backend/gen/openapi/openapi.yaml) - generated OpenAPI description
- [backend/setup/instructions.txt](backend/setup/instructions.txt) - setup notes and helper scripts

## Current State

### Web application

- Public landing page with map-driven idea and project discovery
- Suggestion submission flow with location selection and media support
- Project pages with discussion threads, likes, and archive views
- User account area, authentication, and support request flows
- Admin panels for statistics, users, submissions, maintenance, support, and moderation
- Multilingual interface with Russian, English, and Kazakh content paths in the UI
- Built with `Next.js 16`, `React 19`, `TypeScript`, and Tailwind-based styling

### Backend and integrations

- Layered Go backend with `domain/app/infra` separation
- HTTP, gRPC, and gRPC-Web entrypoints exposed from `backend/starter`
- Registered service surface for:
  - `LoginService`
  - `UserService`
  - `StatisticsService`
  - `ProjectService`
  - `StorageService`
  - `RanksService`
  - `SubmissionsService`
  - `MaintenanceService`
  - `TicketsService`
  - `NotificationService`
  - `CheckerService`
- PostgreSQL-backed persistence and checked-in SQL migration files
- Object storage, SMTP, mail proxy, VK auth, and geocoding integration points
- Generated protobuf and OpenAPI artifacts committed in the repository

### Infrastructure

- Root `docker-compose.yml` for frontend, backend, reverse proxy, and mail-proxy build profile
- `Caddyfile` template for TLS termination and `/api/*` reverse proxying
- `run.bat` helper for Windows-based dependency installation and local dev startup

## Repository Layout

```text
CityofIdeas-RSV/
|-- frontend/
|   |-- web/                  # Next.js app
|   `-- reference/            # design/reference assets
|-- backend/
|   |-- internal/             # core Go packages, generated stubs, protobuf inputs
|   |-- starter/              # main backend bootstrap
|   |-- mail-proxy/           # mail proxy service
|   |-- migrations/           # SQL schema files
|   |-- gen/openapi/          # generated OpenAPI output
|   `-- setup/                # environment bootstrap helpers
|-- .github/                  # workflows and repository assets
|-- docker-compose.yml        # deployment-oriented service stack
|-- Caddyfile                 # reverse proxy template
`-- run.bat                   # Windows helper for install and dev runs
```

## Prerequisites

- `Node.js` with `npm`
- `Go 1.26`
- `Git` with submodule support
- `PostgreSQL` for local backend development
- Optional S3-compatible storage and SMTP credentials for media and mail flows
- `Docker` if you want to use the root Compose stack

## Quick Start

1. Clone the repository:

   ```sh
   git clone https://github.com/Aesterial/CityofIdeas-RSV.git
   cd CityofIdeas-RSV
   ```

2. Initialize the protobuf dependencies:

   ```sh
   git submodule update --init --recursive backend/internal/proto/third_party/googleapis backend/internal/proto/third_party/grpc-web
   ```

3. Install web dependencies:

   ```sh
   cd frontend/web
   npm install
   cd ../..
   ```

4. Prepare the Go workspace and backend environment:

   ```powershell
   cd backend
   go work sync
   Copy-Item starter/.env.example starter/.env
   ```

   Update `backend/starter/.env` with local database credentials and any storage, SMTP, or proxy settings needed for the flows you want to exercise.

5. Start the application in development mode:

   Web:

   ```sh
   cd frontend/web
   npm run dev
   ```

   Backend:

   ```sh
   cd backend/starter
   go run .
   ```

6. Optional Windows shortcut:

   ```bat
   run.bat
   ```

   The helper script can open separate terminals for `npm install`, `go get .`, `npm run dev`, and `go run .`.

## Docker Compose

For the deployment-oriented stack, use the root Compose file:

```sh
docker compose up --build
```

This stack starts:

- `aesterial_frontend`: production Next.js container
- `aesterial_backend`: backend service container
- `caddy`: TLS termination and reverse proxy
- `aesterial_backend_mail`: optional mail-proxy build profile

Notes:

- The Compose file expects external infrastructure through environment variables, including PostgreSQL and storage settings.
- The backend container mounts `db.ca.crt` for TLS database connectivity.
- The checked-in `Caddyfile` uses `example.com`, `www.example.com`, and `admin@example.com` placeholders and must be updated before deployment.

## Development Commands

### Web

- `npm run dev` - start the Next.js dev server
- `npm run build` - build the production bundle
- `npm run start` - run the production server locally
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks

### Backend

- `go work sync` - sync workspace modules
- `go run .` from `backend/starter` - run the main backend service
- `go test ./...` from `backend/internal`, `backend/starter`, or `backend/mail-proxy` - run Go tests

## License

AGPL-3.0. See [LICENSE](LICENSE) for details.
