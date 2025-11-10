import type { Database } from 'bun:sqlite';
import type { UUID } from 'crypto';

export type RefreshToken = {
  token: string;
  userID: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
};

export type RefreshTokenRow = {
  token: string;
  userID: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  revoked_at?: Date;
};

export type CreateRefreshTokenParams = {
  token: string;
  userID: UUID;
  expiresAt: Date;
};

export async function createRefreshToken(
  db: Database,
  params: CreateRefreshTokenParams,
) {
  const sql = `
        INSERT INTO refresh_tokens (token, created_at, updated_at, revoked_at, expires_at, user_id)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, ?, ?)
    `;
  db.run(sql, [params.token, params.expiresAt.toISOString(), params.userID]);
  return getRefreshToken(db, params.token);
}

export async function getRefreshToken(db: Database, token: string) {
  const sql = `
        SELECT * 
        FROM refresh_tokens 
        WHERE token = ?
    `;
  const row = db.query<RefreshTokenRow, [string]>(sql).get(token);
  if (!row) return;

  return {
    token: row.token,
    userID: row.userID,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
  };
}

export async function revokeRefreshToken(db: Database, token: string) {
  const sql = `
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE token = ?
    `;
  return db.run(sql, [token]);
}

export async function deleteRefreshToken(db: Database, token: string) {
  const sql = `
        DELETE FROM refresh_tokens
        WHERE token = ?
    `;
  return db.run(sql, [token]);
}
