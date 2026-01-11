#!/usr/bin/env bash
set -euo pipefail

ENV_PATH="./.env"
PG_VERSION="16"
PG_PORT="5432"

usage() {
  cat <<'EOF'
Usage: postgres-install-(non-docker).sh [options]
  -e, --env PATH           Path to .env (default: ./.env)
  -p, --port PORT          PostgreSQL port (default: 5432)
  -V, --pg-version VER     PostgreSQL major version (default: 16)
  -h, --help               Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env) ENV_PATH="$2"; shift 2 ;;
    -p|--port) PG_PORT="$2"; shift 2 ;;
    -V|--pg-version) PG_VERSION="$2"; shift 2 ;;
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

SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "This script needs root or sudo privileges." >&2
    exit 1
  fi
fi

as_postgres() {
  if command -v sudo >/dev/null 2>&1; then
    sudo -iu postgres "$@"
  else
    su - postgres -c "$(printf '%q ' "$@")"
  fi
}

start_service() {
  local name="$1"
  if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl enable --now "$name"
  elif command -v service >/dev/null 2>&1; then
    $SUDO service "$name" start
  else
    echo "No service manager found. Start PostgreSQL manually." >&2
    exit 1
  fi
}

restart_service() {
  local name="$1"
  if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl restart "$name"
  elif command -v service >/dev/null 2>&1; then
    $SUDO service "$name" restart
  else
    echo "No service manager found. Restart PostgreSQL manually." >&2
    exit 1
  fi
}

wait_port() {
  local host="$1" port="$2" seconds="${3:-30}"
  local deadline=$((SECONDS + seconds))
  while (( SECONDS < deadline )); do
    if (echo > "/dev/tcp/$host/$port") >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
  echo "Port $host:$port is not open after ${seconds}s." >&2
  return 1
}

install_postgres() {
  if command -v psql >/dev/null 2>&1; then
    return 0
  fi

  local mgr=""
  if command -v apt-get >/dev/null 2>&1; then
    mgr="apt"
  elif command -v dnf >/dev/null 2>&1; then
    mgr="dnf"
  elif command -v yum >/dev/null 2>&1; then
    mgr="yum"
  elif command -v pacman >/dev/null 2>&1; then
    mgr="pacman"
  elif command -v zypper >/dev/null 2>&1; then
    mgr="zypper"
  fi

  if [[ -z "$mgr" ]]; then
    echo "No supported package manager found (apt, dnf, yum, pacman, zypper)." >&2
    exit 1
  fi

  echo "Installing PostgreSQL..."
  case "$mgr" in
    apt)
      $SUDO apt-get update
      if apt-cache show "postgresql-$PG_VERSION" >/dev/null 2>&1; then
        $SUDO apt-get install -y "postgresql-$PG_VERSION" "postgresql-client-$PG_VERSION"
      else
        $SUDO apt-get install -y postgresql postgresql-client
      fi
      ;;
    dnf)
      $SUDO dnf install -y postgresql-server postgresql-contrib
      if command -v postgresql-setup >/dev/null 2>&1; then
        $SUDO postgresql-setup --initdb --unit postgresql || $SUDO postgresql-setup --initdb
      fi
      ;;
    yum)
      $SUDO yum install -y postgresql-server postgresql-contrib
      if command -v postgresql-setup >/dev/null 2>&1; then
        $SUDO postgresql-setup --initdb --unit postgresql || $SUDO postgresql-setup --initdb
      fi
      ;;
    pacman)
      $SUDO pacman -S --noconfirm postgresql
      if [[ ! -f /var/lib/postgres/data/PG_VERSION ]]; then
        as_postgres initdb -D /var/lib/postgres/data
      fi
      ;;
    zypper)
      $SUDO zypper -n install postgresql postgresql-server
      if command -v postgresql-setup >/dev/null 2>&1; then
        $SUDO postgresql-setup --initdb --unit postgresql || $SUDO postgresql-setup --initdb
      fi
      ;;
  esac
}

load_dotenv "$ENV_PATH"

db_host="${DATABASE_HOST:-127.0.0.1}"
db_port="${DATABASE_PORT:-$PG_PORT}"
db_name="${DATABASE_NAME:-devdb}"
db_user="${DATABASE_USER:-devuser}"
db_pass="${DATABASE_PASS:-devpass}"

install_postgres
start_service "postgresql"

if [[ "$db_port" == "5432" ]]; then
  wait_port "127.0.0.1" "$db_port" 30
else
  if wait_port "127.0.0.1" "5432" 15; then
    current_port="$(as_postgres psql -tA -p 5432 -d postgres -c "SHOW port" | tr -d '[:space:]' || true)"
    if [[ -n "$current_port" && "$current_port" != "$db_port" ]]; then
      as_postgres psql -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "ALTER SYSTEM SET port = '$db_port';"
      restart_service "postgresql"
    fi
  fi
  wait_port "127.0.0.1" "$db_port" 30
fi

psql_cmd() {
  local sql="$1"
  as_postgres psql -p "$db_port" -d postgres -v ON_ERROR_STOP=1 -X -c "$sql"
}

if [[ -n "${POSTGRES_SUPER_PASS:-}" ]]; then
  psql_cmd "ALTER USER postgres WITH PASSWORD '$POSTGRES_SUPER_PASS';"
fi

sql_role=$(cat <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$db_user') THEN
    EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', '$db_user', '$db_pass');
  END IF;
END
\$\$;
SQL
)

sql_db=$(cat <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$db_name') THEN
    EXECUTE format('CREATE DATABASE %I OWNER %I', '$db_name', '$db_user');
  END IF;
END
\$\$;
SQL
)

psql_cmd "$sql_role"
psql_cmd "$sql_db"

upsert_dotenv_pairs "$ENV_PATH" \
  "DATABASE_HOST=$db_host" \
  "DATABASE_PORT=$db_port" \
  "DATABASE_NAME=$db_name" \
  "DATABASE_USER=$db_user" \
  "DATABASE_PASS=$db_pass"

echo "OK: PostgreSQL is installed and running."
echo "DB:  $db_host:$db_port  name=$db_name user=$db_user"
echo "Env file updated: $ENV_PATH"
