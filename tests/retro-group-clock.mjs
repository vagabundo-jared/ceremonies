/**
 * Local preview check for the combined group-and-name step and the discussion clock.
 *
 * Usage: node tests/retro-group-clock.mjs
 * Requires the Next preview on http://localhost:3456 and the party server on :1999.
 */

import { chromium } from "playwright";

const base = process.env.CEREMONIES_URL ?? "http://localhost:3456";
const room = `clock-${Date.now().toString(36)}`;
const failures = [];

function check(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.log(`FAIL: ${message}`);
    failures.push(message);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto(`${base}/retro/${room}`, { waitUntil: "networkidle" });
  const name = page.getByPlaceholder("Your name");
  await name.click();
  await page.keyboard.type("Ada");
  const join = page.getByRole("button", { name: "Join retro" });
  await join.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll("button")].find((el) =>
      el.textContent?.includes("Join retro"),
    );
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await join.click();
  await page.getByRole("button", { name: "Start retro" }).click();
  await page.getByPlaceholder(/What made you/).fill("shipping got faster");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Move to grouping" }).click();
  await page.getByRole("heading", { name: "Group and name" }).waitFor();
  check(
    await page
      .getByText("The facilitator names each theme before voting.")
      .isVisible(),
    "group step says the facilitator names themes before voting",
  );
  const moveToVoting = page.getByRole("button", { name: "Move to voting" });
  check(await moveToVoting.isVisible(), "the next step from grouping is voting");
  await moveToVoting.click();
  await page.getByRole("heading", { name: "Vote" }).waitFor();
  await page.getByRole("button", { name: "Force reveal & start discussion" }).click();
  await page.getByLabel("Discussion clock").waitFor();
  await page.getByRole("button", { name: "2 min" }).click();
  await page
    .getByLabel("Discussion clock")
    .getByText("2:00")
    .waitFor({ timeout: 5000 });
  check(true, "setting 2 minutes updates the clock everyone sees");
  check(
    await page.getByRole("button", { name: "5 min" }).isVisible(),
    "discussion clock has a length preset",
  );
  check(
    await page.getByRole("button", { name: "Slack off" }).isVisible(),
    "facilitator sees the slack hook control",
  );
  check(
    await page.getByLabel("Clock length in minutes").isVisible(),
    "discussion clock has a minutes field",
  );
} finally {
  await browser.close();
}

if (failures.length > 0) {
  process.exit(1);
}
