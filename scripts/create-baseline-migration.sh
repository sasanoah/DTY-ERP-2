#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
NAME="000000000000_baseline"
TARGET="prisma/migrations/$NAME"
if [ -f "$TARGET/migration.sql" ]; then
  echo "Baseline already exists: $TARGET/migration.sql" >&2
  exit 2
fi
mkdir -p "$TARGET"
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output "$TARGET/migration.sql"
echo "Generated $TARGET/migration.sql"
echo "Review this SQL before applying it."
