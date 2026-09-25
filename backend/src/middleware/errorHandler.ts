import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    res
      .status(400)
      .json({ error: firstIssue ? firstIssue.message : 'Invalid request body.' });
    return;
  }

  const multerError = err as { code?: string; message?: string };
  if (multerError?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'File is too large. Maximum size is 10 MB.' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found.' });
}