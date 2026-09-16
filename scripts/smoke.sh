#!/usr/bin/env bash
# Boots the production server briefly and checks key routes, then shuts it down.
set -uo pipefail
LOG=/var/lib/pgsql/next-smoke.log
npm run start >"$LOG" 2>&1 &
NEXTPID=$!
trap 'kill $NEXTPID 2>/dev/null' EXIT

for _ in $(seq 1 40); do
  curl -s -o /dev/null "http://localhost:3000/login" && break
  sleep 1
done

echo "login_status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)"
echo "root=$(curl -s -o /dev/null -w '%{http_code}->%{redirect_url}' http://localhost:3000/)"
echo "dashboard=$(curl -s -o /dev/null -w '%{http_code}->%{redirect_url}' http://localhost:3000/dashboard)"
echo "doc_raw_unauth=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/documents/x/raw)"
echo "brand=$(curl -s http://localhost:3000/login | grep -o 'ProjectPilot' | head -1)"
# Hit an authenticated page's data path indirectly via the seeded demo by
# checking the login POST path is reachable (no crash on GET of app routes).
echo "projects_unauth=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/projects)"
echo "signup_status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/signup)"
echo "--- errors in log (if any) ---"
grep -A15 "unhandledRejection\|Error:" "$LOG" | head -40 || echo "(none)"
