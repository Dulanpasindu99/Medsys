# Frontend to Backend Connection Guide (Medical App)

This guide explains how to connect your frontend (`medsys-web`) to a separate backend repo (`medsys-api`) safely and in a production-ready way.

## 1. Recommended Integration Pattern

Use **separate deployments**:
- Frontend: Next.js app (this repo)
- Backend: NestJS API repo

Frontend should call backend base URL:
- `https://api.yourdomain.com/api/v1`

## 2. Environment Setup (Frontend)

Create `.env.local` in frontend:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

For local dev:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

## 3. API Client Layer (Frontend)

Create one shared HTTP client in frontend (`app/lib/api-client.ts`) and use it everywhere.

Minimum features:
- Base URL from `NEXT_PUBLIC_API_BASE_URL`
- JSON request/response
- Unified error parsing
- Optional request timeout
- Send `Authorization` header only when needed

Why:
- Avoid duplicate fetch logic
- Centralized auth/error handling
- Easier maintenance and testing

## 4. Auth Flow (Medical-Safe)

Preferred:
- Access token short TTL (10-15 min)
- Refresh token in **HttpOnly Secure SameSite cookie** (set by backend)

Flow:
1. User logs in on frontend.
2. Frontend `POST /auth/login`.
3. Backend returns access token + sets refresh cookie.
4. Frontend stores access token in memory (or short-lived secure storage policy).
5. On 401, frontend calls `POST /auth/refresh`.
6. Retry original request once.

Avoid:
- Long-lived tokens in `localStorage`.
- Exposing refresh token to JavaScript.

## 5. CORS and Cookie Configuration

Backend must allow frontend origin explicitly:
- Production origin(s) only
- `credentials: true` when using cookies

Backend CORS example:
- `origin: ["https://app.yourdomain.com"]`
- `credentials: true`

Frontend fetch must use:

```ts
fetch(url, { credentials: "include" })
```

when using cookie-based refresh.

## 6. Endpoint Mapping for Your UI

Map your existing screens to these backend endpoints:

- Login page:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`

- Owner section:
  - `GET /users`
  - `POST /users`
  - `PATCH /users/:id`

- Patient section:
  - `GET /patients`
  - `GET /patients/:id`
  - `PATCH /patients/:id`

- Doctor section:
  - `GET /appointments?status=waiting`
  - `POST /encounters`
  - `POST /encounters/:id/diagnoses`
  - `POST /encounters/:id/tests`
  - `POST /prescriptions`

- Assistant section:
  - `GET /appointments?status=completed`
  - `PATCH /appointments/:id` (dispense/close)
  - `POST /inventory/:id/movements`

- Analytics section:
  - `GET /analytics/overview`

## 7. Frontend Integration Steps (Order)

1. Add API base URL env variable.
2. Build shared API client.
3. Integrate login flow first.
4. Replace one screen at a time:
   - patients -> appointments -> encounters -> prescriptions -> inventory -> analytics
5. Add loading/error states in each section.
6. Add role-based route guard UI behavior (owner/doctor/assistant).
7. Remove remaining hardcoded demo data after endpoint parity.

## 8. Error Handling Standard (Frontend)

Backend should return:

```json
{
  "error": {
    "code": 400,
    "message": "Validation failed",
    "request_id": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

Frontend should:
- Show user-friendly messages
- Log `request_id` to console/monitoring for support tracing
- Never expose stack traces to users

## 9. Security Rules for Frontend

- Never store passwords or full medical data in local storage.
- Do not cache sensitive responses in browser storage.
- Use HTTPS only.
- Mask sensitive fields in UI logs and error telemetry.
- Implement auto logout on prolonged inactivity.

## 10. Deployment Checklist (Connection)

- [ ] Backend deployed and reachable on stable domain.
- [ ] Frontend `NEXT_PUBLIC_API_BASE_URL` set per environment.
- [ ] Backend CORS allowlist includes frontend domain only.
- [ ] TLS certificate valid on both frontend and backend domains.
- [ ] Auth cookies configured (`Secure`, `HttpOnly`, `SameSite`).
- [ ] Health checks passing (`/health` backend).
- [ ] Frontend smoke test done for login + patient read + prescription write.

## 11. Troubleshooting

### 401 after login
- Check access token expiry
- Check refresh endpoint and cookie flags
- Confirm frontend sends `credentials: include` if cookie flow

### CORS blocked
- Verify backend origin allowlist
- Confirm exact scheme + domain + port match

### Works locally, fails in prod
- Check `.env` values in hosting platform
- Verify HTTPS and cookie `Secure` behavior
- Confirm backend route prefix `/api/v1`

### Intermittent API failures
- Add request timeout + retry for idempotent `GET` only
- Use request IDs and check backend logs by `request_id`

