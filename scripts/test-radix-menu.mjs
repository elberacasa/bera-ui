#!/usr/bin/env node
// Optional browser regression; requires Playwright and an installed browser.
// npm exec --package=playwright@1.62.1 -- node scripts/test-radix-menu.mjs
// Or pass --playwright /absolute/path/to/playwright and --channel chrome.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const require = createRequire(path.join(repository, "package.json"));
const flags = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  assert.ok(
    ["--playwright", "--channel"].includes(flag) && value && !flags.has(flag),
    "Usage: test-radix-menu.mjs [--playwright /absolute/package/path] [--channel chrome]",
  );
  flags.set(flag, value);
}
assert.ok(
  !flags.has("--channel") || flags.get("--channel") === "chrome",
  "Only --channel chrome is supported",
);
let playwright = flags.get("--playwright");
if (playwright)
  assert.ok(
    path.isAbsolute(playwright),
    "--playwright requires an absolute package path",
  );
else {
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    try {
      const executable = await fs.realpath(path.join(directory, "playwright"));
      playwright = createRequire(executable).resolve("playwright");
      break;
    } catch {
      /* Continue through npm exec's executable search path. */
    }
  }
}
assert.ok(
  playwright,
  "Use npm exec --package=playwright@1.62.1, or pass --playwright /absolute/package/path",
);
const { chromium } = require(playwright);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "bera-radix-menu-"));
let browser, server, compiler;
let checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
  // Bundle the actual installed Radix, React, and authored adapter, with no
  // replacement presence logic. flushSync exposes precise retarget boundaries.
  await fs.writeFile(
    path.join(temporary, "entry.js"),
    `
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import * as Menu from "@radix-ui/react-dropdown-menu";
const h = React.createElement;
function App() {
  const [open, setOpen] = React.useState(false);
  window.setMenuOpen = value => flushSync(() => setOpen(value));
  return h("main", null, h(Menu.Root, { open, onOpenChange: setOpen },
    h(Menu.Trigger, { id: "trigger" }, "Actions"),
    h(Menu.Portal, null, h(Menu.Content, { "data-bera-menu-motion": "", sideOffset: 8 },
      h(Menu.Item, null, "Edit"), h(Menu.Item, null, "Duplicate")))),
    h("button", { id: "outside", onClick: () => window.outsideClicks = (window.outsideClicks || 0) + 1 }, "Outside"),
    h("div", { style: { height: "200vh" } }, "Scrollable background"));
}
createRoot(document.getElementById("root")).render(h(App));
`,
  );
  compiler = webpack({
    mode: "development",
    devtool: false,
    context: temporary,
    entry: path.join(temporary, "entry.js"),
    output: { path: temporary, filename: "bundle.js" },
    resolve: {
      modules: [path.join(repository, "node_modules"), "node_modules"],
    },
    optimization: { minimize: false },
  });
  await new Promise((resolve, reject) =>
    compiler.run((error, stats) => {
      if (error) reject(error);
      else if (stats.hasErrors())
        reject(new Error(stats.toString("errors-only")));
      else resolve();
    }),
  );
  const bundle = await fs.readFile(path.join(temporary, "bundle.js"));
  const css = await fs.readFile(
    path.join(repository, "components/adapters/radix-menu-motion.css"),
    "utf8",
  );
  server = createServer((request, response) => {
    if (request.url === "/bundle.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(bundle);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(`<!doctype html><style>
body{margin:100px;font:16px sans-serif}button{padding:12px}
[role=menu]{background:white;border:1px solid #ddd;padding:8px;width:200px;border-radius:8px}
[role=menuitem]{padding:8px}${css}
</style><div id="root"></div><script src="/bundle.js"></script>`);
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  browser = await chromium.launch({
    headless: true,
    channel: flags.get("--channel"),
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(3000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator("#trigger").waitFor();
  const open = async () => {
    await page.locator("#trigger").click();
    await page.waitForFunction(() => {
      const menu = document.querySelector("[role=menu]");
      return (
        menu?.dataset.state === "open" && getComputedStyle(menu).opacity === "1"
      );
    });
  };
  const unlocked = async () => {
    await page.waitForFunction(
      () =>
        !document.querySelector("[role=menu]") &&
        !document.querySelector(
          "[data-radix-focus-guard], [data-aria-hidden]",
        ) &&
        document.getElementById("root").getAttribute("aria-hidden") === null &&
        document.body.style.pointerEvents === "" &&
        !document.body.hasAttribute("data-scroll-locked") &&
        document.activeElement.id === "trigger",
    );
    const clicks = await page.evaluate(() => window.outsideClicks || 0);
    await page.locator("#outside").click();
    assert.equal(await page.evaluate(() => window.outsideClicks), clicks + 1);
    await page.mouse.move(20, 300);
    await page.mouse.wheel(0, 160);
    await page.waitForFunction(() => window.scrollY > 0);
    await page.evaluate(() => window.scrollTo(0, 0));
  };

  await open();
  assert.equal(
    await page.evaluate(() => document.body.style.pointerEvents),
    "none",
  );
  await page.keyboard.press("Escape");
  await unlocked();
  passed("native Escape exit restores focus, page input, and scrolling");

  const retargets = await page.evaluate(async () => {
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    window.setMenuOpen(true);
    await frame();
    await frame();
    const original = document.querySelector("[role=menu]");
    const read = () => {
      const menu = document.querySelector("[role=menu]");
      if (menu !== original)
        throw new Error("Retargeting replaced the menu DOM node");
      const style = getComputedStyle(menu);
      // Normalize the browser's inset()/calc() serialization into physical
      // clipping edges; equivalent serializations must compare equally.
      const tokens = style.clipPath.match(/calc\([^)]*\)|-?[\d.]+(?:px|%)/g);
      if (!tokens?.length) throw new Error("Expected an inset clip transition");
      const edges = [
        tokens[0],
        tokens[1] ?? tokens[0],
        tokens[2] ?? tokens[0],
        tokens[3] ?? tokens[1] ?? tokens[0],
      ];
      const clip = edges.map((edge, index) =>
        [...edge.matchAll(/([+-]?)\s*([\d.]+)(px|%)/g)].reduce(
          (sum, [, sign, amount, unit]) =>
            sum +
            (sign === "-" ? -1 : 1) *
              Number(amount) *
              (unit === "%"
                ? (index % 2 ? menu.offsetWidth : menu.offsetHeight) / 100
                : 1),
          0,
        ),
      );
      const translate =
        style.translate === "none"
          ? [0, 0]
          : style.translate.split(" ").map(Number.parseFloat);
      return [Number(style.opacity), translate[0], translate[1] ?? 0, ...clip];
    };
    const initial = read();
    const samples = [];
    for (const next of [false, true, false, true]) {
      await frame();
      const before = read();
      window.setMenuOpen(next);
      samples.push([before, read()]);
    }
    window.retainedMenu = original;
    return { initial, samples };
  });
  assert.ok(
    retargets.initial[0] > 0 && retargets.initial[0] < 1,
    "Entry must be in flight",
  );
  for (const [before, after] of retargets.samples) {
    before.forEach((value, index) =>
      assert.ok(
        Math.abs(value - after[index]) < 0.05,
        `Motion jumped on reversal: ${JSON.stringify({ before, after })}`,
      ),
    );
  }
  // Wait beyond the old exit deadline: a stale completion must not remove it.
  await page.waitForTimeout(250);
  assert.ok(
    await page.evaluate(
      () =>
        window.retainedMenu ===
        document.querySelector('[role="menu"][data-state="open"]'),
    ),
  );
  await page.evaluate(() => window.setMenuOpen(false));
  await unlocked();
  passed(
    "opacity, translation, and clipping retarget continuously on the same DOM node",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await open();
  assert.deepEqual(
    await page.locator("[role=menu]").evaluate((menu) => {
      const style = getComputedStyle(menu);
      return [style.translate, style.clipPath, style.transitionDuration];
    }),
    ["none", "none", "0s"],
  );
  await page.keyboard.press("Escape");
  await unlocked();
  passed("reduced motion removes visual movement and releases the page");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open();
  assert.equal(
    await page.evaluate(() => {
      window.setMenuOpen(false);
      return document.querySelector("[role=menu]")?.dataset.state;
    }),
    "closed",
    "The native exit must be retained before its completion",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await unlocked();
  passed("changing reduced motion during exit cannot strand modal isolation");
  assert.deepEqual(errors, [], "The browser reported runtime errors");
  console.log(
    `Passed ${checks} Radix menu lifecycle checks in ${browser.version()}.`,
  );
} finally {
  const cleanup = await Promise.allSettled([
    browser?.close(),
    server?.listening
      ? new Promise((resolve) => server.close(resolve))
      : undefined,
    compiler
      ? new Promise((resolve, reject) =>
          compiler.close((error) => (error ? reject(error) : resolve())),
        )
      : undefined,
  ]);
  await fs.rm(temporary, { recursive: true, force: true });
  const failures = cleanup.filter((result) => result.status === "rejected");
  if (failures.length)
    throw new AggregateError(
      failures.map((result) => result.reason),
      "Test cleanup failed",
    );
}
