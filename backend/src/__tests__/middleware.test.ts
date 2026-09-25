import { describe, expect, it } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { signToken } from '../lib/jwt.js';
import { HttpError } from '../lib/httpError.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

function mockRes(): { statusCode: number; body: unknown } {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
    clearCookie() {
      return res;
    },
  };
  return res;
}

describe('requireAuth', () => {
  it('rejects requests without a token', () => {
    const req = { cookies: {} } as unknown as Request;
    const res = mockRes() as unknown as Response;
    let passedError: unknown;
    requireAuth(req, res, (err) => {
      passedError = err;
    });
    expect(passedError).toBeInstanceOf(HttpError);
    expect((passedError as HttpError).status).toBe(401);
  });

  it('rejects an invalid token', () => {
    const req = { cookies: { won_token: 'not-a-real-token' } } as unknown as Request;
    const res = mockRes() as unknown as Response;
    let passedError: unknown;
    requireAuth(req, res, (err) => {
      passedError = err;
    });
    expect((passedError as HttpError).status).toBe(401);
  });

  it('attaches the user for a valid token', () => {
    const token = signToken({ sub: 'user-1', email: 'a@b.com', name: 'Alice' });
    const req = { cookies: { won_token: token } } as unknown as Request;
    const res = mockRes() as unknown as Response;
    let nextCalled = false;
    requireAuth(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect((req as Request & { user?: { id: string } }).user?.id).toBe('user-1');
  });
});

describe('validate', () => {
  it('passes through valid bodies', () => {
    const schema = z.object({ title: z.string().min(1) });
    const req = { body: { title: 'Hello' } } as unknown as Request;
    const res = mockRes() as unknown as Response;
    let nextCalled = false;
    validate(schema)(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it('rejects invalid bodies with a 400 error', () => {
    const schema = z.object({ title: z.string().min(1) });
    const req = { body: { title: '' } } as unknown as Request;
    const res = mockRes() as unknown as Response;
    let passedError: unknown;
    validate(schema)(req, res, (err) => {
      passedError = err;
    });
    expect(passedError).toBeInstanceOf(HttpError);
    expect((passedError as HttpError).status).toBe(400);
  });
});