#!/usr/bin/env node
// Optional real-browser regression, using installed React/Motion and authored source.
// npm exec --package=playwright@1.62.1 -- node scripts/test-animated-list.mjs
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
  path.join(os.tmpdir(), "bera-list-browser-"),
);
let browser,
  server,
  compiler,
  checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
  const { extractTransition } = await import("./extract-transition.mjs");
  const source = await fs.readFile(
    path.join(repository, "components/transitions/animated-list.tsx"),
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
    "AnimatedList",
    "animated-list",
  );
  assert.ok(!standalone.includes('from "./use-motion-preference"'));
  await fs.writeFile(path.join(temporary, "animated-list.tsx"), standalone);
  await fs.copyFile(
    path.join(repository, "components/transitions/animated-list.css"),
    path.join(temporary, "animated-list.css"),
  );
  const loader = path.join(temporary, "typescript-loader.cjs");
  await fs.writeFile(
    loader,
    `const ts=require(${JSON.stringify(require.resolve("typescript"))});module.exports=s=>ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText;`,
  );
  await fs.writeFile(
    path.join(temporary, "entry.js"),
    `
import React from "react";import {hydrateRoot} from "react-dom/client";import {renderToString} from "react-dom/server";import {flushSync} from "react-dom";import {MotionConfig} from "motion/react";
import {AnimatedList as Authored} from ${JSON.stringify(path.join(repository, "components/transitions/animated-list.tsx"))};
import {AnimatedList as Standalone} from "./animated-list.tsx";
const h=React.createElement;const initial={ids:["a","b","c"],replayKey:0,expanded:false,reduced:"never",version:0};window.calls=[];
function App(){const [state,setState]=React.useState(initial);React.useEffect(()=>{window.hydrated=true},[]);window.fixture={update:values=>flushSync(()=>setState(previous=>({...previous,...values}))),reset:values=>{window.calls=[];flushSync(()=>setState(previous=>({...initial,...values,version:previous.version+1})))}};
return h("main",null,h("button",{id:"outside"},"Outside"),...[["authored",Authored],["standalone",Standalone]].map(([kind,Component])=>h("section",{id:kind,key:kind+state.version},h(MotionConfig,{reducedMotion:state.reduced},h(Component,{ariaLabel:kind+" files",speed:.4,replayKey:state.replayKey,emptyState:h("button",{id:kind+"-empty"},"Create first file"),items:state.ids.map(id=>({id,content:h(React.Fragment,null,h("div",{className:"host-row"},h("label",null,id,h("input",{"aria-label":kind+" "+id,defaultValue:id})),h("button",{onClick:()=>window.calls.push(id)},"Open "+id)),state.expanded&&id==="b"&&h("div",{className:"host-extra"},"Host details"))}))})),h("div",{className:"neighbor"},"After the list"))),h("section",{id:"preview",key:"preview"+state.version},h(Authored,{preview:true,replayKey:state.replayKey})));}
const root=document.getElementById("root");root.innerHTML=renderToString(h(App));hydrateRoot(root,h(App));`,
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
    path.join(temporary, "animated-list.css"),
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
        : `<!doctype html><style>body{margin:16px;background:#080808;color:#ededed;font:14px Arial,sans-serif}main{width:min(100%,360px)}section{margin:24px 0;width:100%}input{max-width:100%;width:100px;font:inherit}section[hidden]{display:none}.host-row{display:flex;gap:8px;align-items:center}.neighbor{height:10px;margin:0}button{font:inherit}.host-extra{height:70px}${css}</style><div id="root"></div><script src="/bundle.js"></script>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({
    headless: true,
    channel: flags.get("--channel"),
  });
  const page = await browser.newPage({
    viewport: { width: 420, height: 1100 },
    reducedMotion: "no-preference",
  });
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.hydrated);
  const frames = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  const update = async (values) => {
    await page.evaluate((value) => window.fixture.update(value), values);
    await frames();
  };
  const reset = async (values) => {
    await page.evaluate((value) => window.fixture.reset(value), values);
    await frames();
    await page.waitForTimeout(100);
  };
  const ids = (kind = "authored") =>
    page
      .locator(`#${kind} [data-list-id]:not([data-exiting])`)
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.listId));
  const focused = async (locator) =>
    assert.equal(
      await locator.evaluate((node) => node === document.activeElement),
      true,
    );
  const geometry = (kind = "authored") =>
    page.locator(`#${kind}`).evaluate((node) => ({
      height: node.querySelector(".bal-frame").getBoundingClientRect().height,
      natural: node.querySelector(".bal-list").getBoundingClientRect().height,
      neighbor: node.querySelector(".neighbor").getBoundingClientRect().top,
      scale: [...node.querySelectorAll(".bal-item")].map((item) => {
        const transform = getComputedStyle(item).transform;
        return transform === "none"
          ? [1, 1]
          : [new DOMMatrix(transform).a, new DOMMatrix(transform).d];
      }),
    }));
  for (const kind of ["authored", "standalone"]) {
    assert.deepEqual(await ids(kind), ["a", "b", "c"]);
    assert.equal(await page.locator(`#${kind} .bal-toolbar`).count(), 0);
    assert.equal(
      await page
        .getByRole("list", { name: kind + " files", exact: true })
        .count(),
      1,
    );
    assert.equal(
      await page
        .locator(`#${kind} .bal-root`)
        .evaluate(
          (node) => node.clientWidth === node.parentElement.clientWidth,
        ),
      true,
    );
  }
  passed(
    "authored and extracted source expose semantic, host-owned lists at natural width",
  );
  // Hydration uses the shared hook's conservative server snapshot before reading
  // the browser preference. Layout must stay registered across that change.
  const position = (kind) =>
    page.locator(`#${kind} [data-list-id="a"]`).evaluate((node) => ({
      top: node.getBoundingClientRect().top,
      transform: getComputedStyle(node).transform,
    }));
  const initialPositions = await Promise.all(
    ["authored", "standalone"].map(position),
  );
  await update({ ids: ["c", "b", "a"] });
  await page.waitForTimeout(130);
  const intermediatePositions = await Promise.all(
    ["authored", "standalone"].map(position),
  );
  await page.waitForTimeout(1700);
  const finalPositions = await Promise.all(
    ["authored", "standalone"].map(position),
  );
  for (let index = 0; index < initialPositions.length; index++) {
    const before = initialPositions[index];
    const during = intermediatePositions[index];
    const after = finalPositions[index];
    assert.ok(
      during.top > before.top + 1 && during.top < after.top - 1,
      `Hydrated reorder must visibly travel between endpoints: ${JSON.stringify({ before, during, after })}`,
    );
    assert.notEqual(during.transform, "none");
    assert.equal(after.transform, "none");
  }
  passed(
    "hydrated authored and standalone lists visibly interpolate row positions before settling",
  );
  for (const kind of ["authored", "standalone"]) {
    await reset();
    const input = page.getByRole("textbox", { name: kind + " b", exact: true });
    await input.fill("edited value");
    await input.evaluate((node) => {
      window.savedInput = node;
      node.setSelectionRange(2, 6);
    });
    await update({ ids: ["c", "a", "b"] });
    assert.deepEqual(await ids(kind), ["c", "a", "b"]);
    assert.equal(
      await input.evaluate((node) => node === window.savedInput),
      true,
    );
    assert.equal(await input.inputValue(), "edited value");
    await focused(input);
    assert.deepEqual(
      await input.evaluate((node) => [node.selectionStart, node.selectionEnd]),
      [2, 6],
    );
    await update({ replayKey: 1 });
    await focused(input);
    assert.deepEqual(await ids(kind), ["c", "a", "b"]);
    assert.deepEqual(await page.evaluate(() => window.calls), []);
  }
  passed(
    "reorder and replay preserve input identity, edits, selection, and focus without host callbacks",
  );
  await reset();
  const before = await geometry();
  await update({ ids: ["x", "a", "b", "c"] });
  await page.waitForTimeout(120);
  const during = await geometry();
  await page.waitForTimeout(1700);
  const after = await geometry();
  assert.ok(
    during.height > before.height + 1 && during.height < after.height - 1,
    JSON.stringify({ before, during, after }),
  );
  assert.ok(
    during.neighbor > before.neighbor + 1 &&
      during.neighbor < after.neighbor - 1,
  );
  assert.ok(
    during.scale.every(
      ([x, y]) => Math.abs(x - 1) < 0.001 && Math.abs(y - 1) < 0.001,
    ),
  );
  assert.ok(Math.abs(after.height - after.natural) < 1);
  await update({ expanded: true });
  await page.waitForTimeout(120);
  const resized = await geometry();
  assert.ok(
    resized.height > after.height + 1 && resized.height < resized.natural - 1,
  );
  await page.waitForTimeout(1700);
  assert.ok(
    Math.abs((await geometry()).height - (await geometry()).natural) < 1,
  );
  passed(
    "insertions and host content resize animate real height and neighbor flow without scaling text",
  );
  for (const kind of ["authored", "standalone"]) {
    await reset();
    await page.getByRole("textbox", { name: kind + " b", exact: true }).focus();
    await update({ ids: ["a", "c"] });
    const exit = page.locator(`#${kind} [data-list-id="b"]`);
    assert.equal(await exit.getAttribute("data-exiting"), "true");
    assert.equal(await exit.evaluate((node) => node.inert), true);
    assert.equal(await exit.getAttribute("aria-hidden"), "true");
    assert.equal(
      await exit.evaluate((node) => getComputedStyle(node).pointerEvents),
      "none",
    );
    await focused(page.locator(`#${kind} [data-list-id="c"]`));
    await exit.locator("input").evaluate((node) => node.focus());
    await focused(page.locator(`#${kind} [data-list-id="c"]`));
    await page.waitForTimeout(700);
    assert.equal(await exit.count(), 0);
    await update({ ids: [] });
    await page.waitForTimeout(700);
    await page.locator(`#${kind}-empty`).focus();
    await update({ ids: ["a"] });
    assert.equal(
      await page.locator(`#${kind} .bal-empty`).evaluate((node) => node.inert),
      true,
    );
    await focused(page.locator(`#${kind} [data-list-id="a"]`));
  }
  passed(
    "removed controls and interactive empty states become inert after appropriate focus recovery",
  );
  await reset();
  const input = page.getByRole("textbox", { name: "authored b", exact: true });
  await input.fill("still here");
  await input.evaluate((node) => (window.savedInput = node));
  await page.locator("#outside").focus();
  await update({ ids: ["a", "c"] });
  await update({ ids: ["b", "c", "a"] });
  assert.equal(
    await input.evaluate((node) => node === window.savedInput),
    true,
  );
  assert.equal(await input.inputValue(), "still here");
  assert.equal(await input.evaluate((node) => node.closest("li").inert), false);
  await focused(page.locator("#outside"));
  await page.waitForTimeout(1700);
  assert.deepEqual(await ids(), ["b", "c", "a"]);
  assert.equal(await page.locator("#authored [data-exiting]").count(), 0);
  passed(
    "rapid removal and reinsertion settle to the latest order with retained state and external focus",
  );
  for (const preference of ["host", "system"]) {
    await page.emulateMedia({
      reducedMotion: preference === "system" ? "reduce" : "no-preference",
    });
    await reset({ reduced: preference === "host" ? "always" : "never" });
    await update({ ids: ["x", "c", "a"] });
    await page.waitForTimeout(50);
    for (const kind of ["authored", "standalone"]) {
      const bounds = await geometry(kind);
      assert.ok(
        Math.abs(bounds.height - bounds.natural) < 1,
        JSON.stringify(bounds),
      );
      assert.equal(await page.locator(`#${kind} [data-exiting]`).count(), 0);
      assert.ok(bounds.scale.every(([x, y]) => x === 1 && y === 1));
      assert.equal(
        await page
          .locator(`#${kind} .bal-item`)
          .evaluateAll((nodes) =>
            nodes.every((node) => getComputedStyle(node).transform === "none"),
          ),
        true,
      );
      assert.deepEqual(await ids(kind), ["x", "c", "a"]);
    }
  }
  passed(
    "host MotionConfig always and initial OS reduction make list, exit, and height changes immediate",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await reset();
  await update({ ids: ["x", "a", "b", "c"] });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(1700);
  assert.deepEqual(await ids(), ["x", "a", "b", "c"]);
  assert.ok(
    Math.abs((await geometry()).height - (await geometry()).natural) < 1,
  );
  await update({ ids: ["c", "x"] });
  await page.waitForTimeout(60);
  assert.equal(await page.locator("#authored [data-exiting]").count(), 0);
  passed(
    "reduced-motion changes during a transition settle correctly and subsequent updates are immediate",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await reset();
  const preview = page.locator("#preview");
  const previewIds = () => ids("preview");
  await preview.getByRole("button", { name: "Add file", exact: true }).click();
  assert.equal((await previewIds()).length, 4);
  assert.equal(
    await preview
      .getByRole("button", { name: "Add file", exact: true })
      .isDisabled(),
    true,
  );
  const unsorted = await previewIds();
  await preview.getByRole("button", { name: "Sort", exact: true }).click();
  assert.notDeepEqual(await previewIds(), unsorted);
  const firstRemove = preview.getByRole("button", { name: /^Remove / }).first();
  await firstRemove.focus();
  await page.keyboard.press("Enter");
  await focused(preview.getByRole("button", { name: /^Remove / }).first());
  await page.waitForTimeout(400);
  while ((await previewIds()).length) {
    await preview
      .getByRole("button", { name: /^Remove / })
      .first()
      .click();
    await page.waitForTimeout(250);
  }
  await focused(preview.getByRole("button", { name: "Add file", exact: true }));
  assert.equal(
    await preview
      .getByRole("button", { name: "Sort", exact: true })
      .isDisabled(),
    true,
  );
  assert.match(
    await preview.getByRole("status").textContent(),
    /removed from this preview/,
  );
  passed(
    "preview add, sort, keyboard remove, empty state, and announcements reflect real local mutations",
  );
  await reset();
  await preview.getByRole("button", { name: "Add file", exact: true }).click();
  await page.waitForTimeout(900);
  for (const width of [320, 228]) {
    await page.setViewportSize({
      width: width === 228 ? 320 : width,
      height: 1100,
    });
    await preview.evaluate(
      (node, width) => (node.style.width = width === 228 ? "228px" : "100%"),
      width,
    );
    const bounds = await preview.locator(".bal-root").evaluate((node) => ({
      width: node.clientWidth,
      height: node.getBoundingClientRect().height,
      overflow: node.scrollWidth > node.clientWidth,
      targets: [...node.querySelectorAll("button")].map(
        (button) => button.getBoundingClientRect().height,
      ),
    }));
    assert.ok(!bounds.overflow && bounds.height <= 248, JSON.stringify(bounds));
    assert.ok(bounds.targets.every((height) => height >= 44));
  }
  await page.evaluate(() => {
    document.body.style.background = "#fafafa";
    document.body.style.color = "#171717";
    for (const [key, value] of Object.entries({
      background: "#fafafa",
      foreground: "#171717",
      "muted-foreground": "#666",
      border: "#ddd",
      popover: "#fff",
      ring: "#333",
    }))
      document.body.style.setProperty("--" + key, value);
  });
  assert.equal(
    await preview
      .locator(".bal-root")
      .evaluate((node) => getComputedStyle(node).color),
    "rgb(23, 23, 23)",
  );
  assert.equal(
    await preview
      .locator(".bal-item")
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor),
    "rgb(250, 250, 250)",
  );
  assert.deepEqual(errors, []);
  passed(
    "320 px phone and 228 px inspector preserve four rows, 44 px targets, and host theme tokens",
  );
  console.log(`Passed ${checks} animated-list checks in ${browser.version()}.`);
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
