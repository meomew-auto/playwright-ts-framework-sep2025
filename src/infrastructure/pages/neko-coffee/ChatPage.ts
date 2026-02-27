/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CHAT PAGE — POM cho trang Chat Realtime (/chat)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Encapsulate interactions trên trang chat: chọn user,
 * gửi tin nhắn, và verify tin nhắn đã nhận.
 *
 * 📌 FEATURES:
 * - openChatWithUser(userId) — mở chat với 1 user cụ thể
 * - sendMessage(text) — gửi tin nhắn
 * - expectMessageReceived(text) — verify tin nhắn hiển thị
 *
 * 📌 MULTI-ROLE USAGE:
 * Dùng với asRole() để test chat giữa 2 users:
 * ```typescript
 * const admin = await asRole('admin');     // admin.chatPage
 * const manager = await asRole('manager'); // manager.chatPage
 * await admin.chatPage.sendMessage('Hello');
 * await manager.chatPage.expectMessageReceived('Hello');
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Extends: BasePage
 * - Dùng bởi: neko-context.factory.ts (NekoPOMs)
 * - Test: chat-realtime.spec.ts
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ViewportType } from '../../fixtures/common/ViewportType';
import { Logger } from '../../utils/Logger';

export class ChatPage extends BasePage {
  // ════════════════════════════════════════════════════════════════════════════
  // 📍 LOCATORS — data-testid based
  // ════════════════════════════════════════════════════════════════════════════

  private static readonly LOCATOR_MAP = {
    messageInput: '[data-testid="chat-input-message"]',
    sendButton: '[data-testid="chat-button-send"]',
    messagesContainer: '[data-testid="chat-messages"]',
  } as const;

  /** Get locator for a chat user in the sidebar by user ID */
  private getUserLocator(userId: number) {
    return this.page.locator(`[data-testid="chat-user-${userId}"]`);
  }

  /** Type-safe locator getter */
  public getLocator(key: keyof typeof ChatPage.LOCATOR_MAP) {
    return this.page.locator(ChatPage.LOCATOR_MAP[key]);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🧭 NAVIGATION
  // ════════════════════════════════════════════════════════════════════════════

  /** Verify đang ở trang /chat */
  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/chat/);
  }

  /** Navigate to /chat page */
  async goto(): Promise<void> {
    await this.page.goto('/chat');
    await this.page.waitForLoadState('domcontentloaded');
    Logger.info(`${this.logPrefix}Navigated to /chat`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 💬 CHAT ACTIONS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Mở chat với 1 user cụ thể.
   * Click vào user trong sidebar → đợi input message hiển thị.
   */
  async openChatWithUser(userId: number): Promise<void> {
    const userLocator = this.getUserLocator(userId);
    await userLocator.click();
    await expect(this.getLocator('messageInput')).toBeVisible({ timeout: 10000 });
    Logger.info(`${this.logPrefix}Opened chat with user #${userId}`);
  }

  /**
   * Gửi tin nhắn.
   * Fill input → click send.
   */
  async sendMessage(text: string): Promise<void> {
    await this.getLocator('messageInput').fill(text);
    await this.getLocator('sendButton').click();
    Logger.info(`${this.logPrefix}Sent message: "${text.substring(0, 50)}..."`);
  }

  /**
   * Verify tin nhắn đã xuất hiện trong messages container.
   * Dùng toContainText để check realtime message.
   */
  async expectMessageReceived(text: string, timeout = 15000): Promise<void> {
    await expect(this.getLocator('messagesContainer'))
      .toContainText(text, { timeout });
    Logger.info(`${this.logPrefix}✅ Message received: "${text.substring(0, 50)}..."`);
  }
}
