#!/usr/bin/env node
// Optional real-browser regression, using installed React/Motion and authored source.
// npm exec --package=playwright@1.62.1 -- node scripts/test-expanding-search.mjs
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
  path.join(os.tmpdir(), "bera-search-browser-"),
);
let browser,
  server,
  compiler,
  checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
  // TypeScript only transpiles syntax; real component logic and dependencies run.
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
import { flushSync } from "react-dom";
import { ExpandingSearch } from ${JSON.stringify(path.join(repository, "components/transitions/selection.tsx"))};
import { SearchComparisonPreview } from ${JSON.stringify(path.join(repository, "components/comparisons/search-preview.tsx"))};
const h = React.createElement;
const initial = { controlled: true, open: false, value: "", accept: true, mirrors: true, hidden: false, replayKey: 0, version: 0 };
window.events = [];
window.submissions = 0;
document.addEventListener("submit", () => window.submissions++, true);
function App() {
  const [settings, setSettings] = React.useState(initial);
  window.fixture = {
    reset: values => { window.events = []; window.submissions = 0; flushSync(() => setSettings(previous => ({ ...initial, ...values, version: previous.version + 1 }))); },
    update: values => flushSync(() => setSettings(previous => ({ ...previous, ...values })))
  };
  function preview(id) {
    const callbacks = {
      onOpenChange: value => { window.events.push(["open", id, value]); if (settings.controlled && settings.accept) setSettings(previous => ({ ...previous, open: value })); },
      onValueChange: value => { window.events.push(["value", id, value]); if (settings.controlled) setSettings(previous => ({ ...previous, value })); },
      onSearch: value => window.events.push(["search", id, value])
    };
    const state = settings.controlled ? { open: settings.open, value: settings.value } : { defaultOpen: settings.defaultOpen, defaultValue: settings.value };
    return h("section", { id, key: id + settings.version, hidden: id === "right" && settings.hidden },
      h(settings.baseline ? SearchComparisonPreview : ExpandingSearch, { ...state, ...callbacks, enhanced: false, speed: 1, replayKey: settings.replayKey, items: ["Tabs", "Accordion", "Search"] }));
  }
  return h("main", null, h("button", { id: "outside" }, "Outside"), preview("left"), settings.mirrors && preview("right"));
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
  const css = (
    await Promise.all(
      [
        "components/transitions/selection.css",
        "components/comparisons/search-preview.css",
      ].map((file) => fs.readFile(path.join(repository, file), "utf8")),
    )
  ).join("\n");
  server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/bundle.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/bundle.js"
        ? bundle
        : `<!doctype html><style>body{margin:40px;background:#111;color:#eee;font:16px sans-serif}section{margin:32px 0;width:300px}section[hidden]{display:none}${css}</style><div id="root"></div><script src="/bundle.js"></script>`,
    );
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
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture);
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
  const input = (id = "left") => page.locator(`#${id} input`);
  const trigger = (id = "left") => page.locator(`#${id} .bs-search-trigger`);
  const focused = async (locator) =>
    assert.equal(
      await locator.evaluate((node) => node === document.activeElement),
      true,
    );
  const states = () =>
    page
      .locator("section form")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.open));
  const events = () => page.evaluate(() => window.events);

  await mount({ controlled: false, mirrors: false });
  assert.deepEqual(await states(), ["false"]);
  await trigger().click();
  await focused(input());
  assert.deepEqual(await events(), [["open", "left", true]]);
  await input().fill("Tabs");
  await page.keyboard.press("Escape");
  await focused(trigger());
  await page.locator("#outside").click();
  const legacyEvents = await events();
  await update({ replayKey: 1 });
  assert.deepEqual(await states(), ["true"]);
  assert.equal(await input().inputValue(), "Tabs");
  await focused(page.locator("#outside"));
  assert.deepEqual(await events(), legacyEvents);
  passed(
    "uncontrolled open, query, Escape and replay retain existing behavior",
  );

  for (const [defaultOpen, value, expected] of [
    [true, "", "true"],
    [false, "Tabs", "false"],
    [undefined, "Tabs", "true"],
  ]) {
    await page.locator("#outside").click();
    await mount({ controlled: false, mirrors: false, defaultOpen, value });
    assert.deepEqual(await states(), [expected]);
    await focused(page.locator("#outside"));
    assert.deepEqual(await events(), []);
  }
  passed(
    "defaultOpen overrides query-derived initial disclosure without autofocus",
  );

  await mount({});
  await trigger().click();
  await focused(input());
  assert.deepEqual(await states(), ["true", "true"]);
  assert.deepEqual(
    await events(),
    [["open", "left", true]],
    "Opening must not submit the search",
  );
  await input().fill("Accordion");
  assert.equal(await input("right").inputValue(), "Accordion");
  await page.keyboard.press("Enter");
  await trigger().click();
  await input("right").focus();
  await page.keyboard.press("Escape");
  assert.deepEqual(await states(), ["false", "false"]);
  await focused(trigger("right"));
  assert.deepEqual(await events(), [
    ["open", "left", true],
    ["value", "left", "Accordion"],
    ["search", "left", "Accordion"],
    ["search", "left", "Accordion"],
    ["open", "right", false],
  ]);
  passed(
    "opening never submits; explicit Enter and submit each run once; Escape focuses its origin",
  );

  await page.locator("#outside").click();
  await mount({});
  await update({ open: true, value: "Tabs" });
  await focused(page.locator("#outside"));
  assert.deepEqual(await input().inputValue(), "Tabs");
  await update({ open: false, value: "Search" });
  await focused(page.locator("#outside"));
  assert.deepEqual(await events(), []);
  passed(
    "external disclosure and query updates emit nothing and never move focus",
  );

  await mount({ accept: false });
  await trigger().click();
  assert.deepEqual(await states(), ["false", "false"]);
  await focused(trigger());
  await page.locator("#outside").click();
  await update({ open: true });
  await focused(page.locator("#outside"));
  await input().focus();
  await page.keyboard.press("Escape");
  assert.deepEqual(await states(), ["true", "true"]);
  await focused(input());
  await page.locator("#outside").click();
  await update({ open: false });
  await focused(page.locator("#outside"));
  assert.deepEqual(await events(), [
    ["open", "left", true],
    ["open", "left", false],
  ]);
  passed(
    "rejected controlled requests clear focus intent before later external updates",
  );

  await mount({ open: true, value: "Tabs" });
  await input().focus();
  await input().evaluate((node) => {
    window.originalInput = node;
  });
  await update({ replayKey: 1 });
  await focused(input());
  assert.equal(
    await input().evaluate((node) => node === window.originalInput),
    true,
  );
  assert.equal(await input().inputValue(), "Tabs");
  assert.deepEqual(await states(), ["true", "true"]);
  await page.locator("#outside").click();
  await update({ open: false, replayKey: 2 });
  await update({ replayKey: 3 });
  assert.deepEqual(await states(), ["false", "false"]);
  await update({ open: true });
  assert.equal(await input().inputValue(), "Tabs");
  await focused(page.locator("#outside"));
  assert.deepEqual(await events(), []);
  passed(
    "controlled replay preserves disclosure, query, focused input and all callbacks",
  );

  await mount({ hidden: true });
  await trigger().click();
  await focused(input());
  assert.equal(await input("right").isVisible(), false);
  await input().fill("Search");
  assert.equal(await input("right").inputValue(), "Search");
  await update({ replayKey: 1 });
  await focused(input());
  await page.keyboard.press("Escape");
  await focused(trigger());
  passed(
    "a hidden synchronized mirror cannot take focus during open, typing or replay",
  );

  for (const baseline of [false, true]) {
    await mount({ baseline, mirrors: false });
    await trigger().click();
    await focused(input());
    assert.equal(await page.evaluate(() => window.submissions), 0);
    assert.equal(
      await page
        .locator("#left form")
        .evaluate((node) => getComputedStyle(node).outlineStyle),
      "none",
      "Pointer opening must not create a form focus ring",
    );
    await page.locator("#outside").click();
    await page.keyboard.press("Tab");
    await focused(trigger());
    assert.equal(
      await page
        .locator("#left form")
        .evaluate((node) => getComputedStyle(node).outlineStyle),
      "solid",
      "Keyboard entry needs visible form focus",
    );
    assert.equal(
      await input().evaluate((node) => getComputedStyle(node).outlineStyle),
      "none",
    );
    await input().focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => window.submissions), 1);
    await trigger().click();
    assert.equal(await page.evaluate(() => window.submissions), 2);
  }
  passed(
    "real and baseline search omit pointer rings but show keyboard form focus",
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#outside").click();
  await mount({ value: "Tabs" });
  for (const open of [true, false, true, false]) await update({ open });
  await focused(page.locator("#outside"));
  await trigger("right").click();
  await focused(input("right"));
  assert.equal(await input().inputValue(), "Tabs");
  assert.deepEqual(await events(), [["open", "right", true]]);
  passed(
    "reduced motion and rapid external reversal preserve state and focus isolation",
  );
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    `Passed ${checks} expanding-search checks in ${browser.version()}.`,
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
