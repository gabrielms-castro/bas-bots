import type { BunRequest } from 'bun';
import type { ApiConfig } from '../config';
import { BadRequestError } from './errors';

import { createUser, getUserByEmail, type UserResponse } from '../db/users';
import { respondWithJSON } from './json';
import { hashPassword } from '../services/auth.service';

function isEmailValid(email: string) {
  return email.match(/\w+@\w+/g);
}
export async function handlerCreateUser(config: ApiConfig, req: BunRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    throw new BadRequestError('Por favor, insira um e-mail válido e uma senha');
  }

  if (!isEmailValid(email)) {
    throw new BadRequestError('Por favor, insira um e-mail válido e uma senha');
  }

  const user = await getUserByEmail(config.db, email);
  if (user) {
    throw new BadRequestError(`O e-mail ${email} já está em uso`);
  }

  const hashedPassword = await hashPassword(password);

  const result = await createUser(config.db, {
    email: email,
    password: hashedPassword,
  });

  if (!result) {
    throw new BadRequestError(`Não foi possível criar o usuário`);
  }

  return respondWithJSON(201, {
    id: result.id,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    email: result.email,
  } satisfies UserResponse);
}
