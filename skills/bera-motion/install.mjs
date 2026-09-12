#!/usr/bin/env node
/** Portable Bera motion kit installer. Node.js 18+, no packages or network needed. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KIT = path.dirname(fileURLToPath(import.meta.url));
const AGENTS = {
  codex: ".agents/skills/bera-motion",
  claude: ".claude/skills/bera-motion",
  cursor: ".cursor/skills/bera-motion",
  copilot: ".github/skills/bera-motion",
};
const HELP = `Bera motion kit — Node.js 18+

  node install.mjs list [--json]
  node install.mjs add <id> --project <path> [--dir components/bera] [--dry-run] [--json]
  node install.mjs skill --project <path> [--agent codex|claude|cursor|copilot] [--dry-run] [--json]
  node install.mjs --help

add copies one transition's TSX/CSS or a CSS adapter's explicit files.
list reports standalone transitions and host adapters separately.
skill copies the complete kit into the selected agent's project skill folder.
Codex is the default agent (.agents/skills/bera-motion).
Existing identical files are kept. Different files cause an error before copying.
--dry-run checks the operation without writing. No dependencies are installed.
`;

class InstallError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new InstallError(code, message, details);
}

function parse(argv) {
  if (argv.length === 0) return { help: true, json: false };
  const allowed = {
    list: new Set(["--json", "--help"]),
    add: new Set(["--project", "--dir", "--dry-run", "--json", "--help"]),
    skill: new Set(["--project", "--agent", "--dry-run", "--json", "--help"]),
  };
  if (argv.length === 1 && ["--help", "-h"].includes(argv[0])) {
    return { help: true, json: false };
  }
  const command = argv[0];
  if (!Object.hasOwn(allowed, command))
    fail("USAGE", `Unknown command: ${command}. Use --help.`);
  const options = { command, json: false, dryRun: false };
  const positional = [];
  const seen = new Set();
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("-")) {
      positional.push(token);
      continue;
    }
    if (!allowed[command].has(token))
      fail("USAGE", `Unknown option for ${command}: ${token}`);
    if (seen.has(token))
      fail("USAGE", `Option supplied more than once: ${token}`);
    seen.add(token);
    if (token === "--json") options.json = true;
    else if (token === "--dry-run") options.dryRun = true;
    else if (token === "--help") options.help = true;
    else {
      const value = argv[++i];
      if (!value || value.startsWith("--"))
        fail("USAGE", `Missing value for ${token}.`);
      options[token.slice(2)] = value;
    }
  }
  if (options.help) return options;
  if (positional.length !== (command === "add" ? 1 : 0)) {
    fail(
      "USAGE",
      command === "add"
        ? "Provide exactly one transition or adapter ID."
        : `Unexpected arguments for ${command}.`,
    );
  }
  if (command === "add") options.id = positional[0];
  if (command !== "list" && !options.project)
    fail("USAGE", "--project is required.");
  if (options.id && !validId(options.id))
    fail("INVALID_ID", `Invalid item ID: ${options.id}`);
  if (command === "add")
    options.dir = relativeDir(options.dir ?? "components/bera");
  if (command === "skill") {
    options.agent ??= "codex";
    if (!Object.hasOwn(AGENTS, options.agent))
      fail("USAGE", `Unknown agent: ${options.agent}`);
  }
  return options;
}

function validId(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function relativeDir(value) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.includes("\0") ||
    path.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    /^[a-zA-Z]:/.test(value) ||
    value.split(/[\\/]/).includes("..") ||
    value.includes("\\")
  ) {
    fail(
      "UNSAFE_PATH",
      '--dir must be a relative project path without ".." or backslashes.',
    );
  }
  return path.normalize(value);
}

function within(root, target) {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

async function statOrNull(file) {
  try {
    return await fs.lstat(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function kitFile(relative) {
  const absolute = path.resolve(KIT, relative);
  if (!within(KIT, absolute))
    fail("INVALID_KIT", `Kit path escapes its folder: ${relative}`);
  const stat = await statOrNull(absolute);
  if (!stat || !stat.isFile() || stat.isSymbolicLink())
    fail("INVALID_KIT", `Missing or unsafe kit file: ${relative}`);
  if (!within(await fs.realpath(KIT), await fs.realpath(absolute)))
    fail("INVALID_KIT", `Kit file escapes its folder: ${relative}`);
  return { relative, data: await fs.readFile(absolute) };
}

async function catalog() {
  const file = await kitFile("catalog.json");
  let data;
  try {
    data = JSON.parse(file.data.toString("utf8"));
  } catch {
    fail("INVALID_KIT", "catalog.json is not valid JSON.");
  }
  if (data?.version !== 2 || !Array.isArray(data.transitions))
    fail("INVALID_KIT", "Expected a version 2 transition catalog.");
  const ids = new Set();
  for (const item of data.transitions) {
    if (!item || !validId(item.id) || ids.has(item.id))
      fail(
        "INVALID_KIT",
        "Catalog contains an invalid or duplicate transition ID.",
      );
    ids.add(item.id);
    if (
      typeof item.name !== "string" ||
      !item.name ||
      typeof item.exportName !== "string" ||
      !/^[A-Za-z_$][\w$]*$/.test(item.exportName) ||
      typeof item.category !== "string" ||
      item.source !== `recipes/${item.id}.tsx` ||
      item.styles !== `recipes/${item.id}.css` ||
      item.recipe !== `references/${item.id}.md` ||
      !Array.isArray(item.dependencies) ||
      item.dependencies.some(
        (dependency) =>
          typeof dependency !== "string" ||
          !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(
            dependency,
          ),
      )
    ) {
      fail("INVALID_KIT", `Invalid catalog entry: ${item.id}`);
    }
  }
  // Older version 2 kits contain only transitions. Adapters are additive and
  // explicitly CSS-only; no fabricated component export or package is needed.
  if (data.adapters === undefined) data.adapters = [];
  if (!Array.isArray(data.adapters))
    fail("INVALID_KIT", "Expected an adapters array.");
  for (const item of data.adapters) {
    if (!item || !validId(item.id) || ids.has(item.id))
      fail(
        "INVALID_KIT",
        "Catalog contains an invalid or duplicate adapter ID.",
      );
    ids.add(item.id);
    if (
      item.kind !== "adapter" ||
      typeof item.name !== "string" ||
      !item.name ||
      typeof item.category !== "string" ||
      item.recipe !== `references/${item.id}.md` ||
      !Array.isArray(item.dependencies) ||
      item.dependencies.length !== 0 ||
      !Array.isArray(item.files) ||
      item.files.length !== 1 ||
      item.files[0]?.source !== `adapters/${item.id}.css` ||
      item.files[0]?.target !== `${item.id}.css`
    )
      fail("INVALID_KIT", `Invalid CSS adapter entry: ${item.id}`);
  }
  return data;
}

async function projectRoot(input) {
  let root;
  try {
    root = await fs.realpath(path.resolve(input));
  } catch (error) {
    if (error.code === "ENOENT")
      fail(
        "INVALID_PROJECT",
        `Project folder does not exist: ${path.resolve(input)}`,
      );
    throw error;
  }
  if (!(await fs.stat(root)).isDirectory())
    fail("INVALID_PROJECT", `Project is not a directory: ${root}`);
  return root;
}

// Inspect every existing ancestor, including symlinks, before reading or writing.
async function checkParents(root, destination, create = false) {
  if (!within(root, destination))
    fail("UNSAFE_PATH", `Destination escapes project: ${destination}`);
  const segments = path
    .relative(root, path.dirname(destination))
    .split(path.sep)
    .filter(Boolean);
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    let stat = await statOrNull(current);
    if (!stat && create) {
      try {
        await fs.mkdir(current);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      stat = await fs.lstat(current);
    }
    if (!stat) return;
    if (stat.isSymbolicLink()) {
      let real;
      try {
        real = await fs.realpath(current);
      } catch {
        fail(
          "UNSAFE_PATH",
          `Unresolvable symbolic link in destination: ${current}`,
        );
      }
      if (!within(root, real))
        fail("UNSAFE_PATH", `Symbolic link escapes project: ${current}`);
      if (!(await fs.stat(current)).isDirectory())
        fail("CONFLICT", `Destination parent is not a folder: ${current}`);
    } else if (!stat.isDirectory()) {
      fail("CONFLICT", `Destination parent is not a folder: ${current}`);
    }
  }
}

async function existingFile(root, destination) {
  await checkParents(root, destination);
  const stat = await statOrNull(destination);
  if (!stat) return null;
  if (stat.isSymbolicLink())
    fail(
      "UNSAFE_PATH",
      `Refusing a symbolic-link destination file: ${destination}`,
    );
  if (!stat.isFile())
    fail("CONFLICT", `Destination is not a regular file: ${destination}`);
  if (!within(root, await fs.realpath(destination)))
    fail("UNSAFE_PATH", `Destination escapes project: ${destination}`);
  return fs.readFile(destination);
}

async function dependencies(root, required) {
  const packagePath = path.join(root, "package.json");
  const data = await existingFile(root, packagePath);
  let declared = {};
  if (data) {
    let manifest;
    try {
      manifest = JSON.parse(data.toString("utf8"));
    } catch {
      fail("INVALID_PROJECT", "Project package.json is not valid JSON.");
    }
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
      fail("INVALID_PROJECT", "Project package.json must contain an object.");
    for (const key of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      if (
        manifest[key] &&
        typeof manifest[key] === "object" &&
        !Array.isArray(manifest[key])
      ) {
        declared = { ...declared, ...manifest[key] };
      }
    }
  }
  return {
    dependencies: [...new Set(required)],
    missingDependencies: [...new Set(required)].filter(
      (name) => !Object.hasOwn(declared, name),
    ),
    packageJson: data ? packagePath : null,
  };
}

async function copyFiles(root, destinationDir, sources, dryRun) {
  const plan = [];
  // Preflight the complete operation so a normal conflict never causes a partial copy.
  for (const source of sources) {
    const destination = path.join(
      destinationDir,
      source.target ?? source.relative,
    );
    const existing = await existingFile(root, destination);
    if (existing && !existing.equals(source.data)) {
      fail(
        "CONFLICT",
        `Existing file differs; nothing was overwritten: ${destination}`,
        { destination },
      );
    }
    plan.push({
      ...source,
      destination,
      status: existing ? "unchanged" : dryRun ? "would-create" : "created",
    });
  }
  if (!dryRun) {
    for (const item of plan) {
      if (item.status === "unchanged") continue;
      await checkParents(root, item.destination, true);
      // Exclusive creation also protects an existing file created after preflight.
      try {
        await fs.writeFile(item.destination, item.data, {
          flag: "wx",
          mode: 0o644,
        });
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        const current = await existingFile(root, item.destination);
        if (!current?.equals(item.data))
          fail(
            "CONFLICT",
            `Destination changed during installation: ${item.destination}`,
            { destination: item.destination },
          );
        item.status = "unchanged";
      }
    }
  }
  return plan.map(({ relative, destination, status }) => ({
    source: relative,
    destination,
    status,
  }));
}

async function fullKit(data) {
  const relativeFiles = ["SKILL.md", "catalog.json", "install.mjs", "LICENSE"];
  for (const [folder, extension] of [
    ["references", /\.md$/],
    ["recipes", /\.(tsx|css)$/],
    ...(data.adapters.length ? [["adapters", /\.css$/]] : []),
  ]) {
    const folderPath = path.join(KIT, folder);
    const stat = await statOrNull(folderPath);
    if (!stat?.isDirectory() || stat.isSymbolicLink())
      fail("INVALID_KIT", `Missing or unsafe kit folder: ${folder}`);
    for (const entry of (
      await fs.readdir(folderPath, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!extension.test(entry.name)) continue;
      if (!entry.isFile() || entry.isSymbolicLink())
        fail("INVALID_KIT", `Unsafe kit file: ${folder}/${entry.name}`);
      relativeFiles.push(`${folder}/${entry.name}`);
    }
  }
  for (const item of data.transitions) {
    for (const required of [item.source, item.styles, item.recipe]) {
      if (!relativeFiles.includes(required))
        fail("INVALID_KIT", `Missing kit file: ${required}`);
    }
  }
  for (const item of data.adapters) {
    for (const required of [
      item.recipe,
      ...item.files.map((file) => file.source),
    ]) {
      if (!relativeFiles.includes(required))
        fail("INVALID_KIT", `Missing kit file: ${required}`);
    }
  }
  return Promise.all(relativeFiles.map(kitFile));
}

function report(result, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (result.command === "list") {
    for (const item of result.transitions)
      process.stdout.write(
        `${item.id.padEnd(24)} ${item.name} (${item.category})\n`,
      );
    if (result.adapters.length) process.stdout.write("\nHost adapters:\n");
    for (const item of result.adapters)
      process.stdout.write(
        `${item.id.padEnd(24)} ${item.name} (${item.category})\n`,
      );
    return;
  }
  process.stdout.write(
    `${result.dryRun ? "Dry run" : "Ready"}: ${result.destination}\n`,
  );
  for (const file of result.files)
    process.stdout.write(`  ${file.status}: ${file.destination}\n`);
  if (result.missingDependencies?.length) {
    process.stdout.write(
      `Missing package dependencies: ${result.missingDependencies.join(", ")}\nAdd them with your project's package manager before using the transition.\n`,
    );
  }
}

async function main() {
  if (Number(process.versions.node.split(".")[0]) < 18)
    fail("NODE_VERSION", "Node.js 18 or newer is required.");
  const options = parse(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      options.json
        ? `${JSON.stringify({ ok: true, command: "help", help: HELP }, null, 2)}\n`
        : HELP,
    );
    return;
  }
  const data = await catalog();
  if (options.command === "list") {
    report(
      {
        ok: true,
        command: "list",
        version: data.version,
        transitions: data.transitions,
        adapters: data.adapters,
      },
      options.json,
    );
    return;
  }
  const root = await projectRoot(options.project);
  if (options.command === "add") {
    const transition = data.transitions.find(
      (entry) => entry.id === options.id,
    );
    const item =
      transition ?? data.adapters.find((entry) => entry.id === options.id);
    if (!item)
      fail(
        "UNKNOWN_ID",
        `Unknown transition or adapter: ${options.id}. Run list to see available IDs.`,
      );
    const declarations = transition
      ? [item.source, item.styles].map((source) => ({
          source,
          target: path.basename(source),
        }))
      : item.files;
    const sourceFiles = await Promise.all(
      declarations.map(async (file) => ({
        ...(await kitFile(file.source)),
        target: file.target,
      })),
    );
    await kitFile(item.recipe);
    const required = await dependencies(root, item.dependencies);
    const destination = path.resolve(root, options.dir);
    const files = await copyFiles(
      root,
      destination,
      sourceFiles,
      options.dryRun,
    );
    report(
      {
        ok: true,
        command: "add",
        id: item.id,
        kind: transition ? "transition" : "adapter",
        dryRun: options.dryRun,
        project: root,
        destination,
        files,
        ...required,
      },
      options.json,
    );
    return;
  }
  const sources = await fullKit(data);
  const destination = path.join(root, AGENTS[options.agent]);
  const files = await copyFiles(root, destination, sources, options.dryRun);
  report(
    {
      ok: true,
      command: "skill",
      agent: options.agent,
      version: data.version,
      dryRun: options.dryRun,
      project: root,
      destination,
      files,
    },
    options.json,
  );
}

main().catch((error) => {
  const details = error instanceof InstallError ? error.details : {};
  const result = {
    ok: false,
    error: {
      code: error.code ?? "INSTALL_FAILED",
      message: error.message,
      ...details,
    },
  };
  if (process.argv.includes("--json"))
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
