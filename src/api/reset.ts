import type { BunRequest } from 'bun';
import type { ApiConfig } from '../config';
import { UserForbiddenError } from './errors';
import { reset } from '../db/db';
import { respondWithJSON } from './json';

export async function handlerReset(config: ApiConfig, _: BunRequest) {
  if (config.platform !== 'dev') {
    throw new UserForbiddenError('Not allowed');
  }

  reset(config.db);
  return respondWithJSON(200, { message: 'Database reset to initial state' });
}
