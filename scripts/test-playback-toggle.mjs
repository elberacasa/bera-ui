#!/usr/bin/env node
// Optional real-browser regression, using installed React/Motion and authored source.
// npm exec --package=playwright@1.62.1 -- node scripts/test-playback-toggle.mjs
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
  path.join(os.tmpdir(), "bera-playback-browser-"),
);
let browser,
  server,
  compiler,
  checks = 0;
const passed = (label) => console.log(`ok ${++checks} - ${label}`);

try {
  const { extractTransition } = await import("./extract-transition.mjs");
  const source = await fs.readFile(
    path.join(repository, "components/transitions/playback-toggle.tsx"),
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
    "PlaybackToggle",
    "playback-toggle",
  );
  assert.ok(!standalone.includes('from "./use-motion-preference"'));
  await fs.writeFile(path.join(temporary, "playback-toggle.tsx"), standalone);
  await fs.copyFile(
    path.join(repository, "components/transitions/playback-toggle.css"),
    path.join(temporary, "playback-toggle.css"),
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
import {PlaybackToggle as Authored} from ${JSON.stringify(path.join(repository, "components/transitions/playback-toggle.tsx"))};
import {PlaybackToggle as Standalone} from "./playback-toggle.tsx";
const h=React.createElement;const initial={controlled:true,playing:new URLSearchParams(location.search).has("playing"),defaultPlaying:false,accept:true,prevent:false,disabled:false,replayKey:0,speed:.35,reduced:"user",labels:undefined,version:0,hiddenPreview:false};window.calls=[];window.nativeClicks=[];window.submits=0;window.refs={};
function App(){const [state,setState]=React.useState(initial);React.useEffect(()=>{window.hydrated=true},[]);window.fixture={update:values=>flushSync(()=>setState(previous=>({...previous,...values}))),reset:values=>{window.calls=[];window.nativeClicks=[];window.submits=0;flushSync(()=>setState(previous=>({...initial,...values,version:previous.version+1})))}};
return h(MotionConfig,{reducedMotion:state.reduced},h("main",null,h("button",{id:"outside"},"Outside"),...[["authored",Authored],["standalone",Standalone]].map(([kind,Component])=>h("section",{id:kind,key:kind+state.version},h("form",{onSubmit:e=>{e.preventDefault();window.submits++}},h(Component,{playing:state.controlled?state.playing:undefined,defaultPlaying:state.defaultPlaying,disabled:state.disabled,labels:state.labels,speed:state.speed,replayKey:state.replayKey,buttonRef:node=>window.refs[kind]=node,"aria-describedby":kind+"-help",name:"playback",onClick:event=>{window.nativeClicks.push(kind);if(state.prevent)event.preventDefault()},onPlayingChange:next=>{window.calls.push([kind,next]);if(state.controlled&&state.accept)setState(previous=>({...previous,playing:next}))}})),h("span",{id:kind+"-help"},"Connected to host playback"))),h("section",{id:"preview",hidden:state.hiddenPreview,key:"preview"+state.version},h(Authored,{preview:true,defaultPlaying:true,replayKey:state.replayKey,labels:state.labels,onPlayingChange:next=>window.calls.push(["preview",next])})),h("section",{id:"host-preview",key:"host-preview"+state.version},h(Authored,{preview:true,playing:state.playing,labels:state.labels}))));}
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
    path.join(temporary, "playback-toggle.css"),
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
        : `<!doctype html><style>body{margin:16px;background:#080808;color:#ededed;font:14px Arial,sans-serif}main{width:min(100%,320px)}section{margin:24px 0;width:100%}section[hidden]{display:none}button{font:inherit}${css}</style><div id="root"></div><script src="/bundle.js"></script>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({
    headless: true,
    channel: flags.get("--channel"),
  });
  const page = await browser.newPage({
    viewport: { width: 420, height: 1000 },
    reducedMotion: "no-preference",
  });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await page.goto(origin);
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
    await page.waitForTimeout(80);
  };
  const button = (kind = "authored") => page.locator(`#${kind} .bpt-button`);
  const paths = (kind = "authored") =>
    page
      .locator(`#${kind} [data-playback-path]`)
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  const numbers = (value) => value.match(/-?\d*\.?\d+/g).map(Number);
  const focus = async (locator) =>
    assert.equal(
      await locator.evaluate((node) => node === document.activeElement),
      true,
    );
  const calls = () => page.evaluate(() => window.calls);
  const ratio = () =>
    page.locator("#preview .bpt-progress").evaluate((node) => {
      const transform = getComputedStyle(node).transform;
      return transform === "none" ? 1 : new DOMMatrix(transform).a;
    });
  const play = await paths();
  for (const kind of ["authored", "standalone"]) {
    assert.deepEqual(await paths(kind), play);
    assert.equal(await button(kind).getAttribute("aria-label"), "Play");
    assert.equal(await button(kind).getAttribute("aria-pressed"), null);
    assert.equal(await button(kind).getAttribute("type"), "button");
    assert.equal(
      await button(kind).evaluate(
        (node, kind) => node === window.refs[kind],
        kind,
      ),
      true,
    );
    assert.equal(await page.locator(`#${kind} .bpt-preview`).count(), 0);
  }
  await page.goto(origin + "/?playing");
  await page.waitForFunction(() => window.hydrated);
  await frames();
  const pause = await paths();
  assert.notDeepEqual(pause, play);
  assert.equal(await button().getAttribute("aria-label"), "Pause");
  for (let index = 0; index < 2; index++)
    assert.deepEqual(
      play[index].match(/[MLQZ]/g),
      pause[index].match(/[MLQZ]/g),
    );
  passed(
    "hydrated play and pause endpoints share path commands, retain native button semantics, and forward the host ref",
  );
  await reset({ playing: false });
  await button().click();
  await page.waitForTimeout(130);
  for (const kind of ["authored", "standalone"]) {
    const middle = await paths(kind);
    assert.notDeepEqual(middle, play);
    assert.notDeepEqual(middle, pause);
    const left =
      (numbers(middle[0])[0] - numbers(play[0])[0]) /
      (numbers(pause[0])[0] - numbers(play[0])[0]);
    const right =
      (numbers(middle[1])[0] - numbers(play[1])[0]) /
      (numbers(pause[1])[0] - numbers(play[1])[0]);
    assert.ok(
      left > 0 && left < 1 && Math.abs(left - right) < 0.005,
      JSON.stringify({ left, right }),
    );
    const bounds = await page.locator(`#${kind} svg`).evaluate((node) => {
      const b = node.getBBox();
      return { x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height };
    });
    assert.ok(
      bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.right <= 24 &&
        bounds.bottom <= 24,
    );
  }
  const continuity = await button().evaluate((node) => {
    const paths = () =>
      [...node.querySelectorAll("path")].map((p) => p.getAttribute("d"));
    const before = paths();
    node.click();
    return { before, after: paths() };
  });
  assert.deepEqual(continuity.before, continuity.after);
  await page.waitForTimeout(130);
  assert.notDeepEqual(await paths(), pause);
  await page.waitForTimeout(2000);
  assert.deepEqual(await paths(), play);
  await button().evaluate((node) => {
    node.click();
    node.click();
    node.click();
  });
  await page.waitForTimeout(2200);
  assert.deepEqual(await paths(), pause);
  assert.equal(await button().getAttribute("aria-label"), "Pause");
  passed(
    "both SVG pieces share intermediate progress and reverse continuously to the latest controlled state",
  );
  await reset({ playing: false, accept: false });
  await button().click();
  await page.waitForTimeout(300);
  assert.deepEqual(await paths(), play);
  assert.equal(await button().getAttribute("aria-label"), "Play");
  assert.deepEqual(await calls(), [["authored", true]]);
  await reset({ playing: false, prevent: true });
  await button().click();
  assert.deepEqual(await calls(), []);
  assert.deepEqual(await paths(), play);
  await reset({ playing: false, disabled: true });
  await button().evaluate((node) => node.click());
  assert.deepEqual(await calls(), []);
  assert.deepEqual(await page.evaluate(() => window.nativeClicks), []);
  passed(
    "rejected controlled requests, prevented events, and disabled controls never change the icon",
  );
  for (const kind of ["authored", "standalone"]) {
    await reset({ controlled: false, defaultPlaying: false });
    await button(kind).focus();
    await page.keyboard.press("Enter");
    assert.equal(await button(kind).getAttribute("aria-label"), "Pause");
    await page.keyboard.press("Space");
    assert.equal(await button(kind).getAttribute("aria-label"), "Play");
    await focus(button(kind));
    assert.equal(await page.evaluate(() => window.submits), 0);
    await button(kind).evaluate((node) => {
      node.click();
      node.click();
      node.click();
    });
    assert.equal(await button(kind).getAttribute("aria-label"), "Pause");
    assert.deepEqual(
      (await calls()).map((call) => call[1]),
      [true, false, true, false, true],
    );
  }
  await reset({ controlled: false, defaultPlaying: true });
  assert.equal(await button().getAttribute("aria-label"), "Pause");
  assert.deepEqual(await paths(), pause);
  passed(
    "Enter, Space, default state, and same-turn uncontrolled requests preserve native focus and never submit forms",
  );
  await reset({ playing: false });
  await page.locator("#outside").focus();
  await update({ replayKey: 1 });
  await page.waitForTimeout(130);
  assert.notDeepEqual(await paths(), play);
  assert.equal(await button().getAttribute("aria-label"), "Play");
  assert.deepEqual(await calls(), []);
  await focus(page.locator("#outside"));
  await page.waitForTimeout(3400);
  assert.deepEqual(await paths(), play);
  passed(
    "replay travels out and back without changing the action, host state, callbacks, or focus",
  );
  for (const preference of ["host", "system"]) {
    await page.emulateMedia({
      reducedMotion: preference === "system" ? "reduce" : "no-preference",
    });
    await reset({
      playing: false,
      reduced: preference === "host" ? "always" : "user",
    });
    await button().click();
    await frames();
    assert.deepEqual(await paths(), pause);
    await update({ playing: false, replayKey: 2 });
    assert.deepEqual(await paths(), play);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await reset({ playing: false });
  await button().click();
  await page.waitForTimeout(100);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await frames();
  assert.deepEqual(await paths(), pause);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await frames();
  await update({ playing: false });
  await page.waitForTimeout(130);
  assert.notDeepEqual(await paths(), play);
  assert.notDeepEqual(await paths(), pause);
  await page.waitForTimeout(2000);
  passed(
    "initial host and OS reduction, live interruption, and re-enabled motion all retain correct endpoints",
  );
  await reset({ playing: false });
  await page.waitForTimeout(250);
  assert.equal(await ratio(), 0);
  assert.equal(await button("preview").getAttribute("aria-label"), "Play");
  assert.equal(await page.locator("#host-preview .bpt-track").count(), 0);
  assert.match(
    await page.locator("#host-preview").textContent(),
    /Host playback state/,
  );
  await button("preview").click();
  await page.waitForTimeout(1150);
  assert.ok((await ratio()) > 0.1);
  assert.match(
    await page.locator("#preview [role=timer]").textContent(),
    /0:01/,
  );
  await button("preview").click();
  const stopped = await ratio();
  await page.waitForTimeout(350);
  assert.ok(Math.abs((await ratio()) - stopped) < 0.001);
  const requests = await calls();
  await update({ replayKey: 3 });
  await page.waitForTimeout(400);
  assert.ok(Math.abs((await ratio()) - stopped) < 0.001);
  assert.deepEqual(await calls(), requests);
  await button("preview").click();
  await page.waitForTimeout(350);
  assert.ok((await ratio()) > stopped);
  await update({ hiddenPreview: true });
  await page.waitForTimeout(150);
  const hidden = await ratio();
  await page.waitForTimeout(350);
  assert.ok(Math.abs((await ratio()) - hidden) < 0.001);
  await update({ hiddenPreview: false });
  assert.equal(await button("preview").getAttribute("aria-label"), "Play");
  passed(
    "the local preview never autoplays, advances real time, pauses without resetting, and stops when hidden",
  );
  await button("preview").click();
  await page.waitForTimeout(7500);
  assert.equal(await ratio(), 1);
  assert.equal(await button("preview").getAttribute("aria-label"), "Play");
  assert.match(
    await page.locator("#preview [role=status]").textContent(),
    /complete/,
  );
  const finishedCalls = await calls();
  await page.waitForTimeout(300);
  assert.deepEqual(await calls(), finishedCalls);
  await button("preview").click();
  await page.waitForTimeout(200);
  assert.ok((await ratio()) > 0 && (await ratio()) < 0.1);
  await button("preview").click();
  passed(
    "the eight-second animation finishes once and restarts only after another explicit play action",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await reset({ playing: false });
  await button("preview").click();
  await page.waitForTimeout(300);
  assert.equal(await ratio(), 0);
  await page.waitForTimeout(850);
  assert.equal(await ratio(), 0.125);
  await button("preview").click();
  await reset({
    playing: false,
    labels: {
      play: "Play the complete presentation from the current position",
      pause: "Pause the complete presentation at the current position",
    },
  });
  await page.setViewportSize({ width: 320, height: 1000 });
  await page
    .locator("#preview")
    .evaluate((node) => (node.style.width = "228px"));
  const bounds = await page
    .locator("#preview .bpt-preview")
    .evaluate((node) => ({
      width: node.getBoundingClientRect().width,
      overflow: node.scrollWidth > node.clientWidth,
      button: node.querySelector("button").getBoundingClientRect().toJSON(),
    }));
  assert.equal(bounds.width, 228);
  assert.equal(bounds.overflow, false);
  assert.ok(bounds.button.width >= 44 && bounds.button.height >= 44);
  assert.match(
    await button("preview").getAttribute("aria-label"),
    /complete presentation/,
  );
  await page.evaluate(() => {
    for (const [key, value] of Object.entries({
      background: "#fff",
      foreground: "#181818",
      border: "#ddd",
      accent: "#eee",
      ring: "#555",
    }))
      document.body.style.setProperty("--" + key, value);
  });
  assert.equal(
    await button().evaluate((node) => getComputedStyle(node).color),
    "rgb(24, 24, 24)",
  );
  assert.deepEqual(errors, []);
  passed(
    "reduced preview progress advances in discrete seconds, and narrow layouts and long action labels retain host styling",
  );
  console.log(
    `Passed ${checks} playback-toggle checks in ${browser.version()}.`,
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
