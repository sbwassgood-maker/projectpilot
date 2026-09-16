#!/usr/bin/env bash
# Starts the local Postgres container for ProjectPilot development.
set -e
docker rm -f projectpilot-db >/dev/null 2>&1 || true
docker run -d --name projectpilot-db \
  -e POSTGRES_USER=projectpilot \
  -e POSTGRES_PASSWORD=projectpilot \
  -e POSTGRES_DB=projectpilot \
  -p 5432:5432 \
  postgres:16-alpine
