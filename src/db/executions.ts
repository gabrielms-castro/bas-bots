import type { Database } from 'bun:sqlite';
import { randomUUID } from 'crypto';

export type Execution = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  robotInstanceID: string;
  userID: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date | null;
  finishedAt: Date | null;
  errorMessage: string | null;
  errorStack: string | null;
  executionType: 'manual' | 'scheduled' | 'retry';
  scheduleID: string | null;
  outputDataJson: string | null;
  outputFilePath: string | null;
  logsFilePath: string | null;
  retryCount: number;
  durationSeconds: number | null;
};

export type ExecutionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  robot_instance_id: string;
  user_id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  error_stack: string | null;
  execution_type: string;
  schedule_id: string | null;
  output_data_json: string | null;
  output_file_path: string | null;
  logs_file_path: string | null;
  retry_count: number;
  duration_seconds: number | null;
};

export type CreateExecutionParams = {
  robotInstanceID: string;
  userID: string;
  executionType: 'manual' | 'scheduled' | 'retry';
  scheduleID?: string | null;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
};

export type UpdateExecutionParams = {
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  finishedAt?: Date;
  errorMessage?: string | null;
  errorStack?: string | null;
  outputDataJson?: string | null;
  outputFilePath?: string | null;
  logsFilePath?: string | null;
  retryCount?: number;
  durationSeconds?: number | null;
};

function rowToExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    robotInstanceID: row.robot_instance_id,
    userID: row.user_id,
    status: row.status as Execution['status'],
    startedAt: row.started_at ? new Date(row.started_at) : null,
    finishedAt: row.finished_at ? new Date(row.finished_at) : null,
    errorMessage: row.error_message,
    errorStack: row.error_stack,
    executionType: row.execution_type as Execution['executionType'],
    scheduleID: row.schedule_id,
    outputDataJson: row.output_data_json,
    outputFilePath: row.output_file_path,
    logsFilePath: row.logs_file_path,
    retryCount: row.retry_count,
    durationSeconds: row.duration_seconds,
  };
}

export async function createExecution(
  db: Database,
  params: CreateExecutionParams,
): Promise<Execution | undefined> {
  const newExecutionID = randomUUID();
  const sql = `
        INSERT INTO executions (
            id, 
            created_at, 
            updated_at, 
            robot_instance_id, 
            user_id, 
            status, 
            execution_type,
            schedule_id,
            retry_count
        )
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 0)    
    `;
  const stmt = db.prepare(sql);
  stmt.run(
    newExecutionID,
    params.robotInstanceID,
    params.userID,
    params.status || 'pending',
    params.executionType,
    params.scheduleID || null,
  );

  return await getExecutionByID(db, newExecutionID);
}
export async function listExecutionsByUserID(
  db: Database,
  userID: string,
): Promise<Execution[] | undefined> {
  const sql = `
        SELECT * 
        FROM executions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `;
  const stmt = db.prepare(sql);
  const rows = stmt.all(userID) as ExecutionRow[];
  return rows.map(rowToExecution);
}

export async function listExecutionsByRobotInstanceID(
  db: Database,
  userID: string,
  robotInstanceID: string,
): Promise<Execution[] | undefined> {
  const sql = `
        SELECT * 
        FROM executions 
        WHERE user_id = ? AND robot_instance_id = ? 
        ORDER BY created_at DESC
    `;
  const stmt = db.prepare(sql);
  const rows = stmt.all(userID, robotInstanceID) as ExecutionRow[];
  return rows.map(rowToExecution);
}

export async function listExecutionsByStatus(
  db: Database,
  userID: string,
  status: Execution['status'],
): Promise<Execution[] | undefined> {
  const sql = `
        SELECT *
        FROM executions
        WHERE user_id = ? AND status = ?
        ORDER BY created_at DESC
    `;
  const stmt = db.prepare(sql);
  const rows = stmt.all(userID, status) as ExecutionRow[];
  return rows.map(rowToExecution);
}

export async function getExecutionByID(db: Database, id: string) {
  const sql = `
        SELECT *
        FROM executions 
        WHERE id = ?
    `;
  const row = db.query<ExecutionRow, [string]>(sql).get(id);
  if (!row) return;
  return rowToExecution(row);
}

export async function updateExecution(
  db: Database,
  id: string,
  userID: string,
  params: UpdateExecutionParams,
) {
  const updates: string[] = [];
  const values: any[] = [];

  if (params.status !== undefined) {
    updates.push('status = ?');
    values.push(params.status);
  }
  if (params.startedAt !== undefined) {
    updates.push('started_at = ?');
    values.push(params.startedAt.toISOString());
  }
  if (params.finishedAt !== undefined) {
    updates.push('finished_at = ?');
    values.push(params.finishedAt.toISOString());
  }
  if (params.errorMessage !== undefined) {
    updates.push('error_message = ?');
    values.push(params.errorMessage);
  }
  if (params.errorStack !== undefined) {
    updates.push('error_stack = ?');
    values.push(params.errorStack);
  }
  if (params.outputDataJson !== undefined) {
    updates.push('output_data_json = ?');
    values.push(params.outputDataJson);
  }
  if (params.outputFilePath !== undefined) {
    updates.push('output_file_path = ?');
    values.push(params.outputFilePath);
  }
  if (params.logsFilePath !== undefined) {
    updates.push('logs_file_path = ?');
    values.push(params.logsFilePath);
  }
  if (params.retryCount !== undefined) {
    updates.push('retry_count = ?');
    values.push(params.retryCount);
  }
  if (params.durationSeconds !== undefined) {
    updates.push('duration_seconds = ?');
    values.push(params.durationSeconds);
  }

  if (updates.length === 0) {
    return await getExecutionByID(db, id);
  }

  values.push(id, userID);

  const sql = `
        UPDATE executions
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `;
  const stmt = db.prepare(sql);
  stmt.run(...values);

  return await getExecutionByID(db, id);
}

export async function deleteExecution(
  db: Database,
  userID: string,
  id: string,
): Promise<boolean> {
  const sql = `
        DELETE FROM executions
        WHERE user_id = ? AND id = ?
    `;
  const stmt = db.prepare(sql);
  const result = stmt.run(userID, id);
  return result.changes > 0;
}
