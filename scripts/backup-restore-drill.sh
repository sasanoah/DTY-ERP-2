#!/usr/bin/env sh
set -eu
: "${SOURCE_DATABASE_URL:?SOURCE_DATABASE_URL is required}"
: "${RESTORE_ADMIN_URL:?RESTORE_ADMIN_URL is required}"
: "${RESTORE_DATABASE_NAME:?RESTORE_DATABASE_NAME is required}"
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/postgres-cli-url.sh"
PG_SOURCE_DATABASE_URL="$(postgres_cli_url "$SOURCE_DATABASE_URL")"
PG_RESTORE_ADMIN_URL="$(postgres_cli_url "$RESTORE_ADMIN_URL")"
PG_RESTORE_DATABASE_URL="$(postgres_cli_url "$RESTORE_DATABASE_URL")"

case "$RESTORE_DATABASE_NAME" in
  *_restore_drill) ;;
  *) echo "RESTORE_DATABASE_NAME must end with _restore_drill" >&2; exit 2 ;;
esac
if [ "$SOURCE_DATABASE_URL" = "$RESTORE_DATABASE_URL" ]; then
  echo "Source and restore database URLs must be different" >&2
  exit 2
fi

DRILL_DIR="$(mktemp -d)"
DUMP_FILE="$DRILL_DIR/backup.dump"
cleanup(){
  rm -rf "$DRILL_DIR"
  if [ "${KEEP_RESTORE_DRILL_DB:-0}" != "1" ]; then
    dropdb --if-exists --force --maintenance-db="$PG_RESTORE_ADMIN_URL" "$RESTORE_DATABASE_NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT HUP INT TERM

DATABASE_URL="$SOURCE_DATABASE_URL" sh scripts/backup-postgres.sh "$DUMP_FILE" >/dev/null
dropdb --if-exists --force --maintenance-db="$PG_RESTORE_ADMIN_URL" "$RESTORE_DATABASE_NAME"
createdb --maintenance-db="$PG_RESTORE_ADMIN_URL" "$RESTORE_DATABASE_NAME"
RESTORE_CONFIRM=YES DATABASE_URL="$RESTORE_DATABASE_URL" sh scripts/restore-postgres.sh "$DUMP_FILE"

COUNT_SQL='SELECT (SELECT count(*) FROM "Company") || '"'"':'"'"' || (SELECT count(*) FROM "Plant") || '"'"':'"'"' || (SELECT count(*) FROM "User") || '"'"':'"'"' || (SELECT count(*) FROM "InventoryLot") || '"'"':'"'"' || (SELECT count(*) FROM "_prisma_migrations")'
SOURCE_COUNTS="$(psql "$PG_SOURCE_DATABASE_URL" -v ON_ERROR_STOP=1 -Atc "$COUNT_SQL")"
RESTORE_COUNTS="$(psql "$PG_RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -Atc "$COUNT_SQL")"
if [ "$SOURCE_COUNTS" != "$RESTORE_COUNTS" ]; then
  echo "Restore verification failed: critical record counts differ" >&2
  exit 1
fi
echo "Backup/restore drill passed: $RESTORE_DATABASE_NAME ($RESTORE_COUNTS)"
