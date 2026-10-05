# Student Complaint Management System

A full-stack student complaint portal built with Vue, Express, and SQLite. Students can create accounts, file private complaints, attach evidence, and follow status updates. Administrators can review submissions, filter the inbox, and update complaint statuses with a note recorded in the case history.

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

Build the frontend, set `NODE_ENV=production`, and start the server. The production server serves the built frontend and API on the same port:

```powershell
npm run build
$env:NODE_ENV = "production"
npm start
```

Set `PORT`, `APP_ORIGIN`, `DATABASE_PATH`, and `UPLOADS_DIRECTORY` in the environment as needed. Set `APP_ORIGIN` to the exact public origin when using a reverse proxy. When exposed outside a trusted local network, terminate HTTPS at the server or a trusted reverse proxy and use a strong, private administrator password. Production session cookies are marked `Secure`.

## Deploy to Render

The root [render.yaml](./render.yaml) defines a Render Blueprint for this app, including a Node web service, health check, generated administrator password, and a persistent disk for SQLite and uploaded evidence. The Blueprint uses Render's paid Starter web-service plan because persistent disks are not available on free web services.

1. Push the project to GitHub and sign in to Render.
2. In the Render Dashboard, choose **New** → **Blueprint**, connect the `asarsale7-del/sarsale_VUE_MINI` repository, and select the `main` branch.
3. Review the Blueprint resources and plan, then apply it. Render builds the Vue app and starts the API; wait for the service health check to pass.
4. Open the service's **Environment** settings and securely reveal the generated `ADMIN_PASSWORD`. Sign in at the service's `onrender.com` URL using username `schooladmin`, and share the password privately with the designated complaint monitor.
5. Keep the generated password private. To rotate it, set a new `ADMIN_PASSWORD` in Render's Environment settings and save; the app updates the admin password when the service restarts.

The service's persistent disk preserves the complaint database and attachments across deploys. Keep the paid service active and configure regular backups according to the school's data-retention requirements.

## Features and data handling

- Student accounts use salted `scrypt` password hashes; session tokens are random, stored as hashes in SQLite, and sent only in `HttpOnly`, `SameSite=Strict` cookies.
- Students can view only their own complaints. Administrators can view all complaints and student details.
- Complaint references contain 128 bits of randomness. Students can use a reference number for guest tracking, which returns only the category, dates, and status history. Viewing descriptions, staff notes, or evidence still requires the student's account or an administrator account.
- Complaint status changes and administrator notes are retained in a status history.
- Attachments are limited to one PDF or image, up to 5 MB. File contents are checked before storage; files are kept outside the public web directory and downloads require authorization.
- Student ID format is checked during registration, but this standalone project does not connect to a school roster to verify a student's identity. A school deployment should integrate its identity provider or an approved enrollment roster before treating registrations as verified identities.
- SQLite is appropriate for a local capstone or a single-server deployment. A multi-server school deployment should use a managed database, scheduled backups, HTTPS, and the school's identity and retention policies.

## Checks

```powershell
npm test
npm run build
```
