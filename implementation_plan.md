# Admin Dashboard Implementation Plan

## Goal
Create a protected Admin Dashboard (`/admin/dashboard`) exclusively for `nexjmr07@gmail.com` that provides real-time casino risk oversight, user management, and maintenance control.

## Proposed Changes

### Backend (Cloudflare Workers / D1)
**File:** `functions/api/[[path]].ts`

1.  **Update `handleGetStats`**:
    *   Add query to sum total `balance` from `users` table (Total Liability).
    *   Include "Maintenance Mode" status.
2.  **Add `handleUserSearch`**:
    *   Endpoint: `GET /api/admin/user-search?email=...`
    *   Returns user details (id, email, balance, status) for a given email.
3.  **Add `handleMaintenanceToggle`**:
    *   Endpoint: `POST /api/admin/maintenance`
    *   Updates a key `maintenance_mode` in the `settings` table.
4.  **Middleware/Guard**:
    *   Ensure these endpoints are strictly protected for the super-admin email/role.

### Frontend (Next.js / React)
**File:** `src/app/admin/dashboard/page.jsx`

1.  **Dashboard Component**:
    *   **KPI Cards**: Show "Total User Balance" (Risk) and other stats.
    *   **User Management Section**:
        *   Input field to search by email.
        *   Display result with "Edit Balance" and "Ban User" buttons.
        *   Modals/Prompts for confirmation.
    *   **System Control**:
        *   Toggle Switch for "Maintenance Mode".
    *   **Security**:
        *   Client-side check to redirect if not `nexjmr07@gmail.com`.

## Verification Plan

### Automated/Manual Tests
1.  **Backend Verification**:
    *   Use `curl` or browser to hit `/api/admin/stats` and verify `total_liability` is returned.
    *   Test maintenance toggle and verify persistence in D1.
2.  **Frontend Verification**:
    *   Login as `nexjmr07@gmail.com` -> Navigate to `/admin/dashboard`.
    *   Login as regular user -> Attempt navigation -> Should redirect.
    *   **Risk Display**: Register a new user, add balance, refresh dashboard -> Total Risk should increase.
    *   **Ban User**: Search user -> Click Ban -> Check user status in DB or try to login as that user.
