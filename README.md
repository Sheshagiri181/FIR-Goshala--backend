# FIR Goshala backend

Express API and MongoDB persistence for the React frontend.

## Configure

1. Install Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` to your MongoDB Atlas connection string. In Atlas, allow this machine's IP address and create a database user with access to the target database.
4. Set a unique random `JWT_SECRET` of at least 32 characters, and strong `STAFF_USERNAME` and `STAFF_PASSWORD` values.
5. Keep `.env` private; do not commit or share it.

## Run locally

```sh
npm install
npm run dev
```

The API listens on `http://localhost:4000`. Check `GET /api/health`. The Vite dev server proxies `/api` requests to this backend.

Public routes: `GET /api/records`, `POST /api/auth/login`. Staff-authenticated routes: `POST /api/records`, `PUT /api/records/:id`. Login returns a bearer token that expires after 8 hours.

Run API tests with `npm test`.

For deployment, set the same environment variables in the hosting provider and set `WEB_ORIGIN` to the frontend's exact origin (multiple origins can be comma-separated). Never expose `MONGODB_URI`, `JWT_SECRET`, or staff credentials as frontend variables.