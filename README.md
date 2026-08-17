# DTY ERP V1.0 RC3.1

Arabic-first ERP for DTY manufacturing, covering POY procurement and inventory, production, quality, traceability, sales, finance, costing, maintenance, reporting, and factory-pilot controls.

## Release validation

```bash
npm ci
npm run release:gate
```

The GitHub release gate also deploys the committed Prisma migration to PostgreSQL 16, seeds the factory dataset, proves backup/restore into a disposable database, and runs the Playwright security and operational-integrity suite.

## Production containers

```bash
cp .env.example .env.production
# Replace every CHANGE_ME / replace-with value before continuing.
docker compose --env-file .env.production -f compose.production.yml build
docker compose --env-file .env.production -f compose.production.yml up -d
```

The production composition runs migrations before the application, binds the app to localhost for a reverse proxy, drops Linux capabilities, uses a read-only root filesystem, and exposes database-backed readiness through `/api/health/ready`.

Operational documentation:

- [Deployment and rollback runbook](docs/DEPLOYMENT_RUNBOOK_AR.md)
- [Database backup and recovery](docs/DATABASE_BASELINE_AND_RECOVERY_AR.md)
- [Production deployment checklist](docs/DEPLOYMENT_CHECKLIST_AR.md)
- [Factory pilot runbook](docs/PILOT_RUNBOOK_AR.md)
- [Security go-live checklist](docs/SECURITY_GO_LIVE_CHECKLIST_AR.md)
