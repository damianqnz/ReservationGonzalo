import { NotificationType, Role } from '@prisma/client'
import { db } from '@/lib/db'

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

// ─── Shared select (never exposes userId or owner PII) ───────────────────────

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  message: true,
  data: true,
  isRead: true,
  createdAt: true,
} as const

// ─── Service functions ───────────────────────────────────────────────────────

/**
 * Creates a notification for the owner user.
 * Automatically resolves the first user with role OWNER — no userId needed.
 *
 * @param data - Notification payload (type, title, message, optional data).
 * @throws {Error} If no user with role OWNER exists.
 */
export async function createNotification(data: CreateNotificationInput) {
  try {
    const owner = await db.user.findFirst({
      where: { role: Role.OWNER },
      select: { id: true },
    })

    if (!owner) {
      throw new Error('No owner user found')
    }

    return db.notification.create({
      data: {
        userId: owner.id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? (data.data as object) : undefined,
      },
      select: NOTIFICATION_SELECT,
    })
  } catch (error) {
    console.error('[NotificationService]', error)
    throw error
  }
}

/**
 * Marks a single notification as read by its ID.
 *
 * @param id - Notification ID.
 * @returns The updated notification.
 */
export async function markAsRead(id: string) {
  try {
    return db.notification.update({
      where: { id },
      data: { isRead: true },
      select: NOTIFICATION_SELECT,
    })
  } catch (error) {
    console.error('[NotificationService]', error)
    throw error
  }
}

/**
 * Marks all unread notifications for a user as read.
 *
 * @param userId - The user's ID.
 * @returns The number of notifications updated.
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return result.count
  } catch (error) {
    console.error('[NotificationService]', error)
    throw error
  }
}

/**
 * Returns the count of unread notifications for a user.
 *
 * @param userId - The user's ID.
 * @returns The number of unread notifications.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return db.notification.count({
      where: { userId, isRead: false },
    })
  } catch (error) {
    console.error('[NotificationService]', error)
    throw error
  }
}
