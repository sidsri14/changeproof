import { test, expect } from '@playwright/test';

/**
 * Auto-Synthesized by ChangeProof (Meta Global AI Developer Hackathon)
 * Suite ID: suite_1793130895914
 * Generated At: 2026-10-27T19:54:55.914Z
 * Grounded Steps: 3
 */
test.describe('E-Commerce Headset Checkout Flow', () => {
  test('execute grounded visual workflow', async ({ page }) => {
    // Initial navigation
    await page.goto('https://store.meta.com');

    // [Evidence: Frame #0 @ 1200ms | Box: (120,80,280x42) | Hash: 5f71b61359d4d9cf112544dd7f7a9ef2cfd6f79f3822b5f972d83aedd77b1ff2]
    // Spoken Intent: "Search for "Meta Quest 3S" in the catalog"
    const target_1 = page.locator('button:has-text("Search catalog input"), [aria-label="Search catalog input"], [data-testid="elem_search"]').first();
    await expect(target_1).toBeVisible({ timeout: 5000 });
    await target_1.click();

    // [Evidence: Frame #1 @ 3500ms | Box: (420,320,160x48) | Hash: aea5bbca590b8539a0740a4fb72483ddda351937e47609133ab68ebccde9b882]
    // Spoken Intent: "Click Add to Cart to purchase the headset"
    const target_2 = page.locator('button:has-text("Add to Cart button"), [aria-label="Add to Cart button"], [data-testid="elem_add_to_cart"]').first();
    await expect(target_2).toBeVisible({ timeout: 5000 });
    await target_2.click();

    // [Evidence: Frame #2 @ 6000ms | Box: (200,150,380x60) | Hash: b47ccb4c94ecf8b33b1155b5cb9e1868658d78391f3ac6819d42bbcf05f9a956]
    // Spoken Intent: "Verify the order confirmation screen is displayed"
    await expect(page.locator('button:has-text("Order Confirmation #ORD-9821"), [aria-label="Order Confirmation #ORD-9821"], [data-testid="elem_order_badge"]').first()).toBeVisible({ timeout: 5000 });

  });
});