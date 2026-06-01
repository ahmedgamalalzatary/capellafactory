# Docker Deploy Guide

This guide is ordered by the normal flow of commands: prepare env, build/start, verify migrations, then verify public services.

## Environment Files

- `.env`: local non-Docker development.
- `.env.docker`: local Docker Compose on your PC.
- `.env.production`: production Docker Compose on the VPS.

Production uses:

```bash
docker compose --env-file .env.production ...
```

Local Docker uses:

```cmd
docker compose --env-file .env.docker ...
```

## Service Layout

This project runs three long-lived services and one one-shot migration service:

- `db`: MySQL
- `api`: Express API
- `web`: Next.js app
- `migrate`: runs `db:migrate` before `api` starts

Inside Docker:

- `web` talks to `api` with `API_URL=http://api:4010`
- `api` talks to MySQL with `DB_HOST=db`
- browser requests use `NEXT_PUBLIC_API_URL`, not the internal Docker hostname

Default published host ports for this repo:

- `web`: `3010`
- `api`: `4010`

Container-internal ports stay:

- `web`: `3010`
- `api`: `4010`
- `db`: `3306`

## Required Environment Values

Keep these aligned in `.env.docker` and `.env.production`:

```env
WEB_HOST_PORT=3010
API_HOST_PORT=4010

API_PORT=4010
API_URL=http://api:4010
NEXT_PUBLIC_API_URL=http://localhost:4010
CORS_ORIGIN=http://localhost:3010

DB_HOST=db
DB_PORT=3306
DB_USER=capella_app
DB_PASSWORD=your-db-password
DB_NAME=capella_factory
DB_ROOT_PASSWORD=your-root-password

MYSQL_ROOT_PASSWORD=your-root-password
MYSQL_DATABASE=capella_factory
MYSQL_USER=capella_app
MYSQL_PASSWORD=your-db-password
```

Production notes:

- keep `API_URL=http://api:4010`
- set `NEXT_PUBLIC_API_URL` to the public API URL or the public proxied path
- set `CORS_ORIGIN` to the public web origin

## Production Fresh DB Flow

Use this only when the VPS database has no valuable data. `down -v` deletes the MySQL volume.

Start on the VPS:

```bash
cd ~/capellafactory
git pull
```

Verify repo state before touching Docker:

```bash
git status --short
git log -1 --oneline
docker compose --env-file .env.production config >/tmp/capellafactory-compose.yml
```

Build and start from a clean database:

```bash
docker compose --env-file .env.production down -v
docker compose --env-file .env.production build --no-cache
docker compose --env-file .env.production up -d
```

Verify containers are created:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs migrate --tail 80
docker compose --env-file .env.production logs api --tail 80
```

Verify migrations completed successfully:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs migrate --tail 80
```

Verify public services:

```bash
docker compose --env-file .env.production ps
curl http://127.0.0.1:4010/health
curl -I http://127.0.0.1:3010
```

If Nginx is in front, also verify the public URLs:

```bash
curl https://your-public-api-domain-or-path/health
curl -I https://your-public-web-domain-or-path
```

## Production Existing DB Flow

Use this once production may contain valuable data. Do not use `down -v`.

Start on the VPS:

```bash
cd ~/capellafactory
git pull
```

Verify repo state before touching Docker:

```bash
git status --short
git log -1 --oneline
docker compose --env-file .env.production config >/tmp/capellafactory-compose.yml
```

Build and start:

```bash
docker compose --env-file .env.production build --no-cache
docker compose --env-file .env.production up -d
```

