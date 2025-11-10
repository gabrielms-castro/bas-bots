import type { Database } from 'bun:sqlite';
import { randomUUID } from 'crypto';

export type Extension = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  extensionName: string;
  description: string | null;
  login: string | null;
  password: string | null;
  pin: string | null;
  extensionURL: string | null;
  userID: string;
  isActive: boolean;
};

export type ExtensionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  extension_name: string;
  description: string | null;
  login: string | null;
  password: string | null;
  pin: string | null;
  extension_url: string | null;
  user_id: string;
  is_active: number;
};

export type CreateExtensionParams = {
  extensionName: string;
  description?: string | null;
  login?: string | null;
  password?: string | null;
  pin?: string | null;
  extensionURL?: string | null;
  userID: string;
  isActive?: boolean;
};

export type UpdateExtensionParams = {
  extensionName?: string;
  description?: string | null;
  login?: string | null;
  password?: string | null;
  pin?: string | null;
  extensionURL?: string | null;
  isActive?: boolean;
};

function rowToExtension(row: ExtensionRow): Extension {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    extensionName: row.extension_name,
    description: row.description,
    login: row.login,
    password: row.password,
    pin: row.pin,
    extensionURL: row.extension_url,
    userID: row.user_id,
    isActive: !!row.is_active,
  };
}

export async function createExtension(
  db: Database,
  params: CreateExtensionParams,
): Promise<Extension | undefined> {
  const id = randomUUID();
  const sql = `
        INSERT INTO extensions (
            id,
            created_at,
            updated_at,
            extension_name,
            description,
            login,
            password,
            pin,
            extension_url,
            user_id,
            is_active
        ) 
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  const stmt = db.prepare(sql);
  stmt.run(
    id,
    params.extensionName,
    params.description ?? null,
    params.login ?? null,
    params.password ?? null,
    params.pin ?? null,
    params.extensionURL ?? null,
    params.userID,
    params.isActive === undefined ? 1 : params.isActive ? 1 : 0,
  );

  return await getExtensionByID(db, id);
}

export async function listExtensionsByUserID(
  db: Database,
  userID: string,
): Promise<Extension[]> {
  const sql = `
        SELECT *
        FROM extensions
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;
  const rows = db.prepare(sql).all(userID) as ExtensionRow[];
  return rows.map(rowToExtension);
}

export async function getExtensionByID(
  db: Database,
  id: string,
): Promise<Extension | undefined> {
  const sql = `
        SELECT *
        FROM extensions
        WHERE id = ?
    `;
  const row = db.query<ExtensionRow, [string]>(sql).get(id);
  if (!row) return undefined;
  return rowToExtension(row);
}

export async function getExtensionByName(
  db: Database,
  userID: string,
  extensionName: string,
): Promise<Extension | undefined> {
  const sql = `
        SELECT *
        FROM extensions
        WHERE user_id = ? AND extension_name = ?
    `;
  const row = db
    .query<ExtensionRow, [string, string]>(sql)
    .get(userID, extensionName);
  if (!row) return undefined;
  return rowToExtension(row);
}

export async function updateExtension(
  db: Database,
  id: string,
  userID: string,
  params: UpdateExtensionParams,
): Promise<Extension | undefined> {
  const updates: string[] = [];
  const values: any[] = [];

  if (params.extensionName !== undefined) {
    updates.push('extension_name = ?');
    values.push(params.extensionName);
  }
  if (params.description !== undefined) {
    updates.push('description = ?');
    values.push(params.description);
  }
  if (params.login !== undefined) {
    updates.push('login = ?');
    values.push(params.login);
  }
  if (params.password !== undefined) {
    updates.push('password = ?');
    values.push(params.password);
  }
  if (params.pin !== undefined) {
    updates.push('pin = ?');
    values.push(params.pin);
  }
  if (params.extensionURL !== undefined) {
    updates.push('extension_url = ?');
    values.push(params.extensionURL);
  }
  if (params.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(params.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return await getExtensionByID(db, id);
  }

  values.push(id, userID);

  const sql = `
        UPDATE extensions
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `;

  db.prepare(sql).run(...values);
  return await getExtensionByID(db, id);
}

export async function deleteExtension(
  db: Database,
  id: string,
  userID: string,
): Promise<boolean> {
  const sql = `
        DELETE FROM extensions
        WHERE id = ? AND user_id = ?
    `;
  const result = db.prepare(sql).run(id, userID);
  return result.changes > 0;
}
