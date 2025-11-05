import type { Database } from "bun:sqlite"
import { randomUUID, type UUID } from "crypto";
import { respondWithJSON } from "../api/json";


export type RobotInstance = {
  id: UUID;
  createdAt: Date;
  updatedAt: Date;
  instanceName: string;
  description: string | null;
  robotID: string;
  userID: string;
  credentialID: string | null;
  extensionID: string | null;
  isActive: boolean;
  parametersJSON: string | null;
};

export type RobotInstanceRow = {
  id: UUID;
  created_at: string | number;
  updated_at: string | number;
  instance_name: string;
  description: string;
  robot_id: string;
  user_id: string;
  credential_id: string | null;
  extension_id: string | null;
  is_active: number; 
  parameters_json: string | null;
};

export type CreateRobotInstanceParams = {
    instanceName: string;
    description: string;
    robotID: string;
    userID: string;
    credentialID?: string | null;
    extensionID?: string | null;
    isActive?: boolean;
    parametersJSON?: string | null;
};

export async function createRobotInstance(db: Database, params: CreateRobotInstanceParams): Promise<string> {
    const newRobotInstanceID = randomUUID();
    const sql = `
        INSERT INTO robot_instances (
            id, 
            created_at, 
            updated_at, 
            instance_name, 
            description, 
            robot_id, 
            user_id, 
            credential_id, 
            extension_id, 
            is_active, 
            parameters_json
        )
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
        newRobotInstanceID,
        params.instanceName,
        params.description,
        params.robotID,
        params.userID,
        params.credentialID ?? null,
        params.extensionID ?? null,
        params.isActive ?? true,
        params.parametersJSON ?? null,
    ]);
    
    return newRobotInstanceID;
}

export async function listAllRobotIntancesByUser(db: Database, userID: string) {
    const sql = `
        SELECT 
            ri.id,
            ri.instance_name,
            ri.description,
            ri.is_active,
            r.robot_name,
            r.tribunal_name,
            c.credential_name,
            e.extension_name            
        FROM robot_instances ri
        JOIN robots r ON ri.robot_id = r.id
        LEFT JOIN credentials cred ON ri.credential_id = cred.id
        LEFT JOIN extensions ext on ri.extension_id = ext.id
        WHERE ri.user_id = ?
        ORDER BY ri.created_at DESC
    `;
    const rows = db.query<RobotInstanceRow, [string]>(sql).all(userID)
    if(!rows) return;
    const robotInstances: RobotInstance[] = rows.map((row) => ({
        id: row.id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        instanceName: row.instance_name,
        description: row.description,
        robotID: row.robot_id,
        userID: row.user_id,
        credentialID: row.credential_id,
        extensionID: row.extension_id,
        isActive: row.is_active === 1,
        parametersJSON: row.parameters_json
    }));
    return robotInstances;
}

export async function getRobotIntancesByIDr(db: Database, userID: string) {
    const sql = `
        SELECT 
            ri.*,
            r.robot_name,
            r.description as robot_description,
            r.tribunal_name,
            c.credential_name,
            c.login as credential_login,
            e.extension_name,
            e.extension_type           
        FROM robot_instances ri
        JOIN robots r ON ri.robot_id = r.id
        LEFT JOIN credentials cred ON ri.credential_id = cred.id
        LEFT JOIN extensions ext on ri.extension_id = ext.id
        WHERE ri.user_id = ?
    `;
    const rows = db.query<RobotInstanceRow, [string]>(sql).all(userID)
    if(!rows) return;
}

export async function updateRobotInstance(db: Database) {
    // to be implemented
}

export async function deleteRobotInstance(db: Database, id: string) {
    const sql = `
        DELETE FROM robot_instances
        WHERE id = ?
    `;
    return db.run(sql, [id]);
}