import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { badRequest } from '../lib/httpError.js';

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      next(
        badRequest(
          firstIssue ? firstIssue.message : 'Invalid request body.',
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}