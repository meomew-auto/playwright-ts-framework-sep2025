/**
 * ============================================================================
 * NEKO CHAT INTERFACE — Type definitions cho Chat / WebSocket features
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa TypeScript types cho chat-related API responses.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: api/services/neko/ChatService.ts
 * - Dùng bởi: chat-realtime.spec.ts
 *
 * Dựa trên API: https://api-neko-coffee.autoneko.com/ws/online
 */

// ─────────────────────────────────────────────────────────────────────────
// ONLINE USERS
// ─────────────────────────────────────────────────────────────────────────

/**
 * Response từ GET /ws/online
 * Trả về danh sách users đang online trên hệ thống.
 *
 * @example
 * { "count": 2, "online_users": [1, 2] }
 */
export interface OnlineUsersResponse {
  /** Số lượng users đang online */
  count: number;
  /** Danh sách user IDs đang online */
  online_users: number[];
}
