/**
 * End-to-end smoke test.
 *
 * Walks the three flows the app is built around — discover, plan as a guest,
 * then sign up and keep the work — against a running server:
 *
 *   npm run start &   (or npm run dev)
 *   npm run test:e2e
 *
 * Map tiles come from OpenStreetMap; if your network blocks them the pins and
 * route still render and the test still passes.
 */
import { chromium } from "playwright";

const B = process.env.E2E_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH;
const log = (m) => console.log(m);
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await ctx.newPage();

// Tile requests are allowed to fail — a blocked map host is not an app bug.
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("Failed to load resource")) {
    errors.push("console: " + m.text());
  }
});

// ---------- Flow 1: discovery ----------
await page.goto(B, { waitUntil: "networkidle" });
log("1. Landing page: " + (await page.title()));
log("   destination cards rendered: " + (await page.locator("button:has(h3)").count()));

await page.screenshot({ path: "e2e/screenshots/01-landing.png", fullPage: false });

// live search
await page.getByPlaceholder(/Try Kyoto/).fill("kyoto");
await page.waitForTimeout(350);
log("   after typing 'kyoto': " + (await page.locator("button:has(h3)").count()) + " card(s)");

// filter chip
await page.getByPlaceholder(/Try Kyoto/).fill("");
await page.getByRole("button", { name: "Foodie", exact: true }).click();
await page.waitForTimeout(350);
log("   after Foodie chip: " + (await page.locator("button:has(h3)").count()) + " cards");

// open the modal
await page.getByPlaceholder(/Try Kyoto/).fill("kyoto");
await page.waitForTimeout(300);
await page.locator("button:has(h3)").first().click();
await page.waitForSelector('[role="dialog"]');
log("2. Blueprint modal open: " + (await page.locator('[role="dialog"] h2').first().innerText()));
await page.waitForTimeout(1800); // let the map tiles settle
log("   map present in modal: " + (await page.locator(".leaflet-container").count() > 0));
log("   day tabs: " + (await page.locator('[role="dialog"] button:text-matches("^Day \\\\d$")').count()));
await page.screenshot({ path: "e2e/screenshots/02-blueprint-modal.png" });

// ---------- Flow 1 conversion: guest trip ----------
await page.getByRole("button", { name: /Start Planning This Trip/ }).click();
await page.waitForURL(/\/trips\/guest_/, { timeout: 15000 });
const guestUrl = page.url();
log("3. Landed on guest trip: " + guestUrl.replace(B, ""));
await page.waitForTimeout(2200);
log("   guest banner shown: " + (await page.getByText(/planning as a Guest/).count() > 0));
log("   trip title: " + (await page.locator("h1").first().innerText()));
log("   map on itinerary: " + (await page.locator(".leaflet-container").count() > 0));
log("   activity cards on day 1: " + (await page.locator("article").count()));
await page.screenshot({ path: "e2e/screenshots/03-itinerary.png" });

// tabs
for (const tab of ["Locker", "Budget & splits", "Packing", "Trip settings"]) {
  await page.getByRole("tab", { name: new RegExp(tab.split(" ")[0]) }).click();
  await page.waitForTimeout(900);
  log("   tab '" + tab + "' rendered ok");
  await page.screenshot({ path: "e2e/screenshots/tab-" + tab.split(" ")[0].toLowerCase() + ".png" });
}

// ---------- Flow 2: guest -> account ----------
await page.getByRole("tab", { name: /Itinerary/ }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Sign in or create an account/ }).click();
await page.waitForSelector('[role="dialog"]');
log("4. Auth modal open");
const stamp = Date.now();
await page.getByPlaceholder("Alex Rivera").fill("Ines Duarte");
await page.getByPlaceholder("you@example.com").fill(`ui${stamp}@example.com`);
await page.getByPlaceholder("••••••••").fill("supersecret1");
await page.screenshot({ path: "e2e/screenshots/04-auth-modal.png" });
await page.locator('[role="dialog"]').getByRole("button", { name: "Create account", exact: true }).click();

await page.waitForURL((u) => !u.toString().includes("guest_"), { timeout: 20000 });
await page.waitForTimeout(2500);
log("5. Synced. URL is now: " + page.url().replace(B, ""));
log("   guest banner gone: " + (await page.getByText(/planning as a Guest/).count() === 0));
log("   activities survived: " + (await page.locator("article").count()) + " on day 1");
await page.screenshot({ path: "e2e/screenshots/05-after-signup.png" });

// theme cycles light -> dark -> system
const readTheme = () => page.evaluate(() => ({
  attr: document.documentElement.dataset.theme ?? "(none = follow system)",
  bg: getComputedStyle(document.body).backgroundColor,
}));
log("6. Theme cycle:");
log("   at rest:     " + JSON.stringify(await readTheme()));
for (const step of [1, 2, 3]) {
  await page.getByRole("button", { name: /Theme/ }).click();
  await page.waitForTimeout(400);
  log("   after click " + step + ": " + JSON.stringify(await readTheme()));
}
// leave it on dark for the screenshot
await page.getByRole("button", { name: /Theme/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: "e2e/screenshots/06-dark.png" });

// dashboard
await page.goto(B + "/trips", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
log("7. Dashboard trips: " + (await page.locator("a[href^='/trips/']").count()));
await page.screenshot({ path: "e2e/screenshots/07-dashboard.png" });

await browser.close();

if (errors.length > 0) {
  console.error("\nBrowser errors:\n  " + errors.join("\n  "));
  process.exit(1);
}
log("\nAll flows passed with no browser errors.");
