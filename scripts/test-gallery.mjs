#!/usr/bin/env node
// Build first, then run with optional Playwright and an installed browser:
// npm exec --package=playwright@1.62.1 -- node scripts/test-gallery.mjs
// Or pass --playwright /absolute/path/to/playwright --channel chrome.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const require = createRequire(path.join(repository, "package.json"));
const flags = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const [flag, value] = process.argv.slice(index, index + 2);
  assert.ok(
    ["--playwright", "--channel"].includes(flag) && value && !flags.has(flag),
    "Use [--playwright /absolute/package/path] [--channel chrome]",
  );
  flags.set(flag, value);
}
assert.ok(
  !flags.has("--channel") || flags.get("--channel") === "chrome",
  "Only --channel chrome is supported",
);

let output;
try {
  output = await fs.realpath(path.join(repository, "out"));
  assert.ok((await fs.stat(path.join(output, "index.html"))).isFile());
} catch {
  throw new Error(
    "Gallery build missing. Run npm run build before this check.",
  );
}

let playwright = flags.get("--playwright");
if (playwright)
  assert.ok(path.isAbsolute(playwright), "--playwright must be absolute");
else
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    try {
      playwright = createRequire(
        await fs.realpath(path.join(directory, "playwright")),
      ).resolve("playwright");
      break;
    } catch {
      /* Continue through npm exec's executable search path. */
    }
  }
assert.ok(
  playwright,
  "Use npm exec --package=playwright@1.62.1 or --playwright /absolute/package/path",
);
const { chromium } = require(playwright);
const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
let browser, server;
let checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

async function serve(request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname,
    );
    assert.ok(!pathname.includes("\0"));
  } catch {
    response.writeHead(400).end("Invalid path");
    return;
  }
  const requested = path.resolve(output, `.${pathname}`);
  if (requested !== output && !requested.startsWith(`${output}${path.sep}`)) {
    response.writeHead(403).end("Outside build directory");
    return;
  }
  const candidates = pathname.endsWith("/")
    ? [path.join(requested, "index.html")]
    : [requested, `${requested}.html`, path.join(requested, "index.html")];
  for (const candidate of candidates) {
    try {
      const real = await fs.realpath(candidate);
      if (!real.startsWith(`${output}${path.sep}`)) continue;
      if (!(await fs.stat(real)).isFile()) continue;
      const body = await fs.readFile(real);
      response.setHeader(
        "Content-Type",
        contentTypes[path.extname(real)] ?? "application/octet-stream",
      );
      response.end(body);
      return;
    } catch {
      /* Try the static export's clean-URL alternatives. */
    }
  }
  response.writeHead(404).end("Not found");
}

try {
  server = createServer((request, response) => {
    void serve(request, response).catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end("Could not read build output");
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    headless: true,
    channel: flags.get("--channel"),
  });
  const context = await browser.newContext({
    viewport: { width: 320, height: 900 },
    // Geometry is measured at rest; the actual built components still run.
    reducedMotion: "reduce",
  });
  const externalRequests = [];
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === origin)
      return route.continue();
    externalRequests.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
  const trigger = page.locator("#sliding-tabs").getByRole("button", {
    name: "Customize Sliding tabs",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Sliding tabs",
    exact: true,
  });
  const preview = dialog.locator(".tl-tuning-preview");
  await preview.getByRole("tab", { name: "All notes", exact: true }).waitFor();

  // Checking document overflow alone misses children hidden by a clipped parent.
  // Include the preview itself: its children can fit while the entire preview
  // overflows the narrower customizer grid and is masked by the inspector.
  const clipped = await preview.evaluate((container) => {
    const previewBounds = container.getBoundingClientRect();
    const frame = container.closest(".tl-customizer").getBoundingClientRect();
    const bounds = {
      left: Math.max(previewBounds.left, frame.left),
      right: Math.min(previewBounds.right, frame.right),
      top: Math.max(previewBounds.top, frame.top),
      bottom: Math.min(previewBounds.bottom, frame.bottom),
    };
    return [
      container,
      ...container.querySelectorAll(
        ".bs-tabs-body, .bs-tablist, .bs-tab, .bs-note-title, .bs-note-time, button",
      ),
    ]
      .filter((node) => node.getClientRects().length)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          element: node.className,
          text: node.textContent?.trim(),
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      })
      .filter(
        (rect) =>
          rect.left < bounds.left - 1 ||
          rect.right > bounds.right + 1 ||
          rect.top < bounds.top - 1 ||
          rect.bottom > bounds.bottom + 1,
      );
  });
  assert.deepEqual(
    clipped,
    [],
    "Phone preview content is clipped by its frame",
  );
  passed("320px inspector contains the real tab strip, labels, and controls");

  // The label must name the input, not the output beside it. Real keyboard input
  // must update the controlled value and its separate readout together.
  const tempo = dialog.getByRole("slider", { name: "Tempo", exact: true });
  const corners = dialog.getByRole("slider", { name: "Corners", exact: true });
  await tempo.press("Home");
  await tempo.press("ArrowRight");
  assert.equal(Number(await tempo.inputValue()), 0.65);
  assert.equal(
    await tempo.locator("..").locator("output").textContent(),
    "0.65×",
  );
  await corners.press("Home");
  assert.equal(
    await corners.locator("..").locator("output").textContent(),
    "0px",
  );
  await corners.press("End");
  assert.equal(Number(await corners.inputValue()), 24);
  assert.equal(
    await corners.locator("..").locator("output").textContent(),
    "24px",
  );
  passed(
    "named Tempo and Corners sliders update their readouts with the keyboard",
  );

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      document.activeElement?.closest("article")?.id === "sliding-tabs" &&
      document.activeElement?.getAttribute("aria-label") ===
        "Customize Sliding tabs",
  );
  assert.ok(await trigger.evaluate((node) => node === document.activeElement));
  passed("closing the inspector restores focus to its collection trigger");
  assert.deepEqual(errors, [], "The browser reported runtime errors");
  assert.deepEqual(
    externalRequests,
    [],
    "The gallery attempted external requests",
  );
  console.log(`Passed ${checks} gallery regressions in ${browser.version()}.`);
} finally {
  const cleanup = await Promise.allSettled([
    browser?.close(),
    server?.listening
      ? new Promise((resolve) => server.close(resolve))
      : undefined,
  ]);
  const failures = cleanup.filter((result) => result.status === "rejected");
  if (failures.length)
    throw new AggregateError(
      failures.map((result) => result.reason),
      "Test cleanup failed",
    );
}
