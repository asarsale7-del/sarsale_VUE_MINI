import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import express from 'express';
import { createAdmin, createApp } from './app.js';
import { openDatabase } from './database.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(currentDirectory, '..');
const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(rootDirectory, 'data', 'complaints.sqlite'));
const uploadsDirectory = path.resolve(process.env.UPLOADS_DIRECTORY || path.join(rootDirectory, 'data', 'uploads'));
await mkdir(path.dirname(databasePath), { recursive: true });
const database = openDatabase(databasePath);

const adminSettings = [process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD, process.env.ADMIN_NAME];
if (adminSettings.some(Boolean) && !adminSettings.every(Boolean)) {
  throw new Error('Set ADMIN_USERNAME, ADMIN_NAME, and ADMIN_PASSWORD together.');
}
if (adminSettings.filter(Boolean).length === adminSettings.length) {
  await createAdmin(database, process.env.ADMIN_USERNAME, process.env.ADMIN_NAME, process.env.ADMIN_PASSWORD);
}

const app = createApp({
  database,
  uploadsDir: uploadsDirectory,
  production: process.env.NODE_ENV === 'production',
  allowedOrigins: process.env.APP_ORIGIN
    ? [process.env.APP_ORIGIN]
    : process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:3000', 'http://127.0.0.1:3000']
});

if (process.env.NODE_ENV === 'production') {
  const distributionDirectory = path.join(rootDirectory, 'dist');
  app.use(express.static(distributionDirectory, { index: false, maxAge: '1h' }));
  app.get('/{*path}', (_request, response) => response.sendFile(path.join(distributionDirectory, 'index.html')));
}

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Complaint system API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
