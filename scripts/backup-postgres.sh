#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
. "$SCRIPT_DIR/postgres-cli-url.sh"
PG_DATABASE_URL="$(postgres_cli_url "$DATABASE_URL")"
OUT="${1:-dty-erp-$(date +%Y%m%d-%H%M%S).dump}"
if [ -e "$OUT" ]; then
  echo "Refusing to overwrite existing backup: $OUT" >&2
  exit 2
fi
umask 077
PARTIAL="${OUT}.partial.$$"
cleanup(){ rm -f "$PARTIAL"; }
trap cleanup EXIT HUP INT TERM
pg_dump --format=custom --no-owner --no-acl --file="$PARTIAL" "$PG_DATABASE_URL"
pg_restore --list "$PARTIAL" >/dev/null
mv "$PARTIAL" "$OUT"
trap - EXIT HUP INT TERM
echo "$OUT"
