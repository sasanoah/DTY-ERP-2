#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
OUT="${1:-dty-erp-$(date +%Y%m%d-%H%M%S).dump}"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > "$OUT"
echo "$OUT"
