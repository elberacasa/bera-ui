#!/usr/bin/env node
// Network smoke test, separate from the offline kit checks. All installs and
// generated files stay in temporary projects, which are removed on completion.
// npm exec --yes --package=shadcn@4.21.0 -- node scripts/test-shadcn-registry.mjs
// Or: node scripts/test-shadcn-registry.mjs --cli /path/to/shadcn/dist/index.js
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const repository = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readJSON = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const manifest = await readJSON(
  path.join(repository, "public/transitions/manifest.json"),
);
const registry = await readJSON(
  path.join(repository, "public/r/registry.json"),
);
const ts = createRequire(path.join(repository, "package.json"))("typescript");
const projectPackage = await readJSON(path.join(repository, "package.json"));
const args = process.argv.slice(2);
assert.ok(
  args.length === 0 || (args.length === 2 && args[0] === "--cli"),
  "Only --cli <path> is supported",
);
let cli = args[1];
if (!cli) {
  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    try {
      cli = await fs.realpath(path.join(directory, "shadcn"));
      break;
    } catch {
      /* Try the next executable search directory. */
    }
  }
}
assert.ok(
  cli,
  "Run through npm exec --package=shadcn@4.21.0, or pass --cli /path/to/shadcn/dist/index.js",
);
cli = await fs.realpath(cli);
const cliPackage = await readJSON(
  path.resolve(path.dirname(cli), "../package.json"),
);
assert.equal(
  cliPackage.version,
  manifest.registry.testedVersion,
  "Use the pinned CLI version recorded in the manifest",
);
const { registryItemSchema, registrySchema } = await import(
  pathToFileURL(path.join(path.dirname(cli), "schema/index.js"))
);

