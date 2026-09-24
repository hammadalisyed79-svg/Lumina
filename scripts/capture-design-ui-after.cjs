const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const PW_ROOT =
  "C:/Users/Tahir/AppData/Local/npm-cache/_npx/fd3bca3c548369c0/node_modules/playwright";

async function main() {
  const { chromium } = require(PW_ROOT);
  const ROOT = path.join(__dirname, "..");
  const OUT = path.join(ROOT, "data", "design-ui-after");
  fs.mkdirSync(OUT, { recursive: true });

  async function shot(page, name) {
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    console.log("saved", name);
  }

  async function goStep(page, label) {
    await page.locator(".studio-step-chip", { hasText: label }).first().click();
    await page.waitForTimeout(350);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/design-your-shade", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForSelector(".cfg-panel-intro", { timeout: 30000 });
  await page.waitForTimeout(800);

  await shot(page, "desktop-start.png");

  await goStep(page, "Shape");
  await page.locator("#cfg-shape").scrollIntoViewIfNeeded();
  await shot(page, "desktop-shape.png");

  await goStep(page, "Fabric");
  await page.locator("#cfg-fabric").scrollIntoViewIfNeeded();
  await shot(page, "desktop-fabric.png");

  await goStep(page, "Lining");
  await page.locator("#cfg-lining").scrollIntoViewIfNeeded();
  await shot(page, "desktop-lining.png");

  await page.locator('#cfg-use button[role="radio"]').first().click().catch(() => {});
  await page.waitForTimeout(200);
  await page
    .locator('#cfg-shape button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(200);
  await page
    .locator('#cfg-size button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(200);
  await page
    .locator("#cfg-fabric button")
    .filter({ has: page.locator("img") })
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(200);
  await page
    .locator('#cfg-lining button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(200);
  await page
    .locator('#cfg-fitting button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await goStep(page, "Review");
  await page.locator("#cfg-review").scrollIntoViewIfNeeded();
  await shot(page, "desktop-review.png");

  await browser.close();

  const browser2 = await chromium.launch({ headless: true });
  const mobile = await browser2.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mpage = await mobile.newPage();
  await mpage.goto("http://localhost:3000/design-your-shade", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await mpage.waitForSelector(".cfg-panel-intro", { timeout: 30000 });
  await mpage.waitForTimeout(800);
  await shot(mpage, "mobile-start.png");

  await mpage.locator(".studio-step-chip", { hasText: "Fabric" }).first().click();
  await mpage.locator("#cfg-fabric").scrollIntoViewIfNeeded();
  await mpage.waitForTimeout(400);
  await shot(mpage, "mobile-fabric.png");

  await mpage.locator('#cfg-use button[role="radio"]').first().click().catch(() => {});
  await mpage.waitForTimeout(150);
  await mpage
    .locator('#cfg-shape button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await mpage.waitForTimeout(150);
  await mpage
    .locator('#cfg-size button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await mpage.waitForTimeout(150);
  await mpage
    .locator("#cfg-fabric button")
    .filter({ has: mpage.locator("img") })
    .first()
    .click()
    .catch(() => {});
  await mpage.waitForTimeout(150);
  await mpage
    .locator('#cfg-lining button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await mpage.waitForTimeout(150);
  await mpage
    .locator('#cfg-fitting button[role="radio"]:not([disabled])')
    .first()
    .click()
    .catch(() => {});
  await mpage.waitForTimeout(300);
  await mpage.locator(".studio-step-chip", { hasText: "Review" }).first().click();
  await mpage.locator("#cfg-review").scrollIntoViewIfNeeded();
  await mpage.waitForTimeout(400);
  await shot(mpage, "mobile-review.png");

  await browser2.close();
  console.log("done");
  void pathToFileURL;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
