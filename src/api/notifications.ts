import type { ApiConfig } from '../config';
import type { AuthenticatedRequest } from './middleware';
import {
  createNotification,
  listNotificationsByUserID,
  listUnreadNotificationsByUserID,
  listNotificationsByType,
  listNotificationsByExecutionID,
  getNotificationByID,
  updateNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  countUnreadNotifications,
  type CreateNotificationParams,
  type UpdateNotificationParams,
  type Notification,
} from '../db/notifications';
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UserForbiddenError,
} from './errors';
import { respondWithJSON } from './json';

const VALID_NOTIFICATION_TYPES: Notification['notificationType'][] = [
  'success',
  'error',
  'warning',
  'info',
  'system',
];

function isValidNotificationType(
  type: string,
): type is Notification['notificationType'] {
  return VALID_NOTIFICATION_TYPES.includes(type as any);
}

export async function handlerCreateNotification(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const body = await req.json();

  if (!body.notificationType || !body.title || !body.message) {
    throw new BadRequestError(
      'notificationType, title and message are required',
    );
  }

  if (!isValidNotificationType(body.notificationType)) {
    throw new BadRequestError(
      `notificationType must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
    );
  }

  const params: CreateNotificationParams = {
    userID: userID,
    executionID: body.executionID ?? null,
    notificationType: body.notificationType,
    title: body.title,
    message: body.message,
  };

  const notification = await createNotification(config.db, params);
  return respondWithJSON(201, notification);
}

export async function handlerListAllNotifications(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unreadOnly');
  const notificationType = url.searchParams.get('notificationType');
  const executionID = url.searchParams.get('executionID');

  let notifications;

  if (executionID) {
    notifications = await listNotificationsByExecutionID(
      config.db,
      userID,
      executionID,
    );
  } else if (notificationType) {
    if (!isValidNotificationType(notificationType)) {
      throw new BadRequestError(
        `notificationType must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
      );
    }
    notifications = await listNotificationsByType(
      config.db,
      userID,
      notificationType,
    );
  } else if (unreadOnly === 'true') {
    notifications = await listUnreadNotificationsByUserID(config.db, userID);
  } else {
    notifications = await listNotificationsByUserID(config.db, userID);
  }

  return respondWithJSON(200, notifications);
}

export async function handlerGetNotificationByID(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const notificationID = pathParts[pathParts.length - 1];

  if (!notificationID) throw new BadRequestError('Notification ID is required');

  const notification = await getNotificationByID(config.db, notificationID);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userID !== userID) throw new UserForbiddenError('Forbidden');

  return respondWithJSON(200, notification);
}

export async function handlerDeleteNotification(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const notificationID = pathParts[pathParts.length - 1];

  if (!notificationID) throw new BadRequestError('Notification ID is required');

  const notification = await getNotificationByID(config.db, notificationID);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userID !== userID) throw new UserForbiddenError('Forbidden');

  const deleted = await deleteNotification(config.db, notificationID, userID);
  if (!deleted) throw new InternalServerError('Failed to delete notification');

  return new Response(null, { status: 204 });
}

export async function handlerUpdateNotification(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const notificationID = pathParts[pathParts.length - 1];

  if (!notificationID) throw new BadRequestError('Notification ID is required');

  const notification = await getNotificationByID(config.db, notificationID);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userID !== userID) throw new UserForbiddenError('Forbidden');

  const body = await req.json();

  const params: UpdateNotificationParams = {};
  if (body.isRead !== undefined) params.isRead = !!body.isRead;
  if (body.readAt !== undefined)
    params.readAt = body.readAt ? new Date(body.readAt) : null;

  const updatedNotification = await updateNotification(
    config.db,
    notificationID,
    userID,
    params,
  );

  return respondWithJSON(200, updatedNotification);
}

export async function handlerMarkNotificationAsRead(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const notificationID = pathParts[pathParts.length - 3]; // /api/notifications/:id/read

  if (!notificationID) throw new BadRequestError('Notification ID is required');

  const notification = await getNotificationByID(config.db, notificationID);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.userID !== userID) throw new UserForbiddenError('Forbidden');

  const updatedNotification = await markNotificationAsRead(
    config.db,
    notificationID,
    userID,
  );

  return respondWithJSON(200, updatedNotification);
}

export async function handlerMarkAllNotificationsAsRead(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const count = await markAllNotificationsAsRead(config.db, userID);

  return respondWithJSON(200, { markedAsRead: count });
}

export async function handlerDeleteReadNotifications(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const count = await deleteReadNotifications(config.db, userID);

  return respondWithJSON(200, { deleted: count });
}

export async function handlerCountUnreadNotifications(
  config: ApiConfig,
  req: AuthenticatedRequest,
) {
  const userID = req.user.id;
  const count = await countUnreadNotifications(config.db, userID);

  return respondWithJSON(200, { unreadCount: count });
}
