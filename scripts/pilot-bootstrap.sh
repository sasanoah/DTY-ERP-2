#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${SESSION_SECRET:?SESSION_SECRET is required}"
if [ "${NODE_ENV:-development}" = "production" ]; then
  echo "pilot-bootstrap uses prisma db push and is intentionally blocked in production." >&2
  exit 2
fi
npx prisma generate
npx prisma db push
npm run db:seed
echo "Pilot database is ready. Start the app with: npm run dev"
