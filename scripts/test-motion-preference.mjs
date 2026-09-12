#!/usr/bin/env node
// npm exec --package=playwright@1.62.1 -- node scripts/test-motion-preference.mjs
// Or: --playwright /absolute/path/to/playwright --channel chrome
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
assert.ok(!flags.has("--channel") || flags.get("--channel") === "chrome");
let playwright = flags.get("--playwright");
if (playwright) assert.ok(path.isAbsolute(playwright));
else
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    try {
      playwright = createRequire(
        await fs.realpath(path.join(directory, "playwright")),
      ).resolve("playwright");
      break;
    } catch {
      /* Search npm exec's PATH. */
    }
  }
assert.ok(
  playwright,
  "Use npm exec --package=playwright@1.62.1 or --playwright /absolute/package/path",
);
const { chromium } = require(playwright);
const { webpack } = require("next/dist/compiled/webpack/webpack");
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "bera-preference-"));
let browser,
  server,
  compiler,
  checks = 0;
const pass = (label) => console.log(`ok ${++checks} - ${label}`);
try {
  // Run the real generator in a disposable clone: authored and downloaded source
  // exercise the same browser tests without changing the checkout's artifacts.
  const clone = path.join(temporary, "kit");
  await fs.mkdir(clone);
  for (const file of [
    "LICENSE",
    "package.json",
    "lib/transition-catalog.json",
    "lib/adapter-catalog.json",
    "scripts/sync-components.mjs",
    "scripts/extract-transition.mjs",
    "components/transitions",
    "components/adapters",
    "skills/bera-motion",
  ]) {
    await fs.mkdir(path.dirname(path.join(clone, file)), { recursive: true });
    await fs.cp(path.join(repository, file), path.join(clone, file), {
      recursive: true,
    });
  }
  await fs.symlink(
    path.join(repository, "node_modules"),
    path.join(clone, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  execFileSync(process.execPath, ["scripts/sync-components.mjs"], {
    cwd: clone,
    timeout: 30000,
  });
  const catalog = JSON.parse(
    await fs.readFile(
      path.join(repository, "lib/transition-catalog.json"),
      "utf8",
    ),
  );
  const ts = require("typescript");
  for (const item of catalog) {
    const source = await fs.readFile(
      path.join(clone, `public/transitions/${item.id}.tsx`),
      "utf8",
    );
    const parsed = ts.createSourceFile(
      item.id + ".tsx",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const exports = parsed.statements.flatMap((node) =>
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
        ? node.exportClause.elements.map((item) => item.name.text)
        : node.modifiers?.some(
              (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
            )
          ? [node.name?.text]
          : [],
    );
    assert.deepEqual(exports, [item.exportName]);
    assert.ok(source.includes("useSyncExternalStore"));
    assert.ok(!source.includes('from "./use-motion-preference"'));
  }
  pass(
    "all generated recipes inline the live subscription and retain one component export",
  );
  const loader = path.join(temporary, "typescript-loader.cjs");
  await fs.writeFile(
    loader,
    `const ts=require(${JSON.stringify(require.resolve("typescript"))});module.exports=s=>ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText;`,
  );
  const imports = catalog
    .flatMap((item) => [
      `import {${item.exportName} as authored_${item.exportName}} from ${JSON.stringify(path.join(repository, `components/transitions/${item.group}.tsx`))};`,
      `import {${item.exportName} as generated_${item.exportName}} from ${JSON.stringify(path.join(clone, `public/transitions/${item.id}.tsx`))};`,
    ])
    .join("\n");
  await fs.writeFile(
    path.join(temporary, "entry.js"),
    `
import React from "react"; import {createRoot} from "react-dom/client"; import {flushSync} from "react-dom"; import {MotionConfig} from "motion/react";
import {useMotionPreference} from ${JSON.stringify(path.join(repository, "components/transitions/use-motion-preference.ts"))};
${imports}
const h=React.createElement;
const components={${["authored", "generated"].map((kind) => `${kind}:{${catalog.map((item) => `${item.exportName}:${kind}_${item.exportName}`).join(",")}}`).join(",")}};
window.events=[]; window.actionCalls=0;
function Probe(){return h("output",{id:"preference"},String(useMotionPreference()));}
function App(){
 const [state,setState]=React.useState({open:false,count:8,pressed:false,status:0,query:"Tabs",policy:"user"});
 window.fixture={update:values=>flushSync(()=>setState(previous=>({...previous,...values})))};
 const props={speed:.2,preview:false,replayKey:0};
 return h(MotionConfig,{reducedMotion:state.policy},h(Probe),h("button",{id:"outside"},"Outside"),
 ...Object.entries(components).map(([kind,c])=>h("section",{key:kind,id:kind},
  h("div",{id:kind+"-accordion"},h(c.Accordion,{...props,value:state.open?0:null,onValueChange:v=>window.events.push([kind,"accordion",v]),items:[{title:"Settings",body:h("button",null,"Content action")}]})),
  h("div",{id:kind+"-search"},h(c.ExpandingSearch,{...props,open:state.open,value:state.query,onOpenChange:v=>window.events.push([kind,"search",v]),onValueChange:v=>window.events.push([kind,"query",v])})),
  h("div",{id:kind+"-counter"},h(c.RollingCounter,{...props,value:state.count,onValueChange:v=>window.events.push([kind,"count",v])})),
  h("div",{id:kind+"-icon"},h(c.MorphingIconButton,{...props,pressed:state.pressed,onPressedChange:v=>window.events.push([kind,"pressed",v])})),
  h("div",{id:kind+"-text"},h(c.TextSwap,{...props,value:state.status,statuses:["Saved","Review","Ready"].map(text=>({text,Icon:()=>h("span",null,"✓")}))})),
  h("div",{id:kind+"-tabs"},h(c.SlidingTabs,{...props,value:state.status%2?"unread":"all",onValueChange:v=>window.events.push([kind,"tab",v])})),
  h("div",{id:kind+"-save"},h(c.StateButton,{...props,onAction:()=>{window.actionCalls++;return new Promise(resolve=>window.resolveAction=resolve)}})),
  h("div",{id:kind+"-copy"},h(c.CopyButton,{...props,text:"test command"})),
  h("div",{id:kind+"-menu"},h(c.MorphingMenu,{...props,actions:[{label:"Action",onSelect:()=>window.events.push([kind,"action"])}]})),
  h("div",{id:kind+"-toast"},h(c.ToastStack,{...props}))
 )));
}
createRoot(document.getElementById("root")).render(h(App));`,
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
      ["selection", "surfaces", "feedback", "icons"].map((group) =>
        fs.readFile(
          path.join(repository, `components/transitions/${group}.css`),
          "utf8",
        ),
      ),
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
        : `<!doctype html><style>body{background:#111;color:#eee;font:14px sans-serif}section{display:inline-grid;vertical-align:top;gap:24px;width:330px;margin:24px}${css}</style><div id="root"></div><script src="/bundle.js"></script>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({
    headless: true,
    channel: flags.get("--channel"),
  });
  const page = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 1000, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.fixture);
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  const update = async (state) => {
    await page.evaluate((value) => window.fixture.update(value), state);
    await settle();
  };
  const preference = async (value) => {
    await page.emulateMedia({
      reducedMotion: value ? "reduce" : "no-preference",
    });
    await page.waitForFunction(
      (expected) =>
        document.querySelector("#preference").textContent === String(expected),
      value,
    );
    await settle();
  };
  const snapshot = () =>
    page.evaluate(() =>
      Object.fromEntries(
        ["authored", "generated"].map((kind) => [
          kind,
          {
            icon: document
              .querySelector(`#${kind}-icon [data-stroke=top]`)
              .getAttribute("d"),
            search: document
              .querySelector(`#${kind}-search form`)
              .getBoundingClientRect().width,
            panel: document
              .querySelector(`#${kind}-accordion .bt-accordion-panel`)
              .getBoundingClientRect().height,
          },
        ]),
      ),
    );
  const frames = async (state, duration = 240) =>
    page.evaluate(
      async ({ state, duration }) => {
        window.fixture.update(state);
        const samples = [];
        const start = performance.now();
        while (performance.now() - start < duration) {
          await new Promise(requestAnimationFrame);
          samples.push(
            Object.fromEntries(
              ["authored", "generated"].map((kind) => [
                kind,
                {
                  icon: document
                    .querySelector(`#${kind}-icon [data-stroke=top]`)
                    .getAttribute("d"),
                  width: document
                    .querySelector(`#${kind}-search form`)
                    .getBoundingClientRect().width,
                  transform: getComputedStyle(
                    [
                      ...document.querySelectorAll(
                        `#${kind}-text .bf-status-icon`,
                      ),
                    ].at(-1),
                  ).transform,
                  panel: document
                    .querySelector(`#${kind}-accordion .bt-accordion-panel`)
                    .getBoundingClientRect().height,
                },
              ]),
            ),
          );
        }
        return samples;
      },
      { state, duration },
    );
  const distinct = (samples, kind, key) =>
    new Set(samples.map((sample) => sample[kind][key])).size;
  await page.locator("#outside").focus();
  await update({ open: true, pressed: true, count: 9, status: 1 });
  const reducedState = await snapshot();
  for (const state of Object.values(reducedState)) {
    assert.equal(state.search, 266);
    assert.equal(state.icon, "M7 7C10.33 10.33 13.67 13.67 17 17");
    assert.ok(state.panel > 0);
  }
  assert.deepEqual(reducedState.authored, reducedState.generated);
  pass(
    "initial reduced preference settles authored and generated controls immediately",
  );
  await preference(false);
  const initiallyReducedFrames = await frames({
    open: false,
    pressed: false,
    count: 8,
    status: 2,
  });
  for (const kind of ["authored", "generated"])
    assert.ok(distinct(initiallyReducedFrames, kind, "icon") > 3);
  console.log(
    "Known Motion limitation: after an initially reduced mount, existing positional animations may require a reload. In-flight finite animations may finish after a preference change.",
  );
  await page.reload();
  await page.waitForFunction(() => window.fixture);
  await settle();
  await page.locator("#outside").focus();
  const normalFrames = await frames({
    open: true,
    pressed: true,
    count: 9,
    status: 1,
  });
  for (const kind of ["authored", "generated"]) {
    assert.ok(distinct(normalFrames, kind, "icon") > 3);
    assert.ok(distinct(normalFrames, kind, "width") > 3);
    assert.ok(distinct(normalFrames, kind, "transform") > 3);
    assert.ok(distinct(normalFrames, kind, "panel") > 3);
  }
  pass(
    "normal-mounted authored and generated recipes move in all four families",
  );
  await preference(true);
  // Changing duration alone does not cancel an already-running Motion target.
  // Let that finite transition finish; verify following interactions are reduced.
  await page.waitForTimeout(2500);
  await update({ open: true, pressed: true, count: 9, status: 0 });
  const stillFrames = await frames({
    open: false,
    pressed: false,
    count: 8,
    status: 1,
  });
  for (const kind of ["authored", "generated"]) {
    assert.equal(distinct(stillFrames.slice(2), kind, "icon"), 1);
    assert.equal(distinct(stillFrames.slice(2), kind, "width"), 1);
    assert.equal(distinct(stillFrames.slice(2), kind, "panel"), 1);
  }
  assert.equal(
    await page
      .locator("#outside")
      .evaluate((n) => n === document.activeElement),
    true,
  );
  assert.deepEqual(await page.evaluate(() => window.events), []);
  pass(
    "live reduction affects following interactions and preserves focus, state, and callbacks",
  );
  await preference(false);
  const resumedFrames = await frames({
    open: true,
    pressed: true,
    count: 9,
    status: 2,
  });
  for (const kind of ["authored", "generated"]) {
    assert.ok(distinct(resumedFrames, kind, "icon") > 3);
    assert.ok(distinct(resumedFrames, kind, "width") > 3);
    assert.ok(distinct(resumedFrames, kind, "transform") > 3);
    assert.ok(distinct(resumedFrames, kind, "panel") > 3);
  }
  pass(
    "normal-mounted recipes resume movement when the live preference is restored",
  );
  await page.locator("#authored-save button.bf-state-button").click();
  await preference(false);
  await preference(true);
  assert.equal(await page.evaluate(() => window.actionCalls), 1);
  assert.equal(
    await page
      .locator("#authored-save .bf-state-button")
      .getAttribute("aria-busy"),
    "true",
  );
  await page.evaluate(() => window.resolveAction());
  await settle();
  assert.equal(await page.evaluate(() => window.actionCalls), 1);
  pass(
    "a real pending action survives preference changes and executes only once",
  );
  await preference(false);
  await update({ policy: "always", open: false, pressed: false });
  await update({ open: true, pressed: true });
  assert.equal(await page.locator("#preference").textContent(), "true");
  assert.equal((await snapshot()).authored.search, 266);
  pass("a stronger host MotionConfig policy stays respected");
  assert.deepEqual(errors, []);
  console.log(
    `Passed ${checks} live motion-preference checks in ${browser.version()}.`,
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
