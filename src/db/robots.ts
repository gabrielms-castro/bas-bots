import type { Database } from "bun:sqlite";
import { randomUUID, type UUID } from "crypto";
import { get } from "http";

export type Robot = {
  id: UUID;
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
  id: UUID;
  created_at: Date;
  updated_at: Date;
  robot_name: string;
  robot_type: string;
  description: string;
  requires_credential: boolean;
  requires_extension: boolean;
  supported_extensions: string | null;
  source_file_path: string;
  parameters_schema: string | null;
  version: string;
  is_active: boolean;
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
  robot_name?: string;
  robot_type?: string;
  description?: string;
  requires_credential?: boolean;
  requires_extension?: boolean;
  supported_extensions?: string | null;
  source_file_path?: string;
  parameters_schema?: string | null;
  version?: string;
  is_active?: boolean;
};

function rowToRobot(row: RobotRow): Robot {
    return {
        id: row.id, 
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        robotName: row.robot_name,
        robotType: row.robot_type,
        description: row.description,
        requiresCredential: Boolean(row.requires_credential),
        requiresExtension: Boolean(row.requires_extension),
        supportedExtensions: row.supported_extensions,
        sourceFilePath: row.source_file_path,
        parametersSchema: row.parameters_schema,
        isActive: Boolean(row.is_active),
        version: row.version,
    };
}

export async function createRobot(db: Database, params: CreateRobotParams) {
    const newRobotID = randomUUID();
    const sql = `
        INSERT INTO robots (
        id,
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        newRobotID,
        params.robotName,
        params.robotType,
        params.description,
        params.requiresCredential ? 1 : 0,
        params.requiresExtension ? 1 : 0,
        params.supportedExtensions ?? null,
        params.sourceFilePath,
        params.parametersSchema ?? null,
        params.version ?? "1.0.0",
        params.isActive ?? true ? 1 : 0,
    ]);

    return getRobotByID(db, newRobotID);
}

export async function listAllRobots(db: Database) {
    const sql = `
        SELECT * 
        FROM robots;
        ORDER BY created_at DESC
    `;
    const rows = db.query<RobotRow, []>(sql).all();
    if (!rows) return;
    return rows.map(rowToRobot);
}

export async function getRobotByID(db: Database, id: string) {
    const sql = `
        SELECT * 
        FROM robots
        WHERE id = ?
    `;
    const row = db.query<RobotRow, [string]>(sql).get(id);
    if (!row) return;
    return rowToRobot(row);    
}

export async function deleteRobot(db: Database, id: string) {
    const sql = `
        "DELETE FROM robots 
        WHERE id = ?"
    `;
  return db.run(sql, [id]);
}

export async function updateRobot(db: Database) {
    // to be implemented
}