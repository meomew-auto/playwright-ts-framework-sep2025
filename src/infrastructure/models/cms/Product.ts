/**
 * ============================================================================
 * CMS PRODUCT MODEL — Type definition cho CMS eCommerce products
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa ProductInfo interface cho CMS (ActiveEcommerce platform).
 *
 * 📌 KHÁC NEKO PRODUCT:
 * - CMS: có SEO (metaTitle), Flash Deal, Shipping, Variations, Video
 * - Neko: có Specifications (Bean/Equipment), không có SEO/Flash Deal
 * - Hai hệ thống product hoàn toàn riêng biệt
 *
 * 📚 SECTIONS:
 * Fields được nhóm theo UI form trên CMS:
 * - Product Information: name, category, brand, unit, weight
 * - Price + Stock: unitPrice, discount, quantity, SKU
 * - Description + SEO: description, metaTitle, metaDescription
 * - Settings: featured, todaysDeal, lowStockQuantity
 * - Variations: colors, attributes
 * - Video + Flash Deal + Shipping
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: data/cms/ProductDataFactory.ts (test data)
 * - Dùng bởi: pages/cms/CMSAddNewProductPage.ts (form automation)
 */
export interface ProductInfo {
  // Product Information
  name: string;
  category?: string;
  brand?: string;
  unit: string;
  weight?: number;
  minQty: number;
  tags?: string[];
  barcode?: string;

  // Product Price + Stock
  unitPrice: number;
  discount?: number;
  discountType?: 'Flat' | 'Percent';
  quantity: number;
  sku?: string;
  externalLink?: string;
  externalLinkBtn?: string;

  // Product Description
  description?: string;

  // SEO Meta Tags
  metaTitle?: string;
  metaDescription?: string;

  // Product Settings
  featured?: boolean;
  todaysDeal?: boolean;
  cashOnDelivery?: boolean;
  lowStockQuantity?: number;
  stockVisibilityState?: 'quantity' | 'text' | 'hide';

  // Product Variations
  colors?: string[];
  colorsActive?: boolean;
  attributes?: string[];

  // Video
  videoProvider?: 'Youtube' | 'Dailymotion' | 'Vimeo';
  videoLink?: string;

  // Flash Deal
  flashDeal?: string;
  flashDiscount?: number;
  flashDiscountType?: 'Flat' | 'Percent';

  // Shipping & Tax
  estShippingDays?: number;
  tax?: number;
  taxType?: 'Flat' | 'Percent';
}
