import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 404, 'NOT_FOUND');
  }
}
