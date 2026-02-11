import { test, expect } from '@playwright/test';
import { CMSLoginPage } from '@pages/cms/CMSLoginPage';
import { CMSDashboardPage } from '@pages/cms/CMSDashboardPage';
import { CMSAddNewProductPage } from '@pages/cms/CMSAddNewProductPage';
import { createMinimalProductInfo, createFullProductInfo, createProductWithVariations, createProductWithDiscount, createFeaturedProduct } from '@data/cms/ProductDataFactory';
import { getTestData } from '@data/common/TestDataRepository';

test.describe('CMS Add New Product', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new CMSLoginPage(page);
    await loginPage.goto();
    await loginPage.expectOnPage();
    await loginPage.login('admin@example.com', '123456');
    await loginPage.expectLoggedIn();
  });

  test('should navigate to Add New Product page', async ({ page }) => {
    const dashboardPage = new CMSDashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectOnPage();

    // Navigate to Add New Product via sidebar
    await dashboardPage.navigateToSubMenu('Products', 'Add New Product');

    const addProductPage = new CMSAddNewProductPage(page);
    await addProductPage.expectOnPage();
  });

  test('should fill basic product information using factory', async ({ page }) => {
    const addProductPage = new CMSAddNewProductPage(page);
    await addProductPage.goto();
    await addProductPage.expectOnPage();

    // Generate product data using factory
    const productData = createMinimalProductInfo();

    // Fill basic required fields - dùng bulk fill, category/brand chọn tự động
    await addProductPage.sections.general.fill({
      name: productData.name,
      category: null,
      brand: null,
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Verify fields are filled
    await expect(addProductPage.element('productNameInput')).toHaveValue(new RegExp(productData.name));
    await expect(addProductPage.element('unitInput')).toHaveValue(productData.unit);
    await expect(addProductPage.element('minQtyInput')).toHaveValue(productData.minQty.toString());
    await expect(addProductPage.element('unitPriceInput')).toHaveValue(productData.unitPrice.toString());
    await expect(addProductPage.element('quantityInput')).toHaveValue(productData.quantity.toString());

    // Upload thumbnail image (chọn file đầu tiên từ modal)
    await addProductPage.uploadThumbnailImage(0);

    // Save product
    await addProductPage.savePublish();
    
    // Verify success message or redirect
    await expect(page.locator('.alert-success, .aiz-alert-success, [role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  test('should fill basic product information using schema', async ({ page }) => {
    const addProductPage = new CMSAddNewProductPage(page);
    await addProductPage.goto();
    await addProductPage.expectOnPage();

    // Get product data from schema
    const productData = getTestData('products', 'minimal');

    // Fill basic required fields - dùng bulk fill, category/brand chọn tự động
    await addProductPage.sections.general.fill({
      name: productData.name,
      category: null,
      brand: null,
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Verify fields are filled
    await expect(addProductPage.element('productNameInput')).toHaveValue(new RegExp(productData.name));
    await expect(addProductPage.element('unitInput')).toHaveValue(productData.unit);
    await expect(addProductPage.element('minQtyInput')).toHaveValue(productData.minQty.toString());
    await expect(addProductPage.element('unitPriceInput')).toHaveValue(productData.unitPrice.toString());
    await expect(addProductPage.element('quantityInput')).toHaveValue(productData.quantity.toString());

    // Upload thumbnail image (chọn file đầu tiên từ modal)
    await addProductPage.uploadThumbnailImage(0);

    // Save product
    await addProductPage.savePublish();
    
    // Verify success message or redirect
    await expect(page.locator('.alert-success, .aiz-alert-success, [role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  test('should fill complete product information using factory', async ({ page }) => {
    const addProductPage = new CMSAddNewProductPage(page);
    await addProductPage.goto();
    await addProductPage.expectOnPage();

    // Generate complete product data using factory
    const productData = createFullProductInfo();

    // Fill Product Information section (bulk fill)
    await addProductPage.sections.general.fill({
      name: productData.name,
      category: 'Computer & Accessories', // null = chọn category đầu tiên (ổn định hơn)
      brand: null, // null = chọn brand đầu tiên (ổn định hơn)
      unit: productData.unit,
      weight: productData.weight,
      minQty: productData.minQty,
      tags: productData.tags,
      barcode: productData.barcode,
    });

    // Fill Pricing section (bulk fill)
    await addProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      discount: productData.discount,
      discountType: productData.discountType,
      quantity: productData.quantity,
      sku: productData.sku,
      externalLink: productData.externalLink,
      externalLinkBtn: productData.externalLinkBtn,
      stockVisibilityState: 'text', // hoặc 'text' hoặc 'hide'

    });
    // Fill Description section
    if (productData.description) {
      await addProductPage.sections.general.fillDescription(productData.description);
    }

    // Fill SEO section (bulk fill)
    await addProductPage.sections.seo.fill({
      metaTitle: productData.metaTitle,
      metaDescription: productData.metaDescription,
    });

    // Fill Stock section (bulk fill)
    await addProductPage.sections.priceAndStock.fill({
      lowStockQuantity: productData.lowStockQuantity,
      stockVisibilityState: productData.stockVisibilityState,
    });

    // Fill General section - Status, Tax (bulk fill)
    await addProductPage.sections.general.fill({
      featured: productData.featured,
      todaysDeal: productData.todaysDeal,
      tax: productData.tax,
      taxType: productData.taxType,
    });

    // Fill Shipping section (bulk fill)
    await addProductPage.sections.shipping.fill({
      cashOnDelivery: productData.cashOnDelivery,
      estShippingDays: productData.estShippingDays,
    });

    // Fill Files & Media section (bulk fill)
    if (productData.videoProvider && productData.videoLink) {
      await addProductPage.sections.filesAndMedia.fill({
        videoProvider: productData.videoProvider,
        videoLink: productData.videoLink,
      });
    }

    // Upload images
    await addProductPage.sections.filesAndMedia.uploadThumbnailImage(0);
    await addProductPage.sections.filesAndMedia.uploadGalleryImages(0);
    await addProductPage.sections.filesAndMedia.uploadGalleryImages(1);

    // Verify some key fields
    await expect(addProductPage.element('productNameInput')).toHaveValue(productData.name);
    await expect(addProductPage.element('unitPriceInput')).toHaveValue(productData.unitPrice.toString());
    await expect(addProductPage.element('quantityInput')).toHaveValue(productData.quantity.toString());

    // Save product
    await addProductPage.savePublish();
    
    // Verify success message or redirect
    await expect(page.locator('.alert-success, .aiz-alert-success, [role="alert"]')).toBeVisible({ timeout: 10000 });
  });



  test('should toggle product settings correctly', async ({ page }) => {
    const addProductPage = new CMSAddNewProductPage(page);
    await addProductPage.goto();
    await addProductPage.expectOnPage();

    // Fill basic info
    await addProductPage.sections.general.fill({
      name: 'Settings Product ' + Date.now(),
      category: null,
      brand: null,
      unit: 'Pc',
      minQty: 1,
    });
    await addProductPage.sections.priceAndStock.fill({
      unitPrice: 100.0,
      quantity: 10,
    });

    // Toggle various settings
    await addProductPage.toggleCashOnDelivery(true);
    await addProductPage.toggleFeatured(true);
    await addProductPage.toggleTodaysDeal(true);

    // Verify checkboxes are checked
    await expect(addProductPage.element('cashOnDeliveryCheckbox')).toBeChecked();
    await expect(addProductPage.element('featuredCheckbox')).toBeChecked();
    await expect(addProductPage.element('todaysDealCheckbox')).toBeChecked();

    // Toggle off
    await addProductPage.toggleFeatured(false);
    await expect(addProductPage.element('featuredCheckbox')).not.toBeChecked();

    // Upload thumbnail image
    await addProductPage.sections.filesAndMedia.uploadThumbnailImage(0);

    // Save product
    await addProductPage.savePublish();
    
    // Verify success message or redirect
    await expect(page.locator('.alert-success, .aiz-alert-success, [role="alert"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle discount and tax configuration using factory', async ({ page }) => {
    const addProductPage = new CMSAddNewProductPage(page);
    await addProductPage.goto();
    await addProductPage.expectOnPage();

    // Generate product with discount using factory
    const productData = createProductWithDiscount({
      tax: 10,
      taxType: 'Percent',
    });

    // Fill basic info - không chỉ định category/brand, sẽ chọn đầu tiên
    await addProductPage.sections.general.fill({
      name: productData.name,
      category: null,
      brand: null,
      unit: productData.unit,
      minQty: productData.minQty,
    });
    await addProductPage.sections.priceAndStock.fill({
      unitPrice: productData.unitPrice,
      quantity: productData.quantity,
    });

    // Configure discount
    await addProductPage.sections.priceAndStock.fill({
      discount: productData.discount,
      discountType: productData.discountType,
    });

    // Configure tax
    await addProductPage.sections.general.fill({
      tax: productData.tax,
      taxType: productData.taxType,
    });

    // Verify discount and tax
    if (productData.discount) {
      await expect(addProductPage.element('discountInput')).toHaveValue(productData.discount.toString());
    }
    if (productData.tax) {
      await expect(addProductPage.element('taxInput')).toHaveValue(productData.tax.toString());
    }

    // Upload thumbnail image
    await addProductPage.sections.filesAndMedia.uploadThumbnailImage(0);

    // Save product
    await addProductPage.savePublish();
    
    // Verify success message or redirect
    await expect(page.locator('.alert-success, .aiz-alert-success, [role="alert"]')).toBeVisible({ timeout: 10000 });
  });
});

