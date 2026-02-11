/**
 * ============================================================================
 * CMS ADD NEW PRODUCT PAGE — POM cho form tạo sản phẩm mới
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Automate form tạo product phức tạp với nhiều sections:
 * Product Info, Images, Video, Price, Stock, SEO, Settings, Shipping.
 * URL: /admin/products/create
 *
 * 📌 KEY PATTERNS:
 * - Reusable dynamic locators: formGroup, aizSwitchLabel, radioLabel
 * - Upload modal: gallery images, thumbnail
 * - Bootstrap select dropdowns: category, brand, unit
 * - Tagify inputs: tags
 *
 * ⚠️ LƯU Ý:
 * File này rất lớn (1170+ lines) vì form CMS có nhiều sections.
 * Locators được tổ chức theo sections giống UI form.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: ProductInfo model (models/cms/Product.ts)
 * - Fixture: cms/ui/app.fixture.ts (addNewProductPage)
 * - Extends: BasePage (createLocatorGetter)
 */
import { BasePage } from '../base/BasePage';
import { Page, expect } from '@playwright/test';
import { ViewportType } from '../../fixtures/common/ViewportType';
export class CMSAddNewProductPage extends BasePage {
  private readonly pageLocators = (() => {
    // Helper functions để tái sử dụng trong các locators khác
    const getFormGroup = (page: Page, labelText: string) =>
      page.locator('.form-group.row').filter({ 
        has: page.locator('label.col-from-label, label.col-form-label').filter({ hasText: labelText }) 
      });

    const getUploadModalParent = (page: Page) =>
      page.locator('.modal-content').filter({ has: page.locator('a[href="#aiz-select-file"]') });

    const getAizSwitchLabel = (page: Page, inputName: string) =>
      page.locator('label.aiz-switch').filter({ has: page.locator(`input[name="${inputName}"]`) });

    const getRadioLabel = (page: Page, inputName: string, value: string) =>
      page.locator('label').filter({ has: page.locator(`input[name="${inputName}"][value="${value}"]`) });

    return {
    // ========== Simple Selectors (String) ==========
    form: '#choice_form',
    productNameInput: 'input[name="name"]',
    unitInput: 'input[name="unit"]',
    weightInput: 'input[name="weight"]',
    minQtyInput: 'input[name="min_qty"]',
    tagsInput: 'input[name="tags[]"]',
    barcodeInput: 'input[name="barcode"]',
    unitPriceInput: 'input[name="unit_price"]',
    discountDateRangeInput: 'input[name="date_range"]',
    discountInput: 'input[name="discount"]',
    quantityInput: 'input[name="current_stock"]',
    skuInput: 'input[name="sku"]',
    externalLinkInput: 'input[name="external_link"]',
    externalLinkBtnInput: 'input[name="external_link_btn"]',
    descriptionTextarea: 'textarea[name="description"]',
    metaTitleInput: 'input[name="meta_title"]',
    metaDescriptionTextarea: 'textarea[name="meta_description"]',
    lowStockQuantityInput: 'input[name="low_stock_quantity"]',
    stockVisibilityQuantityRadio: 'input[name="stock_visibility_state"][value="quantity"]',
    stockVisibilityTextRadio: 'input[name="stock_visibility_state"][value="text"]',
    stockVisibilityHideRadio: 'input[name="stock_visibility_state"][value="hide"]',
    cashOnDeliveryCheckbox: 'input[name="cash_on_delivery"]',
    featuredCheckbox: 'input[name="featured"]',
    todaysDealCheckbox: 'input[name="todays_deal"]',
    flashDiscountInput: 'input[name="flash_discount"]',
    estShippingDaysInput: 'input[name="est_shipping_days"]',
    taxInput: 'input[name="tax[]"]',
    videoLinkInput: 'input[name="video_link"]',
    colorsActiveCheckbox: 'input[name="colors_active"]',
    freeShippingRadio: 'input[name="shipping_type"][value="free"]',
    flatRateRadio: 'input[name="shipping_type"][value="flat_rate"]',
    flatShippingCostInput: 'input[name="flat_shipping_cost"]',
    isQuantityMultipliedCheckbox: 'input[name="is_quantity_multiplied"]',
    saveUnpublishButton: 'button[name="button"][value="unpublish"]',
    savePublishButton: 'button[name="button"][value="publish"]',

    // ========== Page Elements ==========
    pageTitle: (page: Page) =>
      page
        .locator('.aiz-titlebar h1, .aiz-titlebar h2, .aiz-titlebar h3, .aiz-titlebar h4, .aiz-titlebar h5, .aiz-titlebar h6')
        .filter({ hasText: 'Add New Product' }),
    // Tab headers
    tabGeneral: '#general-tab',
    tabFilesMedia: '#files-and-media-tab',
    tabPriceStock: '#price-and-stocks-tab',
    tabSEO: '#seo-tab',
    tabShipping: '#shipping-tab',
    tabWarranty: '#warranty-tab',
    tabFrequentlyBought: '#frequenty-bought-product-tab',
    
    // ========== Reusable Dynamic Locators ==========
    // formGroup: Tái sử dụng container cho bất kỳ field nào theo label
    // Usage: this.element('formGroup')('Tags') → Locator
    formGroup: (page: Page, labelText: string) =>
      page.locator('.form-group.row').filter({ 
        has: page.locator('label.col-from-label, label.col-form-label').filter({ hasText: labelText }) 
      }),

    // uploadModalParent: Tái sử dụng upload modal parent locator
    // Usage: this.element('uploadModalParent')() → Locator
    uploadModalParent: (page: Page) =>
      page.locator('.modal-content').filter({ has: page.locator('a[href="#aiz-select-file"]') }),



    // aizSwitchLabel: Tái sử dụng label cho aiz-switch checkbox
    // Usage: this.element('aizSwitchLabel')('cash_on_delivery') → Locator
    aizSwitchLabel: (page: Page, inputName: string) =>
      page.locator('label.aiz-switch').filter({ has: page.locator(`input[name="${inputName}"]`) }),

    // radioLabel: Tái sử dụng label cho radio button
    // Usage: this.element('radioLabel')('stock_visibility_state', 'quantity') → Locator
    radioLabel: (page: Page, inputName: string, value: string) =>
      page.locator('label').filter({ has: page.locator(`input[name="${inputName}"][value="${value}"]`) }),

    // bootstrapSelectOption: Tái sử dụng dropdown option selector
    // Usage: this.element('bootstrapSelectOption')('bs-select-1', 'Category Name') → Locator
    bootstrapSelectOption: (page: Page, dropdownId: string, optionText: string) =>
      page.locator(`#${dropdownId} .dropdown-item`).filter({ hasText: optionText }).first(),

    // ========== Pre-configured Locators (Tái sử dụng reusable locators) ==========
    // Product Information Section
    tagsTagify: (page: Page) => getFormGroup(page, 'Tags').locator('tags.tagify'),
    tagsTagifyInput: (page: Page) => getFormGroup(page, 'Tags').locator('tags.tagify .tagify__input'),
    categorySelect: (page: Page) => getFormGroup(page, 'Category').locator('button[data-id="category_id"]'),
    brandSelect: (page: Page) => getFormGroup(page, 'Brand').locator('button[data-id="brand_id"]'),
    categorySelectOption: (page: Page, categoryText: string) =>
      page.locator(`#bs-select-1 .dropdown-item`).filter({ hasText: categoryText }).first(),
    brandSelectOption: (page: Page, brandText: string) =>
      page.locator(`#bs-select-2 .dropdown-item`).filter({ hasText: brandText }).first(),
    
    // ========== Product Images Section (Tái sử dụng formGroup) ==========
    galleryImagesUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"][data-multiple="true"]'),
    galleryImagesBrowse: (page: Page) => getFormGroup(page, 'Gallery Images').locator('div[data-toggle="aizuploader"] .input-group-text'),
    thumbnailImageUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"]:not([data-multiple])'),
    thumbnailImageBrowse: (page: Page) => getFormGroup(page, 'Thumbnail Image').locator('div[data-toggle="aizuploader"] .input-group-text'),
    
    // ========== Upload Modal Section (Tái sử dụng uploadModalParent) ==========
    uploadModal: (page: Page) => getUploadModalParent(page),
    uploadModalSelectFileTab: (page: Page) => getUploadModalParent(page).locator('a[href="#aiz-select-file"]'),
    uploadModalUploadNewTab: (page: Page) => getUploadModalParent(page).locator('a[href="#aiz-upload-new"]'),
    uploadModalFileCard: (page: Page) => getUploadModalParent(page).locator('.aiz-uploader-select.card-file'),
    uploadModalFileCardByIndex: (page: Page) => (index: number) => 
      getUploadModalParent(page).locator('.aiz-uploader-select.card-file').nth(index),
    uploadModalAddFilesButton: (page: Page) => getUploadModalParent(page).locator('button[data-toggle="aizUploaderAddSelected"]'),
    uploadModalCloseButton: (page: Page) => getUploadModalParent(page).locator('button.close, button[data-dismiss="modal"]'),
    uploadModalUploadInput: (page: Page) => getUploadModalParent(page).locator('.uppy-Dashboard-input[type="file"]'),
    
    // Product Videos Section
    videoProviderSelect: (page: Page) => page.locator('button[data-id="video_provider"]'),
    videoProviderOption: (page: Page, provider: 'Youtube' | 'Dailymotion' | 'Vimeo') => 
      page.locator(`#bs-select-3 .dropdown-item`).filter({ hasText: provider }).first(),
    
    // Product Variation Section
    colorsSelect: (page: Page) => page.locator('button[data-id="colors"]'),
    colorsActiveLabel: (page: Page) => {
      return page.locator('label.aiz-switch').filter({ has: page.locator('input[name="colors_active"]') });
    },
    attributesSelect: (page: Page) => page.locator('button[data-id="choice_attributes"]'),
    attributesSelectOption: (page: Page, attributeText: string) => 
      page.locator(`#bs-select-5 .dropdown-item`).filter({ hasText: attributeText }).first(),
    
    // Product price + stock Section
    discountTypeSelect: (page: Page) => page.locator('select[name="discount_type"]').locator('..').locator('button.dropdown-toggle'),
    discountTypeOption: (page: Page, type: 'Flat' | 'Percent') => 
      page.locator(`#bs-select-6 .dropdown-item`).filter({ hasText: type }).first(),
    
    // Product Description Section
    descriptionEditor: (page: Page) => page.locator('.note-editable'),
    
    // PDF Specification Section
    pdfUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="document"]'),
    pdfBrowse: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="document"] .input-group-text'),
    
    // SEO Meta Tags Section
    metaImageUpload: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"]').nth(2),
    metaImageBrowse: (page: Page) => page.locator('div[data-toggle="aizuploader"][data-type="image"]').nth(2).locator('.input-group-text'),
    
    // Right Sidebar - Shipping Configuration (Tái sử dụng reusable locators)
    stockVisibilityQuantityLabel: (page: Page) => getRadioLabel(page, 'stock_visibility_state', 'quantity'),
    stockVisibilityTextLabel: (page: Page) => getRadioLabel(page, 'stock_visibility_state', 'text'),
    stockVisibilityHideLabel: (page: Page) => getRadioLabel(page, 'stock_visibility_state', 'hide'),
    cashOnDeliveryLabel: (page: Page) => getAizSwitchLabel(page, 'cash_on_delivery'),
    freeShippingLabel: (page: Page) => page.locator('label.aiz-switch').filter({ has: page.locator('input[name="shipping_type"][value="free"]') }),
    flatRateLabel: (page: Page) => page.locator('label.aiz-switch').filter({ has: page.locator('input[name="shipping_type"][value="flat_rate"]') }),
    isQuantityMultipliedLabel: (page: Page) => getAizSwitchLabel(page, 'is_quantity_multiplied'),
    featuredLabel: (page: Page) => getAizSwitchLabel(page, 'featured'),
    todaysDealLabel: (page: Page) => getAizSwitchLabel(page, 'todays_deal'),
    flashDealSelect: (page: Page) => page.locator('button[data-id="flash_deal"]'),
    flashDealOption: (page: Page, dealText: string) => 
      page.locator(`#bs-select-7 .dropdown-item`).filter({ hasText: dealText }).first(),
    flashDiscountTypeSelect: (page: Page) => page.locator('button[data-id="flash_discount_type"]'),
    flashDiscountTypeOption: (page: Page, type: 'Flat' | 'Percent') => 
      page.locator(`#bs-select-8 .dropdown-item`).filter({ hasText: type }).first(),
    taxTypeSelect: (page: Page) => page.locator('select[name="tax_type[]"]').locator('..').locator('button.dropdown-toggle'),
    taxTypeOption: (page: Page, type: 'Flat' | 'Percent') => 
      page.locator(`#bs-select-4 .dropdown-item`).filter({ hasText: type }).first(),
    } as const;
  })();

  public element = this.createLocatorGetter(this.pageLocators);
  public readonly sections: ReturnType<CMSAddNewProductPage['createSections']>;

  constructor(page: Page, viewportType: ViewportType = 'desktop') {
    super(page, viewportType);
    this.sections = this.createSections();
  }

  /**
   * Navigate đến trang Add New Product
   */
  async goto() {
    await this.navigateTo('/admin/products/create');
  }

  /**
   * Verify trang Add New Product đã load đúng
   */
  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/products\/create/);
    await expect(this.element('pageTitle')).toBeVisible();
    await expect(this.element('form')).toBeVisible();
    await expect(this.element('productNameInput')).toBeVisible();
  }

  // ========== Helper methods (shared across sections) ==========
  /**
   * Mở modal upload và chọn file từ danh sách có sẵn
   * @param browseButtonLocator - Locator của browse button (galleryImagesBrowse hoặc thumbnailImageBrowse)
   * @param fileIndex - Index của file cần chọn (0 = file đầu tiên)
   */
  private async selectImageFromModal(browseButtonLocator: any, fileIndex: number = 0) {
    await browseButtonLocator.scrollIntoViewIfNeeded();
    await expect(browseButtonLocator).toBeVisible();
    await this.clickWithLog(browseButtonLocator);
    
    const modal = this.element('uploadModal');
    await expect(modal).toBeVisible();
    
    const selectFileTab = this.element('uploadModalSelectFileTab');
    // Kiểm tra class 'active' bằng cách đọc attribute class
    const classAttr = await selectFileTab.getAttribute('class');
    const isActive = classAttr?.includes('active') ?? false;
    if (!isActive) {
      await this.clickWithLog(selectFileTab);
    }
    
    const fileCardGetter = this.element('uploadModalFileCardByIndex');
    const fileCard = fileCardGetter(fileIndex);
    await expect(fileCard).toBeVisible();
    await fileCard.scrollIntoViewIfNeeded();
    await this.clickWithLog(fileCard);
    
    const addFilesButton = this.element('uploadModalAddFilesButton');
    await expect(addFilesButton).toBeVisible();
    await this.clickWithLog(addFilesButton);
    
    await expect(modal).toBeHidden({ timeout: 10000 });
  }

  /**
   * Upload file mới từ modal (tab Upload New)
   * @param browseButtonLocator - Locator của browse button
   * @param filePath - Đường dẫn file cần upload
   */
  private async uploadNewImageFromModal(browseButtonLocator: any, filePath: string) {
    await browseButtonLocator.scrollIntoViewIfNeeded();
    await expect(browseButtonLocator).toBeVisible();
    await this.clickWithLog(browseButtonLocator);
    
    const modal = this.element('uploadModal');
    await expect(modal).toBeVisible();
    
    const uploadNewTab = this.element('uploadModalUploadNewTab');
    await expect(uploadNewTab).toBeVisible();
    await this.clickWithLog(uploadNewTab);
    
    const uploadInput = this.element('uploadModalUploadInput');
    await expect(uploadInput).toBeVisible();
    await uploadInput.setInputFiles(filePath);
    
    const addFilesButton = this.element('uploadModalAddFilesButton');
    await expect(addFilesButton).toBeVisible();
    await this.clickWithLog(addFilesButton);
    
    await expect(modal).toBeHidden({ timeout: 10000 });
  }

  /**
   * Submit form với Save & Unpublish
   */
  async saveUnpublish() {
    await this.clickWithLog(this.element('saveUnpublishButton'));
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Submit form với Save & Publish
   */
  async savePublish() {
    await this.clickWithLog(this.element('savePublishButton'));
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Điền thông tin sản phẩm cơ bản (required fields)
   */
  async fillBasicProductInfo(data: {
    name: string;
    category?: string; // Optional - nếu không có sẽ chọn category đầu tiên
    unit: string;
    minQty: number;
    unitPrice: number;
    quantity: number;
  }) {
    await this.sections.general.fillProductName(data.name);
    
    // Nếu có category thì chọn, không thì chọn category đầu tiên
    if (data.category) {
      await this.sections.general.selectCategory(data.category);
    } else {
      await this.sections.general.selectFirstCategory();
    }
    
    await this.sections.general.fillUnit(data.unit);
    await this.sections.general.fillMinQty(data.minQty);
    await this.sections.priceAndStock.fillUnitPrice(data.unitPrice);
    await this.sections.priceAndStock.fillQuantity(data.quantity);
  }

  // ========== Public Facade Methods (delegate to sections - không duplicate logic) ==========
  // General Tab
  async fillProductName(name: string) { return this.sections.general.fillProductName(name); }
  async selectFirstCategory() { return this.sections.general.selectFirstCategory(); }
  async selectCategory(categoryText: string) { return this.sections.general.selectCategory(categoryText); }
  async selectFirstBrand() { return this.sections.general.selectFirstBrand(); }
  async selectBrand(brandText: string) { return this.sections.general.selectBrand(brandText); }
  async fillUnit(unit: string) { return this.sections.general.fillUnit(unit); }
  async fillWeight(weight: number) { return this.sections.general.fillWeight(weight); }
  async fillMinQty(qty: number) { return this.sections.general.fillMinQty(qty); }
  async fillTags(tags: string[]) { return this.sections.general.fillTags(tags); }
  async fillBarcode(barcode: string) { return this.sections.general.fillBarcode(barcode); }
  async fillDescription(description: string) { return this.sections.general.fillDescription(description); }
  async toggleFeatured(enabled: boolean) { return this.sections.general.toggleFeatured(enabled); }
  async toggleTodaysDeal(enabled: boolean) { return this.sections.general.toggleTodaysDeal(enabled); }
  async selectFlashDeal(dealText: string) { return this.sections.general.selectFlashDeal(dealText); }
  async fillFlashDiscount(discount: number) { return this.sections.general.fillFlashDiscount(discount); }
  async selectFlashDiscountType(type: 'Flat' | 'Percent') { return this.sections.general.selectFlashDiscountType(type); }
  async fillTax(tax: number) { return this.sections.general.fillTax(tax); }
  async selectTaxType(type: 'Flat' | 'Percent') { return this.sections.general.selectTaxType(type); }

  // Files & Media Tab
  async uploadGalleryImages(fileIndex: number = 0) { return this.sections.filesAndMedia.uploadGalleryImages(fileIndex); }
  async uploadGalleryImagesFromFile(filePath: string) { return this.sections.filesAndMedia.uploadGalleryImagesFromFile(filePath); }
  async uploadThumbnailImage(fileIndex: number = 0) { return this.sections.filesAndMedia.uploadThumbnailImage(fileIndex); }
  async uploadThumbnailImageFromFile(filePath: string) { return this.sections.filesAndMedia.uploadThumbnailImageFromFile(filePath); }
  async selectVideoProvider(provider: 'Youtube' | 'Dailymotion' | 'Vimeo') { return this.sections.filesAndMedia.selectVideoProvider(provider); }
  async fillVideoLink(link: string) { return this.sections.filesAndMedia.fillVideoLink(link); }
  async uploadPDF(filePath: string) { return this.sections.filesAndMedia.uploadPDF(filePath); }

  // Price & Stock Tab
  async fillUnitPrice(price: number) { return this.sections.priceAndStock.fillUnitPrice(price); }
  async fillDiscountDateRange(startDate: string, endDate: string) { return this.sections.priceAndStock.fillDiscountDateRange(startDate, endDate); }
  async fillDiscount(discount: number) { return this.sections.priceAndStock.fillDiscount(discount); }
  async selectDiscountType(type: 'Flat' | 'Percent') { return this.sections.priceAndStock.selectDiscountType(type); }
  async fillQuantity(qty: number) { return this.sections.priceAndStock.fillQuantity(qty); }
  async fillSKU(sku: string) { return this.sections.priceAndStock.fillSKU(sku); }
  async fillExternalLink(link: string) { return this.sections.priceAndStock.fillExternalLink(link); }
  async fillExternalLinkBtn(text: string) { return this.sections.priceAndStock.fillExternalLinkBtn(text); }
  async toggleColorsActive(enabled: boolean) { return this.sections.priceAndStock.toggleColorsActive(enabled); }
  async selectColors(colorTexts: string[]) { return this.sections.priceAndStock.selectColors(colorTexts); }
  async selectAttributes(attributeTexts: string[]) { return this.sections.priceAndStock.selectAttributes(attributeTexts); }
  async fillLowStockQuantity(qty: number) { return this.sections.priceAndStock.fillLowStockQuantity(qty); }
  async selectStockVisibility(state: 'quantity' | 'text' | 'hide') { return this.sections.priceAndStock.selectStockVisibility(state); }

  // SEO Tab
  async fillMetaTitle(title: string) { return this.sections.seo.fillMetaTitle(title); }
  async fillMetaDescription(description: string) { return this.sections.seo.fillMetaDescription(description); }
  async uploadMetaImage(filePath: string) { return this.sections.seo.uploadMetaImage(filePath); }

  // Shipping Tab
  async toggleCashOnDelivery(enabled: boolean) { return this.sections.shipping.toggleCashOnDelivery(enabled); }
  async toggleFreeShipping(enabled: boolean) { return this.sections.shipping.toggleFreeShipping(enabled); }
  async toggleFlatRate(enabled: boolean) { return this.sections.shipping.toggleFlatRate(enabled); }
  async fillFlatShippingCost(cost: number) { return this.sections.shipping.fillFlatShippingCost(cost); }
  async toggleIsQuantityMultiplied(enabled: boolean) { return this.sections.shipping.toggleIsQuantityMultiplied(enabled); }
  async fillEstShippingDays(days: number) { return this.sections.shipping.fillEstShippingDays(days); }

  // Warranty Tab
  async toggleHasWarranty(enabled: boolean) { return this.sections.warranty.toggleHasWarranty(enabled); }
  async selectWarranty(warrantyText: string) { return this.sections.warranty.selectWarranty(warrantyText); }

  // Frequently Bought Tab
  async selectFrequentlyBoughtSelectionType(type: 'product' | 'category') { return this.sections.frequentlyBought.selectSelectionType(type); }
  async selectFrequentlyBoughtCategory(categoryText: string) { return this.sections.frequentlyBought.selectCategory(categoryText); }

  // ========== Section factories ==========
  private createSections() {
    // Lưu reference đến this để sections có thể access trực tiếp
    const self = this;

    // Helper: bảo đảm tab đang active trước khi thao tác
    const ensureTab = async (
      tab:
        | 'general'
        | 'files_and_media'
        | 'price_and_stocks'
        | 'seo'
        | 'shipping'
        | 'warranty'
        | 'frequenty_bought_product'
    ) => {
      const tabMap = {
        general: self.element('tabGeneral'),
        files_and_media: self.element('tabFilesMedia'),
        price_and_stocks: self.element('tabPriceStock'),
        seo: self.element('tabSEO'),
        shipping: self.element('tabShipping'),
        warranty: self.element('tabWarranty'),
        frequenty_bought_product: self.element('tabFrequentlyBought'),
      } as const;

      const tabLocator = tabMap[tab];
      const selected = await tabLocator.getAttribute('aria-selected');
      if (selected !== 'true') {
        await self.clickWithLog(tabLocator);
      }
    };

    // Product Information Section
    const infoMethods = {
      fillProductName: async (name: string) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('productNameInput'), name);
      },
      selectFirstCategory: async () => {
        await ensureTab('general');
        const firstRadio = self.page.locator('input[name="category_id"]').first();
        await expect(firstRadio).toBeVisible();
        await firstRadio.scrollIntoViewIfNeeded();
        if (!(await firstRadio.isChecked())) {
          await firstRadio.click();
        }
      },
      selectCategory: async (text: string) => {
        await ensureTab('general');
        // Tìm label chứa text category, sau đó tìm radio button ngay sau label đó
        // Cấu trúc: <label><input checkbox> Category Name</label><input radio>
        const categoryLabel = self.page
          .locator('label')
          .filter({ hasText: new RegExp(text, 'i') })
          .filter({ has: self.page.locator('input[name="category_ids[]"]') })
          .first();
        
        await expect(categoryLabel).toBeVisible();
        await categoryLabel.scrollIntoViewIfNeeded();
        
        // Tìm radio button ngay sau label này (sibling)
        const targetRadio = categoryLabel.locator('..').locator('input[name="category_id"]').first();
        await expect(targetRadio).toBeVisible();
        
        if (!(await targetRadio.isChecked())) {
          await targetRadio.click();
        }
      },
      selectFirstBrand: async () => {
        await ensureTab('general');
        const selectElement = self.page.locator('select#brand_id');
        const options = selectElement.locator('option:not([value=""])');
        if (await options.count()) {
          const value = await options.first().getAttribute('value');
          if (value) {
            await selectElement.selectOption({ value });
            // Playwright's selectOption() tự động trigger change event
            return;
          }
        }
        const selectButton = self.element('brandSelect');
        await expect(selectButton).toBeVisible();
        await self.clickWithLog(selectButton);
        const firstOption = self.page.locator('#bs-select-2 .dropdown-item, #bs-select-2 li a').first();
        await expect(firstOption).toBeVisible();
        await self.clickWithLog(firstOption);
      },
      selectBrand: async (text: string) => {
        await ensureTab('general');
        await self.helpers.selectBootstrapOption(self.element('brandSelect'), text);
      },
      fillUnit: async (unit: string) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('unitInput'), unit);
      },
      fillWeight: async (weight: number) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('weightInput'), weight.toString());
      },
      fillMinQty: async (qty: number) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('minQtyInput'), qty.toString());
      },
      fillTags: async (tags: string[]) => {
        await ensureTab('general');
        const tagifyElement = self.element('tagsTagify');
        const tagifyInput = self.element('tagsTagifyInput');
        await expect(tagifyElement).toBeVisible();
        await expect(tagifyInput).toBeVisible();
        for (const tag of tags) {
          await tagifyInput.click();
          // Clear content bằng keyboard shortcuts (native Playwright)
          await tagifyInput.press('Control+A');
          await tagifyInput.press('Delete');
          await tagifyInput.pressSequentially(tag, { delay: 50 });
          await tagifyInput.press('Enter');
        }
      },
      fillBarcode: async (barcode: string) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('barcodeInput'), barcode);
      },
    };
    const info = {
      ...infoMethods,
      fill: async (data: {
        name?: string;
        category?: string | null; // null = chọn category đầu tiên
        brand?: string | null; // null = chọn brand đầu tiên
        unit?: string;
        weight?: number;
        minQty?: number;
        tags?: string[];
        barcode?: string;
      }) => {
        if (data.name) await infoMethods.fillProductName(data.name);
        if (data.category !== undefined) {
          if (data.category === null) await infoMethods.selectFirstCategory();
          else await infoMethods.selectCategory(data.category);
        }
        if (data.brand !== undefined) {
          if (data.brand === null) await infoMethods.selectFirstBrand();
          else await infoMethods.selectBrand(data.brand);
        }
        if (data.unit) await infoMethods.fillUnit(data.unit);
        if (data.weight !== undefined) await infoMethods.fillWeight(data.weight);
        if (data.minQty !== undefined) await infoMethods.fillMinQty(data.minQty);
        if (data.tags && data.tags.length > 0) await infoMethods.fillTags(data.tags);
        if (data.barcode) await infoMethods.fillBarcode(data.barcode);
      },
    };

    // Product Images Section
    const images = {
      uploadGalleryImages: async (fileIndex: number = 0) => {
        await ensureTab('files_and_media');
        await self.selectImageFromModal(self.element('galleryImagesBrowse'), fileIndex);
      },
      uploadGalleryImagesFromFile: async (filePath: string) => {
        await ensureTab('files_and_media');
        await self.uploadNewImageFromModal(self.element('galleryImagesBrowse'), filePath);
      },
      uploadThumbnailImage: async (fileIndex: number = 0) => {
        await ensureTab('files_and_media');
        await self.selectImageFromModal(self.element('thumbnailImageBrowse'), fileIndex);
      },
      uploadThumbnailImageFromFile: async (filePath: string) => {
        await ensureTab('files_and_media');
        await self.uploadNewImageFromModal(self.element('thumbnailImageBrowse'), filePath);
      },
    };

    // Product Videos Section
    const videosMethods = {
      selectVideoProvider: async (provider: 'Youtube' | 'Dailymotion' | 'Vimeo') => {
        await ensureTab('files_and_media');
        // Video provider select không còn trong UI mới, skip nếu không tìm thấy
        const videoProviderButton = self.element('videoProviderSelect');
        const count = await videoProviderButton.count();
        if (count === 0) {
          console.log(`[Video Provider] Select không tồn tại trong UI mới, bỏ qua chọn provider "${provider}"`);
          return;
        }
        await self.helpers.selectBootstrapOption(videoProviderButton, provider);
      },
      fillVideoLink: async (link: string) => {
        await ensureTab('files_and_media');
        // Tìm input video_link đầu tiên
        const videoLinkInput = self.page.locator('input[name="video_link[]"]').first();
        await expect(videoLinkInput).toBeVisible();
        await self.fillWithLog(videoLinkInput, link);
      },
    };
    const videos = {
      ...videosMethods,
      fill: async (data: { provider?: 'Youtube' | 'Dailymotion' | 'Vimeo'; link?: string }) => {
        if (data.provider) await videosMethods.selectVideoProvider(data.provider);
        if (data.link) await videosMethods.fillVideoLink(data.link);
      },
    };

    // Product Variation Section
    const variations = {
      toggleColorsActive: async (enabled: boolean) => {
        await ensureTab('price_and_stocks');
        const checkbox = self.element('colorsActiveCheckbox');
        const isChecked = await checkbox.isChecked();
        if (isChecked !== enabled) {
          await self.element('colorsActiveLabel').click();
        }
      },
      selectColors: async (colorTexts: string[]) => {
        return await self.executeWithLog(async () => {
          await ensureTab('price_and_stocks');
          
          const colorsCheckbox = self.element('colorsActiveCheckbox');
          const isEnabled = await colorsCheckbox.isChecked();
          
          if (!isEnabled) {
            throw new Error('Colors chưa được bật. Hãy gọi toggleColorsActive(true) trước.');
          }
          
          const selectElement = self.page.locator('select[name="colors[]"]');
          const selectCount = await selectElement.count();
          
          if (selectCount > 0) {
            const colorValues: string[] = [];
            const options = selectElement.locator('option');
            const optionCount = await options.count();
            
            for (const colorText of colorTexts) {
              for (let i = 0; i < optionCount; i++) {
                const option = options.nth(i);
                const text = await option.textContent();
                if (text && text.trim().toLowerCase().includes(colorText.toLowerCase())) {
                  const value = await option.getAttribute('value');
                  if (value) {
                    colorValues.push(value);
                    break;
                  }
                }
              }
            }
            
            if (colorValues.length > 0) {
              await selectElement.selectOption(colorValues);
              return;
            }
          }
          
          // Sử dụng helper cho multiple select
          const selectButton = self.element('colorsSelect');
          await self.helpers.selectBootstrapOptions(selectButton, colorTexts);
        }, `[selectColors] Chọn colors: ${colorTexts.join(', ')}`);
      },
      selectAttributes: async (attributeTexts: string[]) => {
        return await self.executeWithLog(async () => {
          await ensureTab('price_and_stocks');
          
          const selectElement = self.page.locator('select[name="choice_attributes[]"]');
          const selectCount = await selectElement.count();
          
          if (selectCount > 0) {
            const attributeValues: string[] = [];
            const options = selectElement.locator('option');
            const optionCount = await options.count();
            
            for (const attrText of attributeTexts) {
              for (let i = 0; i < optionCount; i++) {
                const option = options.nth(i);
                const text = await option.textContent();
                if (text && text.trim().toLowerCase().includes(attrText.toLowerCase())) {
                  const value = await option.getAttribute('value');
                  if (value) {
                    attributeValues.push(value);
                    break;
                  }
                }
              }
            }
            
            if (attributeValues.length > 0) {
              await selectElement.selectOption(attributeValues);
              return;
            }
          }
          
          // Sử dụng helper cho multiple select
          const selectButton = self.element('attributesSelect');
          await self.helpers.selectBootstrapOptions(selectButton, attributeTexts);
        }, `[selectAttributes] Chọn attributes: ${attributeTexts.join(', ')}`);
      },
      fill: async (data: { colorsActive?: boolean; colors?: string[]; attributes?: string[] }) => {
        if (data.colorsActive !== undefined) await variations.toggleColorsActive(data.colorsActive);
        if (data.colors && data.colors.length > 0) await variations.selectColors(data.colors);
        if (data.attributes && data.attributes.length > 0) await variations.selectAttributes(data.attributes);
      },
    };

    // Product price + stock Section
    const pricing = {
      fillUnitPrice: async (price: number) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('unitPriceInput'), price.toString());
      },
      fillDiscountDateRange: async (startDate: string, endDate: string) => {
        await ensureTab('price_and_stocks');
        const dateRange = `${startDate} to ${endDate}`;
        await self.fillWithLog(self.element('discountDateRangeInput'), dateRange);
      },
      fillDiscount: async (discount: number) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('discountInput'), discount.toString());
      },
      selectDiscountType: async (type: 'Flat' | 'Percent') => {
        await ensureTab('price_and_stocks');
        await self.helpers.selectBootstrapOption(self.element('discountTypeSelect'), type);
      },
      fillQuantity: async (qty: number) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('quantityInput'), qty.toString());
      },
      fillSKU: async (sku: string) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('skuInput'), sku);
      },
      fillExternalLink: async (link: string) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('externalLinkInput'), link);
      },
      fillExternalLinkBtn: async (text: string) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('externalLinkBtnInput'), text);
      },
      fill: async (data: {
        unitPrice?: number;
        discountDateRange?: { startDate: string; endDate: string };
        discount?: number;
        discountType?: 'Flat' | 'Percent';
        quantity?: number;
        sku?: string;
        externalLink?: string;
        externalLinkBtn?: string;
      }) => {
        if (data.unitPrice !== undefined) await pricing.fillUnitPrice(data.unitPrice);
        if (data.discountDateRange) await pricing.fillDiscountDateRange(data.discountDateRange.startDate, data.discountDateRange.endDate);
        if (data.discount !== undefined) await pricing.fillDiscount(data.discount);
        if (data.discountType) await pricing.selectDiscountType(data.discountType);
        if (data.quantity !== undefined) await pricing.fillQuantity(data.quantity);
        if (data.sku) await pricing.fillSKU(data.sku);
        if (data.externalLink) await pricing.fillExternalLink(data.externalLink);
        if (data.externalLinkBtn) await pricing.fillExternalLinkBtn(data.externalLinkBtn);
      },
    };

    // Product Description Section
    const description = {
      fillDescription: async (description: string) => {
        await ensureTab('general');
        await self.element('descriptionEditor').fill(description);
      },
    };

    // PDF Specification Section
    const pdf = {
      uploadPDF: async (filePath: string) => {
        await ensureTab('files_and_media');
        const fileInput = self.page.locator('div[data-toggle="aizuploader"][data-type="document"] input[type="file"]');
        await fileInput.setInputFiles(filePath);
      },
    };

    // SEO Meta Tags Section
    const seoMethods = {
      fillMetaTitle: async (title: string) => {
        await ensureTab('seo');
        await self.fillWithLog(self.element('metaTitleInput'), title);
      },
      fillMetaDescription: async (description: string) => {
        await ensureTab('seo');
        await self.fillWithLog(self.element('metaDescriptionTextarea'), description);
      },
      uploadMetaImage: async (filePath: string) => {
        await ensureTab('seo');
        const fileInput = self.page.locator('div[data-toggle="aizuploader"][data-type="image"]').nth(2).locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);
      },
    };
    const seo = {
      ...seoMethods,
      fill: async (data: { metaTitle?: string; metaDescription?: string; metaImage?: string }) => {
        if (data.metaTitle) await seoMethods.fillMetaTitle(data.metaTitle);
        if (data.metaDescription) await seoMethods.fillMetaDescription(data.metaDescription);
        if (data.metaImage) await seoMethods.uploadMetaImage(data.metaImage);
      },
    };

    // Stock Section (Price & Stock tab)
    const stock = {
      fillLowStockQuantity: async (qty: number) => {
        await ensureTab('price_and_stocks');
        await self.fillWithLog(self.element('lowStockQuantityInput'), qty.toString());
      },
      selectStockVisibility: async (state: 'quantity' | 'text' | 'hide') => {
        await ensureTab('price_and_stocks');
        const radioMap = {
          quantity: self.element('stockVisibilityQuantityRadio'),
          text: self.element('stockVisibilityTextRadio'),
          hide: self.element('stockVisibilityHideRadio'),
        };
        
        const labelMap = {
          quantity: self.element('stockVisibilityQuantityLabel'),
          text: self.element('stockVisibilityTextLabel'),
          hide: self.element('stockVisibilityHideLabel'),
        };
        
        const targetRadio = radioMap[state];
        const targetLabel = labelMap[state];
        
        const isChecked = await targetRadio.isChecked();
        
        if (!isChecked) {
          await targetLabel.scrollIntoViewIfNeeded();
          await self.clickWithLog(targetLabel);
        } else {
          console.log(`[Stock Visibility] Radio "${state}" đã được chọn, bỏ qua click.`);
        }
      },
      fill: async (data: {
        lowStockQuantity?: number;
        stockVisibilityState?: 'quantity' | 'text' | 'hide';
      }) => {
        if (data.lowStockQuantity !== undefined) await stock.fillLowStockQuantity(data.lowStockQuantity);
        if (data.stockVisibilityState) await stock.selectStockVisibility(data.stockVisibilityState);
      },
    };

    // Status Section (General tab)
    const status = {
      toggleFeatured: async (enabled: boolean) => {
        await ensureTab('general');
        const checkbox = self.element('featuredCheckbox');
        const isChecked = await checkbox.isChecked();
        if (isChecked !== enabled) {
          await self.element('featuredLabel').click();
        }
      },
      toggleTodaysDeal: async (enabled: boolean) => {
        await ensureTab('general');
        const checkbox = self.element('todaysDealCheckbox');
        const isChecked = await checkbox.isChecked();
        if (isChecked !== enabled) {
          await self.element('todaysDealLabel').click();
        }
      },
      fill: async (data: {
        featured?: boolean;
        todaysDeal?: boolean;
      }) => {
        if (data.featured !== undefined) await status.toggleFeatured(data.featured);
        if (data.todaysDeal !== undefined) await status.toggleTodaysDeal(data.todaysDeal);
      },
    };

    // Flash Deal Section (General tab)
    const flashDeal = {
      selectFlashDeal: async (dealText: string) => {
        await ensureTab('general');
        await self.helpers.selectBootstrapOption(self.element('flashDealSelect'), dealText);
      },
      fillFlashDiscount: async (discount: number) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('flashDiscountInput'), discount.toString());
      },
      selectFlashDiscountType: async (type: 'Flat' | 'Percent') => {
        await ensureTab('general');
        await self.helpers.selectBootstrapOption(self.element('flashDiscountTypeSelect'), type);
      },
      fill: async (data: {
        flashDeal?: string;
        flashDiscount?: number;
        flashDiscountType?: 'Flat' | 'Percent';
      }) => {
        if (data.flashDeal) await flashDeal.selectFlashDeal(data.flashDeal);
        if (data.flashDiscount !== undefined) await flashDeal.fillFlashDiscount(data.flashDiscount);
        if (data.flashDiscountType) await flashDeal.selectFlashDiscountType(data.flashDiscountType);
      },
    };

    // Tax Section (General tab)
    const tax = {
      fillTax: async (taxValue: number) => {
        await ensureTab('general');
        await self.fillWithLog(self.element('taxInput'), taxValue.toString());
      },
      selectTaxType: async (type: 'Flat' | 'Percent') => {
        await ensureTab('general');
        await self.helpers.selectBootstrapOption(self.element('taxTypeSelect'), type);
      },
      fill: async (data: {
        tax?: number;
        taxType?: 'Flat' | 'Percent';
      }) => {
        if (data.tax !== undefined) await tax.fillTax(data.tax);
        if (data.taxType) await tax.selectTaxType(data.taxType);
      },
    };

    // Shipping Section (Shipping tab)
    const shipping = {
      // Shipping Configuration subsection
      toggleCashOnDelivery: async (enabled: boolean) => {
        await ensureTab('shipping');
        const checkbox = self.element('cashOnDeliveryCheckbox');
        const isChecked = await checkbox.isChecked();
        if (isChecked !== enabled) {
          await self.element('cashOnDeliveryLabel').click();
        }
      },
      toggleFreeShipping: async (enabled: boolean) => {
        await ensureTab('shipping');
        const radio = self.element('freeShippingRadio');
        const isChecked = await radio.isChecked();
        if (isChecked !== enabled) {
          await self.element('freeShippingLabel').click();
        }
      },
      toggleFlatRate: async (enabled: boolean) => {
        await ensureTab('shipping');
        const radio = self.element('flatRateRadio');
        const isChecked = await radio.isChecked();
        if (isChecked !== enabled) {
          await self.element('flatRateLabel').click();
        }
      },
      fillFlatShippingCost: async (cost: number) => {
        await ensureTab('shipping');
        await self.fillWithLog(self.element('flatShippingCostInput'), cost.toString());
      },
      toggleIsQuantityMultiplied: async (enabled: boolean) => {
        await ensureTab('shipping');
        const checkbox = self.element('isQuantityMultipliedCheckbox');
        const isChecked = await checkbox.isChecked();
        if (isChecked !== enabled) {
          await self.element('isQuantityMultipliedLabel').click();
        }
      },
      // Estimate Shipping Time subsection
      fillEstShippingDays: async (days: number) => {
        await ensureTab('shipping');
        await self.fillWithLog(self.element('estShippingDaysInput'), days.toString());
      },
      fill: async (data: {
        cashOnDelivery?: boolean;
        freeShipping?: boolean;
        flatRate?: boolean;
        flatShippingCost?: number;
        isQuantityMultiplied?: boolean;
        estShippingDays?: number;
      }) => {
        if (data.cashOnDelivery !== undefined) await shipping.toggleCashOnDelivery(data.cashOnDelivery);
        if (data.freeShipping !== undefined) await shipping.toggleFreeShipping(data.freeShipping);
        if (data.flatRate !== undefined) await shipping.toggleFlatRate(data.flatRate);
        if (data.flatShippingCost !== undefined) await shipping.fillFlatShippingCost(data.flatShippingCost);
        if (data.isQuantityMultiplied !== undefined) await shipping.toggleIsQuantityMultiplied(data.isQuantityMultiplied);
        if (data.estShippingDays !== undefined) await shipping.fillEstShippingDays(data.estShippingDays);
      },
    };

    // General Tab - tổng hợp tất cả sections trong General tab
    const general = {
      // Product Information subsection
      ...info,
      // Description subsection
      fillDescription: description.fillDescription,
      // Status subsection
      toggleFeatured: status.toggleFeatured,
      toggleTodaysDeal: status.toggleTodaysDeal,
      // Flash Deal subsection
      selectFlashDeal: flashDeal.selectFlashDeal,
      fillFlashDiscount: flashDeal.fillFlashDiscount,
      selectFlashDiscountType: flashDeal.selectFlashDiscountType,
      // Tax subsection
      fillTax: tax.fillTax,
      selectTaxType: tax.selectTaxType,
      // Bulk fill cho General tab
      fill: async (data: {
        // Product Information
        name?: string;
        category?: string | null;
        brand?: string | null;
        unit?: string;
        weight?: number;
        minQty?: number;
        tags?: string[];
        barcode?: string;
        // Description
        description?: string;
        // Status
        featured?: boolean;
        todaysDeal?: boolean;
        // Flash Deal
        flashDeal?: string;
        flashDiscount?: number;
        flashDiscountType?: 'Flat' | 'Percent';
        // Tax
        tax?: number;
        taxType?: 'Flat' | 'Percent';
      }) => {
        if (data.name || data.category !== undefined || data.brand !== undefined || data.unit || data.weight !== undefined || data.minQty !== undefined || data.tags || data.barcode) {
          await info.fill({
            name: data.name,
            category: data.category,
            brand: data.brand,
            unit: data.unit,
            weight: data.weight,
            minQty: data.minQty,
            tags: data.tags,
            barcode: data.barcode,
          });
        }
        if (data.description) await description.fillDescription(data.description);
        if (data.featured !== undefined || data.todaysDeal !== undefined) {
          await status.fill({ featured: data.featured, todaysDeal: data.todaysDeal });
        }
        if (data.flashDeal || data.flashDiscount !== undefined || data.flashDiscountType) {
          await flashDeal.fill({ flashDeal: data.flashDeal, flashDiscount: data.flashDiscount, flashDiscountType: data.flashDiscountType });
        }
        if (data.tax !== undefined || data.taxType) {
          await tax.fill({ tax: data.tax, taxType: data.taxType });
        }
      },
    };

    // Files & Media Tab
    const filesAndMedia = {
      // Images subsection
      uploadGalleryImages: images.uploadGalleryImages,
      uploadGalleryImagesFromFile: images.uploadGalleryImagesFromFile,
      uploadThumbnailImage: images.uploadThumbnailImage,
      uploadThumbnailImageFromFile: images.uploadThumbnailImageFromFile,
      // Videos subsection
      selectVideoProvider: videosMethods.selectVideoProvider,
      fillVideoLink: videosMethods.fillVideoLink,
      // PDF subsection
      uploadPDF: pdf.uploadPDF,
      // Bulk fill cho Files & Media tab
      fill: async (data: {
        galleryImages?: number | string; // index hoặc filePath
        thumbnailImage?: number | string;
        videoProvider?: 'Youtube' | 'Dailymotion' | 'Vimeo';
        videoLink?: string;
        pdf?: string;
      }) => {
        if (data.galleryImages !== undefined) {
          if (typeof data.galleryImages === 'number') {
            await images.uploadGalleryImages(data.galleryImages);
          } else {
            await images.uploadGalleryImagesFromFile(data.galleryImages);
          }
        }
        if (data.thumbnailImage !== undefined) {
          if (typeof data.thumbnailImage === 'number') {
            await images.uploadThumbnailImage(data.thumbnailImage);
          } else {
            await images.uploadThumbnailImageFromFile(data.thumbnailImage);
          }
        }
        if (data.videoProvider || data.videoLink) {
          await videos.fill({ provider: data.videoProvider, link: data.videoLink });
        }
        if (data.pdf) await pdf.uploadPDF(data.pdf);
      },
    };

    // Price & Stock Tab
    const priceAndStock = {
      // Pricing subsection
      fillUnitPrice: pricing.fillUnitPrice,
      fillDiscountDateRange: pricing.fillDiscountDateRange,
      fillDiscount: pricing.fillDiscount,
      selectDiscountType: pricing.selectDiscountType,
      fillQuantity: pricing.fillQuantity,
      fillSKU: pricing.fillSKU,
      fillExternalLink: pricing.fillExternalLink,
      fillExternalLinkBtn: pricing.fillExternalLinkBtn,
      // Variations subsection
      toggleColorsActive: variations.toggleColorsActive,
      selectColors: variations.selectColors,
      selectAttributes: variations.selectAttributes,
      // Stock subsection
      fillLowStockQuantity: stock.fillLowStockQuantity,
      selectStockVisibility: stock.selectStockVisibility,
      // Bulk fill cho Price & Stock tab
      fill: async (data: {
        // Pricing
        unitPrice?: number;
        discountDateRange?: { startDate: string; endDate: string };
        discount?: number;
        discountType?: 'Flat' | 'Percent';
        quantity?: number;
        sku?: string;
        externalLink?: string;
        externalLinkBtn?: string;
        // Variations
        colorsActive?: boolean;
        colors?: string[];
        attributes?: string[];
        // Stock
        lowStockQuantity?: number;
        stockVisibilityState?: 'quantity' | 'text' | 'hide';
      }) => {
        if (data.unitPrice !== undefined || data.discountDateRange || data.discount !== undefined || data.discountType || data.quantity !== undefined || data.sku || data.externalLink || data.externalLinkBtn) {
          await pricing.fill({
            unitPrice: data.unitPrice,
            discountDateRange: data.discountDateRange,
            discount: data.discount,
            discountType: data.discountType,
            quantity: data.quantity,
            sku: data.sku,
            externalLink: data.externalLink,
            externalLinkBtn: data.externalLinkBtn,
          });
        }
        if (data.colorsActive !== undefined || data.colors || data.attributes) {
          await variations.fill({ colorsActive: data.colorsActive, colors: data.colors, attributes: data.attributes });
        }
        if (data.lowStockQuantity !== undefined || data.stockVisibilityState) {
          await stock.fill({ lowStockQuantity: data.lowStockQuantity, stockVisibilityState: data.stockVisibilityState });
        }
      },
    };

    // Warranty Tab
    const warranty = {
      toggleHasWarranty: async (enabled: boolean) => {
        await ensureTab('warranty');
        const checkbox = self.page.locator('input[name="has_warranty"]');
        const isChecked = await checkbox.isChecked();
        if (isChecked !== enabled) {
          const label = self.page.locator('label.aiz-switch').filter({ has: checkbox });
          await label.click();
        }
      },
      selectWarranty: async (warrantyText: string) => {
        await ensureTab('warranty');
        const warrantyButton = self.page.locator('button[data-id="warranty_id"]');
        await self.helpers.selectBootstrapOption(warrantyButton, warrantyText);
      },
      fill: async (data: {
        hasWarranty?: boolean;
        warranty?: string;
      }) => {
        if (data.hasWarranty !== undefined) await warranty.toggleHasWarranty(data.hasWarranty);
        if (data.warranty) await warranty.selectWarranty(data.warranty);
      },
    };

    // Frequently Bought Tab
    const frequentlyBought = {
      selectSelectionType: async (type: 'product' | 'category') => {
        await ensureTab('frequenty_bought_product');
        const radio = self.page.locator(`input[name="frequently_bought_selection_type"][value="${type}"]`);
        await expect(radio).toBeVisible();
        if (!(await radio.isChecked())) {
          await radio.click();
        }
      },
      selectCategory: async (categoryText: string) => {
        await ensureTab('frequenty_bought_product');
        await frequentlyBought.selectSelectionType('category');
        const categoryButton = self.page.locator('select[name="fq_bought_product_category_id"]').locator('..').locator('button.dropdown-toggle').first();
        await self.helpers.selectBootstrapOption(categoryButton, categoryText);
      },
      fill: async (data: {
        selectionType?: 'product' | 'category';
        category?: string;
      }) => {
        if (data.selectionType) await frequentlyBought.selectSelectionType(data.selectionType);
        if (data.category) await frequentlyBought.selectCategory(data.category);
      },
    };

    return { general, filesAndMedia, priceAndStock, seo, shipping, warranty, frequentlyBought };
  }
}

