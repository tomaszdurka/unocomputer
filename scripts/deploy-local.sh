#!/usr/bin/env bash
set -euo pipefail

# Local macOS deployment.
#
# Builds both apps and installs them as launchd user agents so the app runs in
# the background as a local web app and survives reboots.
#
#   deploy     build + install + (re)start services        (default)
#   status     show service state and health
#   logs       tail both logs
#   uninstall  stop services and remove code (keeps the database)
#
# Layout:
#   ~/Library/Application Support/<name>/backend   deployed backend
#   ~/Library/Application Support/<name>/admin     deployed admin (Next standalone)
#   ~/Library/Application Support/<name>/data      SQLite database (uno-computer.db)
#   ~/Library/Logs/<name>/                         backend.log, admin.log
#   ~/Library/LaunchAgents/com.<name>.{backend,admin}.plist
#
# The app is served on ONE port. Dev uses an OS-assigned port (PORT=0), so a
# deployment and a dev server can run side by side without ever colliding.
# The deployed port is allocated automatically: if Caddy is set up (see below),
# deploy scans the existing fragments in caddy.d, reuses this app's port or picks
# the first free one from 7800 up, and registers http://<name>.localhost ->
# 127.0.0.1:<port>. ADMIN_PORT overrides the allocation. Without Caddy, the port
# defaults to 7800. The backend listens on a unix domain socket
# ($PREFIX/backend.sock); the admin proxies /api/* to it. Nothing else is exposed.
#
# One-time Caddy setup (shared by all apps deployed this way):
#   brew install caddy
#   echo 'import caddy.d/*.caddy' > "$(brew --prefix)/etc/Caddyfile"
#   mkdir -p "$(brew --prefix)/etc/caddy.d"
#   brew services start caddy

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
APP_NAME="$(node -p "require('./package.json').name")"
PREFIX="$HOME/Library/Application Support/$APP_NAME"
DATA_DIR="$PREFIX/data"
LOG_DIR="$HOME/Library/Logs/$APP_NAME"
AGENTS_DIR="$HOME/Library/LaunchAgents"
NODE_BIN="$(command -v node)"
CLAUDE_BIN="$(command -v claude || true)"
# launchd starts services with a bare PATH (/usr/bin:/bin:/usr/sbin:/sbin), so the
# backend cannot find the CLIs it spawns - runs fail with "spawn claude ENOENT".
# Pin a PATH containing whatever is needed at deploy time.
SERVICE_PATH="$(dirname "$NODE_BIN")"
[ -n "$CLAUDE_BIN" ] && [ "$(dirname "$CLAUDE_BIN")" != "$SERVICE_PATH" ] \
  && SERVICE_PATH="$(dirname "$CLAUDE_BIN"):$SERVICE_PATH"
SERVICE_PATH="$SERVICE_PATH:/usr/bin:/bin:/usr/sbin:/sbin"
GUI="gui/$(id -u)"
BACKEND_LABEL="com.$APP_NAME.backend"
ADMIN_LABEL="com.$APP_NAME.admin"
DATABASE_PATH_PROD="$DATA_DIR/uno-computer.db"
SOCKET_PATH_PROD="$PREFIX/backend.sock"
# Claude run workspaces. Kept outside the deployment so redeploys never touch them.
WORKSPACES_DIR_PROD="${WORKSPACES_DIR:-$PREFIX/workspaces}"

BREW_PREFIX="$(brew --prefix 2>/dev/null || true)"
CADDY_DIR="${BREW_PREFIX:+$BREW_PREFIX/etc/caddy.d}"
FRAGMENT="${CADDY_DIR:+$CADDY_DIR/$APP_NAME.caddy}"
caddy_active() { command -v caddy >/dev/null && [ -n "$CADDY_DIR" ] && [ -d "$CADDY_DIR" ]; }

# ADMIN_PORT env wins; else reuse the port from this app's Caddy fragment; else
# first port from 7800 up not claimed by any fragment (the caddy.d directory is
# the port registry). Without Caddy that scan finds nothing and yields 7800.
resolve_admin_port() {
  if [ -z "${ADMIN_PORT:-}" ] && [ -n "$FRAGMENT" ] && [ -f "$FRAGMENT" ]; then
    ADMIN_PORT="$(grep -oE '127\.0\.0\.1:[0-9]+' "$FRAGMENT" | head -1 | cut -d: -f2)"
  fi
  if [ -z "${ADMIN_PORT:-}" ]; then
    local used="" port=7800
    [ -n "$CADDY_DIR" ] && used="$(grep -hoE '127\.0\.0\.1:[0-9]+' "$CADDY_DIR"/*.caddy 2>/dev/null | cut -d: -f2 || true)"
    while printf '%s\n' "$used" | grep -qx "$port"; do port=$((port + 1)); done
    ADMIN_PORT="$port"
  fi
}
resolve_admin_port

