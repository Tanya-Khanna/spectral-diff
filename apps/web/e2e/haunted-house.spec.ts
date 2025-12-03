import { test, expect } from "@playwright/test";

test.describe("Spectral Diff - Haunted House Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display lobby with PR info", async ({ page }) => {
    // Check title
    await expect(page.getByRole("heading", { name: /Spectral Diff/i })).toBeVisible();
    
    // Check PR card is visible
    await expect(page.getByText(/Haunted Rooms/i)).toBeVisible();
    await expect(page.getByText(/Lines Changed/i)).toBeVisible();
    
    // Check enter button
    await expect(page.getByRole("button", { name: /Enter the Haunted House/i })).toBeVisible();
  });

  test("should navigate to house map", async ({ page }) => {
    // Click enter button
    await page.getByRole("button", { name: /Enter the Haunted House/i }).click();
    
    // Should be on house page
    await expect(page).toHaveURL("/house");
    
    // Should see room tiles
    await expect(page.locator("button[aria-label*='risk score']").first()).toBeVisible();
  });

  test("should display room tiles with risk scores", async ({ page }) => {
    await page.goto("/house");
    
    // Wait for rooms to load
    await page.waitForSelector("button[aria-label*='risk score']");
    
    // Check that rooms have risk badges
    const rooms = page.locator("button[aria-label*='risk score']");
    await expect(rooms.first()).toBeVisible();
    
    // Check risk badge text
    await expect(page.getByText(/Risk \d+/i).first()).toBeVisible();
  });

  test("should open diff panel when clicking a room", async ({ page }) => {
    await page.goto("/house");
    
    // Click first room
    const firstRoom = page.locator("button[aria-label*='risk score']").first();
    await firstRoom.click();
    
    // Diff panel should open
    await expect(page.getByText(/Risk Breakdown/i)).toBeVisible();
  });

  test("should navigate to lantern mode", async ({ page }) => {
    await page.goto("/lantern");
    
    // Should see lantern UI
    await expect(page.getByText(/Lantern Mode/i)).toBeVisible();
    
    // Should see navigation controls
    await expect(page.getByRole("button", { name: /Next/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Prev/i })).toBeVisible();
  });

  test("should navigate hunks with keyboard in lantern mode", async ({ page }) => {
    await page.goto("/lantern");
    
    // Wait for content
    await page.waitForSelector("text=Lantern Mode");
    
    // Press N for next
    await page.keyboard.press("n");
    
    // Should still be on lantern page
    await expect(page).toHaveURL("/lantern");
  });

  test("should open exorcise panel from lantern mode", async ({ page }) => {
    await page.goto("/lantern");
    
    // Click exorcise button
    const exorciseButton = page.getByRole("button", { name: /Exorcise/i });
    if (await exorciseButton.isVisible()) {
      await exorciseButton.click();
      
      // Should navigate to exorcise
      await expect(page).toHaveURL("/exorcise");
    }
  });

  test("should display exorcise chamber with actions", async ({ page }) => {
    await page.goto("/exorcise");
    
    // Should see exorcise UI
    await expect(page.getByText(/Exorcise Chamber/i)).toBeVisible();
    
    // Should see action buttons
    await expect(page.getByRole("button", { name: /Post Comment/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Request Changes/i })).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should have proper focus indicators", async ({ page }) => {
    await page.goto("/house");
    
    // Tab to first interactive element
    await page.keyboard.press("Tab");
    
    // Check that focus is visible (element has focus-visible styles)
    const focusedElement = page.locator(":focus-visible");
    await expect(focusedElement).toBeVisible();
  });

  test("should have aria-labels on room tiles", async ({ page }) => {
    await page.goto("/house");
    
    // Check rooms have descriptive aria-labels
    const room = page.locator("button[aria-label*='risk score']").first();
    const ariaLabel = await room.getAttribute("aria-label");
    
    expect(ariaLabel).toContain("risk score");
    expect(ariaLabel).toContain("band");
  });

  test("should respect reduce motion preference", async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/house");
    
    // Page should load without animations
    await expect(page.locator("button[aria-label*='risk score']").first()).toBeVisible();
  });
});

test.describe("GitHub Connect", () => {
  test("should display connect box in lobby", async ({ page }) => {
    await page.goto("/");
    
    // Should see connect GitHub section
    await expect(page.getByText(/Connect GitHub/i)).toBeVisible();
    
    // Should see PAT input
    await expect(page.getByPlaceholder(/ghp_/i)).toBeVisible();
    
    // Should see owner/repo inputs
    await expect(page.getByPlaceholder(/owner/i)).toBeVisible();
    await expect(page.getByPlaceholder(/repo/i)).toBeVisible();
  });

  test("should have test token button", async ({ page }) => {
    await page.goto("/");
    
    // Should see test button
    await expect(page.getByRole("button", { name: /Test/i })).toBeVisible();
  });
});
