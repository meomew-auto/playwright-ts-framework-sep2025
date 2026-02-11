/**
 * ============================================================================
 * CRM CUSTOMER MODEL — Type definition cho CRM customers
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa CustomerInfo interface cho CRM project (future).
 * Hiện tại chỉ có fields cơ bản — sẽ mở rộng khi CRM phát triển.
 *
 * 🔗 LIÊN KẾT:
 * - Export bởi: models/crm/index.ts → models/index.ts (barrel)
 */
export interface CustomerInfo {
  company: string;
  vat?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  language?: string;
  currency?: string;
}
