#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/postgres-cli-url.sh"
PG_DATABASE_URL="$(postgres_cli_url "$DATABASE_URL")"
FILE="${1:?Usage: scripts/restore-postgres.sh backup.dump}"
: "${RESTORE_CONFIRM:?Set RESTORE_CONFIRM=YES after verifying the target database}"
if [ "$RESTORE_CONFIRM" != "YES" ]; then
  echo "Restore cancelled: RESTORE_CONFIRM must equal YES" >&2
  exit 2
fi
if [ ! -r "$FILE" ]; then
  echo "Backup is not readable: $FILE" >&2
  exit 2
fi
pg_restore --list "$FILE" >/dev/null
pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error --single-transaction --dbname="$PG_DATABASE_URL" "$FILE"
