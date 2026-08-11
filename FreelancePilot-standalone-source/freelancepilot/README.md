# FreelancePilot — Portable SaaS

Production-ready freelancer business assistant with a React/Vite frontend, standalone Node.js/Express backend, PostgreSQL migrations, environment variables, and Docker deployment.

## Run locally

1. Install Node.js 22+.
2. Start PostgreSQL (`docker compose up -d postgres`) or use your own PostgreSQL database.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` and `OPENAI_API_KEY`.
4. `npm install`
5. `npm run migrate`
6. `npm run build`
7. `npm start`

Open `http://localhost:3000`.

## Deploy

Use Render, Railway, Fly.io, a VPS, or another Node.js host. Provide a PostgreSQL database and configure the variables in `.env.example`. Build with `npm install && npm run build`; start with `npm run migrate && npm start`.

## GitHub

Create a repository, extract this project, run `git init`, commit, and push. Never commit `.env` or real API keys.

## Architecture

`src/` frontend; `backend/server.ts` standalone API/server; `backend/migrate.ts` migration runner; `migrations/` PostgreSQL schema; `Dockerfile` and `docker-compose.yml` deployment.

The standalone runtime does not require AppDeploy services or AppDeploy SDKs.