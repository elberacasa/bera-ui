#!/usr/bin/env node
// Optional real-browser regression, using installed React/Motion and authored source.
// npm exec --package=playwright@1.62.1 -- node scripts/test-selection-toolbar.mjs
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
  path.join(os.tmpdir(), "bera-toolbar-browser-"),
);
let browser,
  server,
  compiler,
  checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
  const { extractTransition } = await import("./extract-transition.mjs");
  const source = await fs.readFile(
    path.join(repository, "components/transitions/selection-toolbar.tsx"),
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
    "SelectionToolbar",
    "selection-toolbar",
  );
  assert.ok(!standalone.includes('from "./use-motion-preference"'));
  await fs.writeFile(path.join(temporary, "selection-toolbar.tsx"), standalone);
  await fs.copyFile(
    path.join(repository, "components/transitions/selection-toolbar.css"),
    path.join(temporary, "selection-toolbar.css"),
  );
  const loader = path.join(temporary, "typescript-loader.cjs");
  await fs.writeFile(
    loader,
    `const ts=require(${JSON.stringify(require.resolve("typescript"))});module.exports=s=>ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText;`,
  );
  await fs.writeFile(
    path.join(temporary, "entry.js"),
    `
import React from "react";import {createRoot} from "react-dom/client";import {flushSync} from "react-dom";
import {SelectionToolbar as Authored} from ${JSON.stringify(path.join(repository, "components/transitions/selection-toolbar.tsx"))};
import {SelectionToolbar as Standalone} from "./selection-toolbar.tsx";
const h=React.createElement;const initial={count:0,replayKey:0,hidden:false,acceptClear:true,version:0};
window.calls=[];window.pending={};
function App(){
 const [state,setState]=React.useState(initial);const target=React.useRef(null);
 window.fixture={update:values=>flushSync(()=>setState(previous=>({...previous,...values}))),reset:values=>{window.calls=[];flushSync(()=>setState(previous=>({...initial,...values,version:previous.version+1})))}};
 return h("main",null,h("button",{id:"return",ref:target},"Selection source"),h("button",{id:"outside"},"Outside"),
 ...[["authored",Authored],["standalone",Standalone]].map(([kind,Component])=>h("section",{id:kind,key:kind+state.version,hidden:kind==="standalone"&&state.hidden},h(Component,{count:state.count,replayKey:state.replayKey,speed:.4,returnFocusRef:target,onClear:()=>{window.calls.push([kind,"clear"]);if(state.acceptClear)setState(previous=>({...previous,count:0}))},actions:[{id:"archive",label:state.actionLabel||"Archive",onSelect:()=>{window.calls.push([kind,"archive"]);return new Promise((resolve,reject)=>{window.pending[kind]={resolve,reject}})}},{id:"pin",label:"Pin",onSelect:()=>{window.calls.push([kind,"pin"])}}]}))),
 h("section",{id:"preview"},h(Authored,{preview:true})));
}createRoot(document.getElementById("root")).render(h(App));`,
  );
  compiler = webpack({
    mode: "development",
    devtool: false,
    context: temporary,
    entry: path.join(temporary, "entry.js"),
    output: { path: temporary, filename: "bundle.js" },
    resolve: {
      modules: [path.join(repository, "node_modules"), "node_modules"],
      extensions: [".tsx", ".ts", ".js"],
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
    path.join(temporary, "selection-toolbar.css"),
    "utf8",
  );
  server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/bundle.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/bundle.js"
        ? bundle
        : `<!doctype html><style>body{margin:18px;background:#080808;color:#ededed;font:14px Arial,sans-serif}main{width:min(100%,320px)}section{margin:32px 0;width:100%}section[hidden]{display:none}${css}</style><div id="root"></div><script src="/bundle.js"></script>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({
    headless: true,
    channel: flags.get("--channel"),
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 1000 },
  });
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture);
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  const update = async (values) => {
    await page.evaluate((value) => window.fixture.update(value), values);
    await settle();
  };
  const reset = async (values) => {
    await page.evaluate((value) => window.fixture.reset(value), values);
    await settle();
  };
  const calls = () => page.evaluate(() => window.calls);
  const focus = async (locator) =>
    assert.equal(
      await locator.evaluate((node) => node === document.activeElement),
      true,
    );
  const action = (kind = "authored", name = "Archive") =>
    page.locator(`#${kind}`).getByRole("button", { name, exact: true });
  await page.locator("#outside").focus();
  assert.equal(
    await page.locator("#authored .bst-controls").getAttribute("inert"),
    "",
  );
  assert.equal(await action().count(), 0);
  await page
    .locator("#authored .bst-action")
    .first()
    .evaluate((node) => node.click());
  assert.deepEqual(await calls(), []);
  await update({ count: 2 });
  await focus(page.locator("#outside"));
  await page.waitForTimeout(950);
  assert.equal(
    await page.locator("#authored .bst-count").textContent(),
    "2 selected",
  );
  assert.equal(await action().count(), 1);
  passed(
    "host count reveals actions; closed controls are inert and external updates preserve focus",
  );
  await action().click();
  assert.equal(await action().isDisabled(), true);
  await page
    .locator("#authored .bst-action")
    .last()
    .evaluate((node) => node.click());
  await update({ replayKey: 1 });
  assert.deepEqual(await calls(), [["authored", "archive"]]);
  await page.evaluate(() => window.pending.authored.resolve());
  await settle();
  assert.equal(await action().isEnabled(), true);
  assert.equal(
    await page.locator("#authored .bst-count").textContent(),
    "2 selected",
  );
  passed(
    "pending actions disable controls, execute once, and never clear host count on resolution or replay",
  );
  await action().click();
  await page.evaluate(() =>
    window.pending.authored.reject(
      new Error("Archive is unavailable. Try again."),
    ),
  );
  await settle();
  assert.equal(
    await page.locator("#authored").getByRole("alert").textContent(),
    "Archive is unavailable. Try again.",
  );
  assert.equal(await action().isEnabled(), true);
  await action("authored", "Pin").click();
  await settle();
  assert.equal(await page.locator("#authored").getByRole("alert").count(), 0);
  await action("standalone", "Pin").click();
  assert.deepEqual((await calls()).at(-1), ["standalone", "pin"]);
  passed(
    "real rejections remain readable and authored/extracted actions invoke their callbacks",
  );
  await action("authored", "Clear selection").click();
  await focus(page.locator("#return"));
  assert.equal(
    await page.locator("#authored .bst-controls").getAttribute("inert"),
    "",
  );
  assert.deepEqual((await calls()).at(-1), ["authored", "clear"]);
  await update({ count: 3 });
  await action().focus();
  await update({ count: 0 });
  await focus(page.locator("#return"));
  await update({ count: 1, hidden: true });
  await page.locator("#outside").focus();
  await update({ count: 0 });
  await focus(page.locator("#outside"));
  passed(
    "clear and focused closure return to the supplied target; hidden mirrors never steal focus",
  );
  await reset({ count: 2, acceptClear: false });
  await action("authored", "Clear selection").click();
  assert.equal(
    await page.locator("#authored .bst-count").textContent(),
    "2 selected",
  );
  assert.deepEqual(await calls(), [["authored", "clear"]]);
  await page.locator("#outside").focus();
  await update({ replayKey: 1 });
  await focus(page.locator("#outside"));
  assert.deepEqual(await calls(), [["authored", "clear"]]);
  passed(
    "declined clear requests and replay leave controlled selection untouched",
  );
  await reset({ count: 0 });
  await page.waitForTimeout(950);
  const reversal = await page.evaluate(async () => {
    const samples = [];
    const frame = () => new Promise(requestAnimationFrame);
    window.fixture.update({ count: 2 });
    for (let i = 0; i < 5; i++) await frame();
    const node = document.querySelector("#authored .bst-surface");
    samples.push(node.getBoundingClientRect().width);
    window.fixture.update({ count: 0 });
    await frame();
    samples.push(node.getBoundingClientRect().width);
    window.fixture.update({ count: 3 });
    for (let i = 0; i < 80; i++) await frame();
    samples.push(node.getBoundingClientRect().width);
    return samples;
  });
  assert.ok(reversal[0] > 148 && reversal[0] < 320);
  assert.ok(Math.abs(reversal[1] - reversal[0]) < 30);
  assert.ok(Math.abs(reversal[2] - 320) < 1);
  passed(
    "rapid selection reversal continues from the current surface width and settles correctly",
  );
  await update({ replayKey: 1 });
  await page.waitForTimeout(80);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settle();
  assert.equal(
    await page
      .locator("#authored .bst-count-mark")
      .evaluate((node) => getComputedStyle(node).transform),
    "none",
  );
  await update({ count: 0 });
  assert.equal(
    Math.round(
      (await page.locator("#authored .bst-surface").boundingBox()).width,
    ),
    148,
  );
  await update({ count: 2 });
  assert.equal(
    Math.round(
      (await page.locator("#authored .bst-surface").boundingBox()).width,
    ),
    320,
  );
  passed("live reduced motion settles the numeric geometry without a remount");
  const preview = page.locator("#preview");
  const boxes = preview.getByRole("checkbox");
  await boxes.first().check();
  await boxes.nth(1).check();
  await preview.getByRole("button", { name: "Archive", exact: true }).click();
  await settle();
  assert.equal(await boxes.count(), 1);
  assert.equal(
    await preview.locator(".bst-count").textContent(),
    "Select items",
  );
  await focus(boxes.first());
  await preview.getByRole("button", { name: "Restore", exact: true }).click();
  assert.equal(await boxes.count(), 3);
  assert.equal(
    await boxes.evaluateAll(
      (nodes) => nodes.filter((node) => node.checked).length,
    ),
    0,
  );
  await boxes.first().check();
  await preview
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await focus(boxes.first());
  passed(
    "preview checkboxes archive real local rows, restore them, and preserve a usable focus target",
  );
  await page.setViewportSize({ width: 320, height: 1000 });
  await boxes.first().check();
  await settle();
  const bounds = await preview.locator(".bst-preview").evaluate((node) => ({
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
    overflow: node.scrollWidth > node.clientWidth,
    hits: [...node.querySelectorAll(".bst-file")].map(
      (row) => row.getBoundingClientRect().height,
    ),
  }));
  assert.ok(bounds.width <= 284 && !bounds.overflow && bounds.height <= 250);
  assert.ok(bounds.hits.every((height) => height >= 44));
  await page.locator("#return").focus();
  await page.keyboard.press("Tab");
  await focus(page.locator("#outside"));
  await page.setViewportSize({ width: 264, height: 1000 });
  await update({ count: 0, actionLabel: "Download selected files" });
  const narrow = () =>
    page.locator("#authored .bst-toolbar").evaluate((node) => {
      const rect = (selector) =>
        node.querySelector(selector).getBoundingClientRect().toJSON();
      return {
        surface: rect(".bst-surface"),
        count: rect(".bst-count"),
        controls: rect(".bst-controls"),
        buttons: [...node.querySelectorAll("button")].map((button) =>
          button.getBoundingClientRect().toJSON(),
        ),
        overflow: node.scrollWidth > node.clientWidth,
      };
    });
  const closed = await narrow();
  assert.ok(
    closed.count.top >= closed.surface.top &&
      closed.count.bottom <= closed.surface.bottom,
  );
  await update({ count: 2 });
  await page.waitForTimeout(80);
  const wrapped = await narrow();
  assert.ok(wrapped.controls.top >= wrapped.count.bottom && !wrapped.overflow);
  assert.ok(
    wrapped.buttons.every(
      (button) =>
        button.left >= wrapped.surface.left &&
        button.right <= wrapped.surface.right &&
        button.bottom <= wrapped.surface.bottom,
    ),
  );
  assert.deepEqual(errors, []);
  passed(
    "phone preview keeps 44 px targets; 228 px toolbars retain closed labels and wrap longer actions within bounds",
  );
  console.log(
    `Passed ${checks} selection-toolbar checks in ${browser.version()}.`,
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
