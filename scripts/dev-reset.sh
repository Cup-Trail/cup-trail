#!/usr/bin/env bash
# Rebuild the local database from scratch: re-applies every migration in
# supabase/migrations, then runs supabase/seed.sql. Wipes local data.
set -euo pipefail
cd "$(dirname "$0")/.."
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"

echo "▶ Resetting local database (migrations + seed)…"
supabase db reset
echo "✔ Database reset"
