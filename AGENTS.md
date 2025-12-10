# Repository Guidelines

## Project Structure & Module Organization
- Root folders: `backend` (Go), `frontend/web` (SvelteKit), `frontend/mobile` (Flutter for Android and iOS).
- Backend: `backend/internal` holds domain/app/infra/shared packages; `backend/starter` is the entry module. `go.work` ties both modules together.
- Web: Svelte source lives in `frontend/web/src` (`routes` for pages, `lib` for shared code/assets). `.svelte-kit` and `node_modules` are generated; do not edit manually.
- Mobile: Flutter apps sit in `frontend/mobile/android` and `frontend/mobile/ios` with `lib/main.dart` as the shared entry. Platform-specific files live under each platform’s `android`/`ios` directories.

## Build, Test, and Development Commands
- Web (from `frontend/web`):
  - `npm install` to sync dependencies.
  - `npm run dev` to start Vite dev server.
  - `npm run build` to produce a production bundle; `npm run preview` to serve it.
  - `npm run check` (or `npm run check:watch`) to run Svelte/TypeScript diagnostics.
- Backend (from `backend`):
  - `go work sync` after dependency changes to refresh workspace.
  - `go test ./...` from `backend/internal` or `backend/starter` to run Go unit tests when added.
- Mobile:
  - `flutter pub get` inside `frontend/mobile/android` or `frontend/mobile/ios` to install Dart deps.
  - `flutter run` to launch on an emulator/device; `flutter test` for widget/unit tests.

## Coding Style & Naming Conventions
- Web: TypeScript + Svelte; strict compiler options are enabled. Use 2-space indentation and keep Svelte components in `PascalCase.svelte`. Prefer `$lib` imports over relative `../../`.
- Backend: Stick to standard Go patterns (`gofmt` before commit); package names remain lowercase short nouns (`logger`, `db`, `user`).
- Mobile: Flutter follows `flutter_lints`; use lower_snake_case for files, `UpperCamelCase` for types/widgets, and `lowerCamelCase` for members.

## Testing Guidelines
- Web: `npm run check` is the required pre-push sanity pass; add Playwright/Vitest when feature tests arrive, naming files `*.spec.ts`.
- Backend: Add table-driven tests alongside packages (e.g., `internal/app/auth/auth_test.go`) and keep coverage high on domain logic.
- Mobile: Place Dart tests in `test/`; widget tests should mock platform channels where possible.

## Commit & Pull Request Guidelines
- Commits: Use short, imperative subjects; scope prefixes are welcome (e.g., `feat: add auth layout`, `chore: sync go.work`). Group unrelated changes into separate commits.
- PRs: Include a concise summary, key commands run (e.g., `npm run check`, `flutter test`), and screenshots/GIFs for UI changes (web or mobile). Link to issues/targets when available and note any configuration or migration steps.
