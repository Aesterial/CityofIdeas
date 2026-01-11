#!/usr/bin/env bash
set -euo pipefail

ENV_PATH="./.env"
CONTAINER_NAME="dev-postgres16"
VOLUME_NAME="dev-postgres16-data"
PULL="IfMissing"
RECREATE=0

usage() {
  cat <<'EOF'
Usage: postgres-install-(docker).sh [options]
  -e, --env PATH           Path to .env (default: ./.env)
  -n, --name NAME          Docker container name (default: dev-postgres16)
  -v, --volume NAME        Docker volume name (default: dev-postgres16-data)
  -p, --pull POLICY        Pull policy: IfMissing|Always|Never (default: IfMissing)
  -r, --recreate           Remove and recreate container if it exists
  -h, --help               Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env) ENV_PATH="$2"; shift 2 ;;
    -n|--name) CONTAINER_NAME="$2"; shift 2 ;;
    -v|--volume) VOLUME_NAME="$2"; shift 2 ;;
    -p|--pull) PULL="$2"; shift 2 ;;
    -r|--recreate) RECREATE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

load_dotenv() {
  local path="$1"
  [[ -f "$path" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="$(trim "$line")"
    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
    [[ "$line" != *=* ]] && continue
    local key val
    key="$(trim "${line%%=*}")"
    val="$(trim "${line#*=}")"
    if [[ ( "$val" == \"*\" && "$val" == *\" ) || ( "$val" == \'*\' && "$val" == *\' ) ]]; then
      val="${val:1:${#val}-2}"
    fi
    export "$key=$val"
  done < "$path"
}

format_dotenv_value() {
  local v="$1"
  if [[ "$v" =~ [[:space:]#=] || "$v" == *\"* ]]; then
    v="${v//\"/\\\"}"
    printf '"%s"' "$v"
  else
    printf '%s' "$v"
  fi
}

upsert_dotenv_pairs() {
  local file="$1"; shift
  local tmp
  tmp="$(mktemp)"
  declare -A seen=()

  if [[ -f "$file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      local replaced=0
      for pair in "$@"; do
        local key="${pair%%=*}"
        local val="${pair#*=}"
        if [[ "$line" =~ ^[[:space:]]*$key[[:space:]]*= ]]; then
          echo "$key=$(format_dotenv_value "$val")" >> "$tmp"
          seen["$key"]=1
          replaced=1
          break
        fi
      done
      if [[ "$replaced" -eq 0 ]]; then
        echo "$line" >> "$tmp"
      fi
    done < "$file"
  fi

  for pair in "$@"; do
    local key="${pair%%=*}"
    local val="${pair#*=}"
    if [[ -z "${seen[$key]:-}" ]]; then
      echo "$key=$(format_dotenv_value "$val")" >> "$tmp"
    fi
  done

  mv "$tmp" "$file"
}

ensure_docker() {
  command -v docker >/dev/null 2>&1 || { echo "Docker not found in PATH." >&2; exit 1; }
  docker version >/dev/null 2>&1 || { echo "Docker daemon is not available." >&2; exit 1; }
}

ensure_image() {
  local image="$1"
  case "$PULL" in
    Always)
      echo "Pulling image (Always): $image"
      docker pull "$image" >/dev/null
      ;;
    IfMissing)
      if ! docker image inspect "$image" >/dev/null 2>&1; then
        echo "Pulling image (IfMissing): $image"
        docker pull "$image" >/dev/null
      else
        echo "Image already exists: $image"
      fi
      ;;
    Never)
      if ! docker image inspect "$image" >/dev/null 2>&1; then
        echo "Image not found locally and Pull=Never: $image" >&2
        exit 1
      fi
      echo "Pull skipped (Never), image exists: $image"
      ;;
    *)
      echo "Unknown pull policy: $PULL" >&2
      exit 1
      ;;
  esac
}

wait_postgres_ready() {
  local name="$1"
  local seconds="${2:-45}"
  local deadline=$((SECONDS + seconds))
  while (( SECONDS < deadline )); do
    if docker exec "$name" pg_isready >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "PostgreSQL is not ready after ${seconds}s." >&2
  return 1
}

ensure_role_and_db() {
  local name="$1" user="$2" db="$3"
  local sql_role="DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$user') THEN CREATE ROLE $user WITH LOGIN; END IF; END \$\$;"
  local sql_db="DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$db') THEN CREATE DATABASE $db OWNER $user; END IF; END \$\$;"
  local attempts=("postgres" "$user")

  for u in "${attempts[@]}"; do
    if docker exec "$name" psql -U "$u" -d postgres -v ON_ERROR_STOP=1 -c "$sql_role" >/dev/null 2>&1 &&
       docker exec "$name" psql -U "$u" -d postgres -v ON_ERROR_STOP=1 -c "$sql_db" >/dev/null 2>&1; then
      return 0
    fi
  done
}

ensure_docker
load_dotenv "$ENV_PATH"

db_host="${DATABASE_HOST:-127.0.0.1}"
db_port="${DATABASE_PORT:-5432}"
db_name="${DATABASE_NAME:-devdb}"
db_user="${DATABASE_USER:-devuser}"
db_pass="${DATABASE_PASS:-devpass}"

upsert_dotenv_pairs "$ENV_PATH" \
  "DATABASE_HOST=$db_host" \
  "DATABASE_PORT=$db_port" \
  "DATABASE_NAME=$db_name" \
  "DATABASE_USER=$db_user" \
  "DATABASE_PASS=$db_pass"

load_dotenv "$ENV_PATH"

image="postgres:16"
ensure_image "$image"

exists="$(docker ps -a --format "{{.Names}}" | grep -Fx "$CONTAINER_NAME" || true)"
if [[ -n "$exists" && "$RECREATE" -eq 1 ]]; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
  exists=""
fi

if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  docker volume create "$VOLUME_NAME" >/dev/null
fi

if [[ -z "$exists" ]]; then
  docker run -d --name "$CONTAINER_NAME" \
    -p "${db_port}:5432" \
    --restart unless-stopped \
    -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
    -e POSTGRES_USER="$db_user" \
    -e POSTGRES_PASSWORD="$db_pass" \
    -e POSTGRES_DB="$db_name" \
    "$image" >/dev/null
else
  running="$(docker ps --format "{{.Names}}" | grep -Fx "$CONTAINER_NAME" || true)"
  if [[ -z "$running" ]]; then
    docker start "$CONTAINER_NAME" >/dev/null
  fi
fi

wait_postgres_ready "$CONTAINER_NAME" 60
ensure_role_and_db "$CONTAINER_NAME" "$db_user" "$db_name"

echo "OK: PostgreSQL 16 (Docker) is running."
echo "Host: $db_host  Port: $db_port"
echo "DB:   $db_name  User: $db_user"
echo "Container: $CONTAINER_NAME"
echo "Volume:    $VOLUME_NAME"
echo ""
echo "Connect:"
echo "  psql -h $db_host -p $db_port -U $db_user -d $db_name"
