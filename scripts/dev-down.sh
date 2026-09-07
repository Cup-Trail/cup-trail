#!/usr/bin/env bash
# Stop the local Supabase stack. Leaves Colima running for fast restarts;
# pass --all to also stop the Colima VM.
set -euo pipefail
cd "$(dirname "$0")/.."
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"

echo "▶ Stopping Supabase…"
supabase stop

if [ "${1:-}" = "--all" ]; then
  echo "▶ Stopping Colima…"
  colima stop
fi
echo "✔ Down"
