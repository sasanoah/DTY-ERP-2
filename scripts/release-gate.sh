#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
npm run validate
npm run security:check
npx prisma format
npx prisma validate
npm run typecheck
npm run test:domain
npm run build
echo "Release gate passed."
