#!/usr/bin/env node
/**
 * Screenshot capture script for Spectral Diff demo
 * 
 * Usage: node demo/scripts/capture_screens.js
 * 
 * Captures key screens for documentation and presentations.
 */

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...');
  
  // Dynamic import for playwright (optional dependency)
  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    console.log('📦 Playwright not installed. Run: pnpm add -D playwright');
    console.log('   Then: npx playwright install chromium');
    return;
  }
  
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 800 });
  
  try {
    await page.goto('http://localhost:3000');
    
    console.log('📸 Capturing lobby...');
    await page.screenshot({ 
      path: path.join(__dirname, '../screenshots/lobby-demo.png'),
      fullPage: true 
    });
    
    // Click enter house button if exists
    const enterBtn = page.locator('[data-testid="enter-house"]');
    if (await enterBtn.isVisible()) {
      await enterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('📸 Capturing haunted house...');
    await page.screenshot({ 
      path: path.join(__dirname, '../screenshots/haunted-house.png'),
      fullPage: true 
    });
    
    // Click first room tile
    const roomTile = page.locator('.room-tile').first();
    if (await roomTile.isVisible()) {
      await roomTile.click();
      await page.waitForTimeout(1000);
      
      console.log('📸 Capturing exorcise chamber...');
      await page.screenshot({ 
        path: path.join(__dirname, '../screenshots/exorcise-chamber.png'),
        fullPage: true 
      });
    }
    
    console.log('✅ Screenshots captured successfully!');
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots().catch(console.error);