Verify containers and migration result:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs migrate --tail 80
docker compose --env-file .env.production logs api --tail 80
```

Verify public services:

```bash
docker compose --env-file .env.production ps
curl http://127.0.0.1:4010/health
curl -I http://127.0.0.1:3010
```

If Nginx is in front, also verify the public URLs:

```bash
curl https://your-public-api-domain-or-path/health
curl -I https://your-public-web-domain-or-path
```

## Local Docker Fresh DB Flow

Use this when your local Docker database has no valuable data.

Run from the repo root on Windows:

```cmd
D:\Documents\currentwork\capella\capellafactory>
```

Verify local Compose config:

```cmd
docker compose --env-file .env.docker config > nul
```

Build and start from a clean database:

```cmd
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker build --no-cache
docker compose --env-file .env.docker up -d
```

Verify containers are running:

```cmd
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs migrate --tail 80
docker compose --env-file .env.docker logs api --tail 80
```

Verify local services:

```cmd
curl http://localhost:4010/health
curl -I http://localhost:3010
```

## Local Docker Existing DB Flow

Use this when you want to keep your local Docker database volume.

```cmd
docker compose --env-file .env.docker config > nul
docker compose --env-file .env.docker build --no-cache
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs migrate --tail 80
docker compose --env-file .env.docker logs api --tail 80
curl http://localhost:4010/health
curl -I http://localhost:3010
```

## Local Non-Docker Development

Use this when MySQL is running on your host machine and `.env` points to it.

```cmd
pnpm --filter @capella/api db:migrate
pnpm dev
```

Verify local non-Docker services:

```cmd
curl http://localhost:4010/health
```

## Common Commands

Build one service:

```bash
docker compose --env-file .env.production build api
docker compose --env-file .env.production build web
```

Stop without deleting data:

```bash
docker compose --env-file .env.production down
```

Stop and delete Docker volumes:

```bash
docker compose --env-file .env.production down -v
```

Restart services:

```bash
docker compose --env-file .env.production restart api web
docker compose --env-file .env.production restart api
docker compose --env-file .env.production restart web
```

Show running containers:

```bash
docker compose --env-file .env.production ps
```

For local Docker, replace `.env.production` with `.env.docker`.

## Logs

All logs:

```bash
docker compose --env-file .env.production logs
```

Tail all logs:

```bash
docker compose --env-file .env.production logs --tail 100
```

Service logs:

```bash
docker compose --env-file .env.production logs api --tail 80
docker compose --env-file .env.production logs web --tail 80
docker compose --env-file .env.production logs db --tail 80
docker compose --env-file .env.production logs migrate --tail 80
```

For local Docker, replace `.env.production` with `.env.docker`.

## Database Checks

Open MySQL with the app user:

```bash
docker compose --env-file .env.production exec db sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

Check whether a table exists:

```bash
docker compose --env-file .env.production exec db sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SHOW TABLES;"'
```

Describe a table:

```bash
docker compose --env-file .env.production exec db sh -lc 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "DESCRIBE suppliers;"'
```

List migration files inside the API image workspace:

```bash
docker compose --env-file .env.production exec api sh -lc "ls -1 /app/apps/api/drizzle/migrations"
```

For local Docker, replace `.env.production` with `.env.docker`.

## URLs

Production:

- Web: your Nginx public URL
- API: your Nginx public API URL or proxied path
- API health: your public API health URL

Local Docker:

- Web: `http://localhost:3010`
- API: `http://localhost:4010`
- API health: `http://localhost:4010/health`

Local non-Docker:

- API health: `http://localhost:4010/health`

## Rules

- This repo uses `db:migrate` for Dockerized environments. The `migrate` service runs before `api` starts.
- `down -v` deletes Docker volumes, including MySQL data.
- `docker-compose.yml` reads deployment values from the `--env-file` argument.
- Inside Docker, services talk to each other by service name such as `db` and `api`, not `localhost`.
- `API_URL` is for server-side Next.js calls inside Docker. Do not point it at the browser-facing host port.
- `NEXT_PUBLIC_API_URL` is for browser calls. It must be reachable by the browser.
- If another project already uses `3010` and `4010` on the VPS, keep this repo on `3010` and `4010` and let Nginx route traffic.
