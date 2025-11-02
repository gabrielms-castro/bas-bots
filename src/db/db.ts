import { Database } from "bun:sqlite";

export function newDatabase(pathToDB: string): Database {
  
  const db = new Database(pathToDB);
  autoMigrate(db)
  return db
}

function autoMigrate(db: Database) {
  console.log("Starting migration...");
  const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `;
  db.run(usersTable);

  const refreshTokensTable = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;
  db.run(refreshTokensTable);

  const credentialsTable = `
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      credential_name TEXT NOT NULL,      
      url TEXT NOT NULL,
      login TEXT NOT NULL,
      password TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;
  db.run(credentialsTable)
  console.log("Database migrations: success!");
}

export function reset(db: Database) {
  db.run("DELETE FROM users");
  db.run("DELETE FROM refresh_tokens");
  db.run("DELETE FROM credentials");
}