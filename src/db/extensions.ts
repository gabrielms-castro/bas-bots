import type { Database } from "bun:sqlite";
import { randomUUID, type UUID } from "crypto";
import { get } from "http";

type Extension = {
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    extensionName: string,
    login: string | null,
    password: string | null,
    pin: string | null,
    description: string,
    userID: UUID,
    isActive: boolean
}

type ExtensionRow = {
    id: UUID,
    created_at: Date,
    updated_at: Date,
    extension_name: string,
    login: string | null,
    password: string | null,
    pin: string | null,
    description: string,
    user_id: UUID,
    is_active: boolean    
}

type CreateExtensionParams = {
    id: UUID,
    userID: UUID,
    extension_name: string,
    login?: string | null,
    password?: string | null,
    pin?: string | null,
    description: string,
}

type updateExtensionParams = {
    
}

function rowToExtension(row: ExtensionRow): Extension {
    return {
        id: row.id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        extensionName: row.extension_name,
        login: row.login,
        password: row.password,
        pin: row.pin,
        description: row.description,
        userID: row.user_id,
        isActive: Boolean(row.is_active)
    }
}

export async function createExtension(db: Database, params: CreateExtensionParams) {
    const newID = randomUUID()
    const sql = `
        INSERT INTO extensions (
            id, 
            created_at, 
            updated_at, 
            extension_name,
            description
            login,
            password,
            pin,
            user_id,
        )
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)
    `
    db.run(sql, [
        newID,
        params.extension_name,
        params.login ?? null,
        params.password ?? null,
        params.pin ?? null,
        params.userID,
        params.description
    ]);
    return getExtensionByID(db, newID)
}

export async function listAllExtensions(db: Database) {

}

export async function getExtensionByID(db: Database, id: string) {
    
}

export async function deleteExtension(db: Database, id: string) {
    
}

export async function updateExtension(db: Database, params: updateExtensionParams) {

}

