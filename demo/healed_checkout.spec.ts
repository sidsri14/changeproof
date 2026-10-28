import { test, expect } from '@playwright/test';

/**
 * Auto-Synthesized by ChangeProof (Meta Global AI Developer Hackathon)
 * Suite ID: suite_1793193166180
 * Generated At: 2026-10-28T13:12:46.180Z
 * Grounded Steps: 3
 */
test.describe('E-Commerce Headset Checkout Flow (ChangeProof Self-Healed)', () => {
  test('execute grounded visual workflow', async ({ page }) => {
    // Initial navigation
    await page.goto('https://store.meta.com');

    // [Evidence: Frame #0 @ 1200ms | Box: (120,80,280x42) | Hash: 5f71b61359d4d9cf112544dd7f7a9ef2cfd6f79f3822b5f972d83aedd77b1ff2]
    // Spoken Intent: "Search for "Meta Quest 3S" in the catalog"
        // [ChangeProof Auto-Heal: Repaired Step #1 | Original: 'button:has-text("Search catalog input"), [aria-label="Search catalog input"], [data-testid="elem_search"]' -> Healed: '[data-testid="catalog_query_input"], #catalog-query-input' | Confidence: 0.75 | Repair Proof: 006f0a0d0a6e07e0d04b8d556540fd0382f90abdfd2f19d9dc702a3ab646622f]
    const target_1 = page.locator('[data-testid="catalog_query_input"], #catalog-query-input').first();
    await expect(target_1).toBeVisible({ timeout: 5000 });
    await target_1.click();

    // [Evidence: Frame #1 @ 3500ms | Box: (420,320,160x48) | Hash: aea5bbca590b8539a0740a4fb72483ddda351937e47609133ab68ebccde9b882]
    // Spoken Intent: "Click Add to Cart to purchase the headset"
        // [ChangeProof Auto-Heal: Repaired Step #2 | Original: 'button:has-text("Add to Cart button"), [aria-label="Add to Cart button"], [data-testid="elem_add_to_cart"]' -> Healed: '[data-testid="action_checkout_headset"], #btn-purchase-headset, button:has-text("Add Headset to Cart")' | Confidence: 0.55 | Repair Proof: 5e2651d48768a14c5e08141ee8db53275ea3cd290e92021b47012dc740e16b91]
    const target_2 = page.locator('[data-testid="action_checkout_headset"], #btn-purchase-headset, button:has-text("Add Headset to Cart")').first();
    await expect(target_2).toBeVisible({ timeout: 5000 });
    await target_2.click();

    // [Evidence: Frame #2 @ 6000ms | Box: (200,150,380x60) | Hash: b47ccb4c94ecf8b33b1155b5cb9e1868658d78391f3ac6819d42bbcf05f9a956]
    // Spoken Intent: "Verify the order confirmation screen is displayed"
    await expect(page.locator('[data-testid="confirmation_order_badge"], #badge-confirmed-v4, div:has-text("✓ Order Confirmation #ORD-9821")').first()).toBeVisible({ timeout: 5000 });

  });
});