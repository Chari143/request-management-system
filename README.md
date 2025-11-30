# Request Management System

Minimal request workflow with Employees and Managers.

## Stack
- Backend: Node.js, Express, TypeScript, PostgreSQL, Prisma, Zod, JWT
- Frontend: Next.js 16 (App Router), Tailwind CSS

## Local Setup

Backend:
```bash
cd backend
npm install
# .env
# DATABASE_URL=postgresql://user:password@localhost:5432/request_management
# JWT_SECRET=your-secret
# PORT=4000
npm run prisma:migrate
npm run dev
# http://localhost:4000
```

Frontend:
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## Usage
- Sign up or sign in.
- Employees create requests with their manager’s name.
- Managers approve/reject pending requests.
- Approved requests can be closed by the assigned employee.

## API
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/me`
- `POST /api/requests`
- `GET /api/requests`
- `POST /api/requests/:id/approve`
- `POST /api/requests/:id/reject`
- `POST /api/requests/:id/close`
- `GET /health`

## Deploy (Render)
Create a new Web Service pointing to `backend`.

- Environment
  - `DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?schema=request_mgmt`
  - `JWT_SECRET=<your-secret>`
- Build Command
  - `npm install && npm run render-build`
- Start Command
  - `npm run start:prod`

Notes:
- The service listens on `process.env.PORT`.
- Prisma migrations run automatically in `start:prod`.
