#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# with-db.sh — run a command with a live local Postgres.
#
# This sandbox uses an isolated PID namespace per shell invocation, so a
# database daemon started in one call does not survive into the next. This
# helper starts Postgres (data persists on disk in $PGDATA), waits until it is
# accepting connections, runs the command you pass, then stops the server.
#
# Usage:  bash scripts/with-db.sh <command...>
# Example: bash scripts/with-db.sh npx prisma migrate deploy
#          bash scripts/with-db.sh npm run build
# ---------------------------------------------------------------------------
set -uo pipefail

PGDATA=/var/lib/pgsql/ppdata
PGBIN=/usr/bin
SOCK=/var/lib/pgsql/sock

id postgres >/dev/null 2>&1 || useradd -r -m postgres
mkdir -p "$PGDATA" "$SOCK"
chown -R postgres:postgres /var/lib/pgsql
chmod 755 /var/lib/pgsql "$SOCK"

# Initialize the cluster once.
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  su postgres -c "$PGBIN/initdb -D $PGDATA -A trust -U postgres" >/dev/null 2>&1
fi

# Clean any stale lock/socket from a previous (killed) invocation.
rm -f "$PGDATA/postmaster.pid" "$SOCK"/.s.PGSQL.* 2>/dev/null || true

# Start Postgres in the background of THIS shell.
su postgres -c "$PGBIN/postgres -D $PGDATA -p 5432 \
  -c listen_addresses=127.0.0.1 \
  -c unix_socket_directories=$SOCK" >/var/lib/pgsql/run.log 2>&1 &
PGPID=$!

cleanup() { kill "$PGPID" 2>/dev/null; wait "$PGPID" 2>/dev/null; }
trap cleanup EXIT INT TERM

# Wait for readiness over the Unix socket.
READY=0
for _ in $(seq 1 30); do
  if PGPASSWORD=projectpilot "$PGBIN/psql" \
      "postgresql://projectpilot:projectpilot@/projectpilot?host=$SOCK" \
      -c "select 1" >/dev/null 2>&1; then READY=1; break; fi
  # Ensure role/db exist (first run) using the superuser 'postgres'.
  su postgres -c "$PGBIN/psql -h $SOCK -p 5432 -tc \"SELECT 1 FROM pg_roles WHERE rolname='projectpilot'\"" 2>/dev/null | grep -q 1 \
    || su postgres -c "$PGBIN/psql -h $SOCK -p 5432 -c \"CREATE ROLE projectpilot LOGIN PASSWORD 'projectpilot' SUPERUSER\"" >/dev/null 2>&1
  su postgres -c "$PGBIN/psql -h $SOCK -p 5432 -tc \"SELECT 1 FROM pg_database WHERE datname='projectpilot'\"" 2>/dev/null | grep -q 1 \
    || su postgres -c "$PGBIN/psql -h $SOCK -p 5432 -c \"CREATE DATABASE projectpilot OWNER projectpilot\"" >/dev/null 2>&1
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "with-db: Postgres failed to become ready" >&2
  cat /var/lib/pgsql/run.log >&2 || true
  exit 1
fi

# Run the requested command with the DB available.
"$@"
STATUS=$?
exit $STATUS
