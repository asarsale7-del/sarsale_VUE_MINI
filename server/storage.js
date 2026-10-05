import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function createLocalStorage(directory) {
  return {
    async put(name, content) {
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, name), content, { flag: 'wx' });
    },
    async get(name) {
      return readFile(path.join(directory, name));
    },
    async delete(name) {
      await unlink(path.join(directory, name));
    }
  };
}

export function createSupabaseStorage({ url, serviceRoleKey, bucket }) {
  if (!url || !serviceRoleKey || !bucket) {
    throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET.');
  }

  const storageUrl = `${url.replace(/\/+$/, '')}/storage/v1`;
  const baseUrl = `${storageUrl}/object/${encodeURIComponent(bucket)}`;

  async function request(name, options = {}) {
    const response = await fetch(`${baseUrl}/${name.split('/').map(encodeURIComponent).join('/')}`, {
      ...options,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...options.headers
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase Storage request failed (${response.status}): ${detail}`);
    }
    return response;
  }

  return {
    async verify() {
      const response = await fetch(`${storageUrl}/bucket/${encodeURIComponent(bucket)}`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
      });
      if (!response.ok) {
        throw new Error(`Could not verify Supabase Storage bucket "${bucket}" (${response.status}).`);
      }
      const details = await response.json();
      if (details.public !== false) {
        throw new Error(`Supabase Storage bucket "${bucket}" must be private.`);
      }
    },
    async put(name, content, contentType) {
      await request(name, {
        method: 'POST',
        headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
        body: content
      });
    },
    async get(name) {
      return Buffer.from(await (await request(name)).arrayBuffer());
    },
    async delete(name) {
      await request(name, { method: 'DELETE' });
    }
  };
}
