import { afterAll, describe, expect, it } from 'vitest';
import { api, registerUser, randomEmail, cleanupDatabase } from './helpers.js';

afterAll(cleanupDatabase);

describe('Auth API', () => {
  it('registers a new user and sets an auth cookie', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Alice',
      email: randomEmail(),
      password: 'longenoughpw',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie']?.[0]).toContain('won_token');
  });

  it('rejects a duplicate email', async () => {
    const email = randomEmail();
    await api.post('/api/auth/register').send({ name: 'A', email, password: 'longenoughpw' });
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'B', email, password: 'longenoughpw' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email is already registered.');
  });

  it('rejects a short password', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'A', email: randomEmail(), password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/);
  });

  it('logs in with correct credentials', async () => {
    const email = randomEmail();
    await api.post('/api/auth/register').send({ name: 'A', email, password: 'longenoughpw' });
    const res = await api.post('/api/auth/login').send({ email, password: 'longenoughpw' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toContain('won_token');
  });

  it('rejects login with a wrong password', async () => {
    const email = randomEmail();
    await api.post('/api/auth/register').send({ name: 'A', email, password: 'longenoughpw' });
    const res = await api.post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Incorrect email or password.');
  });

  it('exposes the current user via /me', async () => {
    const { agent, user } = await registerUser();
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe(user.email);
  });

  it('rejects /me when logged out', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logs out and invalidates the session', async () => {
    const { agent } = await registerUser();
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});