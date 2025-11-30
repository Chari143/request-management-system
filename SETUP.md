# Build & Setup Guide

A minimal, human-readable guide to run locally and deploy.

## Prerequisites
- Node.js 18+ (Render uses 22; both are fine)
- PostgreSQL (Render Managed Postgres is recommended)
- GitHub account connected to Render and Vercel

## Local Development
- Backend
  - `cd backend && npm install`
  - Create `.env` (or export env vars):
    - `DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?schema=request_mgmt`
    - `JWT_SECRET=<your-secret>`
    - `PORT=4000`
  - Migrate: `npm run prisma:migrate` (creates tables locally)
  - Dev server: `npm run dev` (listens on `http://localhost:4000`)
- Frontend
  - `cd frontend && npm install`
  - Set `NEXT_PUBLIC_API_URL=http://localhost:4000`
  - Dev server: `npm run dev` (opens `http://localhost:3000`)

## Production Build
- Backend
  - `cd backend && npm run render-build` (generates Prisma client + compiles TS)
  - Start (with migrations): `npm start` (runs `prisma migrate deploy && node dist/index.js`)
- Frontend
  - `cd frontend && npm run build`

## Deploy: Render (Backend)
- Create a PostgreSQL instance; copy `DATABASE_URL` and append `?schema=request_mgmt`
- Create a Web Service pointing to `backend`
- Environment variables:
  - `DATABASE_URL=postgresql://…?schema=request_mgmt`
  - `JWT_SECRET=<random-long-secret>`
  - Optional: `NODE_ENV=production`
- Commands:
  - Build: `npm install && npm run render-build`
  - Start: `npm start`
- Verify: `GET https://<service>.onrender.com/health` → `{ "status": "ok" }`

## Deploy: Vercel (Frontend)
- Create a Project pointing to `frontend`
- Environment variables:
  - `NEXT_PUBLIC_API_URL=https://<service>.onrender.com`
- Vercel auto-detects Next.js; build runs with `next build`

## Environment Variables
- Backend
  - `DATABASE_URL`: Postgres connection (include `?schema=request_mgmt`)
  - `JWT_SECRET`: any long random string
  - `PORT`: Render sets this automatically; locally use `4000`
- Frontend
  - `NEXT_PUBLIC_API_URL`: points to backend base URL

## Common Pitfalls & Fixes
- Backend fails with `exports is not defined in ES module scope`
  - Ensure `backend/package.json` does NOT include `"type": "module"`
  - `backend/tsconfig.json` should use `"module": "CommonJS"`
- 404s or CORS errors
  - Confirm `NEXT_PUBLIC_API_URL` is correct and uses `https://` in production
  - CORS is enabled; optionally restrict origin later
- Render build/start issues
  - Check Render logs first (Deploy logs, runtime logs)
  - Ensure Build: `npm install && npm run render-build`, Start: `npm start`
  - Verify env vars set on Render match your `.env`

## Quick Test
- Sign up a Manager, then an Employee using the manager’s name
- Employee creates a request (Manager Name required)
- Manager approves/rejects under Approvals

## Repo Structure
- `backend/` Express + Prisma API
- `frontend/` Next.js App Router UI
- `README.md` overview; `SETUP.md` this document

