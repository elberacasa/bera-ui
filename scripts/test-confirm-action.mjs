#!/usr/bin/env node
// Optional browser regression against authored and extracted React/Motion source.
// npm exec --package=playwright@1.62.1 -- node scripts/test-confirm-action.mjs
// Or: --playwright /absolute/path/to/playwright --channel chrome
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
const { webpack } = require("next/dist/compiled/webpack/webpack");
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), "bera-confirm-browser-"),
);
let browser,
  server,
  compiler,
  checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
  const { extractTransition } = await import("./extract-transition.mjs");
  const source = await fs.readFile(
    path.join(repository, "components/transitions/confirm-action.tsx"),
    "utf8",
  );
  const preference = (
    await fs.readFile(
      path.join(repository, "components/transitions/use-motion-preference.ts"),
      "utf8",
    )
  ).replace(/^"use client";\s*/, "");
  const standalone = extractTransition(
    source.replace(
      'import { useMotionPreference } from "./use-motion-preference";',
      preference,
    ),
    "ConfirmAction",
    "confirm-action",
  );
  assert.ok(!standalone.includes('from "./use-motion-preference"'));
  await fs.writeFile(path.join(temporary, "confirm-action.tsx"), standalone);
  await fs.copyFile(
    path.join(repository, "components/transitions/confirm-action.css"),
    path.join(temporary, "confirm-action.css"),
  );
  const loader = path.join(temporary, "typescript-loader.cjs");
  await fs.writeFile(
    loader,
    `const ts = require(${JSON.stringify(require.resolve("typescript"))}); module.exports = source => ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;`,
  );
  await fs.writeFile(
    path.join(temporary, "entry.js"),
    `
import React from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server.browser";
import { flushSync } from "react-dom";
import { ConfirmAction as Authored } from ${JSON.stringify(path.join(repository, "components/transitions/confirm-action.tsx"))};
import { ConfirmAction as Standalone } from "./confirm-action.tsx";
const h = React.createElement;
const initial = { callback: true, mode: "deferred", replayKey: 0, shown: true, hidden: false, version: 0, width: 320, light: false, labels: {}, preview: false };
window.calls = []; window.requests = []; window.completed = 0; window.submissions = 0;
function App() {
  const [settings, setSettings] = React.useState(initial);
  window.fixture = {
    reset: values => { window.calls = []; window.requests = []; window.completed = 0; window.submissions = 0; flushSync(() => setSettings(previous => ({ ...initial, ...values, version: previous.version + 1 }))); },
    update: values => flushSync(() => setSettings(previous => ({ ...previous, ...values }))),
    resolve: index => window.requests[index].resolve(),
    reject: (index, message) => window.requests[index].reject(new Error(message))
  };
  const onConfirm = kind => {
    window.calls.push(kind);
    if (settings.mode === "throw") throw new Error("Archive unavailable.");
    if (settings.mode === "sync") { window.completed++; return; }
    return new Promise((resolve, reject) => window.requests.push({ resolve: () => { window.completed++; resolve(); }, reject }));
  };
  return h("main", { style: settings.light ? { "--foreground": "#171717", "--background": "#ffffff", background: "#fff", color: "#171717" } : {} },
    h("button", { id: "outside", type: "button" }, "Outside"),
    h("form", { onSubmit: event => { event.preventDefault(); window.submissions++; } },
      ...[["authored", Authored], ["standalone", Standalone]].map(([kind, Component]) => h("section", { id: kind, key: kind + settings.version, hidden: kind === "standalone" && settings.hidden },
        settings.shown && h(Component, { onConfirm: settings.callback ? () => onConfirm(kind) : undefined, preview: settings.preview, replayKey: settings.replayKey, style: { width: settings.width }, ...settings.labels })
      ))
    )
  );
}
document.getElementById("server-preview").innerHTML = renderToString(h(React.Fragment, null,
  h(Authored, { preview: true }),
  h("div", { id: "server-long" }, h(Standalone, { label: "Archive this exceptionally long project name and all its related resources", style: { width: 228 } }))
));
createRoot(document.getElementById("root")).render(h(React.StrictMode, null, h(App)));
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
      extensions: [".tsx", ".ts", ".js", ".json"],
    },
    module: {
      rules: [
        { test: /\.tsx?$/, use: loader },
        { test: /\.css$/, type: "asset/source" },
      ],
    },
    optimization: { minimize: false },
  });
  await new Promise((resolve, reject) =>
    compiler.run((error, stats) =>
      error
        ? reject(error)
        : stats.hasErrors()
          ? reject(new Error(stats.toString("errors-only")))
          : resolve(),
    ),
  );
  const bundle = await fs.readFile(path.join(temporary, "bundle.js"));
  const css = await fs.readFile(
    path.join(repository, "components/transitions/confirm-action.css"),
    "utf8",
  );
  server = createServer((request, response) => {
    if (request.url === "/bundle.js") {
      response.setHeader("Content-Type", "text/javascript; charset=utf-8");
      response.end(bundle);
    } else if (request.url === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(
        `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0;background:#080808;color:#eee;font:16px Arial,sans-serif}main{box-sizing:border-box;min-height:100vh;padding:16px}section{margin:24px 0;width:320px;max-width:100%}section[hidden]{display:none}#outside{font:inherit}${css}</style><div id="server-preview"></div><div id="root"></div><script src="/bundle.js"></script>`,
      );
    } else {
      response.statusCode = 404;
      response.end();
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
  const page = await browser.newPage({ viewport: { width: 960, height: 800 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture);
  await page.setViewportSize({ width: 320, height: 800 });
  const initialGeometry = await page
    .locator("#server-preview > .bca-root")
    .evaluate((root) => {
      const label = root.querySelector(".bca-label");
      return {
        visible: label.clientWidth,
        text: label.scrollWidth,
        right: root.querySelector(".bca-surface").getBoundingClientRect().right,
        viewport: innerWidth,
      };
    });
  assert.ok(
    initialGeometry.text <= initialGeometry.visible &&
      initialGeometry.right <= initialGeometry.viewport,
    "The server-rendered button must fit before hydration measures it",
  );
  assert.equal(
    await page.locator("#server-long .bca-root").evaluate((root) => {
      const surface = root
        .querySelector(".bca-surface")
        .getBoundingClientRect();
      const label = root.querySelector(".bca-label").getBoundingClientRect();
      return (
        label.left >= surface.left &&
        label.right <= surface.right &&
        label.top >= surface.top &&
        label.bottom <= surface.bottom &&
        surface.right <= innerWidth
      );
    }),
    true,
    "An unhydrated long label must determine its natural height inside a228px surface",
  );
  await page.locator("#server-preview").evaluate((node) => node.remove());
  await page.setViewportSize({ width: 960, height: 800 });
  passed(
    "server-rendered confirmation has a complete label and bounded natural width",
  );

  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  const mount = async (settings) => {
    await page.evaluate((value) => window.fixture.reset(value), settings);
    await settle();
  };
  const update = async (settings) => {
    await page.evaluate((value) => window.fixture.update(value), settings);
    await settle();
  };
  const resolve = async (index) => {
    await page.evaluate((value) => window.fixture.resolve(value), index);
    await settle();
  };
  const calls = () => page.evaluate(() => window.calls);
  const focused = async (locator) =>
    assert.equal(
      await locator.evaluate((node) => node === document.activeElement),
      true,
      "Focus must remain with the originating interaction",
    );
  const geometrySettled = (scope) =>
    scope.locator(".bca-surface").evaluate(async (surface) => {
      for (let frame = 0; frame < 180; frame++) {
        const box = surface.getBoundingClientRect();
        const content = surface
          .querySelector(".bca-content")
          .getBoundingClientRect();
        if (
          Math.abs(box.width - content.width - 2) < 0.6 &&
          Math.abs(box.height - content.height - 2) < 1.1
        )
          return;
        await new Promise(requestAnimationFrame);
      }
      throw new Error("Measured surface did not settle around its contents");
    });
  const outside = page.locator("#outside");

  for (const kind of ["authored", "standalone"]) {
    const scope = page.locator(`#${kind}`);
    const trigger = () =>
      scope.getByRole("button", { name: "Archive project", exact: true });
    const cancel = () =>
      scope.getByRole("button", { name: "Cancel", exact: true });
    const confirm = () =>
      scope.getByRole("button", { name: "Archive", exact: true });
    const status = () => scope.getByRole("status");
    const arm = async () => {
      await trigger().click();
      await focused(cancel());
    };

    await mount({ callback: false });
    assert.equal(await trigger().isDisabled(), true);
    await mount({ callback: false, preview: true });
    await arm();
    await geometrySettled(scope);
    assert.equal(
      await scope.locator(".bca-row").evaluate((row) => {
        const context = row
          .querySelector(".bca-context")
          .getBoundingClientRect();
        const actions = row
          .querySelector(".bca-actions")
          .getBoundingClientRect();
        return Math.abs(context.top - actions.top) < 1;
      }),
      true,
      "The normal 320px preview must unfold horizontally within its padded 288px host",
    );
    assert.deepEqual(await calls(), []);
    await confirm().click();
    await settle();
    assert.equal(
      await scope.locator(".bca-preview-heading small").textContent(),
      "Archived locally",
    );
    assert.match(await status().textContent(), /in this local preview/);
    await scope.getByRole("button", { name: "Restore project" }).click();
    await focused(trigger());
    assert.equal(
      await scope.locator(".bca-preview-heading small").textContent(),
      "Local preview",
    );
    assert.deepEqual(await calls(), []);
    passed(
      `${kind}: missing actions stay inert; preview archives and restores real local state`,
    );

    await mount({});
    await trigger().focus();
    await page.keyboard.down("Enter");
    await focused(cancel());
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    await focused(cancel());
    assert.deepEqual(await calls(), []);
    await page.keyboard.press("Escape");
    await focused(trigger());
    await trigger().dblclick();
    await focused(cancel());
    assert.deepEqual(
      await calls(),
      [],
      "Rapid activation may arm but cannot confirm",
    );
    await cancel().click();
    await focused(trigger());
    await arm();
    await outside.click();
    assert.equal(
      await cancel().isVisible(),
      true,
      "Blur must not cancel or run the action",
    );
    await cancel().focus();
    await cancel().press("Enter");
    await focused(trigger());
    assert.equal(await page.evaluate(() => window.submissions), 0);
    passed(
      `${kind}: held Enter, double click, explicit cancel and Escape never skip confirmation or submit a host form`,
    );

    await arm();
    await page.keyboard.press("Tab");
    await focused(confirm());
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    assert.deepEqual(await calls(), [kind]);
    assert.equal(
      await scope.getByRole("group").getAttribute("aria-busy"),
      "true",
    );
    assert.equal(await status().textContent(), "Archiving…");
    assert.equal(await page.evaluate(() => window.completed), 0);
    await scope.locator(".bca-confirm").dispatchEvent("click");
    await cancel().dispatchEvent("click");
    await cancel().press("Escape");
    assert.deepEqual(await calls(), [kind]);
    assert.equal(
      await scope.getByRole("group").getAttribute("aria-busy"),
      "true",
      "Accepted work cannot be cancelled by hiding its pending state",
    );
    await scope.locator(".bca-confirm").focus();
    await resolve(0);
    const success = scope.getByRole("button", {
      name: "Archived",
      exact: true,
    });
    await focused(success);
    assert.equal(await page.evaluate(() => window.completed), 1);
    assert.equal(await success.getAttribute("aria-disabled"), "true");
    await success.dispatchEvent("click");
    await success.press("Enter");
    await update({ replayKey: 1 });
    assert.equal(await scope.getByRole("group").count(), 0);
    assert.deepEqual(await calls(), [kind]);
    passed(
      `${kind}: exactly one real transaction stays pending until completion; success persists without automatic or replay re-arming`,
    );

    await mount({});
    await arm();
    await confirm().click();
    await page.evaluate(() =>
      window.fixture.reject(0, "Project has active releases."),
    );
    await settle();
    assert.equal(
      await scope.getByRole("alert").textContent(),
      "Project has active releases.",
    );
    await focused(confirm());
    await confirm().click();
    assert.equal(await scope.getByRole("alert").count(), 0);
    await resolve(1);
    assert.equal(
      await scope
        .getByRole("button", { name: "Archived", exact: true })
        .count(),
      1,
    );
    await mount({ mode: "throw" });
    await arm();
    await confirm().click();
    await settle();
    assert.equal(
      await scope.getByRole("alert").textContent(),
      "Archive unavailable.",
    );
    await focused(confirm());
    await update({ replayKey: 1 });
    assert.equal(
      await scope.getByRole("alert").textContent(),
      "Archive unavailable.",
    );
    assert.deepEqual(await calls(), [kind]);
    await cancel().click();
    await focused(trigger());
    passed(
      `${kind}: rejection and thrown errors stay armed for retry; replay preserves errors and cancellation remains explicit`,
    );

    await mount({});
    await arm();
    await cancel().evaluate((node) => {
      window.originalCancel = node;
    });
    await update({ replayKey: 1 });
    await focused(cancel());
    assert.equal(
      await cancel().evaluate((node) => node === window.originalCancel),
      true,
    );
    assert.deepEqual(await calls(), []);
    await confirm().click();
    await update({ replayKey: 2 });
    assert.equal(
      await scope.getByRole("group").getAttribute("aria-busy"),
      "true",
    );
    await outside.click();
    await resolve(0);
    await focused(outside);
    await mount({});
    await arm();
    await confirm().click();
    await update({ shown: false });
    await outside.focus();
    await update({ shown: true });
    await arm();
    await resolve(0);
    await focused(cancel());
    assert.equal(
      await scope.getByRole("group").getAttribute("aria-busy"),
      "false",
    );
    assert.deepEqual(await calls(), [kind]);
    passed(
      `${kind}: replay preserves live focus and pending state; outside focus and newly mounted confirmation ignore stale replies`,
    );

    await page.setViewportSize({ width: 320, height: 900 });
    for (const width of [228, 320]) {
      await mount({ width, light: true });
      await geometrySettled(scope);
      const before = await scope.locator(".bca-label").evaluate((node) => ({
        left: node.getBoundingClientRect().left,
        top: node.getBoundingClientRect().top,
      }));
      await arm();
      await geometrySettled(scope);
      const after = await scope.locator(".bca-label").evaluate((node) => ({
        left: node.getBoundingClientRect().left,
        top: node.getBoundingClientRect().top,
      }));
      assert.ok(
        Math.abs(before.left - after.left) < 1 &&
          Math.abs(before.top - after.top) < 1,
        "The label must retain both text origins while controls unfold",
      );
      await cancel().click();
      await update({
        labels: {
          label: "Archive this exceptionally long project name",
          confirmLabel: "Archive this project permanently",
          cancelLabel: "Keep this project available",
          pendingLabel: "Archiving the selected project…",
        },
      });
      await scope.locator(".bca-trigger").click();
      await geometrySettled(scope);
      await scope.locator(".bca-confirm").click();
      await geometrySettled(scope);
      await page.evaluate(() =>
        window.fixture.reject(0, "CheckPermissionsBeforeArchiving".repeat(12)),
      );
      await settle();
      await geometrySettled(scope);
      const geometry = await scope.locator(".bca-root").evaluate((root) => {
        const host = root.getBoundingClientRect();
        const surface = root
          .querySelector(".bca-surface")
          .getBoundingClientRect();
        return {
          left: Math.max(host.left, surface.left),
          right: Math.min(host.right, surface.right, innerWidth),
          top: surface.top,
          bottom: surface.bottom,
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
          ink: getComputedStyle(root).color,
          controls: [
            ...root.querySelectorAll(
              ".bca-label, .bca-actions button, .bca-error",
            ),
          ].map((node) => {
            const r = node.getBoundingClientRect();
            return {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              height: r.height,
              button: node.matches("button"),
            };
          }),
        };
      });
      assert.ok(geometry.scroll <= geometry.viewport);
      assert.equal(geometry.ink, "rgb(23, 23, 23)");
      for (const bounds of geometry.controls) {
        assert.ok(
          bounds.left >= geometry.left - 1 &&
            bounds.right <= geometry.right + 1 &&
            bounds.top >= geometry.top - 1 &&
            bounds.bottom <= geometry.bottom + 1,
          "Long labels and error text must fit the host and measured surface",
        );
        if (bounds.button) assert.ok(bounds.height >= 44);
      }
      await scope.locator(".bca-cancel").press("Escape");
    }
    passed(
      `${kind}: 228/320px surfaces retain text origin, wrap long controls/errors, and inherit light host tokens`,
    );

    await page.setViewportSize({ width: 960, height: 800 });
    await mount({});
    await arm();
    await confirm().click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => document.querySelector(".bca-root").dataset.reduced === "true",
    );
    await update({ replayKey: 1 });
    assert.deepEqual(await calls(), [kind]);
    await focused(scope.locator(".bca-confirm"));
    await resolve(0);
    await focused(scope.getByRole("button", { name: "Archived", exact: true }));
    assert.equal(await page.evaluate(() => window.submissions), 0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    passed(
      `${kind}: live reduced motion preserves transaction results and keyboard focus`,
    );
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    `Passed ${checks} confirm-action checks in ${browser.version()}.`,
  );
} finally {
  await browser?.close();
  server?.closeAllConnections();
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (compiler)
    await new Promise((resolve, reject) =>
      compiler.close((error) => (error ? reject(error) : resolve())),
    );
  await fs.rm(temporary, { recursive: true, force: true });
}
