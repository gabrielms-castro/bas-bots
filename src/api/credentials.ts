import type { ApiConfig } from '../config';
import { respondWithJSON } from './json';
import { BadRequestError, InternalServerError } from './errors';
import {
  createCredential,
  deleteCredential,
  getCredentialByID,
  getCredentialByName,
  getCredentials,
  listAllCredentialsByUserID,
  updateCredential,
  type UpdateCredentialParams,
} from '../db/credentials';
import type { AuthenticatedRequest } from './middleware';
import { decrypt, encrypt } from '../services/crypto.service';

export async function handlerCreateCredential(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const { groupName, credentialName, login, password } = await req.json();
  if (!groupName || !credentialName || !login || !password) {
    throw new BadRequestError(
      'Por favor, insira um nome para a credencial, login e senha',
    );
  }

  const queryCredential = await getCredentialByName(
    config.db,
    userID,
    credentialName,
  );
  if (queryCredential) {
    throw new BadRequestError(`A credencial ${credentialName} já existe`);
  }
  const encryptedPassword = encrypt(password);
  const result = await createCredential(config.db, {
    groupName: groupName,
    credentialName: credentialName,
    login: login,
    password: encryptedPassword,
    userID: userID,
  });

  if (!result) {
    throw new BadRequestError(`Não foi possível criar a credencial`);
  }

  return respondWithJSON(200, result);
}

export async function handlerListAllCredentialsByUserID(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const instances = await listAllCredentialsByUserID(config.db, userID);
  return respondWithJSON(200, instances);
}

export async function handlerUpdateCredential(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const credentialID = pathParts[pathParts.length - 1];
  if (!credentialID) throw new BadRequestError('Credential ID is required');

  const body: UpdateCredentialParams = await req.json();

  const credential = await getCredentialByID(config.db, credentialID);
  if (!credential || credential.userID !== userID)
    throw new BadRequestError('Credencial não encontrada');

  const params: UpdateCredentialParams = {};
  if (body.credentialName !== undefined)
    params.credentialName = body.credentialName;
  if (body.login !== undefined) params.login = body.login;
  if (body.password !== undefined) params.password = body.password;

  const updated = await updateCredential(
    config.db,
    credentialID,
    userID,
    params,
  );
  return respondWithJSON(200, updated);
}

export async function handlerGetCredentialByID(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;

  type CredParams = { credentialID: string };
  const params = req.params as unknown as CredParams | undefined;
  const credentialID = params?.credentialID;
  if (!credentialID) throw new BadRequestError('ID inválido');

  const result = await getCredentialByID(config.db, credentialID);
  if (!result) throw new BadRequestError('Não encontrado');
  if (result.userID !== userID)
    throw new BadRequestError('Credencial nao encontrada');

  result.password = decrypt(result.password);
  return respondWithJSON(200, result);
}

export async function handlerDeleteCredential(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const credentialID = pathParts[pathParts.length - 1];
  if (!credentialID) throw new BadRequestError('Credential ID is required');

  const credential = await getCredentialByID(config.db, credentialID);
  if (!credential || credential.userID !== userID)
    throw new BadRequestError('Credential not found');

  const deleted = await deleteCredential(config.db, userID, credentialID);
  if (!deleted) throw new InternalServerError('Failed to delete credential');

  return respondWithJSON(204, {});
}
