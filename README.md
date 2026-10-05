# Student Complaint Management System

A full-stack student complaint portal built with Vue, Express, PostgreSQL, and private object storage in production. Local development uses SQLite and local files. Students can create accounts, file private complaints, attach evidence, and follow status updates. Administrators can review submissions, filter the inbox, and update complaint statuses with a note recorded in the case history.

## Requirements

- Node.js 22 or newer
- npm

## Run locally

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Configure the first administrator account:

   ```powershell
   Copy-Item .env.example .env
   ```

   Edit `.env` and replace `ADMIN_PASSWORD` with a unique password of at least 10 characters. The administrator account is created or updated when the API starts.

3. Start the web app and API:

   ```powershell
   npm run dev
   ```

4. Open <http://localhost:3000>. Students can create an account or sign in. The assigned complaint monitor selects **Staff / Admin Login** and signs in using `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`.

## Staff complaint monitoring

The staff/admin account is provisioned from the server environment; it is not created through student registration. Set `ADMIN_USERNAME`, `ADMIN_NAME`, and a strong `ADMIN_PASSWORD` in `.env`, then restart the server. Give those credentials only to the designated school complaint monitor.

After selecting **Staff / Admin Login**, the monitor can review the complaint inbox, filter by pending/in-progress/resolved status, open a complaint to read its details and any attachment, add an optional update note, and change its status. Status changes and notes are saved in the complaint history for the student. The monitor should sign in and refresh the inbox on the schedule set by the school; this version does not send automatic email or SMS alerts.

The development command starts Vite on port 3000 and the API on port 3001. Vite proxies `/api` requests to the API. SQLite data and uploaded documents are stored under `data/`, which is excluded from version control.

## Production

Build the frontend, configure PostgreSQL and private Supabase Storage, set `NODE_ENV=production`, and start the server. The production server serves the built frontend and API on the same port:

```powershell
npm run build
$env:NODE_ENV = "production"
npm start
```

Production requires `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`; these must remain private server-side secrets. The schema is created idempotently at startup. Set `APP_ORIGIN` to the exact public website origin when requests are reverse-proxied. Production session cookies are marked `Secure`.

## Deploy to Render

The root [render.yaml](./render.yaml) defines a free Render web service for the API, a health check, and a generated administrator password. Its build command explicitly installs development dependencies because Vite is needed to build the frontend even when Render sets `NODE_ENV=production`. Persistent PostgreSQL data and evidence files are hosted separately by Supabase; no complaint data or uploads are kept on Render's temporary filesystem. The [vercel.json](./vercel.json) rewrite proxies `/api/*` requests from the public Vercel website to the Render service, keeping secure session cookies same-origin.

1. Get the school's approval for the hosting providers and their data-retention/privacy terms before accepting real student complaints.
2. Create a Supabase project. In its Storage page, create a **private** bucket named `complaint-evidence`, allow only PDF/JPEG/PNG/GIF/WebP files, and set its per-file limit to 5 MB.
3. In Supabase, copy the PostgreSQL connection URI (use SSL) and the server-side service-role key. Never put either secret in browser code, GitHub, or Vercel's frontend variables.
4. In Render, choose **New** → **Blueprint**, select the `asarsale7-del/sarsale_VUE_MINI` repository and the `main` branch, then apply the Blueprint. Enter the Supabase values for `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` when prompted. The app creates its database tables on startup.
5. Wait for the Render health check to pass and note the exact service URL. If it is not `https://campuscare-complaint-system.onrender.com`, update the destination in `vercel.json` to the actual Render URL and push that change.
6. The connected Vercel project will redeploy from GitHub. Verify `/api/health` on the public Vercel website before enabling student access.
7. In Render's **Environment** settings, securely reveal the generated `ADMIN_PASSWORD`. Sign in as `schooladmin` and share the credential privately with the designated complaint monitor.

Render's free web service can spin down when idle, and Supabase free-tier projects/storage have quotas and availability limits. The first request after idle may be slow. Keep backups and review retention and access policies; use school-approved paid/managed service plans if the portal becomes an official channel for sensitive complaints.

## Features and data handling

- Student accounts use salted `scrypt` password hashes; session tokens are random, stored as hashes in the database, and sent only in `HttpOnly`, `SameSite=Strict` cookies.
- Students can view only their own complaints. Administrators can view all complaints and student details.
- Complaint references contain 128 bits of randomness. Students can use a reference number for guest tracking, which returns only the category, dates, and status history. Viewing descriptions, staff notes, or evidence still requires the student's account or an administrator account.
- Complaint status changes and administrator notes are retained in a status history.
- Attachments are limited to one PDF or image, up to 5 MB. File contents are checked before storage; production files are kept in a private Supabase Storage bucket and downloads require authorization.
- Student ID format is checked during registration, but this standalone project does not connect to a school roster to verify a student's identity. A school deployment should integrate its identity provider or an approved enrollment roster before treating registrations as verified identities.
- Local development uses SQLite. Production uses managed PostgreSQL and private object storage; a school deployment still needs approved identity verification, scheduled backups, HTTPS, and documented retention/access policies.

## Checks

```powershell
npm test
npm run build
```
