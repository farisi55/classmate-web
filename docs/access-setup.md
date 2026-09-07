# Cloudflare Access Setup — Service Token Authentication

> Task #013 — Phase 4 Integration

## Overview

This document describes the Cloudflare Access configuration for the Classmate Indonesia website API endpoints that require authentication.

## Access Applications

### 1. Admin Browser Login — `/admin`

- **Application URL:** `https://classmate.co.id/admin`
- **Domain:** `classmate.co.id`
- **Path:** `/admin*`
- **Policy Type:** Allow — Login with Email/Google (browser-based JWT)
- **Purpose:** Human admin access to the ticker management interface
- **Auth Method:** JWT via `Cf-Access-Jwt-Assertion` header

### 2. Export Service Token — `/api/admin/ticker-export`

- **Application URL:** `https://classmate.co.id/api/admin/ticker-export`
- **Domain:** `classmate.co.id`
- **Path:** `/api/admin/ticker-export`
- **Policy Type:** Allow — Service Token only (no email/Google login)
- **Purpose:** Automated backup via GitHub Actions (least-privilege isolation)
- **Auth Method:** Service Token via `CF-Access-Client-Id` + `CF-Access-Client-Secret` headers

## Least Privilege Design

The export endpoint uses a **separate Access Application** from the admin browser login for the following reasons:

1. **Blast radius containment:** If the backup Service Token is compromised, it only grants read-only access to the export endpoint — not the ability to modify ticker data
2. **No privilege escalation:** A Service Token for the export app cannot be used to authenticate to the admin app (different application ID)
3. **Independent token rotation:** Export tokens can be rotated without affecting admin browser sessions

## Configuration Steps (Cloudflare Zero Trust Dashboard)

### Create Export Access Application

1. Navigate to **Cloudflare Zero Trust Dashboard → Access → Applications**
2. Click **Add an application → Self-hosted**
3. Configure:
   - **Application name:** `Classmate Export — Service Auth Only`
   - **Session duration:** 24 hours (backup runs daily)
   - **Application domain:** `classmate.co.id`
   - **Application path:** `/api/admin/ticker-export`
   - **Immediately allow access:** No
4. Add policy:
   - **Policy name:** `Backup Service Token`
   - **Action:** Allow
   - **Include → Selector:** Service Token
   - **Value:** [Select or create Service Token]
5. Save application

### Create Service Token

1. Navigate to **Cloudflare Zero Trust Dashboard → Access → Service Tokens**
2. Click **Create Service Token**
3. Configure:
   - **Description:** `GitHub Actions Backup — Ticker Export`
   - **Service Token name:** `classmate-backup-export`
4. Copy the **Client ID** and **Client Secret** immediately (secret is shown only once)
5. Add to GitHub Actions repository secrets:
   - `CF_ACCESS_CLIENT_ID` = [Client ID]
   - `CF_ACCESS_CLIENT_SECRET` = [Client Secret]

## Application IDs (for reference)

> **WARNING:** Never commit actual Application IDs or tokens to the repository.

| Application | Purpose | Policy Type |
|---|---|---|
| Classmate Admin | Browser login for ticker management | JWT (email/Google) |
| Classmate Export | Service auth for backup automation | Service Token |

## Verification

After setup, verify the following:

1. **Without headers:** `GET /api/admin/ticker-export` without Service Token headers returns `401`/`403` (blocked by Access, never reaches application code)
2. **With valid Service Token:** `GET /api/admin/ticker-export` with correct `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers returns `200` with ticker data
3. **Cross-application isolation:** Service Token from the Export application does NOT grant access to `/admin` routes, and vice versa

## Token Rotation

- **Recommended rotation:** Every 90 days
- **Process:**
  1. Create new Service Token in Cloudflare dashboard
  2. Update GitHub Actions secrets (`CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`)
  3. Verify backup workflow succeeds on next run
  4. Revoke old Service Token

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| 401 on export endpoint | Missing or invalid Service Token | Verify headers `CF-Access-Client-Id` and `CF-Access-Client-Secret` are set correctly |
| 403 on export endpoint | Service Token does not have access to this application | Verify token was created for the Export Access Application, not the Admin application |
| Backup workflow fails with auth error | Token expired or revoked | Rotate token and update GitHub Actions secrets |