bootout() { launchctl bootout "$GUI/$1" 2>/dev/null || true; }

write_plist() { # label, workdir, logfile, program args (rest);
                # env via WRITE_PLIST_ENV, one KEY=VALUE per line (values may contain spaces)
  local label="$1" workdir="$2" logfile="$3"
  shift 3
  local plist="$AGENTS_DIR/$label.plist"
  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
    echo '<plist version="1.0"><dict>'
    echo "  <key>Label</key><string>$label</string>"
    echo '  <key>ProgramArguments</key><array>'
    for arg in "$@"; do echo "    <string>$arg</string>"; done
    echo '  </array>'
    echo "  <key>WorkingDirectory</key><string>$workdir</string>"
    echo '  <key>EnvironmentVariables</key><dict>'
    while IFS= read -r kv; do
      [ -n "$kv" ] || continue
      echo "    <key>${kv%%=*}</key><string>${kv#*=}</string>"
    done <<< "$WRITE_PLIST_ENV"
    echo '  </dict>'
    echo '  <key>RunAtLoad</key><true/>'
    echo '  <key>KeepAlive</key><true/>'
    echo "  <key>StandardOutPath</key><string>$logfile</string>"
    echo "  <key>StandardErrorPath</key><string>$logfile</string>"
    echo '</dict></plist>'
  } > "$plist"
}

case "${1:-deploy}" in

status)
  for label in "$BACKEND_LABEL" "$ADMIN_LABEL"; do
    if launchctl print "$GUI/$label" >/dev/null 2>&1; then
      pid="$(launchctl print "$GUI/$label" 2>/dev/null | awk '/pid =/{print $3}')"
      echo "$label: loaded (pid ${pid:-?})"
    else
      echo "$label: not loaded"
    fi
  done
  echo "backend (socket) -> $(curl -s -o /dev/null -w '%{http_code}' --unix-socket "$SOCKET_PATH_PROD" http://localhost/api/runs || true)"
  echo "admin   http://localhost:$ADMIN_PORT -> $(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$ADMIN_PORT/runs" || true)"
  if caddy_active && [ -f "$FRAGMENT" ]; then
    echo "caddy   http://$APP_NAME.localhost -> $(curl -s -o /dev/null -w '%{http_code}' -H "Host: $APP_NAME.localhost" http://127.0.0.1/runs || true)"
  fi
  ;;

logs)
  tail -n 40 -f "$LOG_DIR/backend.log" "$LOG_DIR/admin.log"
  ;;

uninstall)
  bootout "$BACKEND_LABEL"
  bootout "$ADMIN_LABEL"
  rm -f "$AGENTS_DIR/$BACKEND_LABEL.plist" "$AGENTS_DIR/$ADMIN_LABEL.plist"
  rm -rf "$PREFIX/backend" "$PREFIX/admin"
  if [ -n "$FRAGMENT" ] && [ -f "$FRAGMENT" ]; then
    rm -f "$FRAGMENT"
    caddy_active && { caddy reload --config "$BREW_PREFIX/etc/Caddyfile" --adapter caddyfile || true; }
    echo "Caddy hostname removed ($APP_NAME.localhost); its port is free for reuse."
  fi
  echo "Services removed. Database kept at: $DATABASE_PATH_PROD"
  echo "Delete it too with: rm -rf \"$PREFIX\" \"$LOG_DIR\""
  ;;

deploy)
  echo "==> Building backend"
  pnpm --filter backend build

  echo "==> Building admin"
  pnpm --filter admin build

  STAGE="$(mktemp -d)"
  trap 'rm -rf "$STAGE"' EXIT

  echo "==> Packaging backend (pnpm deploy)"
  pnpm --filter backend --prod deploy --legacy "$STAGE/backend"

  echo "==> Packaging admin (next standalone)"
  cp -R apps/admin/.next/standalone "$STAGE/admin"
  mkdir -p "$STAGE/admin/apps/admin/.next"
  cp -R apps/admin/.next/static "$STAGE/admin/apps/admin/.next/static"
  [ -d apps/admin/public ] && cp -R apps/admin/public "$STAGE/admin/apps/admin/public"

  # No migration step: MikroORM's schema generator runs updateSchema() during
  # bootstrap, so the backend brings its own database up to date on first start.
  echo "==> Database ($DATABASE_PATH_PROD)"
  mkdir -p "$DATA_DIR" "$LOG_DIR" "$WORKSPACES_DIR_PROD"

  echo "==> Installing to $PREFIX"
  bootout "$BACKEND_LABEL"
  bootout "$ADMIN_LABEL"
  mkdir -p "$PREFIX"
  rm -rf "$PREFIX/backend" "$PREFIX/admin"
  mv "$STAGE/backend" "$PREFIX/backend"
  mv "$STAGE/admin" "$PREFIX/admin"

  echo "==> Registering launchd agents"
  [ -n "$CLAUDE_BIN" ] || echo "WARNING: no 'claude' on PATH at deploy time - runs will fail with ENOENT."
  WRITE_PLIST_ENV="NODE_ENV=production
