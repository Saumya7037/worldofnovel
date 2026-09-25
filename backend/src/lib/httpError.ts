export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export function notFound(message = 'Not found.'): HttpError {
  return new HttpError(404, message);
}

export function forbidden(message = 'You do not have access to this resource.'): HttpError {
  return new HttpError(403, message);
}

export function unauthorized(message = 'You must be signed in to do that.'): HttpError {
  return new HttpError(401, message);
}

export function badRequest(message = 'Invalid request.'): HttpError {
  return new HttpError(400, message);
}