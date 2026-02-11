import { faker } from '@faker-js/faker';
import { ProductInfo } from '../../models/cms/Product';

/**
 * Format thời gian thành HH:mm:ss
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format thời gian thành HHmmss
 */
function formatTimeCompact(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}${minutes}${seconds}`;
}

/**
 * Generate product name với prefix và timestamp
 */
export function generateProductName(prefix: string): string {
  const fakeProduct = faker.commerce.productName();
  const timestamp = formatTime(new Date());
  return `${prefix} ${fakeProduct} ${timestamp}`;
}

/**
 * Generate SKU với prefix
 */
export function generateSKU(prefix: string = 'AUTO'): string {
  const random = faker.string.alphanumeric(6).toUpperCase();
  const timestamp = formatTimeCompact(new Date());
  return `${prefix}-${random}-${timestamp}`;
}

/**
 * Generate barcode
 */
export function generateBarcode(): string {
  return faker.string.numeric(13);
}

/**
 * Tạo ProductInfo với các trường tối thiểu (required fields)
 */
export function createMinimalProductInfo(overrides?: Partial<ProductInfo>): ProductInfo {
  return {
    name: generateProductName('Auto PW'),
    category: 'Sport shoes',
    unit: 'Pc',
    minQty: 1,
    unitPrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    quantity: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}

/**
 * Tạo ProductInfo với đầy đủ các trường
 */
export function createFullProductInfo(overrides?: Partial<ProductInfo>): ProductInfo {
  const baseProduct = createMinimalProductInfo();
  
  return {
    ...baseProduct,
    name: overrides?.name ?? generateProductName('Auto PW'),
    brand: overrides?.brand ?? faker.company.name(),
    weight: overrides?.weight ?? parseFloat(faker.commerce.price({ min: 0.1, max: 10, dec: 2 })),
    tags: overrides?.tags ?? [
      faker.commerce.productAdjective(),
      faker.commerce.productMaterial(),
      'automation',
    ],
    barcode: overrides?.barcode ?? generateBarcode(),
    discount: overrides?.discount ?? faker.number.int({ min: 5, max: 50 }),
    discountType: overrides?.discountType ?? faker.helpers.arrayElement(['Flat', 'Percent']),
    sku: overrides?.sku ?? generateSKU(),
    externalLink: overrides?.externalLink ?? faker.internet.url(),
    externalLinkBtn: overrides?.externalLinkBtn ?? 'Buy Now',
    description: overrides?.description ?? faker.commerce.productDescription(),
    metaTitle: overrides?.metaTitle ?? `Meta Title for ${baseProduct.name}`,
    metaDescription: overrides?.metaDescription ?? faker.lorem.paragraph(),
    featured: overrides?.featured ?? faker.datatype.boolean(),
    todaysDeal: overrides?.todaysDeal ?? faker.datatype.boolean(),
    cashOnDelivery: overrides?.cashOnDelivery ?? true,
    lowStockQuantity: overrides?.lowStockQuantity ?? faker.number.int({ min: 1, max: 10 }),
    stockVisibilityState: overrides?.stockVisibilityState ?? 'quantity',
    colors: overrides?.colors ?? faker.helpers.arrayElements(['Red', 'Blue', 'Green', 'Black', 'White'], { min: 1, max: 3 }),
    colorsActive: overrides?.colorsActive ?? true,
    attributes: overrides?.attributes ?? faker.helpers.arrayElements(['Size', 'Quality'], { min: 0, max: 2 }),
    videoProvider: overrides?.videoProvider ?? faker.helpers.arrayElement(['Youtube', 'Dailymotion', 'Vimeo']),
    videoLink: overrides?.videoLink ?? `https://www.youtube.com/watch?v=${faker.string.alphanumeric(11)}`,
    estShippingDays: overrides?.estShippingDays ?? faker.number.int({ min: 1, max: 7 }),
    tax: overrides?.tax ?? faker.number.int({ min: 0, max: 20 }),
    taxType: overrides?.taxType ?? faker.helpers.arrayElement(['Flat', 'Percent']),
    ...overrides,
  };
}

/**
 * Tạo ProductInfo với variations (colors và attributes)
 */
export function createProductWithVariations(overrides?: Partial<ProductInfo>): ProductInfo {
  const baseProduct = createMinimalProductInfo();
  
  return {
    ...baseProduct,
    colors: overrides?.colors ?? ['Red', 'Blue', 'Green'],
    colorsActive: overrides?.colorsActive ?? true,
    attributes: overrides?.attributes ?? ['Size', 'Quality'],
    ...overrides,
  };
}

/**
 * Tạo ProductInfo với discount configuration
 */
export function createProductWithDiscount(overrides?: Partial<ProductInfo>): ProductInfo {
  const baseProduct = createMinimalProductInfo();
  
  return {
    ...baseProduct,
    discount: overrides?.discount ?? faker.number.int({ min: 10, max: 30 }),
    discountType: overrides?.discountType ?? 'Percent',
    ...overrides,
  };
}

/**
 * Tạo ProductInfo cho featured product
 */
export function createFeaturedProduct(overrides?: Partial<ProductInfo>): ProductInfo {
  const baseProduct = createMinimalProductInfo();
  
  return {
    ...baseProduct,
    featured: true,
    todaysDeal: overrides?.todaysDeal ?? faker.datatype.boolean(),
    cashOnDelivery: true,
    ...overrides,
  };
}
