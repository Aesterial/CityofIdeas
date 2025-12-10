# Ascendant Website
[EN](#ascendant-website) | [RU](#ascendant-website-ru)

Monorepo for Ascendant's web, mobile, and backend surfaces. The web client is built with SvelteKit, the mobile apps with Flutter (Android/iOS), and the backend is a Go workspace scaffolded for future services.

## Table of Contents
- [Architecture](#architecture)
- [Project Layout](#project-layout)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [Environment & Config](#environment--config)
- [Git Workflow & Commit Style](#git-workflow--commit-style)
- [Contributing](#contributing)
- [License](#license)

## Architecture
- Web: SvelteKit + Vite in `frontend/web`, SSR-ready with TypeScript.
- Mobile: Flutter clients under `frontend/mobile/android` and `frontend/mobile/ios`, sharing `lib/main.dart`.
- Backend: Go workspace (`backend/go.work`) with `internal` (domain/app/infra/shared) and `starter` entry module.

## Project Layout
```
backend/            Go workspace (internal packages + starter entry)
frontend/web/       SvelteKit app (src/routes, src/lib, static)
frontend/mobile/    Flutter apps (android/, ios/, shared lib/)
.github/            CI configuration
```

## Prerequisites
- Node 20+ and npm for the web app.
- Go 1.25.5 (per `go.work`) for backend modules.
- Flutter 3.x SDK for mobile builds (with Android/iOS toolchains as needed).

## Quick Start
```sh
git clone https://github.com/4scendant/Website.git
cd Website
```
Web:
```sh
cd frontend/web
npm install
npm run dev
```
Mobile (example for Android):
```sh
cd frontend/mobile/android
flutter pub get
flutter run
```
Backend:
```sh
cd backend
go work sync
# add packages/tests as the services evolve
```

## Development Commands
- Web: `npm run dev`, `npm run build`, `npm run preview`, `npm run check`.
- Backend: `go test ./...` inside `backend/internal` or `backend/starter` when tests are added.
- Mobile: `flutter run` (device/emulator) and `flutter test` from the platform folder.

## Testing
- Web: `npm run check` (Svelte + TS diagnostics). Add `*.spec.ts` with Vitest/Playwright as coverage grows.
- Backend: Table-driven Go tests next to packages (e.g., `internal/app/auth/auth_test.go`), run with `go test ./...`.
- Mobile: Widget/unit tests in `frontend/mobile/*/test` via `flutter test`; mock platform channels when needed.

## Environment & Config
- Web env vars via `.env` in `frontend/web` (Vite conventions).
- Backend service configuration will live under `backend/internal/infra` as components are added.
- Mobile platform secrets should use native secure storage, not hard-coded files.

## Git Workflow & Commit Style
- Use the conventional pattern: `<type>(<scope>): <summary>`.
  - Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `build`, `ci`, `perf`, `revert`.
  - Scopes: `web`, `mobile-android`, `mobile-ios`, `backend-<pkg>` (e.g., `backend-app`, `backend-domain`), or a shared area like `repo`.
  - Examples:
    - `feat(web): add auth landing page`
    - `fix(mobile-android): handle back navigation on login`
    - `chore(backend-domain): add user repo interface`
- Keep PRs small, link issues, and include screenshots/GIFs for UI changes.

## Contributing
- Read `AGENTS.md` for contributor guidelines.
- Before opening a PR: run relevant checks (`npm run check`, `flutter test`, `go test ./...` as applicable).

## License
Distributed under the MIT. See `LICENSE` for details.

---

# Ascendant Website (RU)

Монохранилище для веба, мобильных клиентов и бэкенда Ascendant. Веб собирается на SvelteKit + Vite, мобильные приложения на Flutter (Android/iOS), бэкенд — Go workspace.

## Содержание
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Команды разработки](#команды-разработки)
- [Тестирование](#тестирование-1)
- [Окружение и конфиг](#окружение-и-конфиг)
- [Git и стиль коммитов](#git-и-стиль-коммитов)
- [Вклад](#вклад)
- [Лицензия](#лицензия)

## Архитектура
- Веб: SvelteKit + Vite в `frontend/web`, TypeScript и SSR.
- Мобильные: Flutter в `frontend/mobile/android` и `frontend/mobile/ios`, общий `lib/main.dart`.
- Бэкенд: Go workspace (`backend/go.work`) с модулями `internal` (domain/app/infra/shared) и `starter`.

## Структура проекта
```
backend/            Go workspace (internal + starter)
frontend/web/       SvelteKit (src/routes, src/lib, static)
frontend/mobile/    Flutter (android/, ios/, shared lib/)
.github/            CI конфигурация
```

## Требования
- Node 20+ и npm для веба.
- Go 1.25.5 для бэкенда.
- Flutter 3.x SDK + инструменты Android/iOS.

## Быстрый старт
```sh
git clone https://github.com/4scendant/Website.git
cd Website
```
Веб:
```sh
cd frontend/web
npm install
npm run dev
```
Мобильный (Android):
```sh
cd frontend/mobile/android
flutter pub get
flutter run
```
Бэкенд:
```sh
cd backend
go work sync
```

## Команды разработки
- Веб: `npm run dev`, `npm run build`, `npm run preview`, `npm run check`.
- Бэкенд: `go test ./...` в `backend/internal` или `backend/starter` (когда появятся тесты).
- Мобильные: `flutter run` и `flutter test` из каталога платформы.

## Тестирование
- Веб: `npm run check`; будущие тесты — `*.spec.ts` (Vitest/Playwright).
- Бэкенд: табличные тесты рядом с пакетами (пример `internal/app/auth/auth_test.go`), запуск `go test ./...`.
- Мобильные: `flutter test` в `frontend/mobile/*/test`; по возможности мокать платформенные каналы.

## Окружение и конфиг
- Веб: переменные через `.env` в `frontend/web` (формат Vite).
- Бэкенд: конфиги будут в `backend/internal/infra` по мере роста сервисов.
- Мобильные: секреты хранить в безопасных хранилищах платформ, не в коде.

## Git и стиль коммитов
- Шаблон: `<type>(<scope>): <summary>`.
  - Типы: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `build`, `ci`, `perf`, `revert`.
  - Скоупы: `web`, `mobile-android`, `mobile-ios`, `backend-<pkg>` (например `backend-app`, `backend-domain`) или общий `repo`.
  - Примеры:
    - `feat(web): add auth landing page`
    - `fix(mobile-android): handle back navigation on login`
    - `chore(backend-domain): add user repo interface`
- PR: мелкие изменения, ссылки на задачи, скриншоты/гифки для UI.

## Вклад
- Смотрите `AGENTS.md` для гайда по проекту.
- Перед PR: запускайте `npm run check`, `flutter test`, `go test ./...` по релевантным частям.

## Лицензия
Распространяется под MIT. См. `LICENSE`.
