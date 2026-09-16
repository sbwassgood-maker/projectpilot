#!/usr/bin/env bash
# Initializes and starts a native PostgreSQL server for local development,
# then ensures the projectpilot role and database exist.
# Postgres refuses to run as root, so we use the system 'postgres' user.
set -e

PGDATA=/var/lib/pgsql/ppdata
PGBIN=/usr/bin
LOG=/var/lib/pgsql/pp.log

# Ensure a non-root owner for the data dir
id postgres >/dev/null 2>&1 || useradd -r -m postgres
mkdir -p "$PGDATA"
mkdir -p /var/lib/pgsql/sock
chown -R postgres:postgres /var/lib/pgsql

# Init the cluster once
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  su postgres -c "$PGBIN/initdb -D $PGDATA -A trust -U postgres" >/dev/null
fi

# Start (idempotent)
if ! su postgres -c "$PGBIN/pg_ctl -D $PGDATA status" >/dev/null 2>&1; then
  su postgres -c "$PGBIN/pg_ctl -D $PGDATA -l $LOG -o '-p 5432 -c listen_addresses=127.0.0.1 -c unix_socket_directories=/var/lib/pgsql/sock' start" >/dev/null
fi

# Wait for readiness
for i in $(seq 1 20); do
  if su postgres -c "$PGBIN/pg_isready -h /var/lib/pgsql/sock -p 5432" >/dev/null 2>&1; then break; fi
  sleep 1
done

PSQL="$PGBIN/psql -h /var/lib/pgsql/sock -p 5432"
# Ensure role + database
su postgres -c "$PSQL -tc \"SELECT 1 FROM pg_roles WHERE rolname='projectpilot'\"" | grep -q 1 \
  || su postgres -c "$PSQL -c \"CREATE ROLE projectpilot LOGIN PASSWORD 'projectpilot' SUPERUSER\""
su postgres -c "$PSQL -tc \"SELECT 1 FROM pg_database WHERE datname='projectpilot'\"" | grep -q 1 \
  || su postgres -c "$PSQL -c \"CREATE DATABASE projectpilot OWNER projectpilot\""

echo "native postgres ready on 127.0.0.1:5432"
