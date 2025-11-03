import type { Database } from "bun:sqlite";
import { randomUUID, type UUID } from "crypto";
import type { StringMappingType } from "typescript";

type Credential = {
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    credentialName: string,
    login: string,
    password: string,
    userID: UUID
}

type CredentialRow = {
    id: string,
    created_at: Date,
    updated_at: Date,
    credential_name: string,
    login: string,
    password: string,
    user_id: string
}

type CreateCredentialParams = {
    credentialName: string,
    login: string,
    password: string,
    userID: string
}

type UpdateCredentialParams = {
    credentialName: string,
    login: string,
    password: string,
    userID: string
}

export async function createCredential(db: Database, params: CreateCredentialParams) {
    const newCredentialID = randomUUID();
    const sql = `
        INSERT INTO credentials (id, created_at, updated_at, credential_name, login, password, user_id)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?)
    `;
    db.run(sql, [newCredentialID, params.credentialName, params.login, params.password, params.userID]);
    return await getCredentialByID(db, newCredentialID);
}

export async function getCredentialByID(db: Database, id: string) {
    const sql = `
        SELECT * 
        FROM credentials
        WHERE id = ?
    `;
    const row = db.query<CredentialRow, [string]>(sql).get(id);
    if (!row) return;
    return {
        id: row.id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        credentialName: row.credential_name,
        login: row.login,
        password: row.password,
        userID: row.user_id
    }
}

export async function getCredentialByName(db: Database, credentialName: string) {
    const sql = `
        SELECT * 
        FROM credentials
        WHERE credential_name = ?
    `;
    const row = db.query<CredentialRow, [string]>(sql).get(credentialName);
    if (!row) return;
    return {
        id: row.id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        credentialName: row.credential_name,
        login: row.login,
        password: row.password,
        userID: row.user_id
    }    
}

export async function updateCredential(db: Database, params: UpdateCredentialParams) {
    const sql = `
        UPDATE credentials
        SET credential_name = ?, login = ?, password = ?
        WHERE id = ?
    `;
    db.run(sql, [params.credentialName, params.login, params.password]);
}