import { randomBytes, randomUUID, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { createLocalStorage } from './storage.js';

const scrypt = promisify(scryptCallback);
const categories = new Set([
  'Academic Concern',
  'Library Services',
  'Facilities & Services',
  'Disciplinary Concern',
  'Technical Issue',
  'Other'
]);
const statuses = new Set(['Pending', 'In Progress', 'Resolved']);
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const sessionCookie = 'scms_session';
const uploadLimit = 5 * 1024 * 1024;
const loginWindow = 15 * 60 * 1000;
const loginAttemptLimit = 10;
const dummyPasswordHash = await hashPassword('not-a-real-account-password');

function postgresSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function databaseGet(database, sql, parameters = []) {
  if (typeof database.query === 'function') {
    return database.query(postgresSql(sql), parameters).then((result) => result.rows[0] || null);
  }
  return database.prepare(sql).get(...parameters) || null;
}

function databaseAll(database, sql, parameters = []) {
  if (typeof database.query === 'function') {
    return database.query(postgresSql(sql), parameters).then((result) => result.rows);
  }
  return database.prepare(sql).all(...parameters);
}

function databaseRun(database, sql, parameters = []) {
  if (typeof database.query === 'function') {
    return database.query(postgresSql(sql), parameters).then((result) => ({
      changes: result.rowCount,
      lastInsertRowid: result.rows[0]?.id
    }));
  }
  if (/\bRETURNING\b/i.test(sql)) {
    const row = database.prepare(sql).get(...parameters);
    return { changes: row ? 1 : 0, lastInsertRowid: row?.id };
  }
  return database.prepare(sql).run(...parameters);
}

function databaseTransaction(database, callback) {
  if (typeof database.transaction === 'function') return database.transaction(callback);
  return database.transaction(() => callback(database))();
}

function requestSessionToken(request) {
  return request.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [algorithm, saltHex, keyHex] = stored.split(':');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function publicUser(user) {
  return {
    id: user.id,
    studentId: user.student_id,
    fullName: user.full_name,
    role: user.role
  };
}

function cleanComplaint(complaint, role) {
  return {
    reference: complaint.reference,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    createdAt: complaint.created_at,
    updatedAt: complaint.updated_at,
    ...(role === 'admin' ? {
      studentId: complaint.student_id,
      studentName: complaint.full_name
    } : {}),
    evidence: complaint.evidence_id ? {
      filename: complaint.filename,
      contentType: complaint.content_type,
      size: complaint.size,
      url: `/api/complaints/${encodeURIComponent(complaint.reference)}/evidence`
    } : null
  };
}

function isAllowedFile(file) {
  const signature = file.buffer.subarray(0, 12);
  if (file.mimetype === 'application/pdf') return signature.subarray(0, 5).toString() === '%PDF-';
  if (file.mimetype === 'image/jpeg') return signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  if (file.mimetype === 'image/png') return signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/gif') return ['GIF87a', 'GIF89a'].includes(signature.subarray(0, 6).toString());
  if (file.mimetype === 'image/webp') return signature.subarray(0, 4).toString() === 'RIFF' && signature.subarray(8, 12).toString() === 'WEBP';
  return false;
}

function attachmentExtension(contentType) {
  return {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  }[contentType];
}

export function createApp({ database, uploadsDir, storage, production = false, allowedOrigins = [] }) {
  const app = express();
  const evidenceStorage = storage || createLocalStorage(uploadsDir);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: uploadLimit, fieldSize: 24 * 1024, fields: 2, files: 1, parts: 3 },
    fileFilter(_request, file, callback) {
      const supported = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!supported.includes(file.mimetype)) {
        return callback(Object.assign(new Error('Unsupported attachment type.'), { status: 400, code: 'INVALID_FILE_TYPE' }));
      }
      callback(null, true);
    }
  });
  const selectComplaint = `
    SELECT c.*, u.student_id, u.full_name, e.id AS evidence_id, e.filename, e.content_type, e.size, e.storage_name
    FROM complaints c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN evidence e ON e.complaint_id = c.id
  `;
  const getComplaint = (reference) => databaseGet(database, `${selectComplaint} WHERE c.reference = ?`, [reference]);

  app.disable('x-powered-by');
  if (production) app.set('trust proxy', 1);
  app.use((request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Frame-Options': 'DENY'
    });
    if (production) {
      response.set('Content-Security-Policy', "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; connect-src 'self'; style-src 'self'; font-src 'self'");
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', (_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });

  app.use(async (request, response, next) => {
    try {
      const origin = request.get('origin');
      const sameOrigin = origin === `${request.protocol}://${request.get('host')}`;
      if (origin && !sameOrigin && !allowedOrigins.includes(origin)) {
        return response.status(403).json({ error: 'Cross-origin requests are not allowed.' });
      }

      const token = requestSessionToken(request);
      if (token) {
        const session = await databaseGet(database, `
          SELECT u.* FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?
        `, [hashToken(token), Date.now()]);
        if (session) request.user = session;
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  function requireUser(request, response, next) {
    if (!request.user) return response.status(401).json({ error: 'Sign in to continue.' });
    next();
  }

  function requireAdmin(request, response, next) {
    if (!request.user) return response.status(401).json({ error: 'Sign in to continue.' });
    if (request.user.role !== 'admin') return response.status(403).json({ error: 'Administrator access is required.' });
    next();
  }

  async function setSession(response, user) {
    const token = randomBytes(32).toString('base64url');
    await databaseRun(database, 'DELETE FROM sessions WHERE expires_at <= ?', [Date.now()]);
    await databaseRun(database, 'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [
      hashToken(token), user.id, Date.now() + sessionLifetime
    ]);
    const secure = production ? '; Secure' : '';
    response.set('Set-Cookie', `${sessionCookie}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetime / 1000}${secure}`);
    response.set('Cache-Control', 'no-store');
  }

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

  app.get('/api/auth/me', (request, response) => {
    response.set('Cache-Control', 'no-store');
    response.json({ user: request.user ? publicUser(request.user) : null });
  });

  app.post('/api/auth/register', async (request, response, next) => {
    try {
      const { studentId, fullName, password } = request.body || {};
      if (typeof studentId !== 'string' || !/^[a-zA-Z0-9_-]{4,32}$/.test(studentId.trim())) {
        return response.status(400).json({ error: 'Student ID must be 4–32 letters, numbers, dashes, or underscores.' });
      }
      if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100) {
        return response.status(400).json({ error: 'Enter a name between 2 and 100 characters.' });
      }
      if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
        return response.status(400).json({ error: 'Password must be between 10 and 128 characters.' });
      }
      const existing = await databaseGet(database, 'SELECT id FROM users WHERE student_id = ?', [studentId.trim().toLowerCase()]);
      if (existing) return response.status(409).json({ error: 'An account with that Student ID already exists.' });

      const result = await databaseRun(database, `
        INSERT INTO users (student_id, full_name, password_hash)
        VALUES (?, ?, ?)
        RETURNING id
      `, [studentId.trim().toLowerCase(), fullName.trim(), await hashPassword(password)]);
      const user = await databaseGet(database, 'SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
      await setSession(response, user);
      response.status(201).json({ user: publicUser(user) });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        return response.status(409).json({ error: 'An account with that Student ID already exists.' });
      }
      next(error);
    }
  });

  app.post('/api/auth/login', async (request, response, next) => {
    try {
      const { studentId, password } = request.body || {};
      if (typeof studentId !== 'string' || typeof password !== 'string') {
        return response.status(400).json({ error: 'Enter your Student ID and password.' });
      }
      const now = Date.now();
      const ipHash = hashToken(request.ip || request.socket.remoteAddress || 'unknown');
      const attempt = await databaseGet(database, `
        INSERT INTO login_attempts (ip_hash, window_started_at, attempts) VALUES (?, ?, 1)
        ON CONFLICT(ip_hash) DO UPDATE SET
          attempts = CASE WHEN login_attempts.window_started_at <= ? THEN 1 ELSE login_attempts.attempts + 1 END,
          window_started_at = CASE WHEN login_attempts.window_started_at <= ? THEN excluded.window_started_at ELSE login_attempts.window_started_at END
        RETURNING attempts
      `, [ipHash, now, now - loginWindow, now - loginWindow]);
      if (attempt.attempts > loginAttemptLimit) {
        return response.status(429).json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' });
      }
      const user = studentId.length <= 32
        ? await databaseGet(database, 'SELECT * FROM users WHERE student_id = ?', [studentId.trim().toLowerCase()])
        : null;
      const valid = await verifyPassword(password, user?.password_hash || dummyPasswordHash);
      if (!user || !valid) return response.status(401).json({ error: 'Student ID or password is incorrect.' });
      await databaseRun(database, 'DELETE FROM login_attempts WHERE ip_hash = ?', [ipHash]);
      await setSession(response, user);
      response.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/auth/logout', async (request, response, next) => {
    const token = requestSessionToken(request);
    try {
      if (token) await databaseRun(database, 'DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
      response.set('Set-Cookie', `${sessionCookie}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${production ? '; Secure' : ''}`);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/complaints', requireUser, async (request, response, next) => {
    try {
      const { status, reference } = request.query;
      if (status && !statuses.has(status)) return response.status(400).json({ error: 'Unknown complaint status.' });
      let query = `${selectComplaint} WHERE 1 = 1`;
      const parameters = [];
      if (request.user.role !== 'admin') {
        query += ' AND c.user_id = ?';
        parameters.push(request.user.id);
      }
      if (status) {
        query += ' AND c.status = ?';
        parameters.push(status);
      }
      if (reference) {
        query += ' AND c.reference = ?';
        parameters.push(String(reference).trim().toUpperCase());
      }
      query += ' ORDER BY c.created_at DESC';
      const rows = await databaseAll(database, query, parameters);
      response.json({ complaints: rows.map((row) => cleanComplaint(row, request.user.role)) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/complaints', requireUser, upload.single('evidence'), async (request, response, next) => {
    let storedEvidenceName;
    try {
      const { category, description } = request.body || {};
      if (!categories.has(category)) return response.status(400).json({ error: 'Choose a valid complaint category.' });
      if (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 5000) {
        return response.status(400).json({ error: 'Description must be between 10 and 5,000 characters.' });
      }
      if (request.file && !isAllowedFile(request.file)) {
        return response.status(400).json({ error: 'The attachment content does not match a supported file type.' });
      }
      const reference = `SC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(16).toString('hex').toUpperCase()}`;
      const insert = `
        INSERT INTO complaints (reference, user_id, category, description)
        VALUES (?, ?, ?, ?)
        RETURNING id
      `;
      const createInitialUpdate = `
        INSERT INTO complaint_updates (complaint_id, status, note, changed_by)
        VALUES (?, 'Pending', 'Complaint submitted.', ?)
      `;
      let evidenceName;
      if (request.file) {
        evidenceName = `${randomUUID()}${attachmentExtension(request.file.mimetype)}`;
        storedEvidenceName = evidenceName;
        await evidenceStorage.put(evidenceName, request.file.buffer, request.file.mimetype);
      }

      const createInPostgres = async (transactionDatabase) => {
        const result = await databaseRun(transactionDatabase, insert, [
          reference, request.user.id, category, description.trim()
        ]);
        const complaintId = result.lastInsertRowid;
        await databaseRun(transactionDatabase, createInitialUpdate, [complaintId, request.user.id]);
        if (request.file) {
          await databaseRun(transactionDatabase, `
            INSERT INTO evidence (complaint_id, filename, content_type, storage_name, size)
            VALUES (?, ?, ?, ?, ?)
          `, [complaintId, path.basename(request.file.originalname).slice(0, 200), request.file.mimetype, evidenceName, request.file.size]);
        }
      };
      if (typeof database.query === 'function') {
        await databaseTransaction(database, createInPostgres);
      } else {
        database.transaction(() => {
          const result = database.prepare(insert).get(reference, request.user.id, category, description.trim());
          const complaintId = result.id;
          database.prepare(createInitialUpdate).run(complaintId, request.user.id);
          if (request.file) {
            database.prepare(`
              INSERT INTO evidence (complaint_id, filename, content_type, storage_name, size)
              VALUES (?, ?, ?, ?, ?)
            `).run(complaintId, path.basename(request.file.originalname).slice(0, 200), request.file.mimetype, evidenceName, request.file.size);
          }
        })();
      }

      const complaint = await getComplaint(reference);
      response.status(201).json({ complaint: cleanComplaint(complaint, request.user.role) });
    } catch (error) {
      if (storedEvidenceName) {
        try {
          await evidenceStorage.delete(storedEvidenceName);
        } catch (cleanupError) {
          console.error('Could not remove an orphaned complaint attachment:', cleanupError);
        }
      }
      next(error);
    }
  });

  app.get('/api/complaints/:reference', requireUser, async (request, response, next) => {
    try {
      const complaint = await getComplaint(request.params.reference.toUpperCase());
      if (!complaint || (request.user.role !== 'admin' && complaint.user_id !== request.user.id)) {
        return response.status(404).json({ error: 'Complaint not found.' });
      }
      const updates = await databaseAll(database, `
        SELECT u.full_name AS changed_by, h.status, h.note, h.created_at
        FROM complaint_updates h JOIN users u ON u.id = h.changed_by
        WHERE h.complaint_id = ? ORDER BY h.created_at DESC, h.id DESC
      `, [complaint.id]);
      response.json({
        complaint: cleanComplaint(complaint, request.user.role),
        updates
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/public/complaints/:reference', async (request, response, next) => {
    try {
      const reference = request.params.reference.toUpperCase();
      if (!/^SC-\d{8}-[0-9A-F]{32}$/.test(reference)) {
        return response.status(404).json({ error: 'Complaint not found.' });
      }
      const complaint = await getComplaint(reference);
      if (!complaint) return response.status(404).json({ error: 'Complaint not found.' });

      const updates = await databaseAll(database, `
        SELECT status, created_at
        FROM complaint_updates
        WHERE complaint_id = ? ORDER BY created_at DESC, id DESC
      `, [complaint.id]);
      response.json({
        complaint: {
          reference: complaint.reference,
          category: complaint.category,
          status: complaint.status,
          createdAt: complaint.created_at,
          updatedAt: complaint.updated_at
        },
        updates
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/complaints/:reference/evidence', requireUser, async (request, response, next) => {
    try {
      const complaint = await getComplaint(request.params.reference.toUpperCase());
      if (!complaint || !complaint.evidence_id || (request.user.role !== 'admin' && complaint.user_id !== request.user.id)) {
        return response.status(404).json({ error: 'Attachment not found.' });
      }
      const content = await evidenceStorage.get(complaint.storage_name);
      response.set({
        'Content-Type': complaint.content_type,
        'Content-Disposition': `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(complaint.filename)}`,
        'Cache-Control': 'private, no-store'
      });
      response.send(content);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/complaints/:reference/status', requireAdmin, async (request, response, next) => {
    try {
      const { status, note = '' } = request.body || {};
      if (!statuses.has(status)) return response.status(400).json({ error: 'Choose a valid complaint status.' });
      if (typeof note !== 'string' || note.trim().length > 1000) return response.status(400).json({ error: 'Update notes must be 1,000 characters or fewer.' });
      const complaint = await databaseGet(database, 'SELECT * FROM complaints WHERE reference = ?', [request.params.reference.toUpperCase()]);
      if (!complaint) return response.status(404).json({ error: 'Complaint not found.' });

      const updateInPostgres = async (transactionDatabase) => {
        await databaseRun(transactionDatabase, `
          UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [status, complaint.id]);
        await databaseRun(transactionDatabase, `
          INSERT INTO complaint_updates (complaint_id, status, note, changed_by)
          VALUES (?, ?, ?, ?)
        `, [complaint.id, status, note.trim(), request.user.id]);
      };
      if (typeof database.query === 'function') {
        await databaseTransaction(database, updateInPostgres);
      } else {
        database.transaction(() => {
          database.prepare(`
            UPDATE complaints SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?
          `).run(status, complaint.id);
          database.prepare(`
            INSERT INTO complaint_updates (complaint_id, status, note, changed_by)
            VALUES (?, ?, ?, ?)
          `).run(complaint.id, status, note.trim(), request.user.id);
        })();
      }
      response.json({ complaint: cleanComplaint(await getComplaint(complaint.reference), request.user.role) });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', (_request, response) => response.status(404).json({ error: 'API endpoint not found.' }));
  app.use((error, _request, response, _next) => {
    if (error instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: 'Attachment must be 5 MB or smaller.',
        LIMIT_FILE_COUNT: 'Only one attachment is allowed.',
        LIMIT_FIELD_COUNT: 'The complaint form contains too many fields.',
        LIMIT_FIELD_VALUE: 'A complaint form field is too large.',
        LIMIT_PART_COUNT: 'The complaint form contains too many parts.',
        LIMIT_UNEXPECTED_FILE: 'Only one supported attachment is allowed.'
      };
      const message = messages[error.code] || 'The complaint form could not be processed.';
      return response.status(400).json({ error: message });
    }
    if (error.code === 'INVALID_FILE_TYPE') return response.status(400).json({ error: error.message });
    if (error.status === 400 && error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    console.error('Request failed:', error);
    response.status(500).json({ error: 'The request could not be completed. Please try again.' });
  });

  return app;
}

export async function createAdmin(database, studentId, fullName, password) {
  if (!studentId || !fullName || !password) return false;
  if (password.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  const normalizedId = studentId.trim().toLowerCase();
  const current = await databaseGet(database, 'SELECT id, role FROM users WHERE student_id = ?', [normalizedId]);
  const passwordHash = await hashPassword(password);
  if (current) {
    if (current.role !== 'admin') throw new Error('ADMIN_USERNAME belongs to a student account.');
    await databaseRun(database, 'UPDATE users SET password_hash = ?, full_name = ? WHERE id = ?', [passwordHash, fullName.trim(), current.id]);
    return true;
  }
  await databaseRun(database, `
    INSERT INTO users (student_id, full_name, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `, [normalizedId, fullName.trim(), passwordHash]);
  return true;
}
