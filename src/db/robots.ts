import type { Database } from 'bun:sqlite';
import { randomUUID } from 'crypto';

export type Robot = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  robotName: string;
  robotType: string;
  description: string;
  requiresCredential: boolean;
  requiresExtension: boolean;
  supportedExtensions: string | null;
  sourceFilePath: string;
  parametersSchema: string | null;
  version: string;
  isActive: boolean;
};

export type RobotRow = {
  id: string;
  created_at: string;
  updated_at: string;
  robot_name: string;
  robot_type: string;
  description: string;
  requires_credential: number;
  requires_extension: number;
  supported_extensions: string | null;
  source_file_path: string;
  parameters_schema: string | null;
  version: string;
  is_active: number;
};

export type CreateRobotParams = {
  robotName: string;
  robotType: string;
  description: string;
  requiresCredential: boolean;
  requiresExtension: boolean;
  supportedExtensions?: string | null;
  sourceFilePath: string;
  parametersSchema?: string | null;
  version?: string;
  isActive?: boolean;
};

export type UpdateRobotParams = {
  robotName?: string;
  robotType?: string;
  description?: string;
  requiresCredential?: boolean;
  requiresExtension?: boolean;
  supportedExtensions?: string | null;
  sourceFilePath?: string;
  parametersSchema?: string | null;
  version?: string;
  isActive?: boolean;
};

function rowToRobot(row: RobotRow): Robot {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    robotName: row.robot_name,
    robotType: row.robot_type,
    description: row.description,
    requiresCredential: !!row.requires_credential,
    requiresExtension: !!row.requires_extension,
    supportedExtensions: row.supported_extensions,
    sourceFilePath: row.source_file_path,
    parametersSchema: row.parameters_schema,
    version: row.version,
    isActive: !!row.is_active,
  };
}

export async function createRobot(
  db: Database,
  params: CreateRobotParams,
): Promise<Robot | undefined> {
  const id = randomUUID();
  const sql = `
        INSERT INTO robots (
            id,
            created_at,
            updated_at,
            robot_name,
            robot_type,
            description,
            requires_credential,
            requires_extension,
            supported_extensions,
            source_file_path,
            parameters_schema,
            version,
            is_active
        ) 
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const stmt = db.prepare(sql);
  stmt.run(
    id,
    params.robotName,
    params.robotType,
    params.description,
    params.requiresCredential ? 1 : 0,
    params.requiresExtension ? 1 : 0,
    params.supportedExtensions ?? null,
    params.sourceFilePath,
    params.parametersSchema ?? null,
    params.version ?? '1.0.0',
    params.isActive === false ? 0 : 1,
  );

  return await getRobotByID(db, id);
}

export async function listAllRobots(db: Database): Promise<Robot[]> {
  const sql = `
        SELECT *
        FROM robots
        ORDER BY created_at DESC
    `;
  const rows = db.prepare(sql).all() as RobotRow[];
  return rows.map(rowToRobot);
}

export async function getRobotByID(
  db: Database,
  id: string,
): Promise<Robot | undefined> {
  const sql = `
        SELECT *
        FROM robots
        WHERE id = ?
    `;
  const row = db.query<RobotRow, [string]>(sql).get(id);
  if (!row) return undefined;
  return rowToRobot(row);
}

export async function updateRobot(
  db: Database,
  id: string,
  params: UpdateRobotParams,
): Promise<Robot | undefined> {
  const updates: string[] = [];
  const values: any[] = [];

  if (params.robotName !== undefined) {
    updates.push('robot_name = ?');
    values.push(params.robotName);
  }
  if (params.robotType !== undefined) {
    updates.push('robot_type = ?');
    values.push(params.robotType);
  }
  if (params.description !== undefined) {
    updates.push('description = ?');
    values.push(params.description);
  }
  if (params.requiresCredential !== undefined) {
    updates.push('requires_credential = ?');
    values.push(params.requiresCredential ? 1 : 0);
  }
  if (params.requiresExtension !== undefined) {
    updates.push('requires_extension = ?');
    values.push(params.requiresExtension ? 1 : 0);
  }
  if (params.supportedExtensions !== undefined) {
    updates.push('supported_extensions = ?');
    values.push(params.supportedExtensions);
  }
  if (params.sourceFilePath !== undefined) {
    updates.push('source_file_path = ?');
    values.push(params.sourceFilePath);
  }
  if (params.parametersSchema !== undefined) {
    updates.push('parameters_schema = ?');
    values.push(params.parametersSchema);
  }
  if (params.version !== undefined) {
    updates.push('version = ?');
    values.push(params.version);
  }
  if (params.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(params.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return await getRobotByID(db, id);
  }

  values.push(id);

  const sql = `
        UPDATE robots
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

  db.prepare(sql).run(...values);
  return await getRobotByID(db, id);
}

export async function deleteRobot(db: Database, id: string): Promise<boolean> {
  const sql = `
        DELETE FROM robots
        WHERE id = ?
    `;
  const result = db.prepare(sql).run(id);
  return result.changes > 0;
}
