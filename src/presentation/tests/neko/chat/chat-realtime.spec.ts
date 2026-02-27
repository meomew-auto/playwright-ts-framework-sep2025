/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHAT REALTIME TEST — Multi-role chat + online status
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Test chức năng chat realtime giữa 2 users (admin, manager)
 * và verify online status qua API.
 *
 * 📌 SCENARIOS:
 * - TC01: Admin và Manager chat realtime — gửi nhận tin nhắn 2 chiều
 * - TC02: Khi cả 2 roles online → API /ws/online trả về 2 users
 *
 * 📌 MULTI-ROLE PATTERN:
 * Mỗi test dùng 2 kiểu truy cập:
 *
 * 1. FIXTURE MẶC ĐỊNH (admin) — chatPage, chatService
 *    → Đã login bởi neko.setup.ts
 *    → Dùng trực tiếp trong test args
 *
 * 2. asRole('manager') — lazy login
 *    → Lần đầu: tự động gọi API login → lưu .auth/neko-manager.json
 *    → Lần sau: dùng file có sẵn (skip login, nhanh hơn)
 *    → Trả về: { page, chatPage, chatService, ... } (isolated context)
 *
 * 📌 PATTERN QUAN TRỌNG:
 * - ADMIN → dùng fixture:  chatPage.goto(), chatService.getOnlineUsers()
 * - ROLE KHÁC → dùng asRole: manager.chatPage.goto(), manager.chatService.getOnlineUsers()
 * - KHÔNG dùng asRole('admin') — admin đã có sẵn từ fixture!
 *
 * 📌 expect.poll() — TIMING PATTERN:
 * WebSocket cần thời gian để connect. Sau khi navigate đến /chat,
 * user chưa xuất hiện online ngay lập tức. Dùng expect.poll()
 * để retry API call cho đến khi cả 2 users xuất hiện.
 *
 * 📌 TEST DATA:
 * - Admin: user id 1 (NEKO_ADMIN_USERNAME)
 * - Manager: user id 2 (NEKO_MANAGER_USERNAME=test1)
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: unified.fixture (asRole, chatPage, chatService)
 * - POM: ChatPage (/chat) — dùng data-testid locators
 * - Service: ChatService (getOnlineUsers) — validate bằng Zod
 * - Schema: ChatSchemas (OnlineUsersSchema)
 * - Factory: neko-context.factory.ts (tạo POMs + Services cho mọi role)
 */

import { test, expect } from '@fixtures/neko/unified.fixture';
import { Logger } from '@utils/Logger';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_USER_ID = 1;
const MANAGER_USER_ID = 2;

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Chat Realtime — Multi-role', () => {
  test('TC01. Admin và Manager chat realtime với nhau', async ({ chatPage, asRole }) => {
    // ─── Setup ──────────────────────────────────────────────────────────
    // chatPage = admin (từ fixture mặc định, đã login bởi setup)
    // manager = từ asRole (lazy login nếu chưa có storageState)
    const manager = await asRole('manager');

    // ─── Navigate cả 2 đến /chat ────────────────────────────────────────
    await Promise.all([
      chatPage.goto(),
      manager.chatPage.goto(),
    ]);

    // ─── Admin mở chat với Manager (id:2) ───────────────────────────────
    await chatPage.openChatWithUser(MANAGER_USER_ID);

    // ─── Manager mở chat với Admin (id:1) ───────────────────────────────
    await manager.chatPage.openChatWithUser(ADMIN_USER_ID);

    // ─── Admin gửi tin nhắn ─────────────────────────────────────────────
    const adminMessage = `Hello from Admin! ${Date.now()}`;
    await chatPage.sendMessage(adminMessage);

    // ─── Verify: Manager nhận được tin nhắn từ Admin ────────────────────
    await manager.chatPage.expectMessageReceived(adminMessage);
    Logger.info('✅ Manager đã nhận được tin nhắn từ Admin');

    // ─── Manager reply ──────────────────────────────────────────────────
    const managerReply = `Received! Reply from Manager ${Date.now()}`;
    await manager.chatPage.sendMessage(managerReply);

    // ─── Verify: Admin nhận được tin nhắn từ Manager ────────────────────
    await chatPage.expectMessageReceived(managerReply);
    Logger.info('✅ Admin đã nhận được tin nhắn từ Manager');
  });

  test('TC02. Cả 2 roles online → API trả về 2 users', async ({ chatPage, chatService, asRole }) => {
    // ─── Setup ──────────────────────────────────────────────────────────
    // chatPage + chatService = admin (từ fixture mặc định)
    // manager = từ asRole (lazy login)
    const manager = await asRole('manager');

    // ─── Navigate cả 2 đến /chat (connect WebSocket) ────────────────────
    await Promise.all([
      chatPage.goto(),
      manager.chatPage.goto(),
    ]);

    // ─── Đợi cả 2 users xuất hiện online (WebSocket cần thời gian connect) ──
    await expect.poll(
      async () => {
        const data = await chatService.getOnlineUsers();
        Logger.info(`Polling online users: ${JSON.stringify(data)}`);
        return data.online_users;
      },
      { message: 'Waiting for both admin and manager to appear online', timeout: 15000 }
    ).toEqual(expect.arrayContaining([ADMIN_USER_ID, MANAGER_USER_ID]));

    // ─── Admin check (dùng chatService fixture) ─────────────────────────
    const adminView = await chatService.getOnlineUsers();
    Logger.info(`Admin sees online users: ${JSON.stringify(adminView)}`);

    expect(adminView.count).toBeGreaterThanOrEqual(2);
    expect(adminView.online_users).toContain(ADMIN_USER_ID);
    expect(adminView.online_users).toContain(MANAGER_USER_ID);

    // ─── Manager check (dùng chatService từ asRole) ─────────────────────
    const managerView = await manager.chatService.getOnlineUsers();
    Logger.info(`Manager sees online users: ${JSON.stringify(managerView)}`);

    expect(managerView.count).toBeGreaterThanOrEqual(2);
    expect(managerView.online_users).toContain(ADMIN_USER_ID);
    expect(managerView.online_users).toContain(MANAGER_USER_ID);

    Logger.info('✅ Cả Admin và Manager đều thấy 2 users online');
  });
});
