import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { createAdmin, createApp } from '../server/app.js';
import { openDatabase } from '../server/database.js';

let database;
let server;
let baseUrl;
let uploadsDir;
let studentCookie;
let studentReference;
let adminCookie;

async function request(route, { method = 'GET', cookie, body, headers = {} } = {}) {
  return fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      Origin: baseUrl,
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    ...(body !== undefined ? { body } : {})
  });
}

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

before(async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'campuscare-test-'));
  uploadsDir = path.join(directory, 'uploads');
  database = openDatabase(':memory:');
  await createAdmin(database, 'schooladmin', 'School Administrator', 'test-admin-password');
  const app = createApp({ database, uploadsDir, production: true });
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  database.close();
  await rm(path.dirname(uploadsDir), { recursive: true, force: true });
});

test('requires an authenticated student session and creates a private account', async () => {
  const anonymous = await request('/api/complaints');
  assert.equal(anonymous.status, 401);

  const registration = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Alex Rivera',
      studentId: 'STU-1001',
      password: 'student-test-password'
    })
  });
  assert.equal(registration.status, 201);
  const registered = await registration.json();
  assert.equal(registered.user.role, 'student');
  assert.equal(registered.user.studentId, 'stu-1001');
  studentCookie = cookieFrom(registration);
  assert.match(registration.headers.get('set-cookie'), /HttpOnly/);
  assert.match(registration.headers.get('set-cookie'), /SameSite=Strict/);

  const duplicate = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Another Student',
      studentId: 'stu-1001',
      password: 'another-test-password'
    })
  });
  assert.equal(duplicate.status, 409);

  const currentUser = await request('/api/auth/me', { cookie: studentCookie });
  assert.equal((await currentUser.json()).user.fullName, 'Alex Rivera');
});

test('stores complaints and prevents other students from reading them', async () => {
  const form = new FormData();
  form.set('category', 'Academic Concern');
  form.set('description', 'I need assistance with a course assessment.');
  const submitted = await request('/api/complaints', { method: 'POST', cookie: studentCookie, body: form });
  assert.equal(submitted.status, 201);
  const result = await submitted.json();
  studentReference = result.complaint.reference;
  assert.match(studentReference, /^SC-\d{8}-[0-9A-F]{32}$/);
  assert.equal(result.complaint.status, 'Pending');
  assert.equal(result.complaint.evidence, null);

  const list = await request('/api/complaints', { cookie: studentCookie });
  assert.equal((await list.json()).complaints.length, 1);

  const guestTrack = await request(`/api/public/complaints/${studentReference}`);
  assert.equal(guestTrack.status, 200);
  const guestResult = await guestTrack.json();
  assert.equal(guestResult.complaint.status, 'Pending');
  assert.equal(guestResult.complaint.category, 'Academic Concern');
  assert.equal('description' in guestResult.complaint, false);
  assert.equal('evidence' in guestResult.complaint, false);
  assert.equal('note' in guestResult.updates[0], false);

  const secondRegistration = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Sam Taylor',
      studentId: 'STU-2002',
      password: 'second-student-password'
    })
  });
  const secondCookie = cookieFrom(secondRegistration);
  const secondList = await request('/api/complaints', { cookie: secondCookie });
  assert.deepEqual((await secondList.json()).complaints, []);
  const privateDetail = await request(`/api/complaints/${studentReference}`, { cookie: secondCookie });
  assert.equal(privateDetail.status, 404);

  const studentForbidden = await request(`/api/complaints/${studentReference}/status`, {
    method: 'PATCH',
    cookie: studentCookie,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Resolved' })
  });
  assert.equal(studentForbidden.status, 403);
});

test('administrator can update a complaint and leave an audit note', async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: 'SCHOOLADMIN', password: 'test-admin-password' })
  });
  assert.equal(login.status, 200);
  adminCookie = cookieFrom(login);
  assert.equal((await login.json()).user.role, 'admin');

  const update = await request(`/api/complaints/${studentReference}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In Progress', note: 'Assigned to the academic office.' })
  });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).complaint.status, 'In Progress');

  const detailResponse = await request(`/api/complaints/${studentReference}`, { cookie: studentCookie });
  const detail = await detailResponse.json();
  assert.equal(detail.complaint.status, 'In Progress');
  assert.equal(detail.updates.length, 2);
  assert.equal(detail.updates[0].note, 'Assigned to the academic office.');
  const guestAfterUpdate = await request(`/api/public/complaints/${studentReference}`);
  assert.equal((await guestAfterUpdate.json()).complaint.status, 'In Progress');

  const adminList = await request('/api/complaints', { cookie: adminCookie });
  const adminComplaint = (await adminList.json()).complaints[0];
  assert.equal(adminComplaint.studentId, 'stu-1001');
  assert.equal(adminComplaint.studentName, 'Alex Rivera');

  const invalidStatus = await request(`/api/complaints/${studentReference}/status`, {
    method: 'PATCH',
    cookie: adminCookie,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Deleted' })
  });
  assert.equal(invalidStatus.status, 400);
});

test('stores verified attachments and restricts downloads to the complaint owner', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/eioAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.set('category', 'Facilities & Services');
  form.set('description', 'A classroom light needs to be repaired.');
  form.set('evidence', new Blob([png], { type: 'image/png' }), 'photo.png');
  const submitted = await request('/api/complaints', { method: 'POST', cookie: studentCookie, body: form });
  assert.equal(submitted.status, 201);
  const complaint = (await submitted.json()).complaint;
  assert.equal(complaint.evidence.filename, 'photo.png');

  const downloaded = await request(complaint.evidence.url, { cookie: studentCookie });
  assert.equal(downloaded.status, 200);
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), png);

  const otherStudent = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: 'stu-2002', password: 'second-student-password' })
  });
  const forbiddenDownload = await request(complaint.evidence.url, { cookie: cookieFrom(otherStudent) });
  assert.equal(forbiddenDownload.status, 404);

  const invalidForm = new FormData();
  invalidForm.set('category', 'Technical Issue');
  invalidForm.set('description', 'The student portal gives an error.');
  invalidForm.set('evidence', new Blob(['not a pdf'], { type: 'application/pdf' }), 'fake.pdf');
  const invalidUpload = await request('/api/complaints', { method: 'POST', cookie: studentCookie, body: invalidForm });
  assert.equal(invalidUpload.status, 400);
});

test('limits repeated failed sign-in attempts', async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 'stu-1001', password: 'wrong-password' })
    });
    assert.equal(response.status, 401);
  }
  const blocked = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: 'stu-1001', password: 'wrong-password' })
  });
  assert.equal(blocked.status, 429);
});

test('logout revokes access and cross-origin requests are rejected', async () => {
  const proxiedHttpsOrigin = `https://${new URL(baseUrl).host}`;
  const proxiedRequest = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Origin: proxiedHttpsOrigin, 'X-Forwarded-Proto': 'https' }
  });
  assert.equal(proxiedRequest.status, 200);

  const rejectedOrigin = await fetch(`${baseUrl}/api/complaints`, {
    headers: { Origin: 'https://untrusted.example', Cookie: studentCookie }
  });
  assert.equal(rejectedOrigin.status, 403);

  const logout = await request('/api/auth/logout', { method: 'POST', cookie: studentCookie });
  assert.equal(logout.status, 204);
  const currentUser = await request('/api/auth/me', { cookie: studentCookie });
  assert.equal((await currentUser.json()).user, null);
  const privateList = await request('/api/complaints', { cookie: studentCookie });
  assert.equal(privateList.status, 401);
});
