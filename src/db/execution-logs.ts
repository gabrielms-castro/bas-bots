import type { Database } from 'bun:sqlite';
import { randomUUID } from 'crypto';

export type ExecutionLog = {
  id: string;
  createdAt: Date;
  executionID: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  contextJSON: string | null;
};

export type ExecutionLogRow = {
  id: string;
  created_at: string;
  execution_id: string;
  log_level: string;
  message: string;
  context_json: string | null;
};

export type CreateExecutionLogParams = {
  executionID: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  contextJSON?: string | null;
};

function rowToExecutionLog(row: ExecutionLogRow): ExecutionLog {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    executionID: row.execution_id,
    logLevel: row.log_level as ExecutionLog['logLevel'],
    message: row.message,
    contextJSON: row.context_json,
  };
}

export async function createExecutionLog(
  db: Database,
  params: CreateExecutionLogParams,
): Promise<ExecutionLog | undefined> {
  const id = randomUUID();
  const sql = `
        INSERT INTO execution_logs (
            id,
            created_at,
            execution_id,
            log_level,
            message,
            context_json
        ) 
        VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
    `;

  const stmt = db.prepare(sql);
  stmt.run(
    id,
    params.executionID,
    params.logLevel,
    params.message,
    params.contextJSON ?? null,
  );

  return await getExecutionLogByID(db, id);
}

export async function listExecutionLogsByExecutionID(
  db: Database,
  executionID: string,
  userID: string,
): Promise<ExecutionLog[]> {
  const sql = `
        SELECT el.*
        FROM execution_logs el
        INNER JOIN executions e ON el.execution_id = e.id
        WHERE el.execution_id = ? AND e.user_id = ?
        ORDER BY el.created_at ASC
    `;
  const rows = db.prepare(sql).all(executionID, userID) as ExecutionLogRow[];
  return rows.map(rowToExecutionLog);
}

export async function listExecutionLogsByLevel(
  db: Database,
  userID: string,
  logLevel: ExecutionLog['logLevel'],
): Promise<ExecutionLog[]> {
  const sql = `
    SELECT el.*
    FROM execution_logs el
    INNER JOIN executions e ON el.execution_id = e.id
    WHERE e.user_id = ? AND el.log_level = ?
    ORDER BY el.created_at DESC
  `;
  const rows = db.prepare(sql).all(userID, logLevel) as ExecutionLogRow[];
  return rows.map(rowToExecutionLog);
}

export async function getExecutionLogByID(
  db: Database,
  id: string,
): Promise<ExecutionLog | undefined> {
  const sql = `
        SELECT *
        FROM execution_logs
        WHERE id = ?
    `;
  const row = db.query<ExecutionLogRow, [string]>(sql).get(id);
  if (!row) return undefined;
  return rowToExecutionLog(row);
}

// Verifica se um log pertence ao usuário (via execution)
export async function verifyExecutionLogOwnership(
  db: Database,
  logID: string,
  userID: string,
): Promise<boolean> {
  const sql = `
        SELECT 1
        FROM execution_logs el
        INNER JOIN executions e ON el.execution_id = e.id
        WHERE el.id = ? AND e.user_id = ?
    `;
  const result = db
    .query<{ '1': number }, [string, string]>(sql)
    .get(logID, userID);
  return !!result;
}

export async function deleteExecutionLog(
  db: Database,
  id: string,
  userID: string,
): Promise<boolean> {
  const sql = `
        DELETE FROM execution_logs
        WHERE id = ? AND execution_id IN (
            SELECT id FROM executions WHERE user_id = ?
        )
    `;
  const result = db.prepare(sql).run(id, userID);
  return result.changes > 0;
}

export async function deleteExecutionLogsByExecutionID(
  db: Database,
  executionID: string,
  userID: string,
): Promise<number> {
  const sql = `
        DELETE FROM execution_logs
        WHERE execution_id = ? AND execution_id IN (
            SELECT id FROM executions WHERE user_id = ?
        )
    `;
  const result = db.prepare(sql).run(executionID, userID);
  return result.changes;
}
