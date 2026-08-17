#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
FILE="${1:?Usage: scripts/restore-postgres.sh backup.dump}"
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DATABASE_URL" "$FILE"
