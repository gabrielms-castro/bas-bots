import type { Database } from "bun:sqlite";
import { randomUUID, type UUID } from "crypto";

type Extension = {

}

type ExtensionRow = {
    
}

type CreateExtensionParams = {

}

type updateExtensionParams = {
    
}

function rowToExtension(row: ExtensionRow): Extension {
    return {

    }
}

export async function createExtension(db: Database, params: createExtensionParams) {

}

export async function listAllExtensions(db: Database) {

}

export async function getExtensionByID(db: Database) {
    
}

export async function deleteExtension(db: Database, id: string) {
    
}

export async function updateExtension(db: Database, params: updateExtensionParams) {

}

