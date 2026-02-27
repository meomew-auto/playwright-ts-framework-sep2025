/**
 * ============================================================================
 * CHAT SERVICE — Quản lý Chat/WebSocket features qua API
 * ============================================================================
 *
 * Kế thừa BaseService, cung cấp các phương thức cho Chat:
 * - GET /ws/online: Lấy danh sách users đang online (validate bằng Zod)
 *
 * 📌 ZOD VALIDATION:
 * Dùng getAndValidate() từ BaseService — tự động validate response.
 * Nếu API trả về format sai → ZodError → test fail rõ ràng.
 *
 * 🔗 LIÊN KẾT:
 * - Schema: schemas/neko/ChatSchemas.ts
 * - Interface: models/neko/chat.interface.ts
 * - Dùng bởi: neko-context.factory.ts (NekoServices)
 * - Test: chat-realtime.spec.ts
 */

import { APIRequestContext } from '@playwright/test';
import { BaseService } from '../base/BaseService';
import { ChatSchemas, type OnlineUsersResponse } from '../../schemas/neko/ChatSchemas';

export class ChatService extends BaseService {
  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ONLINE STATUS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách users đang online
   * GET /ws/online
   *
   * @returns { count: number, online_users: number[] }
   * @throws ZodError nếu response không khớp OnlineUsersSchema
   */
  async getOnlineUsers(): Promise<OnlineUsersResponse> {
    return this.getAndValidate('/ws/online', ChatSchemas.OnlineUsers);
  }

  /**
   * Kiểm tra 1 user cụ thể có online không
   * @param userId - ID của user cần check
   */
  async isUserOnline(userId: number): Promise<boolean> {
    const data = await this.getOnlineUsers();
    return data.online_users.includes(userId);
  }

  /**
   * Lấy số lượng users đang online
   */
  async getOnlineCount(): Promise<number> {
    const data = await this.getOnlineUsers();
    return data.count;
  }
}
