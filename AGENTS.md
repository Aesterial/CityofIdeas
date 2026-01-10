# Repository Guidelines

## Project Structure & Module Organization
- Root folders: `backend` (Go) and `frontend/web` (Next.js + React).
- Backend: `backend/internal` holds domain/app/infra/shared packages; `backend/starter` is the entry module. `go.work` ties both modules together.
- Web: Next.js App Router lives in `frontend/web/app` (routes/layouts). Shared UI in `frontend/web/components`, utilities in `frontend/web/lib`, styles in `frontend/web/styles`, static assets in `frontend/web/public`. `.next` and `node_modules` are generated; do not edit manually.

## Build, Test, and Development Commands
- Web (from `frontend/web`):
  - `npm install` to sync dependencies.
  - `npm run dev` to start Next.js dev server.
  - `npm run build` to produce a production bundle; `npm run start` to serve it.
  - `npm run lint` to run ESLint checks.
- Backend (from `backend`):
  - `go work sync` after dependency changes to refresh workspace.
  - `go test ./...` from `backend/internal` or `backend/starter` to run Go unit tests when added.

## Coding Style & Naming Conventions
- Web: TypeScript + React (Next.js); strict compiler options are enabled. Use 2-space indentation and keep components in `PascalCase.tsx`. Prefer `@/` imports over relative `../../`.
- Backend: Stick to standard Go patterns (`gofmt` before commit); package names remain lowercase short nouns (`logger`, `db`, `user`).

## Testing Guidelines
- Web: `npm run lint` is the required pre-push sanity pass; add Playwright/Vitest when feature tests arrive, naming files `*.spec.tsx`.
- Backend: Add table-driven tests alongside packages (e.g., `internal/app/auth/auth_test.go`) and keep coverage high on domain logic.

## Commit & Pull Request Guidelines
- Commits: Use short, imperative subjects; scope prefixes are welcome (e.g., `feat: add auth layout`, `chore: sync go.work`). Group unrelated changes into separate commits.
- PRs: Include a concise summary, key commands run (e.g., `npm run check`), and screenshots/GIFs for UI changes. Link to issues/targets when available and note any configuration or migration steps.
