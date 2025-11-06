import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

export type Schedule = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    robotInstanceID: string;
    userID: string;
    scheduleName: string;
    cronExpression: string;
    timezone: string;
    isActive: boolean; 
    lastExecutionAt: Date | null;
    nextExecutionAt: Date | null;
    description: string | null;
    maxRetries: number;
    retryDelayMinutes: number;
};

export type ScheduleRow = {
    id: string;
    created_at: string;
    updated_at: string;
    robot_instance_id: string;
    user_id: string;
    schedule_name: string;
    cron_expression: string;
    timezone: string;
    is_active: number;
    last_execution_at: string | null;
    next_execution_at: string | null;
    description: string | null;
    max_retries: number;
    retry_delay_minutes: number;
};

export type CreateScheduleParams = {
    robotInstanceID: string;
    userID: string;
    scheduleName: string;
    cronExpression: string;
    timezone?: string;
    isActive?: boolean;
    lastExecutionAt?: Date | null;
    nextExecutionAt?: Date | null;
    description?: string | null;
    maxRetries?: number;
    retryDelayMinutes?: number;
};

export type UpdateScheduleParams = {
    scheduleName?: string;
    cronExpression?: string;
    timezone?: string;
    isActive?: boolean;
    lastExecutionAt?: Date | null;
    nextExecutionAt?: Date | null;
    description?: string | null;
    maxRetries?: number;
    retryDelayMinutes?: number;
};

function rowToSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    robotInstanceID: row.robot_instance_id,
    userID: row.user_id,
    scheduleName: row.schedule_name,
    cronExpression: row.cron_expression,
    timezone: row.timezone,
    isActive: !!row.is_active,
    lastExecutionAt: row.last_execution_at ? new Date(row.last_execution_at) : null,
    nextExecutionAt: row.next_execution_at ? new Date(row.next_execution_at) : null,
    description: row.description,
    maxRetries: row.max_retries,
    retryDelayMinutes: row.retry_delay_minutes,
  };
}

export async function createSchedule(db: Database, params: CreateScheduleParams): Promise<Schedule | undefined> {
    const id = randomUUID();
    const sql = `
        INSERT INTO schedules (
            id,
            created_at,
            updated_at,
            robot_instance_id,
            user_id,
            schedule_name,
            cron_expression,
            timezone,
            is_active,
            last_execution_at,
            next_execution_at,
            description,
            max_retries,
            retry_delay_minutes
            ) 
        VALUES (
            ?,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `;
    const stmt = db.prepare(sql);
    stmt.run(
        id,
        params.robotInstanceID,
        params.userID,
        params.scheduleName,
        params.cronExpression,
        params.timezone ?? "America/Sao_Paulo",
        params.isActive === undefined ? 1 : (params.isActive ? 1 : 0),
        params.lastExecutionAt ? params.lastExecutionAt.toISOString() : null,
        params.nextExecutionAt ? params.nextExecutionAt.toISOString() : null,
        params.description ?? null,
        params.maxRetries ?? 3,
        params.retryDelayMinutes ?? 5
    );

    return await getScheduleByID(db, id);
}

export async function listAllSchedules(db: Database, userID: string): Promise<Schedule[]> {
    const sql = `
        SELECT *
        FROM schedules
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;
    const rows = db.prepare(sql).all(userID) as ScheduleRow[];
    return rows.map(rowToSchedule);
}

export async function getScheduleByID(db: Database, id: string): Promise<Schedule | undefined> {
    const sql = `
        SELECT *
        FROM schedules
        WHERE id = ?
    `;
    const row = db.query<ScheduleRow, [string]>(sql).get(id);
    if (!row) return;
    return rowToSchedule(row);
}

export async function updateSchedule(db: Database,id: string,userID: string,params: UpdateScheduleParams): Promise<Schedule | undefined> {
    const updates: string[] = [];
    const values: any[] = [];

    if (params.scheduleName !== undefined) {
        updates.push("schedule_name = ?");
        values.push(params.scheduleName);
    }
    if (params.cronExpression !== undefined) {
        updates.push("cron_expression = ?");
        values.push(params.cronExpression);
    }
    if (params.timezone !== undefined) {
        updates.push("timezone = ?");
        values.push(params.timezone);
    }
    if (params.isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(params.isActive ? 1 : 0);
    }
    if (params.lastExecutionAt !== undefined) {
        updates.push("last_execution_at = ?");
        values.push(params.lastExecutionAt ? params.lastExecutionAt.toISOString() : null);
    }
    if (params.nextExecutionAt !== undefined) {
        updates.push("next_execution_at = ?");
        values.push(params.nextExecutionAt ? params.nextExecutionAt.toISOString() : null);
    }
    if (params.description !== undefined) {
        updates.push("description = ?");
        values.push(params.description);
    }
    if (params.maxRetries !== undefined) {
        updates.push("max_retries = ?");
        values.push(params.maxRetries);
    }
    if (params.retryDelayMinutes !== undefined) {
        updates.push("retry_delay_minutes = ?");
        values.push(params.retryDelayMinutes);
    }

    if (updates.length === 0) {
        return await getScheduleByID(db, id);
    }

    values.push(id, userID);

    const sql = `
        UPDATE schedules
        SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `;
    const stmt = db.prepare(sql);
    stmt.run(...values);

    return await getScheduleByID(db, id);
}

export async function deleteSchedule(db: Database, id: string, userID: string): Promise<boolean> {
    const sql = `
        DELETE FROM schedules
        WHERE id = ? AND user_id = ?
    `;
    const result = db.prepare(sql).run(id, userID);
    return result.changes > 0;
}