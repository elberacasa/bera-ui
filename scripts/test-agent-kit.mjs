#!/usr/bin/env node
// Run from the repository: node scripts/test-agent-kit.mjs
// Requires the project's existing TypeScript dependency. All writes stay in a
// temporary directory; the generator is exercised in an isolated source copy.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gunzipSync } from "node:zlib";
import { checkTransitionExamples } from "./check-transition-examples.mjs";

const execute = promisify(execFile);
const EXPECTED_IDS = [
  "accordion",
  "copy-button",
  "expanding-search",
  "morphing-icon-button",
  "morphing-menu",
  "rolling-counter",
  "sliding-tabs",
  "state-button",
  "text-swap",
  "toast-stack",
];

async function findRepository() {
  const candidates = [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(path.join(candidate, "skills/bera-motion/catalog.json"));
      await fs.access(path.join(candidate, "scripts/sync-components.mjs"));
      return fs.realpath(candidate);
    } catch {
      /* Try the other supported invocation location. */
    }
  }
  throw new Error(
    "Run from the bera-ui repository, or place this script in its scripts directory. Generate the kit first.",
  );
}

async function readJSON(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

// Snapshot only regular files and directory entries; never follow a symlink.
async function snapshot(root, relative = "", result = {}) {
  for (const item of (
    await fs.readdir(path.join(root, relative), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = relative ? `${relative}/${item.name}` : item.name;
    const absolute = path.join(root, name);
    if (item.isDirectory()) {
      result[`${name}/`] = "directory";
      await snapshot(root, name, result);
    } else if (item.isFile()) {
      result[name] = createHash("sha256")
        .update(await fs.readFile(absolute))
        .digest("hex");
    } else if (item.isSymbolicLink()) {
      result[name] = `symlink:${await fs.readlink(absolute)}`;
    } else throw new Error(`Unexpected filesystem entry: ${absolute}`);
  }
  return result;
}

async function sameFile(left, right, label = left) {
  assert.ok(
    (await fs.readFile(left)).equals(await fs.readFile(right)),
    `Content differs: ${label}`,
  );
}

async function runInstaller(installer, args, expectedCode = 0) {
  let result;
  try {
    result = {
      code: 0,
      ...(await execute(process.execPath, [installer, ...args, "--json"], {
        timeout: 15_000,
        maxBuffer: 2 * 1024 * 1024,
      })),
    };
  } catch (error) {
    result = {
      code: error.code,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    };
  }
  assert.equal(
    result.code,
    expectedCode,
    `${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
  );
  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Installer did not return JSON: ${result.stdout || result.stderr}`,
    );
  }
  assert.equal(output.ok, expectedCode === 0);
  return output;
}

// Read the standard USTAR archive independently of its generator. Extraction is
// limited to checked regular-file entries beneath the expected kit directory.
function unpackArchive(compressed) {
  const tar = gunzipSync(compressed);
  assert.equal(tar.length % 512, 0, "Tar blocks must be aligned");
  const files = new Map();
  let offset = 0;
  for (; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (start, length) =>
      header
        .toString("utf8", start, start + length)
        .split("\0", 1)[0]
        .trim();
    const prefix = field(345, 155);
    const name = `${prefix ? `${prefix}/` : ""}${field(0, 100)}`;
    assert.equal(field(257, 6), "ustar", `Non-USTAR entry: ${name}`);
    assert.ok(
      ["0", ""].includes(field(156, 1)),
      `Only regular files are allowed: ${name}`,
    );
    assert.ok(
      name.startsWith("bera-motion/") &&
        !name.includes("\\") &&
        name
          .split("/")
          .every((part) => part && part !== "." && part !== "..") &&
        !path.posix.isAbsolute(name),
      `Unsafe archive path: ${name}`,
    );
    assert.ok(!files.has(name), `Duplicate archive path: ${name}`);
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(32, 148, 156);
    assert.equal(
      Number.parseInt(field(148, 8), 8),
      checksumHeader.reduce((sum, byte) => sum + byte, 0),
      `Bad tar checksum: ${name}`,
    );
    const size = Number.parseInt(field(124, 12), 8);
    assert.ok(
      Number.isSafeInteger(size) &&
        size >= 0 &&
        offset + 512 + size <= tar.length,
      `Bad tar size: ${name}`,
    );
    files.set(
      name,
      Buffer.from(tar.subarray(offset + 512, offset + 512 + size)),
    );
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  assert.ok(
    tar.length - offset >= 1024 &&
      tar.subarray(offset).every((byte) => byte === 0),
    "Missing tar end blocks",
  );
  return files;
}

const CONSUMER_PROPS = {
  "morphing-icon-button":
    'pressed={false} onPressedChange={value => update(Number(value))} label="Navigation" aria-controls="navigation-panel" disabled={false}',
  "state-button": "onAction={save}",
  "sliding-tabs":
    'items={[{ value: "first", label: "First", content: <span>Panel</span> }]} value="first" onValueChange={value => update(value)}',
  "morphing-menu":
    'label="Actions" actions={[{ label: "Open", onSelect: () => update("open") }]}',
  "text-swap": 'statuses={[{ text: "Ready", Icon }]} value={0}',
  "expanding-search":
    'items={["Alpha", "Beta"]} value="Alpha" onValueChange={value => update(value)} onSearch={query => update(query)}',
  "toast-stack":
    'title="Preview notification" description={<span>Local demonstration</span>}',
  "copy-button": 'text="https://example.com/project"',
  "rolling-counter":
    "value={4} min={0} max={99} onValueChange={value => update(value)}",
  accordion:
    'items={[{ title: "Details", body: <a href="#details">Read more</a> }]} value={0} onValueChange={value => update(value)}',
};

async function compileConsumer(ts, repository, project, transition) {
  const directory = path.join(project, "components/bera");
  const sourcePath = path.join(directory, `${transition.id}.tsx`);
  const consumerPath = path.join(project, "consumer.tsx");
  await fs.symlink(
    path.join(repository, "node_modules"),
    path.join(project, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await fs.writeFile(
    path.join(project, "styles.d.ts"),
    'declare module "*.css";\n',
  );
  await fs.writeFile(
    consumerPath,
    `import { ${transition.exportName} } from "./components/bera/${transition.id}";
declare function save(): Promise<void>;
declare function update(value: string | number | null): void;
const Icon = () => <span aria-hidden="true" />;
export const Consumer = () => <${transition.exportName} ${CONSUMER_PROPS[transition.id]} speed={1} radius={12} preview={false} className="host-component" style={{ color: "inherit" }} />;
// @ts-expect-error The public radius prop must remain numeric.
export const InvalidRadius = <${transition.exportName} radius="rounded" />;
`,
  );
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    isolatedModules: true,
    esModuleInterop: true,
    allowArbitraryExtensions: true,
    noUncheckedSideEffectImports: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    lib: ["lib.es2020.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    types: ["react", "react-dom"],
    typeRoots: [path.join(repository, "node_modules/@types")],
  };
  const program = ts.createProgram(
    [consumerPath, path.join(project, "styles.d.ts")],
    options,
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => project,
      getNewLine: () => "\n",
    }),
  );
  const source = program.getSourceFile(sourcePath);
  assert.ok(source, `Consumer did not include ${transition.id}`);
  const checker = program.getTypeChecker();
  const symbol = checker.getSymbolAtLocation(source);
  assert.ok(symbol, "Recipe must be an external module");
  assert.deepEqual(
    checker.getExportsOfModule(symbol).map((item) => item.name),
    [transition.exportName],
    `${transition.id} must export exactly its named component`,
  );
  const imports = source.statements
    .filter(ts.isImportDeclaration)
    .map((item) => item.moduleSpecifier.text);
  assert.deepEqual(
    imports.filter((item) => item.startsWith(".")),
    [`./${transition.id}.css`],
    "A standalone component must not require sibling code or gallery CSS",
  );
  for (const dependency of imports.filter((item) => !item.startsWith("."))) {
    assert.ok(
      ["react", ...transition.dependencies].some(
        (name) => dependency === name || dependency.startsWith(`${name}/`),
      ),
      `Undeclared import: ${dependency}`,
    );
  }
  await fs.access(path.join(directory, `${transition.id}.css`));
}

async function main() {
  const repository = await findRepository();
  const ts = createRequire(path.join(repository, "package.json"))("typescript");
  const kit = path.join(repository, "skills/bera-motion");
  const installer = path.join(kit, "install.mjs");
  const catalog = await readJSON(path.join(kit, "catalog.json"));
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "bera-agent-kit-")),
  );
  let passed = 0;
  let failed = 0;
  const check = async (name, action) => {
    try {
      await action();
      passed++;
      console.log(`ok ${passed + failed} - ${name}`);
    } catch (error) {
      failed++;
      console.error(
        `not ok ${passed + failed} - ${name}\n${error.stack ?? error}`,
      );
    }
  };
  const project = async (manifest = { dependencies: { motion: "*" } }) => {
    const root = await fs.mkdtemp(path.join(temporary, "project-"));
    await fs.writeFile(
      path.join(root, "package.json"),
      JSON.stringify(manifest),
    );
    return root;
  };
  const stateButton = catalog.transitions.find(
    (item) => item.id === "state-button",
  );
  const add = (root, extra = [], executable = installer) =>
    runInstaller(executable, [
      "add",
      "state-button",
      "--project",
      root,
      ...extra,
    ]);
  let archiveFiles;
  let unpackedKit;
  try {
    await check("catalog contains every complete recipe", async () => {
      assert.equal(catalog.version, 2);
      assert.deepEqual(
        catalog.transitions.map((item) => item.id).sort(),
        EXPECTED_IDS,
      );
      for (const entry of catalog.transitions) {
        assert.match(entry.exportName, /^[A-Z][A-Za-z0-9]*$/);
        for (const file of [entry.source, entry.styles, entry.recipe])
          assert.ok((await fs.stat(path.join(kit, file))).isFile(), file);
      }
      assert.deepEqual(
        catalog.adapters.map((entry) => entry.id),
        ["radix-menu-motion"],
      );
      assert.ok(
        !catalog.transitions.some((entry) => entry.id === "radix-menu-motion"),
      );
      for (const entry of catalog.adapters) {
        assert.equal(entry.kind, "adapter");
        assert.deepEqual(entry.dependencies, []);
        assert.deepEqual(entry.files, [
          { source: `adapters/${entry.id}.css`, target: `${entry.id}.css` },
        ]);
      }
    });
    await check("installer list returns the actual catalog", async () => {
      const output = await runInstaller(installer, ["list"]);
      assert.equal(output.version, catalog.version);
      assert.deepEqual(output.transitions, catalog.transitions);
      assert.deepEqual(output.adapters, catalog.adapters);
    });
    await check(
      "CSS adapter dry run and install preserve the host menu, theme, and packages",
      async () => {
        const root = await project({ dependencies: { "radix-ui": "^1.6.7" } });
        await fs.mkdir(path.join(root, "components/ui"), { recursive: true });
        await fs.writeFile(
          path.join(root, "components/ui/dropdown-menu.tsx"),
          "// Host-owned menu with custom handlers.\n",
        );
        await fs.writeFile(
          path.join(root, "theme.css"),
          ":root { --foreground: 0 0% 98%; }\n",
        );
        const args = [
          "add",
          "radix-menu-motion",
          "--project",
          root,
          "--dir",
          "src/motion",
        ];
        const before = await snapshot(root);
        const preview = await runInstaller(installer, [...args, "--dry-run"]);
        assert.equal(preview.kind, "adapter");
        assert.equal(preview.files.length, 1);
        assert.deepEqual(preview.dependencies, []);
        assert.deepEqual(preview.missingDependencies, []);
        assert.deepEqual(await snapshot(root), before);
        await runInstaller(installer, args);
        const after = await snapshot(root);
        for (const [file, hash] of Object.entries(before))
          assert.equal(after[file], hash, file);
        assert.deepEqual(
          Object.keys(after).filter((file) => !(file in before)),
          ["src/", "src/motion/", "src/motion/radix-menu-motion.css"],
        );
        await sameFile(
          path.join(root, "src/motion/radix-menu-motion.css"),
          path.join(kit, "adapters/radix-menu-motion.css"),
        );
        assert.equal(
          (await runInstaller(installer, args)).files[0].status,
          "unchanged",
        );
        assert.deepEqual(await snapshot(root), after);
        await fs.appendFile(
          path.join(root, "src/motion/radix-menu-motion.css"),
          "/* Host adaptation. */\n",
        );
        const edited = await snapshot(root);
        assert.equal(
          (await runInstaller(installer, args, 1)).error.code,
          "CONFLICT",
        );
        assert.deepEqual(await snapshot(root), edited);
      },
    );
    await check(
      "CSS adapters reject unsafe file declarations, duplicate IDs, and missing files",
      async () => {
        for (const mutation of [
          (data) => {
            data.adapters[0].files[0].target = "../escape.css";
          },
          (data) => {
            data.adapters[0].files[0].source = "../escape.css";
          },
          (data) => {
            data.adapters.push(data.adapters[0]);
          },
          (data) => {
            data.adapters[0].id = data.transitions[0].id;
          },
        ]) {
          const copied = await fs.mkdtemp(
            path.join(temporary, "adapter-invalid-"),
          );
          await fs.cp(kit, copied, { recursive: true });
          const data = structuredClone(catalog);
          mutation(data);
          await fs.writeFile(
            path.join(copied, "catalog.json"),
            JSON.stringify(data),
          );
          const root = await project();
          const before = await snapshot(root);
          assert.equal(
            (
              await runInstaller(
                path.join(copied, "install.mjs"),
                ["add", "radix-menu-motion", "--project", root],
                1,
              )
            ).error.code,
            "INVALID_KIT",
          );
          assert.deepEqual(await snapshot(root), before);
        }
        const copied = await fs.mkdtemp(
          path.join(temporary, "adapter-missing-"),
        );
        await fs.cp(kit, copied, { recursive: true });
        await fs.rm(path.join(copied, "adapters/radix-menu-motion.css"));
        const root = await project();
        const before = await snapshot(root);
        assert.equal(
          (
            await runInstaller(
              path.join(copied, "install.mjs"),
              ["add", "radix-menu-motion", "--project", root],
              1,
            )
          ).error.code,
          "INVALID_KIT",
        );
        assert.deepEqual(await snapshot(root), before);
      },
    );
    await check(
      "help is JSON and invalid commands, flags, and IDs fail",
      async () => {
        assert.equal(
          (await runInstaller(installer, ["add", "state-button", "--help"]))
            .command,
          "help",
        );
        const root = await project();
        for (const args of [
          ["toString"],
          ["list", "--unknown"],
          ["add", "../escape", "--project", root],
          ["add", "unknown-transition", "--project", root],
        ]) {
          assert.ok((await runInstaller(installer, args, 1)).error.code);
        }
        assert.deepEqual(Object.keys(await snapshot(root)), ["package.json"]);
      },
    );
    await check(
      "add dry run reports dependencies and makes no writes",
      async () => {
        const root = await project();
        const before = await snapshot(root);
        const output = await add(root, ["--dry-run"]);
        assert.deepEqual(
          output.files.map((file) => file.status),
          ["would-create", "would-create"],
        );
        assert.deepEqual(output.missingDependencies, ["lucide-react"]);
        assert.deepEqual(await snapshot(root), before);
      },
    );
    await check(
      "add copies only selected TSX/CSS into a custom directory",
      async () => {
        const root = await project();
        const output = await add(root, ["--dir", "src/motion"]);
        assert.equal(output.destination, path.join(root, "src/motion"));
        assert.deepEqual(
          Object.keys(await snapshot(path.join(root, "src/motion"))).sort(),
          ["state-button.css", "state-button.tsx"],
        );
        await sameFile(
          path.join(root, "src/motion/state-button.tsx"),
          path.join(kit, stateButton.source),
        );
        await sameFile(
          path.join(root, "src/motion/state-button.css"),
          path.join(kit, stateButton.styles),
        );
      },
    );
    await check(
      "identical add is idempotent and preserves file timestamps",
      async () => {
        const root = await project();
        await add(root);
        const file = path.join(root, "components/bera/state-button.tsx");
        const before = (await fs.stat(file)).mtimeMs;
        assert.ok(
          (await add(root)).files.every((item) => item.status === "unchanged"),
        );
        assert.equal((await fs.stat(file)).mtimeMs, before);
      },
    );
    await check(
      "conflicts preserve user files without a partial copy",
      async () => {
        const root = await project();
        await fs.mkdir(path.join(root, "components/bera"), { recursive: true });
        await fs.writeFile(
          path.join(root, "components/bera/state-button.css"),
          "user-owned CSS",
        );
        const before = await snapshot(root);
        const output = await runInstaller(
          installer,
          ["add", "state-button", "--project", root],
          1,
        );
        assert.equal(output.error.code, "CONFLICT");
        assert.deepEqual(await snapshot(root), before);
      },
    );
    await check(
      "directory traversal and absolute destinations are rejected",
      async () => {
        const root = await project();
        const before = await snapshot(root);
        for (const dir of [
          "../escape",
          "safe/../escape",
          path.join(temporary, "escape"),
          "C:\\escape",
          "..\\escape",
        ]) {
          const output = await runInstaller(
            installer,
            ["add", "state-button", "--project", root, "--dir", dir],
            1,
          );
          assert.equal(output.error.code, "UNSAFE_PATH");
        }
        assert.deepEqual(await snapshot(root), before);
      },
    );
    await check(
      "symlink escapes and destination file symlinks are rejected",
      async () => {
        const root = await project();
        const outside = await project();
        const before = await snapshot(outside);
        await fs.symlink(
          outside,
          path.join(root, "components"),
          process.platform === "win32" ? "junction" : "dir",
        );
        assert.equal(
          (
            await runInstaller(
              installer,
              ["add", "state-button", "--project", root],
              1,
            )
          ).error.code,
          "UNSAFE_PATH",
        );
        assert.deepEqual(await snapshot(outside), before);
        await fs.unlink(path.join(root, "components"));
        await fs.mkdir(path.join(root, "components/bera"), { recursive: true });
        await fs.symlink(
          path.join(outside, "package.json"),
          path.join(root, "components/bera/state-button.tsx"),
          "file",
        );
        assert.equal(
          (
            await runInstaller(
              installer,
              ["add", "state-button", "--project", root],
              1,
            )
          ).error.code,
          "UNSAFE_PATH",
        );
        assert.deepEqual(await snapshot(outside), before);
      },
    );
    await check(
      "an incomplete downloaded recipe fails before copying",
      async () => {
        const broken = path.join(temporary, "broken-kit");
        await fs.cp(kit, broken, { recursive: true });
        await fs.unlink(path.join(broken, stateButton.recipe));
        const root = await project();
        const before = await snapshot(root);
        const output = await runInstaller(
          path.join(broken, "install.mjs"),
          ["add", "state-button", "--project", root],
          1,
        );
        assert.equal(output.error.code, "INVALID_KIT");
        assert.deepEqual(await snapshot(root), before);
      },
    );
    await check("skill dry run leaves the host unchanged", async () => {
      const root = await project();
      const before = await snapshot(root);
      const output = await runInstaller(installer, [
        "skill",
        "--project",
        root,
        "--dry-run",
      ]);
      assert.ok(
        output.files.length > 20 &&
          output.files.every((item) => item.status === "would-create"),
      );
      assert.deepEqual(await snapshot(root), before);
    });
    await check(
      "all agent skill paths install fully, rerun safely, and preserve conflicts",
      async () => {
        const root = await project();
        const original = await snapshot(kit);
        for (const [agent, directory] of [
          ["codex", ".agents"],
          ["claude", ".claude"],
          ["cursor", ".cursor"],
          ["copilot", ".github"],
        ]) {
          const args = ["skill", "--project", root, "--agent", agent];
          const output = await runInstaller(installer, args);
          const destination = path.join(root, directory, "skills/bera-motion");
          assert.equal(output.destination, destination);
          assert.deepEqual(await snapshot(destination), original);
          assert.ok(
            (await runInstaller(installer, args)).files.every(
              (item) => item.status === "unchanged",
            ),
          );
          await fs.writeFile(
            path.join(destination, "SKILL.md"),
            "existing custom skill",
          );
          const before = await snapshot(destination);
          assert.equal(
            (await runInstaller(installer, args, 1)).error.code,
            "CONFLICT",
          );
          assert.deepEqual(await snapshot(destination), before);
        }
      },
    );
    await check(
      "tar.gz has safe portable headers and every kit file byte-for-byte",
      async () => {
        archiveFiles = unpackArchive(
          await fs.readFile(path.join(repository, "public/bera-motion.tar.gz")),
        );
        const files = Object.entries(await snapshot(kit)).filter(
          ([, hash]) => hash !== "directory",
        );
        assert.deepEqual(
          [...archiveFiles.keys()].sort(),
          files.map(([name]) => `bera-motion/${name}`).sort(),
        );
        const extracted = path.join(temporary, "download");
        for (const [name, data] of archiveFiles) {
          assert.ok(
            data.equals(
              await fs.readFile(
                path.join(kit, name.slice("bera-motion/".length)),
              ),
            ),
            name,
          );
          const output = path.join(extracted, name);
          await fs.mkdir(path.dirname(output), { recursive: true });
          await fs.writeFile(output, data);
        }
        unpackedKit = path.join(extracted, "bera-motion");
      },
    );
    await check(
      "extracted download installs components and the complete portable skill",
      async () => {
        assert.ok(
          unpackedKit,
          "Archive must pass validation before extraction is used",
        );
        const executable = path.join(unpackedKit, "install.mjs");
        assert.deepEqual(
          (await runInstaller(executable, ["list"])).transitions,
          catalog.transitions,
        );
        const root = await project();
        await add(root, [], executable);
        const adapterOutput = await runInstaller(executable, [
          "add",
          "radix-menu-motion",
          "--project",
          root,
        ]);
        assert.equal(adapterOutput.files.length, 1);
        await sameFile(
          path.join(root, "components/bera/radix-menu-motion.css"),
          path.join(kit, "adapters/radix-menu-motion.css"),
        );
        await sameFile(
          path.join(root, "components/bera/state-button.tsx"),
          path.join(kit, stateButton.source),
        );
        const output = await runInstaller(executable, [
          "skill",
          "--project",
          root,
        ]);
        assert.deepEqual(
          await snapshot(output.destination),
          await snapshot(kit),
        );
      },
    );
    await check(
      "public source, CSS, JSON, briefs, manifest, and skill match the kit",
      async () => {
        const manifest = await readJSON(
          path.join(repository, "public/transitions/manifest.json"),
        );
        assert.equal(manifest.version, 2);
        assert.deepEqual(
          manifest.transitions.map((item) => item.id),
          catalog.transitions.map((item) => item.id),
        );
        for (const entry of catalog.transitions) {
          const base = path.join(repository, "public/transitions", entry.id);
          await sameFile(`${base}.tsx`, path.join(kit, entry.source));
          await sameFile(`${base}.css`, path.join(kit, entry.styles));
          const asset = await readJSON(`${base}.json`);
          assert.equal(
            asset.source,
            await fs.readFile(path.join(kit, entry.source), "utf8"),
          );
          assert.equal(
            asset.css,
            await fs.readFile(path.join(kit, entry.styles), "utf8"),
          );
          assert.deepEqual(asset.dependencies, entry.dependencies);
          const brief = await fs.readFile(`${base}.agent.md`, "utf8");
          assert.ok(
            brief.includes(entry.integration) &&
              brief.includes(
                `https://bera-ui.vercel.app/transitions/${entry.id}.tsx`,
              ) &&
              brief.includes(
                `https://bera-ui.vercel.app/transitions/${entry.id}.css`,
              ) &&
              brief.includes(asset.source) &&
              brief.includes(asset.css),
            entry.id,
          );
          const published = manifest.transitions.find(
            (item) => item.id === entry.id,
          );
          assert.deepEqual(
            [
              published.source,
              published.styles,
              published.recipe,
              published.asset,
            ],
            [
              `/transitions/${entry.id}.tsx`,
              `/transitions/${entry.id}.css`,
              `/transitions/${entry.id}.agent.md`,
              `/transitions/${entry.id}.json`,
            ],
          );
        }
        const publicSkill = await fs.readFile(
          path.join(repository, "public/bera-motion.SKILL.md"),
          "utf8",
        );
        assert.match(
          publicSkill,
          /https:\/\/bera-ui\.vercel\.app\/transitions\/manifest\.json/,
        );
        assert.ok(
          !publicSkill.includes("](references/") &&
            !publicSkill.includes("](catalog.json)"),
        );
        const integration = await fs.readFile(
          path.join(repository, "public/transitions/integration.md"),
          "utf8",
        );
        assert.ok(
          !integration.includes("../catalog") &&
            !integration.includes("../recipes/") &&
            !integration.includes("../references/"),
        );
        assert.ok(
          integration.includes(
            "https://bera-ui.vercel.app/transitions/manifest.json",
          ),
        );
        await sameFile(
          path.join(repository, "public/transitions/motion.md"),
          path.join(kit, "references/motion.md"),
        );
      },
    );
    await check(
      "shadcn registry has paired source, scoped targets, supported packages, and lightweight discovery",
      async () => {
        const index = await readJSON(
          path.join(repository, "public/r/registry.json"),
        );
        const manifest = await readJSON(
          path.join(repository, "public/transitions/manifest.json"),
        );
        const packageJSON = await readJSON(
          path.join(repository, "package.json"),
        );
        assert.equal(
          index.$schema,
          "https://ui.shadcn.com/schema/registry.json",
        );
        assert.equal(index.name, "bera");
        assert.equal(index.homepage, "https://bera-ui.vercel.app");
        assert.deepEqual(
          index.items.map((item) => item.name),
          [...catalog.transitions, ...catalog.adapters].map((item) => item.id),
        );
        assert.equal(manifest.registry.url, "/r/registry.json");
        assert.equal(manifest.compatibility.react, "^19.0.0");
        await sameFile(
          path.join(repository, "registry.json"),
          path.join(repository, "public/r/registry.json"),
        );
        for (const entry of catalog.transitions) {
          const item = await readJSON(
            path.join(repository, "public/r", `${entry.id}.json`),
          );
          assert.equal(
            item.$schema,
            "https://ui.shadcn.com/schema/registry-item.json",
          );
          assert.equal(item.name, entry.id);
          assert.equal(item.type, "registry:component");
          assert.deepEqual(
            Object.keys(item).sort(),
            [
              "$schema",
              "name",
              "type",
              "title",
              "description",
              "dependencies",
              "files",
              "docs",
              "categories",
            ].sort(),
          );
          assert.deepEqual(
            item.dependencies,
            entry.dependencies.map(
              (name) => `${name}@${packageJSON.dependencies[name]}`,
            ),
          );
          assert.equal(item.files.length, 2);
          assert.equal(item.files[0].type, "registry:component");
          assert.equal(item.files[1].type, "registry:file");
          for (const [number, extension] of ["tsx", "css"].entries()) {
            const file = item.files[number];
            assert.equal(
              file.target,
              `@components/bera/${entry.id}.${extension}`,
            );
            assert.equal(
              file.path,
              `skills/bera-motion/recipes/${entry.id}.${extension}`,
            );
            assert.equal(
              file.content,
              await fs.readFile(path.join(repository, file.path), "utf8"),
            );
          }
          assert.deepEqual(
            index.items.find((candidate) => candidate.name === entry.id),
            {
              ...item,
              files: item.files.map(({ path, type, target }) => ({
                path,
                type,
                target,
              })),
            },
          );
          assert.equal(
            manifest.transitions.find((candidate) => candidate.id === entry.id)
              .registry,
            `/r/${entry.id}.json`,
          );
        }
        assert.ok(
          Buffer.byteLength(JSON.stringify(index)) < 32_000,
          "Discovery must not duplicate all source/CSS blobs",
        );
        const llms = await fs.readFile(
          path.join(repository, "public/llms.txt"),
          "utf8",
        );
        for (const entry of catalog.transitions)
          assert.ok(
            llms.includes(
              `https://bera-ui.vercel.app/transitions/${entry.id}.agent.md`,
            ),
          );
        for (const adapter of catalog.adapters) {
          const item = await readJSON(
            path.join(repository, "public/r", `${adapter.id}.json`),
          );
          assert.equal(item.type, "registry:file");
          assert.deepEqual(item.dependencies, []);
          assert.equal(item.files.length, 1);
          assert.deepEqual(
            Object.keys(item).sort(),
            [
              "$schema",
              "name",
              "type",
              "title",
              "description",
              "dependencies",
              "files",
              "docs",
              "categories",
            ].sort(),
          );
          assert.equal(
            item.files[0].path,
            `skills/bera-motion/adapters/${adapter.id}.css`,
          );
          assert.equal(
            item.files[0].target,
            `@components/bera/${adapter.id}.css`,
          );
          assert.equal(item.files[0].type, "registry:file");
          const css = await fs.readFile(
            path.join(kit, adapter.files[0].source),
            "utf8",
          );
          assert.equal(item.files[0].content, css);
          await sameFile(
            path.join(repository, "public/adapters", `${adapter.id}.css`),
            path.join(kit, adapter.files[0].source),
          );
          const guide = await fs.readFile(
            path.join(repository, "public/adapters", `${adapter.id}.agent.md`),
            "utf8",
          );
          assert.ok(guide.includes(css));
          assert.ok(
            !guide.includes("](../adapters/") &&
              !guide.includes("](../catalog.json)"),
          );
          const published = manifest.adapters.find(
            (entry) => entry.id === adapter.id,
          );
          assert.deepEqual(published.files, [
            {
              source: `/adapters/${adapter.id}.css`,
              target: `${adapter.id}.css`,
            },
          ]);
          assert.equal(published.recipe, `/adapters/${adapter.id}.agent.md`);
          assert.equal(published.registry, `/r/${adapter.id}.json`);
          assert.ok(
            llms.includes(
              `https://bera-ui.vercel.app/adapters/${adapter.id}.agent.md`,
            ),
          );
        }
      },
    );
    await check(
      "published guidance links resolve to real website assets",
      async () => {
        const files = [
          "llms.txt",
          "bera-motion.SKILL.md",
          ...catalog.transitions.map(
            (entry) => `transitions/${entry.id}.agent.md`,
          ),
          ...catalog.adapters.map((entry) => `adapters/${entry.id}.agent.md`),
          "transitions/integration.md",
          "transitions/motion.md",
        ];
        for (const name of files) {
          const markdown = (
            await fs.readFile(path.join(repository, "public", name), "utf8")
          ).replace(/```[\s\S]*?```/g, "");
          for (const match of markdown.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
            const target = new URL(
              match[1],
              `https://bera-ui.vercel.app/${name}`,
            );
            if (target.origin !== "https://bera-ui.vercel.app") continue;
            if (target.pathname === "/agents") continue; // Next page, not a public asset.
            if (target.pathname.startsWith("/integrations/")) {
              assert.ok(
                (
                  await fs.stat(
                    path.join(repository, "app", target.pathname, "page.tsx"),
                  )
                ).isFile(),
                `Missing integration page: ${target.pathname}`,
              );
              continue;
            }
            const destination = path.join(
              repository,
              "public",
              decodeURIComponent(target.pathname),
            );
            assert.ok(
              (await fs.stat(destination)).isFile(),
              `${name} has a missing link: ${match[1]}`,
            );
          }
        }
      },
    );
    await check(
      "Install examples strictly compile against generated source",
      () => checkTransitionExamples(repository),
    );
    await check(
      "isolated generation matches published files and is deterministic",
      async () => {
        const clone = path.join(temporary, "generation");
        await fs.mkdir(clone);
        await fs.cp(kit, path.join(clone, "skills/bera-motion"), {
          recursive: true,
        });
        const files = [
          "LICENSE",
          "package.json",
          "scripts/sync-components.mjs",
          "scripts/extract-transition.mjs",
          "lib/transition-catalog.json",
          "lib/adapter-catalog.json",
        ];
        const entries = await readJSON(
          path.join(repository, "lib/transition-catalog.json"),
        );
        for (const adapter of await readJSON(
          path.join(repository, "lib/adapter-catalog.json"),
        ))
          files.push(adapter.source);
        for (const group of new Set(entries.map((item) => item.group)))
          files.push(
            `components/transitions/${group}.tsx`,
            `components/transitions/${group}.css`,
          );
        for (const file of files) {
          await fs.mkdir(path.dirname(path.join(clone, file)), {
            recursive: true,
          });
          await fs.copyFile(
            path.join(repository, file),
            path.join(clone, file),
          );
        }
        await fs.symlink(
          path.join(repository, "node_modules"),
          path.join(clone, "node_modules"),
          process.platform === "win32" ? "junction" : "dir",
        );
        const generate = () =>
          execute(
            process.execPath,
            [path.join(clone, "scripts/sync-components.mjs")],
            { cwd: clone, timeout: 30_000, maxBuffer: 1024 * 1024 },
          );
        await generate();
        const first = await snapshot(path.join(clone, "public"));
        assert.deepEqual(
          await snapshot(path.join(clone, "skills/bera-motion")),
          await snapshot(kit),
        );
        assert.deepEqual(
          await snapshot(path.join(clone, "public/transitions")),
          await snapshot(path.join(repository, "public/transitions")),
        );
        assert.deepEqual(
          await snapshot(path.join(clone, "public/r")),
          await snapshot(path.join(repository, "public/r")),
        );
        assert.deepEqual(
          await snapshot(path.join(clone, "public/adapters")),
          await snapshot(path.join(repository, "public/adapters")),
        );
        await sameFile(
          path.join(clone, "registry.json"),
          path.join(repository, "registry.json"),
        );
        await sameFile(
          path.join(clone, "public/llms.txt"),
          path.join(repository, "public/llms.txt"),
        );
        // Node releases may use different deflate implementations. The portable
        // tar stream must match; repeat generation below still compares gzip bytes.
        assert.deepEqual(
          gunzipSync(
            await fs.readFile(path.join(clone, "public/bera-motion.tar.gz")),
          ),
          gunzipSync(
            await fs.readFile(
              path.join(repository, "public/bera-motion.tar.gz"),
            ),
          ),
          "Portable archive contents changed across builders",
        );
        await generate();
        assert.deepEqual(await snapshot(path.join(clone, "public")), first);
        assert.deepEqual(
          await snapshot(path.join(clone, "skills/bera-motion")),
          await snapshot(kit),
        );
      },
    );
    for (const transition of catalog.transitions) {
      await check(
        `${transition.id} installs and compiles as one strict standalone consumer`,
        async () => {
          const root = await project({
            dependencies: {
              react: "*",
              ...Object.fromEntries(
                transition.dependencies.map((name) => [name, "*"]),
              ),
            },
          });
          const output = await runInstaller(installer, [
            "add",
            transition.id,
            "--project",
            root,
          ]);
          assert.deepEqual(output.missingDependencies, []);
          assert.deepEqual(
            Object.keys(
              await snapshot(path.join(root, "components/bera")),
            ).sort(),
            [`${transition.id}.css`, `${transition.id}.tsx`],
          );
          await sameFile(
            path.join(root, "components/bera", `${transition.id}.css`),
            path.join(kit, transition.styles),
          );
          await compileConsumer(ts, repository, root, transition);
        },
      );
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
  console.log(
    `\nAgent kit: ${passed} passed, ${failed} failed. Temporary fixtures removed.`,
  );
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
