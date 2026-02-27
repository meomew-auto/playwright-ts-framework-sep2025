/**
 * ============================================================================
 * CHAT SCHEMAS — Zod schemas cho Chat API responses
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Xác thực (validate) API responses cho chat-related endpoints bằng Zod.
 * Đảm bảo response đúng format trước khi test dùng.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: ChatService.ts (getAndValidate)
 * - Types: models/neko/chat.interface.ts
 *
 * Dựa trên API: https://api-neko-coffee.autoneko.com/ws/online
 */

import { z } from 'zod';
import type { OnlineUsersResponse } from '@models/neko/chat.interface';

// ─────────────────────────────────────────────────────────────────────────
// ONLINE USERS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Schema cho GET /ws/online
 * Validate: count là số, online_users là mảng số
 */
const OnlineUsersSchema: z.ZodType<OnlineUsersResponse> = z.object({
  count: z.number(),
  online_users: z.array(z.number()),
});

// ─────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────

export const ChatSchemas = {
  OnlineUsers: OnlineUsersSchema,
};

// Re-export types
export type { OnlineUsersResponse };
