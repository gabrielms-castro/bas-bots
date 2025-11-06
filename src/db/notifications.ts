import type { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

export type Notification = {
  id: string;
  createdAt: Date;
  userID: string;
  executionID: string | null;
  notificationType: "success" | "error" | "warning" | "info" | "system";
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
};

export type NotificationRow = {
  id: string;
  created_at: string;
  user_id: string;
  execution_id: string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: number;
  read_at: string | null;
};

export type CreateNotificationParams = {
  userID: string;
  executionID?: string | null;
  notificationType: "success" | "error" | "warning" | "info" | "system";
  title: string;
  message: string;
};

export type UpdateNotificationParams = {
  isRead?: boolean;
  readAt?: Date | null;
};

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    userID: row.user_id,
    executionID: row.execution_id,
    notificationType: row.notification_type as Notification["notificationType"],
    title: row.title,
    message: row.message,
    isRead: !!row.is_read,
    readAt: row.read_at ? new Date(row.read_at) : null,
  };
}

export async function createNotification(
  db: Database,
  params: CreateNotificationParams
): Promise<Notification | undefined> {
  const id = randomUUID();
  const sql = `
    INSERT INTO notifications (
      id,
      created_at,
      user_id,
      execution_id,
      notification_type,
      title,
      message,
      is_read,
      read_at
    ) VALUES (
      ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 0, NULL
    )
  `;

  const stmt = db.prepare(sql);
  stmt.run(
    id,
    params.userID,
    params.executionID ?? null,
    params.notificationType,
    params.title,
    params.message
  );

  return await getNotificationByID(db, id);
}

// Lista todas as notificações do usuário
export async function listNotificationsByUserID(db: Database, userID: string): Promise<Notification[]> {
  const sql = `
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  const rows = db.prepare(sql).all(userID) as NotificationRow[];
  return rows.map(rowToNotification);
}

// Lista notificações não lidas do usuário
export async function listUnreadNotificationsByUserID(db: Database, userID: string): Promise<Notification[]> {
  const sql = `
    SELECT *
    FROM notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC
  `;
  const rows = db.prepare(sql).all(userID) as NotificationRow[];
  return rows.map(rowToNotification);
}

export async function listNotificationsByType(db: Database, userID: string, notificationType: Notification["notificationType"]): Promise<Notification[]> {
    const sql = `
        SELECT *
        FROM notifications
        WHERE user_id = ? AND notification_type = ?
        ORDER BY created_at DESC
    `;
    const rows = db.prepare(sql).all(userID, notificationType) as NotificationRow[];
    return rows.map(rowToNotification);
}

export async function listNotificationsByExecutionID(db: Database, userID: string, executionID: string): Promise<Notification[]> {
    const sql = `
        SELECT *
        FROM notifications
        WHERE user_id = ? AND execution_id = ?
        ORDER BY created_at DESC
    `;
    const rows = db.prepare(sql).all(userID, executionID) as NotificationRow[];
    return rows.map(rowToNotification);
    }

export async function getNotificationByID(db: Database, id: string): Promise<Notification | undefined> {
    const sql = `
        SELECT *
        FROM notifications
        WHERE id = ?
    `;
    const row = db.query<NotificationRow, [string]>(sql).get(id);
    if (!row) return undefined;
    return rowToNotification(row);
}

export async function updateNotification(db: Database, id: string, userID: string, params: UpdateNotificationParams): Promise<Notification | undefined> {
    const updates: string[] = [];
    const values: any[] = [];

    if (params.isRead !== undefined) {
        updates.push("is_read = ?");
        values.push(params.isRead ? 1 : 0);
    }
    if (params.readAt !== undefined) {
        updates.push("read_at = ?");
        values.push(params.readAt ? params.readAt.toISOString() : null);
    }

    if (updates.length === 0) {
        return await getNotificationByID(db, id);
    }

    values.push(id, userID);

    const sql = `
        UPDATE notifications
        SET ${updates.join(", ")}
        WHERE id = ? AND user_id = ?
    `;

    db.prepare(sql).run(...values);
    return await getNotificationByID(db, id);
}

export async function markNotificationAsRead(db: Database, id: string, userID: string): Promise<Notification | undefined> {
    return await updateNotification(db, id, userID, {
        isRead: true,
        readAt: new Date(),
    });
}

export async function markAllNotificationsAsRead(db: Database, userID: string): Promise<number> {
    const sql = `
        UPDATE notifications
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_read = 0
    `;
    const result = db.prepare(sql).run(userID);
    return result.changes;
}

export async function deleteNotification(db: Database, id: string, userID: string): Promise<boolean> {
    const sql = `
        DELETE FROM notifications
        WHERE id = ? AND user_id = ?
    `;
    const result = db.prepare(sql).run(id, userID);
    return result.changes > 0;
}

export async function deleteReadNotifications(db: Database, userID: string): Promise<number> {
    const sql = `
        DELETE FROM notifications
        WHERE user_id = ? AND is_read = 1
    `;
    const result = db.prepare(sql).run(userID);
    return result.changes;
}

export async function countUnreadNotifications(db: Database, userID: string): Promise<number> {
    const sql = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0
    `;
    const result = db.query<{ count: number }, [string]>(sql).get(userID);
    return result?.count ?? 0;
}