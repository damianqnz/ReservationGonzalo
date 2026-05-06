import { NotificationType, Role } from '@prisma/client'
import { db } from '@/shared/lib/db'

// ─── Notify all OWNER + ADMIN users ──────────────────────────────────────────

/**
 * Creates a notification for every user with role OWNER or ADMIN.
 * Useful for system-wide alerts and monthly summaries.
 *
 * @param data - Notification payload.
 */
export async function notifyAllOwnerAdmins(data: CreateNotificationInput) {
  try {
    const admins = await db.user.findMany({
      where: { role: { in: [Role.OWNER, Role.ADMIN] } },
      select: { id: true },
    })

    if (!admins.length) return

    await db.notification.createMany({
      data: admins.map((u) => ({
        userId:  u.id,
        type:    data.type,
        title:   data.title,
        message: data.message,
        data:    data.data ? (data.data as object) : undefined,
      })),
      skipDuplicates: true,
    })
  } catch (error) {
    console.error('[NotificationService/notifyAllOwnerAdmins]', error)
    throw error
  }
}

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
 * Returns the latest notifications for a user together with the total
 * unread count, using a single Prisma transaction.
 *
 * @param userId - The user's ID.
 * @param limit - Max notifications to return (default 20).
 */
export async function listNotifications(userId: string, limit = 20) {
  try {
    const [items, unreadCount] = await db.$transaction([
      db.notification.findMany({
        where: { userId },
        select: NOTIFICATION_SELECT,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({ where: { userId, isRead: false } }),
    ])

    return { items, unreadCount }
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
