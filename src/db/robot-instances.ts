import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

export type RobotInstance = {
    id: string;
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
    id: string;
    created_at: string;
    updated_at: string;
    instance_name: string;
    description: string | null;
    robot_id: string;
    user_id: string;
    credential_id: string | null;
    extension_id: string | null;
    is_active: number;
    parameters_json: string | null;
};

export type CreateRobotInstanceParams = {
    instanceName: string;
    description?: string | null;
    robotID: string;
    userID: string;
    credentialID?: string | null;
    extensionID?: string | null;
    isActive?: boolean;
    parametersJSON?: string | null;
};

export type UpdateRobotInstanceParams = {
    instanceName?: string;
    description?: string | null;
    credentialID?: string | null;
    extensionID?: string | null;
    isActive?: boolean;
    parametersJSON?: string | null;
};

function rowToRobotInstance(row: RobotInstanceRow): RobotInstance {
    return {
        id: row.id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        instanceName: row.instance_name,
        description: row.description,
        robotID: row.robot_id,
        userID: row.user_id,
        credentialID: row.credential_id,
        extensionID: row.extension_id,
        isActive: !!row.is_active,
        parametersJSON: row.parameters_json,
    };
}

export async function createRobotInstance(db: Database,params: CreateRobotInstanceParams): Promise<RobotInstance | undefined> {
    const id = randomUUID();
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

    const stmt = db.prepare(sql);
    stmt.run(
        id,
        params.instanceName,
        params.description ?? null,
        params.robotID,
        params.userID,
        params.credentialID ?? null,
        params.extensionID ?? null,
        params.isActive === false ? 0 : 1,
        params.parametersJSON ?? null
    );

    return await getRobotInstanceByID(db, id);
}

export async function listAllRobotInstancesByUser(db: Database, userID: string): Promise<RobotInstance[]> {
    const sql = `
        SELECT *
        FROM robot_instances
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;
    const rows = db.prepare(sql).all(userID) as RobotInstanceRow[];
    return rows.map(rowToRobotInstance);
}

export async function getRobotInstanceByID(db: Database, id: string): Promise<RobotInstance | undefined> {
    const sql = `
        SELECT *
        FROM robot_instances
        WHERE id = ?
    `;
    const row = db.query<RobotInstanceRow, [string]>(sql).get(id);
    if (!row) return undefined;
    return rowToRobotInstance(row);
}

export async function updateRobotInstance(db: Database,id: string,userID: string,params: UpdateRobotInstanceParams): Promise<RobotInstance | undefined> {
    const updates: string[] = [];
    const values: any[] = [];

    if (params.instanceName !== undefined) {
        updates.push("instance_name = ?");
        values.push(params.instanceName);
    }
    if (params.description !== undefined) {
        updates.push("description = ?");
        values.push(params.description);
    }
    if (params.credentialID !== undefined) {
        updates.push("credential_id = ?");
        values.push(params.credentialID);
    }
    if (params.extensionID !== undefined) {
        updates.push("extension_id = ?");
        values.push(params.extensionID);
    }
    if (params.isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(params.isActive ? 1 : 0);
    }
    if (params.parametersJSON !== undefined) {
        updates.push("parameters_json = ?");
        values.push(params.parametersJSON);
    }

    if (updates.length === 0) {
        return await getRobotInstanceByID(db, id);
    }

    values.push(id, userID);

    const sql = `
        UPDATE robot_instances
        SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `;

    db.prepare(sql).run(...values);
    return await getRobotInstanceByID(db, id);
}

export async function deleteRobotInstance(db: Database, id: string, userID: string): Promise<boolean> {
    const sql = `
        DELETE FROM robot_instances
        WHERE id = ? AND user_id = ?
    `;
    const result = db.prepare(sql).run(id, userID);
    return result.changes > 0;
}