PATH=$SERVICE_PATH
SOCKET_PATH=$SOCKET_PATH_PROD
DATABASE_PATH=$DATABASE_PATH_PROD
WORKSPACES_DIR=$WORKSPACES_DIR_PROD" \
    write_plist "$BACKEND_LABEL" "$PREFIX/backend" "$LOG_DIR/backend.log" \
    "$NODE_BIN" "$PREFIX/backend/dist/main.js"
  WRITE_PLIST_ENV="NODE_ENV=production
PORT=$ADMIN_PORT
HOSTNAME=127.0.0.1
BACKEND_SOCKET=$SOCKET_PATH_PROD" \
    write_plist "$ADMIN_LABEL" "$PREFIX/admin/apps/admin" "$LOG_DIR/admin.log" \
    "$NODE_BIN" "$PREFIX/admin/apps/admin/server.js"
  launchctl bootstrap "$GUI" "$AGENTS_DIR/$BACKEND_LABEL.plist"
  launchctl bootstrap "$GUI" "$AGENTS_DIR/$ADMIN_LABEL.plist"

  APP_URL="http://localhost:$ADMIN_PORT"
  if caddy_active; then
    echo "==> Registering http://$APP_NAME.localhost with Caddy"
    printf 'http://%s.localhost {\n\treverse_proxy 127.0.0.1:%s\n}\n' "$APP_NAME" "$ADMIN_PORT" > "$FRAGMENT"
    caddy reload --config "$BREW_PREFIX/etc/Caddyfile" --adapter caddyfile \
      || echo "WARNING: caddy reload failed - start it with: brew services start caddy"
    APP_URL="http://$APP_NAME.localhost"
  else
    echo "==> Caddy not set up; skipping hostname (see header for one-time setup)"
  fi

  echo "==> Waiting for health"
  for i in $(seq 1 30); do
    # / is a 307 to /runs, so probe /runs directly rather than the root.
    b="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$ADMIN_PORT/api/openapi.json" || true)"
    a="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$ADMIN_PORT/runs" || true)"
    [ "$b" = "200" ] && [ "$a" = "200" ] && break
    sleep 1
  done
  # A 200 alone can lie: if another process squats the port, IT answered, while the
  # deployed admin crash-loops on EADDRINUSE. Verify the listener is our service.
  admin_pid="$(launchctl print "$GUI/$ADMIN_LABEL" 2>/dev/null | awk '/pid =/{print $3}')"
  port_pid="$(lsof -nP -tiTCP:"$ADMIN_PORT" -sTCP:LISTEN 2>/dev/null | head -1)"
  if [ -z "$port_pid" ] || [ "$port_pid" != "${admin_pid:-}" ]; then
    echo "WARNING: port $ADMIN_PORT is served by pid ${port_pid:-none}, not the deployed admin (pid ${admin_pid:-unknown})."
    echo "         Another process is squatting the port - the health results above are not from this deployment."
  fi
  if caddy_active; then
    h="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $APP_NAME.localhost" http://127.0.0.1/runs || true)"
    [ "$h" = "200" ] || echo "WARNING: Caddy route check failed (HTTP $h) - is 'brew services start caddy' running?"
  fi
  echo
  echo "Deployed."
  echo "  app        $APP_URL          ($a)"
  echo "  api        $APP_URL/api      ($b)"
  echo "  port       $ADMIN_PORT"
  echo "  socket     $SOCKET_PATH_PROD"
  echo "  data       $DATABASE_PATH_PROD"
  echo "  workspaces $WORKSPACES_DIR_PROD"
  echo "  logs       $LOG_DIR/"
  ;;

*)
  echo "usage: $0 [deploy|status|logs|uninstall]" >&2
  exit 1
  ;;
esac