async function snapshot(root, relative = "", result = {}) {
  for (const entry of (
    await fs.readdir(path.join(root, relative), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules") continue;
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      result[`${name}/`] = "directory";
      await snapshot(root, name, result);
    } else {
      assert.ok(entry.isFile(), `Unexpected entry ${name}`);
      result[name] = createHash("sha256")
        .update(await fs.readFile(path.join(root, name)))
        .digest("hex");
    }
  }
  return result;
}

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "bera-shadcn-"));
const server = createServer(async (request, response) => {
  const name = new URL(request.url, "http://localhost").pathname;
  if (!/^\/r\/[a-z0-9-]+\.json$/.test(name)) {
    response.writeHead(404).end();
    return;
  }
  try {
    response.setHeader("Content-Type", "application/json");
    response.end(await fs.readFile(path.join(repository, "public", name)));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let checks = 0;
async function check(label, action) {
  await action();
  console.log(`ok ${++checks} - ${label}`);
}
async function run(project, command, options = []) {
  try {
    const pending = execute(
      process.execPath,
      [cli, ...command, "--cwd", project, ...options],
      {
        cwd: project,
        env: {
          ...process.env,
          PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH}`,
          CI: "true",
          npm_config_audit: "false",
          npm_config_fund: "false",
        },
        timeout: 120_000,
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    // --yes does not approve overwriting edited files. Exercise the CLI's real
    // default-preserve prompt, answering No for each explicitly named file.
    let promptOutput = "";
    const declined = new Set();
    const answerTimers = [];
    const declineOverwrite = (chunk) => {
      promptOutput += chunk.toString().replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
      for (const match of promptOutput.matchAll(
        /The file ([\w.-]+) already exists\. Would you like to overwrite\?/g,
      )) {
        if (!declined.has(match[1])) {
          declined.add(match[1]);
          // prompts renders before attaching its key listener. Answer after
          // that listener is ready, just as a person would, without mocking it.
          answerTimers.push(
            setTimeout(() => pending.child.stdin.write("n\n"), 100),
          );
        }
      }
      if (declined.size > 0 && /Skipped \d+ files?/.test(chunk.toString()))
        pending.child.stdin.end();
    };
    pending.child.stdout.on("data", declineOverwrite);
    pending.child.stderr.on("data", declineOverwrite);
    try {
      const result = await pending;
      assert.ok(
        !pending.child.killed,
        `CLI timed out: ${result.stdout}\n${result.stderr}`,
      );
      return result;
    } finally {
      answerTimers.forEach(clearTimeout);
    }
  } catch (error) {
    throw new Error(
      `${error.message}\n${error.stdout ?? ""}\n${error.stderr ?? ""}`,
      { cause: error },
    );
  }
}
async function fixture(name, sourceRoot, componentDirectory, tsx = true) {
  const root = path.join(temporary, name);
  const css = path.posix.join(sourceRoot, "globals.css");
  await fs.mkdir(path.join(root, sourceRoot), { recursive: true });
  const config = {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: true,
    tsx,
    tailwind: { config: "", css, baseColor: "neutral", cssVariables: true },
    aliases: {
      components: `@host/${componentDirectory}`,
      ui: `@host/${componentDirectory}/ui`,
      utils: "@host/lib/utils",
      lib: "@host/lib",
      hooks: "@host/hooks",
    },
    registries: { "@bera": `${origin}/r/{name}.json` },
  };
  await fs.writeFile(
    path.join(root, "components.json"),
    JSON.stringify(config),
  );
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name,
      private: true,
      type: "module",
      dependencies: {
        react: projectPackage.dependencies.react,
        "react-dom": projectPackage.dependencies["react-dom"],
      },
      devDependencies: tsx
        ? {
            "@types/react": projectPackage.devDependencies["@types/react"],
            "@types/react-dom":
              projectPackage.devDependencies["@types/react-dom"],
          }
        : {},
    }),
  );
  await fs.writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        baseUrl: ".",
        paths: { "@host/*": [`./${sourceRoot ? `${sourceRoot}/` : ""}*`] },
      },
    }),
  );
  await fs.writeFile(
    path.join(root, css),
    ":root { --background: oklch(0.15 0 0); --foreground: oklch(0.95 0 0); }\n",
  );
  return {
    root,
    destination: path.join(root, sourceRoot, componentDirectory, "bera"),
    css,
    config,
  };
}
async function assertHostIntact(project, before) {
  const after = await snapshot(project.root);
  for (const name of ["components.json", "tsconfig.json", project.css])
    assert.equal(after[name], before[name], `Host file changed: ${name}`);
}
async function compileInstalled(project, entries) {
  const paths = Object.fromEntries(
    Object.entries(project.config.aliases).map(([, alias]) => [
      `${alias}/*`,
      [`${path.relative(project.root, path.dirname(project.destination))}/*`],
    ]),
  );
  const declarations = path.join(project.root, "styles.d.ts");
  await fs.writeFile(declarations, 'declare module "*.css";\n');
  const sourcePaths = entries.map((entry) =>
    path.join(project.destination, `${entry.id}.tsx`),
  );
  const program = ts.createProgram([...sourcePaths, declarations], {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    isolatedModules: true,
    esModuleInterop: true,
    noUncheckedSideEffectImports: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    baseUrl: project.root,
    paths,
    types: ["react", "react-dom"],
    typeRoots: [path.join(project.root, "node_modules/@types")],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => project.root,
      getNewLine: () => "\n",
    }),
  );
  const checker = program.getTypeChecker();
  for (const [index, file] of sourcePaths.entries()) {
    const source = program.getSourceFile(file);
    assert.deepEqual(
      checker
        .getExportsOfModule(checker.getSymbolAtLocation(source))
        .map((symbol) => symbol.name),
      [entries[index].exportName],
    );
    const cssImports = source.statements
      .filter(ts.isImportDeclaration)
      .map((node) => node.moduleSpecifier.text)
      .filter((name) => name.endsWith(".css"));
    assert.equal(cssImports.length, 1);
    const cssImport = cssImports[0];
    assert.ok(
      cssImport.startsWith(".") ||
        cssImport.startsWith(`${project.config.aliases.components}/`),
      `Unexpected CSS import: ${cssImport}`,
    );
    const cssPath = cssImport.startsWith(".")
      ? path.resolve(path.dirname(file), cssImport)
      : path.join(
          path.dirname(project.destination),
          cssImport.slice(project.config.aliases.components.length + 1),
        );
    assert.equal(
      await fs.readFile(cssPath, "utf8"),
      await fs.readFile(
        path.join(repository, "public/transitions", `${entries[index].id}.css`),
        "utf8",
      ),
    );
  }
}

try {
  await check(
    "released shadcn schemas accept every item and index",
    async () => {
      registrySchema.parse(registry);
      for (const entry of registry.items)
        registryItemSchema.parse(
          await readJSON(
            path.join(repository, "public/r", `${entry.name}.json`),
          ),
        );
    },
  );
  const standard = await fixture("root-alias", "", "components");
  const pristine = await snapshot(standard.root);
  await check("actual CLI dry run performs no project writes", async () => {
    await run(
      standard.root,
      ["add", `${origin}/r/state-button.json`],
      ["--dry-run"],
    );
    assert.deepEqual(await snapshot(standard.root), pristine);
    await assert.rejects(fs.access(path.join(standard.root, "node_modules")));
  });
  await check(
    "URL install writes only selected TSX/CSS and installs declared packages",
    async () => {
      await run(
        standard.root,
        ["add", `${origin}/r/state-button.json`],
        ["--yes"],
      );
      assert.deepEqual((await fs.readdir(standard.destination)).sort(), [
        "state-button.css",
        "state-button.tsx",
      ]);
      const installed = await readJSON(
        path.join(standard.root, "package.json"),
      );
      assert.equal(
        installed.dependencies.react,
        projectPackage.dependencies.react,
      );
      for (const dependency of ["motion", "lucide-react"])
        assert.ok(installed.dependencies[dependency]);
      await assertHostIntact(standard, pristine);
    },
  );
  await check(
    "identical rerun preserves installed files and host configuration",
    async () => {
      const before = await snapshot(standard.root);
      await run(
        standard.root,
        ["add", `${origin}/r/state-button.json`],
        ["--yes"],
      );
      assert.deepEqual(await snapshot(standard.root), before);
    },
  );
  await check(
    "declining real overwrite prompts preserves differing TSX and CSS",
    async () => {
      for (const extension of ["tsx", "css"])
        await fs.appendFile(
          path.join(standard.destination, `state-button.${extension}`),
          "\n/* Host customization. */\n",
        );
      const before = await snapshot(standard.root);
      await run(
        standard.root,
        ["add", `${origin}/r/state-button.json`],
        ["--yes"],
      );
      assert.deepEqual(await snapshot(standard.root), before);
    },
  );
  const custom = await fixture("src-custom-alias", "src", "widgets");
  const customBefore = await snapshot(custom.root);
  await check(
    "native namespace search discovers the lightweight registry catalog",
    async () => {
      const { stdout } = await run(
        custom.root,
        ["search", "@bera"],
        ["--query", "accordion", "--json"],
      );
      const result = JSON.parse(stdout);
      assert.ok(
        result.items.some((item) => item.name === "accordion"),
        stdout,
      );
    },
  );
  await check(
    "configured namespace installs all recipes under a custom src alias",
    async () => {
      await run(
        custom.root,
        ["add", ...manifest.transitions.map((entry) => `@bera/${entry.id}`)],
        ["--yes"],
      );
      assert.deepEqual(
        (await fs.readdir(custom.destination)).sort(),
        manifest.transitions
          .flatMap((entry) => [`${entry.id}.css`, `${entry.id}.tsx`])
          .sort(),
      );
      await assertHostIntact(custom, customBefore);
      await assert.rejects(fs.access(path.join(custom.root, "components")));
    },
  );
  await check(
    "all CLI-transformed recipes strictly compile, retain one export, and resolve matching CSS",
    () => compileInstalled(custom, manifest.transitions),
  );
  const javascript = await fixture(
    "javascript-consumer",
    "src",
    "parts",
    false,
  );
  await check(
    "JavaScript consumer receives JSX and its matching unchanged CSS",
    async () => {
      await run(
        javascript.root,
        ["add", `${origin}/r/morphing-icon-button.json`],
        ["--yes"],
      );
      assert.deepEqual((await fs.readdir(javascript.destination)).sort(), [
        "morphing-icon-button.css",
        "morphing-icon-button.jsx",
      ]);
      const source = await fs.readFile(
        path.join(javascript.destination, "morphing-icon-button.jsx"),
        "utf8",
      );
      assert.ok(!/\binterface\s+\w+/.test(source));
      assert.match(source, /morphing-icon-button\.css/);
      assert.equal(
        await fs.readFile(
          path.join(javascript.destination, "morphing-icon-button.css"),
          "utf8",
        ),
        await fs.readFile(
          path.join(repository, "public/transitions/morphing-icon-button.css"),
          "utf8",
        ),
      );
    },
  );
  await check(
    "native shadcn build resolves the generated root source registry",
    async () => {
      const output = path.join(temporary, "native-build");
      await run(repository, ["build", "registry.json"], ["--output", output]);
      for (const entry of manifest.transitions) {
        const item = await readJSON(path.join(output, `${entry.id}.json`));
        registryItemSchema.parse(item);
        for (const file of item.files)
          assert.equal(
            file.content,
            await fs.readFile(path.join(repository, file.path), "utf8"),
          );
      }
    },
  );
  console.log(
    `\nshadcn ${cliPackage.version}: ${checks} checks passed. Temporary projects removed.`,
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(temporary, { recursive: true, force: true });
}
