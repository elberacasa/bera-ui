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
    viewport: { width: 1440, height: 960 },
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
  const views = page.getByRole("navigation", { name: "Gallery views" });
  const componentsLink = views.getByRole("link", {
    name: "Components",
    exact: true,
  });
  const compareLink = views.getByRole("link", {
    name: "Compare motion",
    exact: true,
  });
  const collection = page.locator("#transitions");
  const comparisons = page.locator("#compare");
  async function expectView(view) {
    const collectionActive = view === "components";
    await (collectionActive ? collection : comparisons).waitFor({
      state: "visible",
    });
    await (collectionActive ? comparisons : collection).waitFor({
      state: "hidden",
    });
    assert.equal(
      await (collectionActive ? componentsLink : compareLink).getAttribute(
        "aria-current",
      ),
      "page",
    );
    assert.notEqual(
      await (collectionActive ? compareLink : componentsLink).getAttribute(
        "aria-current",
      ),
      "page",
    );
    assert.equal(
      await (collectionActive ? comparisons : collection)
        .getByRole("button")
        .count(),
      0,
      "The hidden gallery view must not expose its controls to assistive technology",
    );
  }

  await expectView("components");
  assert.equal(await componentsLink.getAttribute("href"), "#transitions");
  assert.equal(await compareLink.getAttribute("href"), "#compare");
  assert.equal(
    await comparisons.count(),
    1,
    "Comparisons remain available in the mounted hidden view",
  );
  assert.equal(await page.evaluate(() => scrollY), 0);
  const firstPreview = await collection
    .locator(".tl-preview")
    .first()
    .boundingBox();
  assert.ok(
    firstPreview &&
      Math.min(firstPreview.y + firstPreview.height, 960) -
        Math.max(firstPreview.y, 0) >=
        100,
    "The default collection must show a usable component preview above the fold",
  );
  const captionAlignment = await collection
    .locator(".tl-caption")
    .first()
    .evaluate((caption) => {
      const title = caption.querySelector("h3").getBoundingClientRect();
      const action = caption
        .querySelector(".tl-inspect")
        .getBoundingClientRect();
      return Math.abs(
        title.y + title.height / 2 - action.y - action.height / 2,
      );
    });
  assert.ok(
    captionAlignment < 1,
    "Customize must remain aligned beside its component name",
  );
  passed(
    "homepage opens on an above-fold collection with accessible view navigation",
  );

  // Use a real component's local state, so remounting the hidden collection is
  // caught even if both views look correct after navigation.
  const counter = collection.locator("#rolling-counter");
  const originalCount = Number(await counter.locator("output").textContent());
  await counter
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await compareLink.click();
  await expectView("compare");
  await page.goBack();
  await expectView("components");
  assert.equal(
    Number(await counter.locator("output").textContent()),
    originalCount + 1,
  );
  await page.goForward();
  await expectView("compare");
  await componentsLink.click();
  await expectView("components");
  assert.equal(
    Number(await counter.locator("output").textContent()),
    originalCount + 1,
  );
  passed(
    "browser history switches views without resetting collection component state",
  );

  await page.goto(`${origin}/#compare-expanding-search`);
  await page.reload();
  await expectView("compare");
  await page.waitForFunction(() => {
    const target = document
      .getElementById("compare-expanding-search")
      .getBoundingClientRect();
    return target.top < innerHeight && target.bottom > 0;
  });
  await page.goto(`${origin}/#sliding-tabs`);
  await expectView("components");
  await collection.locator("#sliding-tabs").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const target = document
      .getElementById("sliding-tabs")
      .getBoundingClientRect();
    return target.top < innerHeight && target.bottom > 0;
  });
  await collection
    .getByRole("group", { name: "Filter transitions" })
    .getByRole("button", { name: "Feedback", exact: true })
    .click();
  await collection.locator("#sliding-tabs").waitFor({ state: "hidden" });
  await compareLink.click();
  await page.goto(`${origin}/#sliding-tabs`);
  await expectView("components");
  await collection.locator("#sliding-tabs").waitFor({ state: "visible" });
  assert.equal(
    await collection
      .getByRole("group", { name: "Filter transitions" })
      .getByRole("button", { name: /^All/ })
      .getAttribute("aria-pressed"),
    "true",
  );
  passed(
    "direct fragments select the right view and reveal filtered-out components",
  );

  const patterns = [
    ["animated-list", ".bc-list-preview ul", "text"],
    ["sliding-tabs", '[role="tab"][aria-selected="true"]', "text"],
    ["accordion", ".bt-accordion-trigger", "aria-expanded"],
    ["expanding-search", ".bs-search-form", "data-open"],
    ["rolling-counter", ".bs-counter-value output", "text"],
    ["morphing-icon-button", ".bi-morph-button", "aria-expanded"],
    ["text-swap", '[role="status"]', "text"],
  ];
  async function readPair(row, selector, attribute) {
    return row
      .locator(selector)
      .evaluateAll(
        (nodes, attribute) =>
          nodes.map((node) =>
            attribute === "text"
              ? node.textContent.trim()
              : node.getAttribute(attribute),
          ),
        attribute,
      );
  }
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await compareLink.click();
    await expectView("compare");
    for (const [id, selector, attribute] of patterns) {
      const row = comparisons.locator(`#compare-${id}`);
      const action = row.locator(".cx-row-play");
      const before = await readPair(row, selector, attribute);
      assert.equal(
        await action.count(),
        1,
        `${id} needs one clear local action`,
      );
      await action.click();
      const after = await readPair(row, selector, attribute);
      assert.equal(after.length, 2);
      assert.equal(
        after[0],
        after[1],
        `${id} must update both previews together`,
      );
      assert.notDeepEqual(
        after,
        before,
        `${id} local action must change its actual state`,
      );
      assert.ok(
        await action.evaluate((node) => node === document.activeElement),
        `${id} must preserve the action's focus`,
      );
    }
    await comparisons
      .locator("#compare-rolling-counter")
      .evaluate((row) =>
        row.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    const navigationBounds = await views.boundingBox();
    assert.ok(
      navigationBounds && navigationBounds.y <= 1,
      "Gallery navigation should be stuck at the viewport edge",
    );
    if (width === 1440) {
      const header = await comparisons
        .locator("thead th")
        .first()
        .boundingBox();
      assert.ok(
        header && header.y >= navigationBounds.y + navigationBounds.height - 1,
        "Sticky comparison headings must sit below gallery navigation",
      );
    } else {
      assert.equal(
        await comparisons.locator(".cx-without").getByRole("button").count(),
        0,
      );
      for (const [name, view] of [
        ["Without bera", "without"],
        ["With bera", "with"],
      ]) {
        const toggle = comparisons.getByRole("button", { name, exact: true });
        const hit = await toggle.evaluate((button) => {
          const bounds = button.getBoundingClientRect();
          const x = bounds.left + bounds.width / 2;
          const y = bounds.top + bounds.height / 2;
          return {
            x,
            y,
            reachable:
              document.elementFromPoint(x, y)?.closest("button") === button,
          };
        });
        assert.ok(hit.reachable, `${name} is covered by another sticky header`);
        // Click the measured position directly: an automatic scroll must not
        // conceal the overlap that a person encounters midway down the table.
        await page.mouse.click(hit.x, hit.y);
        await page.waitForFunction(
          (view) => document.querySelector(".cx-table").dataset.view === view,
          view,
        );
        assert.equal(
          await comparisons
            .locator(view === "with" ? ".cx-without" : ".cx-with")
            .getByRole("button")
            .count(),
          0,
        );
      }
    }
    passed(
      `${width}px comparison exposes working local actions with synchronized state and stable focus`,
    );
  }
  passed(
    "sticky comparison headings and mobile switches remain reachable below gallery navigation",
  );

  const workspace = comparisons.locator(
    "#compare-morphing-icon-button .cx-with",
  );
  const workspaceToggle = workspace.getByRole("button", {
    name: "Workspace navigation",
    exact: true,
  });
  if ((await workspaceToggle.getAttribute("aria-expanded")) !== "true")
    await workspaceToggle.click();
  await workspace
    .getByRole("link", { name: "Transitions", exact: true })
    .click();
  await expectView("components");
  assert.equal(new URL(page.url()).hash, "#transitions");
  await compareLink.click();
  await expectView("compare");
  await page.getByRole("link", { name: "Bera UI home", exact: true }).click();
  await expectView("components");
  assert.equal(new URL(page.url()).hash, "#top");
  await page.waitForFunction(() => {
    const heading = document.querySelector("h1").getBoundingClientRect();
    return heading.top >= 0 && heading.bottom <= innerHeight;
  });
  passed(
    "workspace and brand links reveal the collection through native fragment navigation",
  );

  await componentsLink.click();
  await expectView("components");
  await page.setViewportSize({ width: 320, height: 900 });
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

  const categoryPicker = collection.getByRole("combobox", {
    name: "Filter components",
  });
  await categoryPicker.selectOption("Inputs");
  await collection.locator("#inline-edit").waitFor({ state: "visible" });
  await collection.locator("#animated-list").waitFor({ state: "hidden" });
  await categoryPicker.selectOption("All");
  await collection.locator("#animated-list").waitFor({ state: "visible" });
  passed("phone category picker reveals the selected component family");

  for (const [id, name, exported] of [
    ["inline-edit", "Inline edit", "InlineEdit"],
    ["animated-list", "Animated list", "AnimatedList"],
    ["selection-toolbar", "Selection toolbar", "SelectionToolbar"],
  ]) {
    await collection
      .locator(`#${id}`)
      .getByRole("button", { name: `Customize ${name}`, exact: true })
      .click();
    const workbench = page.getByRole("dialog", { name, exact: true });
    const sample = workbench.locator(".tl-tuning-preview");
    if (id === "inline-edit") {
      await sample
        .getByRole("button", { name: "Edit project name", exact: true })
        .click();
    } else if (id === "animated-list") {
      await sample
        .getByRole("button", { name: "Add file", exact: true })
        .click();
    } else {
      const countFits = await sample.locator(".bst-count").evaluate((count) => {
        const label = count.getBoundingClientRect();
        const surface = count.closest(".bst-surface").getBoundingClientRect();
        return (
          label.top >= surface.top &&
          label.bottom <= surface.bottom &&
          label.right <= surface.right
        );
      });
      assert.ok(
        countFits,
        "Idle selection text must remain visible when actions wrap in the narrow inspector",
      );
      await sample.getByRole("checkbox").first().check();
      // The controls exist at full content width while the closed shell masks
      // them. Measure only after the reduced-motion effect exposes the actions.
      await page.waitForFunction(() => {
        const toolbar = document.querySelector("[role='dialog'] .bst-toolbar");
        if (!toolbar) return false;
        const actions = toolbar.querySelector(".bst-controls");
        const surface = toolbar
          .querySelector(".bst-surface")
          .getBoundingClientRect();
        const content = toolbar.querySelector(".bst-content");
        return (
          getComputedStyle(actions).opacity === "1" &&
          Math.abs(surface.width - toolbar.clientWidth) < 1 &&
          Math.abs(surface.height - content.offsetHeight - 2) < 1
        );
      });
    }
    const overflow = await sample.evaluate((frame) => {
      const bounds = frame.getBoundingClientRect();
      const playbackTop = frame
        .querySelector(".tl-tuning-playback")
        .getBoundingClientRect().top;
      return [...frame.querySelectorAll("button, input, select")]
        .filter(
          (node) =>
            node.getClientRects().length &&
            !node.closest("[inert], [aria-hidden='true'], .tl-tuning-playback"),
        )
        .map((node) => ({
          label: node.getAttribute("aria-label") || node.textContent,
          bounds: node.getBoundingClientRect().toJSON(),
        }))
        .filter(
          ({ bounds: rect }) =>
            rect.left < bounds.left - 1 ||
            rect.right > bounds.right + 1 ||
            rect.top < bounds.top - 1 ||
            rect.bottom > Math.min(bounds.bottom, playbackTop) + 1,
        );
    });
    assert.deepEqual(
      overflow,
      [],
      `${name}'s opened controls must fit the 320px inspector`,
    );
    await workbench.getByRole("tab", { name: "React", exact: true }).click();
    await workbench.locator("pre").waitFor();
    assert.ok(
      (await workbench.locator("pre").textContent()).includes(exported),
      `${name} must load its own generated source`,
    );
    await workbench
      .getByRole("button", { name: "Close transition", exact: true })
      .click();
    await workbench.waitFor({ state: "hidden" });
  }
  passed(
    "new recipes remain usable in the phone customizer and load their standalone source",
  );

  // A correct final state is not evidence of animation. Exercise hydration in
  // the static export, then measure the same keyed row during a real reorder.
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${origin}/#compare-animated-list`);
  await page.reload();
  await expectView("compare");
  const slowPlayback = comparisons.getByRole("button", {
    name: "Slow motion",
    exact: true,
  });
  await slowPlayback.click();
  await comparisons
    .locator("#compare-animated-list")
    .evaluate((row) =>
      row.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  const motionFrames = await page.evaluate(async () => {
    const row = document.getElementById("compare-animated-list");
    const before = row.querySelector('.cx-without [data-list-id="brief"]');
    const after = row.querySelector('.cx-with [data-list-id="brief"]');
    const read = () => [
      before.getBoundingClientRect().y,
      after.getBoundingClientRect().y,
    ];
    // Let scrolling and the speed change settle before collecting positions.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const start = read();
    row.querySelector(".cx-row-play").click();
    const frames = [];
    const began = performance.now();
    await new Promise((resolve) => {
      const sample = (now) => {
        frames.push({ time: now - began, positions: read() });
        if (now - began < 1800) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    return { start, frames };
  });
  const finalPositions = motionFrames.frames.at(-1).positions;
  const travel = finalPositions[1] - motionFrames.start[1];
  assert.ok(Math.abs(travel) > 100, "Reorder must move the keyed row");
  assert.ok(
    motionFrames.frames.some(({ positions }) => {
      const progress = (positions[1] - motionFrames.start[1]) / travel;
      return progress > 0.1 && progress < 0.9;
    }),
    "The hydrated Bera list must visibly pass through intermediate positions",
  );
  assert.ok(
    motionFrames.frames
      .filter(({ time }) => time > 100)
      .every(({ positions }) => Math.abs(positions[0] - finalPositions[0]) < 1),
    "The baseline must jump to its final position without interpolation",
  );
  assert.ok(
    Math.abs(finalPositions[0] - finalPositions[1]) < 1,
    "Both comparisons must settle at the same position",
  );
  passed(
    "hydrated list comparison visibly animates while its baseline changes immediately",
  );
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
