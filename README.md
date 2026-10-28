# MindEase Web Panel

React panel for MindEase **therapists** and **admins**. It talks to the Laravel API in `../mindease-api` (`/v1/panel/*`).

| Role | Can do |
|---|---|
| Admin | Add therapists (with a temporary password), edit any profile, set prices, show or hide therapists in the app, reset passwords, see all sessions, cancel sessions |
| Therapist | Edit own profile, set weekly hours and time off, see own sessions and client notes, join video calls (Zoom Video SDK, host), mark sessions completed or no-show, cancel sessions (full refund) |

Admins can't join calls or read client notes.

## Run locally

```bash
# terminal 1: API
cd ../mindease-api && php artisan migrate --seed && php artisan serve   # http://localhost:8000

# terminal 2: panel
npm install
npm run dev                                                              # http://localhost:5173
```

Vite proxies `/v1` to `localhost:8000` (override with `API_PROXY_TARGET`).

Demo logins (local seed): `admin@mindease.test` / `password123`, `therapist@mindease.test` / `password123`.

Video calls need `ZOOM_SDK_KEY` and `ZOOM_SDK_SECRET` in the API's `.env`. Without them, Join shows "Video sessions aren't available right now".

## Build and deploy

```bash
VITE_API_URL=https://api.example.com/v1 npm run build    # static files in dist/
```

- Serve `dist/` from any static host, with a fallback to `index.html` for client-side routes.
- Add the panel's origin to `CORS_ALLOWED_ORIGINS` in the API's `.env`.
- Serve it over HTTPS, because browsers allow camera and microphone only on secure origins.

## Structure

```
src/api/client.ts       fetch wrapper: bearer token, single-flight refresh, ApiError
src/api/hooks.ts        React Query hooks for every panel endpoint
src/auth/AuthContext    sign in -> /panel/me (app users are rejected), session restore
src/pages/              Dashboard, Sessions, Therapists, TherapistDetail, Account, Call
src/components/         Layout, SessionList, TherapistForm, AvailabilityEditor, ui
```

Tokens: the access token is kept in memory and the refresh token in `sessionStorage`, so a session ends when the tab closes. The refresh token rotates on every use, so only one refresh runs at a time.
