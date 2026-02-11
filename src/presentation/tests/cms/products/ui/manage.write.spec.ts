import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';

/**
 * CMS Tất Cả Sản Phẩm - Tests Thay Đổi Dữ Liệu (Mutating)
 * Các tests này thay đổi dữ liệu (edit, delete) → phải chạy tuần tự
 * 
 * Sử dụng fixtures để:
 * - Tự động login (authedPage)
 * - Auto-inject page object với viewportType
 * - Auto-navigate và verify page loaded
 * 
 * Chạy: npx playwright test all-products-write.spec.ts --project=chromium
 */
test.describe('CMS Tất Cả Sản Phẩm - Mutating Tests', () => {
  // Chạy tuần tự để tránh conflict khi nhiều tests cùng edit/delete
  test.describe.configure({ mode: 'serial' });

  test('08. Thực hiện hành động trên dòng - clickRowAction()', async ({ allProductsPage, page }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    console.log(`[Demo] Clicking Edit action for: "${firstProductName}"`);
    await allProductsPage.editProduct(firstProductName);

    await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
    console.log(`[Demo] ✓ Successfully navigated to edit page`);
  });

  test('15. Demo quy trình hoàn chỉnh', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Complete Workflow Demo ===`);

    const allData = await allProductsPage.getDefaultTableData();
    console.log(`[Demo] Step 1: Found ${allData.length} products`);

    if (allData.length > 0) {
      const targetProduct = allData[0];
      console.log(`[Demo] Step 2: Target product:`, targetProduct.name);

      const row = await allProductsPage.findRowByFilters({
        name: targetProduct.name,
        published: targetProduct.published,
      });
      await expect(row).toBeVisible();
      console.log(`[Demo] Step 3: ✓ Found row`);

      const rowData = await allProductsPage.getRowDataByFilters(
        { name: targetProduct.name },
        ['name', 'addedBy', 'info', 'totalStock', 'todaysDeal', 'published', 'featured']
      );
      console.log(`[Demo] Step 4: Row data:`, rowData);

      console.log(`[Demo] Step 5: Clicking View action`);
      await allProductsPage.viewProduct(targetProduct.name);
      console.log(`[Demo] ✓ Complete workflow executed successfully`);
    }
  });

  test('19. Demo quy trình tìm kiếm xuyên trang hoàn chỉnh', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Complete Cross-Page Search Workflow ===`);

    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
        console.log(`[Demo] Target product: "${targetProduct}"`);

        const row = await allProductsPage.findRowByFiltersAcrossPages(
          { name: targetProduct },
          { maxPages: 5 }
        );
        await expect(row).toBeVisible();
        console.log(`[Demo] ✓ Found row`);

        const rowData = await allProductsPage.getRowDataByFiltersAcrossPages(
          { name: targetProduct },
          { maxPages: 5 },
          ['name', 'addedBy', 'info', 'totalStock', 'published', 'featured']
        );
        console.log(`[Demo] Row data:`, rowData);

        await allProductsPage.editProduct(targetProduct);
        await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
        console.log(`[Demo] ✓ Complete cross-page workflow executed successfully!`);
    } else {
      console.log(`[Demo] Skipping workflow test: Not enough data`);
    }
  });

  test('20. Chỉnh sửa sản phẩm theo tên - editProduct()', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Edit Product by Name Filter ===`);

    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    console.log(`[Demo] Target product: "${firstProductName}"`);

    await allProductsPage.editProduct(firstProductName);

    await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
    console.log(`[Demo] ✓ Successfully navigated to edit page`);
    
    const editPageTitle = page.locator('h1, h2, h3').filter({ hasText: /edit|update|product/i });
    const titleCount = await editPageTitle.count();
    if (titleCount > 0) {
      await expect(editPageTitle.first()).toBeVisible();
      console.log(`[Demo] ✓ Edit page loaded successfully`);
    }
  });

  test('21. Xóa một sản phẩm theo tên - deleteProduct()', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Delete Single Product by Name Filter ===`);

    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    console.log(`[Demo] Target product to delete: "${firstProductName}"`);

    const productNamesBefore = await allProductsPage.getColumnValues('name');
    const existsBefore = productNamesBefore.some((name) => name.includes(firstProductName));
    expect(existsBefore).toBe(true);
    console.log(`[Demo] ✓ Product exists before delete`);

    await allProductsPage.toggleRowCheckboxByName(firstProductName, true);
    
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    const checkbox = row.locator('input[type="checkbox"].check-one').first();
    await expect(checkbox).toBeChecked();
    console.log(`[Demo] ✓ Checkbox selected`);

    await allProductsPage.deleteProduct(firstProductName);

    await allProductsPage.waitForTableReady();
    await page.waitForTimeout(2000);

    const productNamesAfter = await allProductsPage.getColumnValues('name');
    const existsAfter = productNamesAfter.some((name) => name.includes(firstProductName));
    console.log(`[Demo] Product exists after delete: ${existsAfter}`);
    console.log(`[Demo] ✓ Delete action completed`);
  });

  test('22. Xóa hàng loạt nhiều sản phẩm - bulkDeleteProducts()', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Bulk Delete Multiple Products ===`);

    const productNames = await allProductsPage.getColumnValues('name');
    expect(productNames.length).toBeGreaterThan(0);
    
    const productsToDelete = productNames.slice(0, Math.min(2, productNames.length));
    console.log(`[Demo] Products to delete (${productsToDelete.length}):`, productsToDelete);

    const productNamesBefore = await allProductsPage.getColumnValues('name');
    productsToDelete.forEach((productName) => {
      const exists = productNamesBefore.some((name) => name.includes(productName));
      expect(exists).toBe(true);
    });
    console.log(`[Demo] ✓ All products exist before delete`);

    await allProductsPage.bulkDeleteProducts(productsToDelete);

    await allProductsPage.waitForTableReady();
    await page.waitForTimeout(2000);

    const productNamesAfter = await allProductsPage.getColumnValues('name');
    productsToDelete.forEach((productName) => {
      const exists = productNamesAfter.some((name) => name.includes(productName));
      console.log(`[Demo] Product "${productName}" exists after delete: ${exists}`);
    });
    console.log(`[Demo] ✓ Bulk delete action completed`);
  });

  test('23. Chỉnh sửa sản phẩm tìm thấy qua nhiều trang', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Edit Product Found Across Pages ===`);

    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
        console.log(`[Demo] Đã ở trang chứa product, thực hiện edit trực tiếp: "${targetProduct}"`);

        await allProductsPage.editProduct(targetProduct);
        await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
        console.log(`[Demo] ✓ Successfully edited product`);
    } else {
        console.log(`[Demo] Skipping test: Not enough data`);
    }
  });

  test('24. Xóa sản phẩm tìm thấy qua nhiều trang', async ({ allProductsPage, page }) => {
    console.log(`[Demo] === Delete Product Found Across Pages ===`);

    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
        console.log(`[Demo] Đã ở trang chứa product: "${targetProduct}"`);

        await allProductsPage.toggleRowCheckboxByName(targetProduct, true);
        
        const row = await allProductsPage.findRowByColumnValue('name', targetProduct);
        const checkbox = row.locator('input[type="checkbox"].check-one').first();
        await expect(checkbox).toBeChecked();
        console.log(`[Demo] ✓ Checkbox selected`);

        await allProductsPage.deleteProduct(targetProduct);

        await allProductsPage.waitForTableReady();
        await page.waitForTimeout(2000);
        console.log(`[Demo] ✓ Delete action completed`);
    } else {
        console.log(`[Demo] Skipping test: Not enough data`);
    }
  });
});
