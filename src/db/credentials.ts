import type { Database } from 'bun:sqlite';
import { group } from 'console';
import { randomUUID, type UUID } from 'crypto';

export type Credential = {
  id: UUID;
  createdAt: Date;
  updatedAt: Date;
  groupName: string;
  credentialName: string;
  login: string;
  password: string;
  userID: UUID;
};

type CredentialRow = {
  id: UUID;
  created_at: string;
  updated_at: string;
  group_name: string;
  credential_name: string;
  login: string;
  password: string;
  user_id: UUID;
};

export type CreateCredentialParams = {
  groupName: string;
  credentialName: string;
  login: string;
  password: string;
  userID: string;
};

export type UpdateCredentialParams = {
  credentialName?: string;
  login?: string;
  password?: string;
};

function rowToCredential(row: CredentialRow): Credential {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    groupName: row.group_name,
    credentialName: row.credential_name,
    login: row.login,
    password: row.password,
    userID: row.user_id,
  };
}

export async function createCredential(
  db: Database,
  params: CreateCredentialParams,
): Promise<Credential | undefined> {
  const newCredentialID = randomUUID();
  const sql = `
        INSERT INTO credentials (id, created_at, updated_at, group_name, credential_name, login, password, user_id)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
    `;

  db.run(sql, [
    newCredentialID,
    params.groupName,
    params.credentialName,
    params.login,
    params.password,
    params.userID,
  ]);

  return await getCredentialByID(db, newCredentialID);
}

export async function getCredentials(db: Database, userID: string) {
  const sql = `
        SELECT *
        FROM credentials
        WHERE user_id = ?
        ORDER BY group_name, credential_name
    `;

  const rows = db.query<CredentialRow, [string]>(sql).all(userID);
  if (!rows || rows.length === 0) return undefined;

  return rows.map(rowToCredential);
}

export async function listAllCredentialsByUserID(db: Database, userID: string) {
  const sql = `
        SELECT *
        FROM credentials
        WHERE user_id = ?
        ORDER BY credential_name
    `;
  const rows = db.prepare(sql).all(userID) as CredentialRow[];
  return rows.map(rowToCredential);
}

export async function listCredentialsByGroupAndUser(
  db: Database,
  userID: string,
  groupName: string,
) {
  const sql = `
        SELECT *
        FROM credentials
        WHERE user_id = ? AND group_name = ?
        ORDER BY credential_name
    `;

  const rows = db.prepare(sql).all(userID, groupName) as CredentialRow[];
  return rows.map(rowToCredential);
}

export async function getCredentialByID(db: Database, id: string) {
  const sql = `
        SELECT * 
        FROM credentials
        WHERE id = ?
    `;

  const row = db.query<CredentialRow, [string]>(sql).get(id);
  if (!row) return undefined;

  return rowToCredential(row);
}

export async function getCredentialByName(
  db: Database,
  userID: string,
  credentialName: string,
) {
  const sql = `
        SELECT * 
        FROM credentials
        WHERE user_id = ? AND credential_name = ?
        LIMIT 1
    `;

  const row = db
    .query<CredentialRow, [string, string]>(sql)
    .get(userID, credentialName);
  if (!row) return undefined;

  return rowToCredential(row);
}

export async function updateCredential(
  db: Database,
  id: string,
  userID: string,
  params: UpdateCredentialParams,
) {
  const fields: string[] = [];
  const values: any[] = [];

  if (params.credentialName !== undefined) {
    fields.push('credential_name = ?');
    values.push(params.credentialName);
  }

  if (params.login !== undefined) {
    fields.push('login = ?');
    values.push(params.login);
  }

  if (params.password !== undefined) {
    fields.push('password = ?');
    values.push(params.password);
  }

  if (fields.length === 0) {
    return { changes: 0 };
  }

  const sql = `
        UPDATE credentials
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `;

  values.push(id, userID);
  db.prepare(sql).run(...values);
  return await getCredentialByID(db, id);
}

export async function deleteCredential(
  db: Database,
  userID: string,
  id: string,
) {
  const sql = `
        DELETE FROM credentials
        WHERE user_id = ? AND id = ?
    `;

  return db.run(sql, [userID, id]);
}
