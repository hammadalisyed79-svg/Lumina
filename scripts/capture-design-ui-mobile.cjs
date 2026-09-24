const path = require("path");
const fs = require("fs");
const { chromium } = require(
  "C:/Users/Tahir/AppData/Local/npm-cache/_npx/fd3bca3c548369c0/node_modules/playwright"
);

const OUT = path.join(__dirname, "..", "data", "design-ui-after");
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("saved", name);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const mobile = await browser.newContext({
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
  await mpage.waitForTimeout(1000);
  await shot(mpage, "mobile-start.png");

  await mpage.locator(".studio-step-chip", { hasText: "Fabric" }).first().click();
  await mpage.locator("#cfg-fabric").scrollIntoViewIfNeeded();
  await mpage.waitForTimeout(500);
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
  await mpage.waitForTimeout(500);
  await shot(mpage, "mobile-review.png");

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
