import { newDatabase } from './db/db';
import type { Database } from 'bun:sqlite';

export type ApiConfig = {
  db: Database;
  jwtSecret: string;
  port: string;
  platform: string;
  filePathRoot: string;
  assetsRoot: string;
  encryptionAlgorithm: string;
  encryptionKey: string;
  prestoEmail: string;
  prestoSenha: string;
  prestoPin: string
};

const pathToDB = EnvOrThrow('DB_PATH');
const jwtSecret = EnvOrThrow('JWT_SECRET');
const port = EnvOrThrow('PORT');
const platform = EnvOrThrow('PLATFORM');
const filePathRoot = EnvOrThrow('FILEPATH_ROOT');
const assetsRoot = EnvOrThrow('ASSETS_ROOT');
const encryptionAlgorithm = EnvOrThrow('ENCRYPTION_ALGORITHM');
const encryptionKey = EnvOrThrow('ENCRYPTION_KEY');
const prestoEmail = EnvOrThrow('PRESTO_EMAIL');
const prestoSenha = EnvOrThrow('PRESTO_SENHA');
const prestoPin = EnvOrThrow('PRESTO_PIN');
const db = newDatabase(pathToDB);

export const config: ApiConfig = {
  db: db,
  jwtSecret: jwtSecret,
  port: port,
  platform: platform,
  filePathRoot: filePathRoot,
  assetsRoot: assetsRoot,
  encryptionAlgorithm: encryptionAlgorithm,
  encryptionKey: encryptionKey,
  prestoEmail: prestoEmail,
  prestoSenha: prestoSenha,
  prestoPin: prestoPin
};

function EnvOrThrow(key: string): string {
  const envVar = process.env[key];
  if (!envVar) {
    throw new Error(`${key} precisa ser definida`);
  }
  return envVar;
}
