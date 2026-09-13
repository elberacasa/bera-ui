#!/usr/bin/env node
// Optional browser regression against the authored recipe and real React/Motion.
// npm exec --package=playwright@1.62.1 -- node scripts/test-inline-edit.mjs
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
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "bera-inline-edit-"));
let browser,
  server,
  compiler,
  checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
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
import { InlineEdit } from ${JSON.stringify(path.join(repository, "components/transitions/inline-edit.tsx"))};
const h = React.createElement;
const initial = { controlled: true, value: "Launch plan", callback: true, accept: true, mode: "deferred", validation: "", preview: false, replayKey: 0, shown: true, version: 0, width: 320, light: false };
window.calls = []; window.requests = []; window.submissions = 0;
function App() {
  const [settings, setSettings] = React.useState(initial);
  window.fixture = {
    reset: values => { window.calls = []; window.requests = []; window.submissions = 0; flushSync(() => setSettings(previous => ({ ...initial, ...values, version: previous.version + 1 }))); },
    update: values => flushSync(() => setSettings(previous => ({ ...previous, ...values }))),
    resolve: index => window.requests[index].resolve(),
    reject: (index, message) => window.requests[index].reject(new Error(message))
  };
  const onCommit = next => {
    window.calls.push(next);
    const publish = () => { if (settings.accept) setSettings(previous => ({ ...previous, value: next })); };
    if (settings.mode === "sync") { publish(); return; }
    if (settings.mode === "throw") throw new Error("Save unavailable.");
    return new Promise((resolve, reject) => window.requests.push({ resolve: () => { publish(); resolve(); }, reject }));
  };
  return h("main", { style: settings.light ? { "--foreground": "#171717", "--background": "#ffffff", background: "#fff", color: "#171717" } : {} },
    h("button", { id: "outside", type: "button" }, "Outside"),
    h("form", { id: "host", onSubmit: event => { event.preventDefault(); window.submissions++; } },
      settings.shown && h(InlineEdit, {
        key: settings.version,
        ...(settings.controlled ? { value: settings.value } : { defaultValue: settings.value }),
        onCommit: settings.callback ? onCommit : undefined,
        validate: settings.validation ? () => settings.validation : undefined,
        preview: settings.preview,
        replayKey: settings.replayKey,
        style: { width: settings.width }
      })
    )
  );
}
// Keep one real server-rendered tree unhydrated to test its initial geometry.
document.getElementById("server-preview").innerHTML = renderToString(h(InlineEdit, { preview: true }));
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
    path.join(repository, "components/transitions/inline-edit.css"),
    "utf8",
  );
  server = createServer((request, response) => {
    if (request.url === "/bundle.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(bundle);
    } else if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>body{margin:0;background:#080808;color:#eee;font:16px Arial,sans-serif}main{box-sizing:border-box;min-height:100vh;padding:16px}#host{margin:32px 0 0;width:320px;max-width:100%}#outside{font:inherit}${css}</style><div id="server-preview"></div><div id="root"></div><script src="/bundle.js"></script>`,
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
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture);
  await page.setViewportSize({ width: 320, height: 720 });
  const initialText = await page
    .locator("#server-preview .bie-value")
    .evaluate((node) => ({
      visibleWidth: node.clientWidth,
      textWidth: node.scrollWidth,
      font: getComputedStyle(node).fontSize,
      surfaceRight: node.closest(".bie-surface").getBoundingClientRect().right,
      viewport: innerWidth,
    }));
  assert.equal(initialText.font, "20px");
  assert.ok(
    initialText.textWidth <= initialText.visibleWidth,
    "The server-rendered preview title must fit before hydration measures it",
  );
  assert.ok(
    initialText.surfaceRight <= initialText.viewport,
    "Natural initial sizing must stay inside a 320px viewport",
  );
  await page.locator("#server-preview").evaluate((node) => node.remove());
  await page.setViewportSize({ width: 960, height: 720 });
  passed(
    "the server-rendered title fits immediately without relying on hydration or a guessed width",
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
  const input = page.getByRole("textbox", { name: "Project name" });
  const trigger = page.getByRole("button", { name: "Edit project name" });
  const outside = page.locator("#outside");
  const save = page.getByRole("button", { name: "Save", exact: true });
  const focused = async (locator) =>
    assert.equal(
      await locator.evaluate((node) => node === document.activeElement),
      true,
      "Expected focus on the interaction's current control",
    );
  const displayed = () => page.locator(".bie-value").textContent();
  const begin = async (value) => {
    await trigger.click();
    await focused(input);
    if (value !== undefined) await input.fill(value);
  };
  const settledGeometry = () =>
    page.waitForFunction(() => {
      const surface = document
        .querySelector(".bie-surface")
        .getBoundingClientRect();
      const content = document
        .querySelector(".bie-content")
        .getBoundingClientRect();
      return (
        Math.abs(surface.width - content.width - 2) < 0.5 &&
        Math.abs(surface.height - content.height - 2) < 0.5
      );
    });

  await mount({ callback: false });
  assert.equal(await trigger.isDisabled(), true);
  await mount({ callback: false, preview: true });
  assert.equal(
    await trigger.isDisabled(),
    true,
    "Controlled preview requires a host action too",
  );
  await mount({ controlled: false, callback: false, preview: true });
  await begin("New local name");
  await input.press("Enter");
  await focused(trigger);
  assert.equal(await displayed(), "New local name");
  assert.match(
    await page.getByRole("status").textContent(),
    /updated in this preview/,
  );
  assert.deepEqual(await calls(), []);
  passed(
    "missing actions stay inert; opt-in preview performs an accurately labelled local edit",
  );

  await mount({});
  await outside.focus();
  await page.keyboard.press("Tab");
  await focused(trigger);
  await page.keyboard.press("Enter");
  await focused(input);
  await input.fill("Draft name");
  await outside.click();
  assert.equal(await input.inputValue(), "Draft name");
  assert.deepEqual(await calls(), [], "Blur must not save");
  await input.focus();
  await input.press("Escape");
  await focused(trigger);
  assert.equal(await displayed(), "Launch plan");
  await begin();
  await input.press("Enter");
  await focused(trigger);
  assert.deepEqual(
    await calls(),
    [],
    "Unchanged values must not call the application",
  );
  assert.equal(await page.evaluate(() => window.submissions), 0);
  passed(
    "keyboard entry, cancellation and unchanged save preserve focus and never submit the host form",
  );

  await begin("新しい名前");
  await input.dispatchEvent("compositionstart", { data: "名" });
  await input.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    isComposing: true,
  });
  await input.dispatchEvent("keydown", {
    key: "Enter",
    code: "Enter",
    keyCode: 229,
  });
  await input.dispatchEvent("keydown", {
    key: "Escape",
    code: "Escape",
    isComposing: true,
  });
  await save.click();
  assert.equal(await input.isVisible(), true);
  assert.deepEqual(await calls(), [], "Composition must not save or cancel");
  await input.dispatchEvent("compositionend", { data: "名前" });
  await input.focus();
  await input.press("Enter");
  await input.press("Enter");
  assert.deepEqual(await calls(), ["新しい名前"]);
  assert.equal(await input.getAttribute("readonly"), "");
  assert.equal(
    await page
      .getByRole("group", { name: "Project name" })
      .getAttribute("aria-busy"),
    "true",
  );
  assert.match(await page.getByRole("status").textContent(), /^Saving/);
  // Dispatch exercises the handler even though aria-disabled protects normal browser automation.
  await page.locator(".bie-save").dispatchEvent("click");
  assert.deepEqual(
    await calls(),
    ["新しい名前"],
    "Pending saves cannot duplicate the callback",
  );
  await resolve(0);
  await focused(trigger);
  assert.equal(await displayed(), "新しい名前");
  assert.equal(
    await page.getByRole("status").textContent(),
    "Project name saved.",
  );
  assert.equal(await page.evaluate(() => window.submissions), 0);
  passed(
    "IME is protected; actual pending completion saves once and restores originating focus",
  );

  await mount({});
  await begin("   ");
  await save.click();
  await focused(input);
  assert.equal(await input.inputValue(), "   ");
  assert.equal(await input.getAttribute("aria-invalid"), "true");
  assert.equal(await page.getByRole("alert").textContent(), "Enter a value.");
  assert.deepEqual(await calls(), []);
  await input.fill("Revised plan");
  assert.equal(await page.getByRole("alert").count(), 0);
  await save.click();
  await page.evaluate(() => window.fixture.reject(0, "Name already exists."));
  await settle();
  await focused(input);
  assert.equal(await input.inputValue(), "Revised plan");
  assert.equal(
    await page.getByRole("alert").textContent(),
    "Name already exists.",
  );
  await input.fill("Revised plan two");
  await input.press("Enter");
  await resolve(1);
  await focused(trigger);
  assert.equal(await displayed(), "Revised plan two");
  await mount({ mode: "throw" });
  await begin("Retry later");
  await save.click();
  await settle();
  assert.equal(
    await page.getByRole("alert").textContent(),
    "Save unavailable.",
  );
  await focused(input);
  passed(
    "validation and rejected or thrown saves retain the draft, clear on typing and permit retry",
  );

  await mount({});
  await begin("First request");
  await input.press("Enter");
  await input.press("Escape");
  await focused(trigger);
  assert.equal(await trigger.getAttribute("aria-disabled"), "true");
  await trigger.dispatchEvent("click");
  await trigger.press("Enter");
  assert.equal(
    await input.count(),
    0,
    "A closed pending save must prevent a second host write",
  );
  assert.deepEqual(await calls(), ["First request"]);
  await resolve(0);
  await focused(trigger);
  assert.equal(await displayed(), "First request");
  await begin("Second request");
  await input.press("Enter");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.evaluate(() =>
    window.fixture.reject(1, "Connection interrupted."),
  );
  await settle();
  await focused(trigger);
  assert.match(
    await page.getByRole("status").textContent(),
    /could not be saved/,
  );
  await begin();
  assert.equal(
    await input.inputValue(),
    "Second request",
    "Closed failures must keep the submitted draft for retry",
  );
  await input.press("Enter");
  await resolve(2);
  assert.equal(await displayed(), "Second request");
  await update({ accept: false });
  await begin("Unmounted request");
  await input.press("Enter");
  await update({ shown: false });
  await outside.focus();
  await update({ shown: true });
  await focused(outside);
  await begin("Fresh draft");
  await resolve(3);
  assert.equal(await input.inputValue(), "Fresh draft");
  await focused(input);
  await input.press("Escape");
  assert.equal(await displayed(), "Second request");
  assert.deepEqual(await calls(), [
    "First request",
    "Second request",
    "Second request",
    "Unmounted request",
  ]);
  passed(
    "closing serializes real host saves; closed errors preserve retry drafts; unmounted replies cannot alter a fresh editor",
  );

  await mount({});
  await begin("Preserved draft");
  await input.evaluate((node) => {
    window.originalInput = node;
    node.setSelectionRange(2, 7);
  });
  await update({ replayKey: 1 });
  await focused(input);
  assert.deepEqual(
    await input.evaluate((node) => [
      node === window.originalInput,
      node.selectionStart,
      node.selectionEnd,
    ]),
    [true, 2, 7],
  );
  assert.equal(await input.inputValue(), "Preserved draft");
  assert.deepEqual(await calls(), []);
  await input.press("Enter");
  await update({ replayKey: 2 });
  assert.equal(
    await page
      .getByRole("group", { name: "Project name" })
      .getAttribute("aria-busy"),
    "true",
  );
  assert.deepEqual(await calls(), ["Preserved draft"]);
  await outside.click();
  await resolve(0);
  await focused(outside);
  await update({ replayKey: 3 });
  await focused(outside);
  assert.equal(await displayed(), "Preserved draft");
  passed(
    "replay preserves the live input, selection and pending save; completion never steals outside focus",
  );

  await mount({ accept: false });
  await begin("Host decides");
  await input.press("Enter");
  await resolve(0);
  assert.equal(
    await displayed(),
    "Launch plan",
    "Controlled value must remain authoritative after success",
  );
  await update({ value: "Published by host" });
  assert.equal(await displayed(), "Published by host");
  await begin("Private draft");
  await update({ value: "Remote update" });
  assert.equal(await input.inputValue(), "Private draft");
  await input.press("Escape");
  assert.equal(await displayed(), "Remote update");
  await mount({ controlled: false, mode: "sync" });
  await begin("Uncontrolled save");
  await input.press("Enter");
  await settle();
  assert.equal(await displayed(), "Uncontrolled save");
  passed(
    "host-controlled values stay authoritative; external changes preserve drafts; uncontrolled saves update locally",
  );

  await page.setViewportSize({ width: 320, height: 700 });
  for (const width of [280, 320]) {
    await mount({
      preview: true,
      width,
      value: "A long project title ".repeat(18),
      light: true,
    });
    await settledGeometry();
    const origin = await page.locator(".bie-value").evaluate((node) => ({
      left: node.getBoundingClientRect().left,
      top: node.getBoundingClientRect().top,
      font: getComputedStyle(node).fontSize,
    }));
    await begin("Narrow project");
    await settledGeometry();
    const inputStyle = await input.evaluate((node) => ({
      left:
        node.getBoundingClientRect().left +
        parseFloat(getComputedStyle(node).paddingLeft),
      top:
        node.getBoundingClientRect().top +
        parseFloat(getComputedStyle(node).paddingTop),
      font: getComputedStyle(node).fontSize,
    }));
    assert.equal(origin.font, "20px");
    assert.equal(inputStyle.font, origin.font);
    assert.ok(
      Math.abs(origin.left - inputStyle.left) <= 1 &&
        Math.abs(origin.top - inputStyle.top) <= 1,
      "Text origin must stay continuous",
    );
    await update({ validation: "Choose a shorter name. ".repeat(12) });
    await save.click();
    await settledGeometry();
    assert.equal(await input.inputValue(), "Narrow project");
    await focused(input);
    const geometry = await page.locator(".bie-root").evaluate((root) => {
      const frame = root.getBoundingClientRect();
      const host = root.closest("#host").getBoundingClientRect();
      const surface = root
        .querySelector(".bie-surface")
        .getBoundingClientRect();
      const bounds = [
        ...root.querySelectorAll("input, .bie-cancel, .bie-save, .bie-error"),
      ].map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          control: node.matches("input,button"),
        };
      });
      return {
        left: Math.max(frame.left, host.left),
        right: Math.min(frame.right, host.right, innerWidth),
        top: surface.top,
        bottom: surface.bottom,
        bounds,
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
        ink: getComputedStyle(root.querySelector("input")).color,
      };
    });
    assert.ok(
      geometry.scroll <= geometry.viewport,
      "Invisible measurement and long content cannot overflow the viewport",
    );
    for (const bounds of geometry.bounds) {
      assert.ok(
        bounds.left >= geometry.left - 1 &&
          bounds.right <= geometry.right + 1 &&
          bounds.top >= geometry.top - 1 &&
          bounds.bottom <= geometry.bottom + 1,
        "Visible content must fit both the host and measured editor surface",
      );
      if (bounds.control)
        assert.ok(bounds.height >= 44, "Every control has a 44px target");
    }
    assert.equal(
      geometry.ink,
      "rgb(23, 23, 23)",
      "Minimal light host tokens must be inherited",
    );
    await input.press("Escape");
    await focused(trigger);
  }
  passed(
    "280/320px previews preserve typography and text origin, contain long errors and inherit light host tokens",
  );

  await mount({});
  await begin("Reduced motion save");
  await input.press("Enter");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => document.querySelector(".bie-root").dataset.reduced === "true",
  );
  await update({ replayKey: 1 });
  assert.equal(await input.inputValue(), "Reduced motion save");
  await focused(input);
  assert.deepEqual(await calls(), ["Reduced motion save"]);
  await resolve(0);
  await focused(trigger);
  assert.equal(await displayed(), "Reduced motion save");
  assert.equal(await page.evaluate(() => window.submissions), 0);
  passed(
    "live reduced motion preserves a pending operation and its final keyboard behavior",
  );
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(`Passed ${checks} inline-edit checks in ${browser.version()}.`);
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
