import { afterAll, describe, expect, it } from 'vitest';
import { registerUser, randomEmail, cleanupDatabase, api } from './helpers.js';

afterAll(cleanupDatabase);

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

describe('Uploads API', () => {
  it('rejects uploads without authentication', async () => {
    const res = await api.post('/api/uploads/image').attach('file', PNG_1PX, 'a.png');
    expect(res.status).toBe(401);
  });

  it('uploads a cover image and returns a public URL', async () => {
    const { agent } = await registerUser();
    const res = await agent
      .post('/api/uploads/cover')
      .attach('file', PNG_1PX, 'cover.png');
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\/\d{4}-\d{2}-\d{2}\/[\w-]+\.png$/);
  });

  it('uploads an inline image', async () => {
    const { agent } = await registerUser();
    const res = await agent
      .post('/api/uploads/image')
      .attach('file', PNG_1PX, 'scene.png');
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\//);
  });

  it('rejects non-image files', async () => {
    const { agent } = await registerUser();
    const res = await agent
      .post('/api/uploads/cover')
      .attach('file', Buffer.from('<html>not an image</html>', 'utf8'), 'evil.html');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG, PNG, WebP, or GIF/);
  });

  it('serves an uploaded file at its public URL', async () => {
    const { agent } = await registerUser();
    const upload = await agent.post('/api/uploads/cover').attach('file', PNG_1PX, 'img.png');
    const url = upload.body.url as string;
    const fetch = await agent.get(url);
    expect(fetch.status).toBe(200);
    expect(fetch.headers['content-type']).toMatch(/image\/png/);
  });
});