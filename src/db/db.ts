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
        password TEXT NOT NULL,
        name TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login_at TIMESTAMP
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
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  db.run(refreshTokensTable);

  const credentialsTable = `
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      group_name TEXT NOT NULL,
      credential_name TEXT NOT NULL,      
      login TEXT NOT NULL,
      password TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, credential_name)
    );
  `;
  db.run(credentialsTable);
  
  const userOTPKeysTable = `
    CREATE TABLE IF NOT EXISTS user_otp_keys (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      secret_key TEXT NOT NULL,
      issuer TEXT,
      user_id TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.run(userOTPKeysTable);

  const extensionsTable = `
    CREATE TABLE IF NOT EXISTS extensions (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      extension_name TEXT NOT NULL,
      description TEXT,
      login TEXT,
      password TEXT,
      pin TEXT,
      extension_url TEXT,
      user_id TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, extension_name)
    )
  `;
  db.run(extensionsTable);

  const robotsTable = `
    CREATE TABLE IF NOT EXISTS robots (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      
      robot_name TEXT UNIQUE NOT NULL,
      robot_type TEXT NOT NULL,
      description TEXT NOT NULL,
      requires_credential BOOLEAN DEFAULT 0,
      requires_extension BOOLEAN DEFAULT 0,
      supported_extensions TEXT,
      source_file_path TEXT NOT NULL,
      parameters_schema TEXT,
      version TEXT DEFAULT '1.0.0',
      is_active BOOLEAN DEFAULT 1,
      CHECK (requires_credential = 1 OR requires_extension = 1)
    )
  `;
  db.run(robotsTable);

  const robotsIntancesTable = `
    CREATE TABLE IF NOT EXISTS robot_instances (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        instance_name TEXT NOT NULL,
        description TEXT,
        robot_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        credential_id TEXT,
        extension_id TEXT,
        is_active BOOLEAN DEFAULT 1,
        parameters_json TEXT,
        FOREIGN KEY (robot_id) REFERENCES robots(id) ON DELETE RESTRICT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE SET NULL,
        FOREIGN KEY (extension_id) REFERENCES extensions(id) ON DELETE SET NULL,
        UNIQUE(user_id, instance_name),
        CHECK (
            (credential_id IS NOT NULL AND extension_id IS NULL) OR
            (credential_id IS NULL AND extension_id IS NOT NULL)
        )
    )
  `;
  db.run(robotsIntancesTable);

  const executionsTable = `
    CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        robot_instance_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        started_at TIMESTAMP,
        finished_at TIMESTAMP,
        error_message TEXT,
        error_stack TEXT,
        execution_type TEXT NOT NULL,
        schedule_id TEXT,
        output_data_json TEXT, 
        output_file_path TEXT,
        logs_file_path TEXT,
        retry_count INTEGER DEFAULT 0,
        duration_seconds INTEGER,
        FOREIGN KEY (robot_instance_id) REFERENCES robot_instances(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
    )
  `;
  db.run(executionsTable);

  const schedulesTable = `
    CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        robot_instance_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        schedule_name TEXT NOT NULL,
        cron_expression TEXT NOT NULL,
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        is_active BOOLEAN DEFAULT 1,
        last_execution_at TIMESTAMP,
        next_execution_at TIMESTAMP,
        description TEXT,
        max_retries INTEGER DEFAULT 3,
        retry_delay_minutes INTEGER DEFAULT 5,
        FOREIGN KEY (robot_instance_id) REFERENCES robot_instances(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, schedule_name)
    )
  `;
  db.run(schedulesTable);

  const executionLogsTable = `
    CREATE TABLE IF NOT EXISTS execution_logs (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_id TEXT NOT NULL,
        log_level TEXT NOT NULL,
        message TEXT NOT NULL,
        context_json TEXT,
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
    )
  `;
  db.run(executionLogsTable);

  const notificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL,
        execution_id TEXT,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        read_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE SET NULL
    )
  `;
  db.run(notificationsTable);

  console.log("Database migrations: success!");
}

export function reset(db: Database) {
  db.run("DELETE FROM users");
  db.run("DELETE FROM refresh_tokens");
  db.run("DELETE FROM credentials");
  db.run("DELETE FROM user_otp_keys");
  db.run("DELETE FROM extensions");
  db.run("DELETE FROM robots");
  db.run("DELETE FROM robot_instances");
  db.run("DELETE FROM executions");
  db.run("DELETE FROM schedules");
  db.run("DELETE FROM execution_logs");
  db.run("DELETE FROM notifications");
}