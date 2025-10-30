import { newDatabase } from "./db/db";
import type { Database } from "bun:sqlite";

export type ApiConfig = {
  db?: Database
  jwtSecret: string
  port: string
  platform: string
  filePathRoot: string
  assetsRoot: string
}

const pathToDB = EnvOrThrow("DB_PATH")
const jwtSecret = EnvOrThrow("JWT_SECRET")
const port = EnvOrThrow("PORT")
const platform = EnvOrThrow("PLATFORM")
const filePathRoot = EnvOrThrow("FILEPATH_ROOT")
const assetsRoot = EnvOrThrow("ASSETS_ROOT")
const db = newDatabase(pathToDB)

export const config: ApiConfig = {
  db: db,
  jwtSecret: jwtSecret,
  port: port,
  platform: platform,
  filePathRoot: filePathRoot,
  assetsRoot: assetsRoot
}

function EnvOrThrow(key: string): string {
  const envVar = process.env[key]
  if (!envVar) {
      throw new Error(`${key} precisa ser definida`)
  }
  return envVar;
}