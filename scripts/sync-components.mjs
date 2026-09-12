import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { extractTransition } from "./extract-transition.mjs";

const entries = JSON.parse(readFileSync("lib/transition-catalog.json", "utf8"));
const adapterEntries = JSON.parse(
  readFileSync("lib/adapter-catalog.json", "utf8"),
);
const kit = "skills/bera-motion";
const packageJSON = JSON.parse(readFileSync("package.json", "utf8"));
const homepage = "https://bera-ui.vercel.app";
const registry = {
  url: "/r/registry.json",
  itemUrlTemplate: "/r/{name}.json",
  cli: "shadcn",
  testedVersion: "4.21.0",
};
const compatibility = {
  react: "^19.0.0",
  shadcn: "Use shadcn@latest; alias targets verified with 4.21.0.",
  node: ">=20.18.1 for shadcn 4.21.0; the portable installer supports Node >=18.",
  cssTokens:
    "Host tokens must be complete CSS colors (OKLCH, HSL, or hex), not bare HSL channels. Modern shadcn themes are supported; adapt legacy tokens locally.",
  styles:
    "Companion namespaced CSS is imported by each recipe. No Tailwind plugin, theme, or global CSS changes are declared.",
};
const registryItems = [];
const license = readFileSync("LICENSE", "utf8");
const licenseComment = `/*\n${license.trim()}\n*/\n`;
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
};
const json = (value) => JSON.stringify(value, null, 2) + "\n";

// These directories contain generated files only. Authored guidance lives beside them.
for (const path of [
  "public/transitions",
  "public/adapters",
  "public/r",
  `${kit}/recipes`,
  `${kit}/adapters`,
])
  rmSync(path, { recursive: true, force: true });
const transitions = entries.map((entry) => {
  const { group, ...metadata } = entry;
  const source =
    licenseComment +
    extractTransition(
      readFileSync(`components/transitions/${group}.tsx`, "utf8"),
      entry.exportName,
      entry.id,
    );
  // Namespaced family CSS is intentionally shared; no gallery stylesheet is required.
  const css =
    licenseComment +
    readFileSync(`components/transitions/${group}.css`, "utf8");
  const dependencies = [
    "motion",
    ...(source.includes('from "lucide-react"') ? ["lucide-react"] : []),
  ];
  let recipe = `# ${entry.name}\n\n${entry.description}\n\n## Choose this for\n\n${entry.when}\n\n## Integration\n\n${entry.integration}\n\nRead the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.\n\nExport: \`${entry.exportName}\`\n\nProps: ${entry.props}.\n\nDefaults: \`speed={1}\`, \`radius={12}\`, \`preview={false}\`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit \`preview\` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.\n\nSource: \`../recipes/${entry.id}.tsx\`\nStyles: \`../recipes/${entry.id}.css\`\nDependencies: React, ${dependencies.join(", ")}. Styles use namespaced selectors and inherit the host's neutral tokens.\n\n## Verify\n\nExercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.\n`;
  if (entry.id === "text-swap") {
    recipe = recipe.replace(
      "Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels.",
      "Defaults: `speed={1}`, `preview={false}`. Speed scales timing. Radius does not apply to TextSwap; its radius prop remains accepted for API compatibility.",
    );
  }
  const publicRecipe = recipe
    .replace(
      `\`../recipes/${entry.id}.tsx\``,
      `[${entry.id}.tsx](${homepage}/transitions/${entry.id}.tsx)`,
    )
    .replace(
      `\`../recipes/${entry.id}.css\``,
      `[${entry.id}.css](${homepage}/transitions/${entry.id}.css)`,
    );
  const brief = `${publicRecipe}\n## Complete source\n\nSave as \`${entry.id}.tsx\`:\n\n\`\`\`tsx\n${source}\n\`\`\`\n\nSave as \`${entry.id}.css\`:\n\n\`\`\`css\n${css}\n\`\`\`\n`;
  for (const [ext, content] of [
    ["tsx", source],
    ["css", css],
  ]) {
    write(`public/transitions/${entry.id}.${ext}`, content);
    write(`${kit}/recipes/${entry.id}.${ext}`, content);
  }
  write(
    `public/transitions/${entry.id}.json`,
    json({ ...metadata, dependencies, source, css }),
  );
  write(`public/transitions/${entry.id}.agent.md`, brief);
  write(`${kit}/references/${entry.id}.md`, recipe);
  const registryItem = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: entry.id,
    type: "registry:component",
    title: entry.name,
    description: entry.description,
    dependencies: dependencies.map((name) => {
      const range = packageJSON.dependencies[name];
      if (!range) throw new Error(`Missing supported package range: ${name}`);
      return `${name}@${range}`;
    }),
    files: [
      {
        path: `${kit}/recipes/${entry.id}.tsx`,
        type: "registry:component",
        target: `@components/bera/${entry.id}.tsx`,
        content: source,
      },
      {
        path: `${kit}/recipes/${entry.id}.css`,
        type: "registry:file",
        target: `@components/bera/${entry.id}.css`,
        content: css,
      },
    ],
    docs: `Import { ${entry.exportName} } from your configured components alias under bera/${entry.id}. Keep its companion CSS. ${entry.integration} Defaults: preview=false, speed=1${entry.id === "text-swap" ? "; radius does not apply" : ", radius=12"}. Tested with React 19 and shadcn 4.21.0; use complete CSS color tokens. Integration: ${homepage}/transitions/${entry.id}.agent.md`,
    categories: [entry.category.toLowerCase(), "motion"],
  };
  registryItems.push(registryItem);
  write(`public/r/${entry.id}.json`, json(registryItem));
  return {
    ...metadata,
    dependencies,
    source: `recipes/${entry.id}.tsx`,
    styles: `recipes/${entry.id}.css`,
    recipe: `references/${entry.id}.md`,
  };
});
const adapters = adapterEntries.map(
  ({ source: authoredSource, ...metadata }) => {
    if (transitions.some((item) => item.id === metadata.id))
      throw new Error(`Duplicate installable ID: ${metadata.id}`);
    const css = licenseComment + readFileSync(authoredSource, "utf8");
    const source = `adapters/${metadata.id}.css`;
    const target = `${metadata.id}.css`;
    const recipe = `references/${metadata.id}.md`;
    const guide = readFileSync(`${kit}/${recipe}`, "utf8");
    const publicGuide = guide
      .replaceAll(
        `](../adapters/${target})`,
        `](${homepage}/adapters/${target})`,
      )
      .replaceAll(
        "](../catalog.json)",
        `](${homepage}/transitions/manifest.json)`,
      )
      .replaceAll(
        "](integration.md)",
        `](${homepage}/transitions/integration.md)`,
      );
    write(`${kit}/${source}`, css);
    write(`public/adapters/${target}`, css);
    write(
      `public/adapters/${metadata.id}.agent.md`,
      `${publicGuide}\n\n## Complete stylesheet\n\n\`\`\`css\n${css}\n\`\`\`\n`,
    );
    const item = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: metadata.id,
      type: "registry:file",
      title: metadata.name,
      description: metadata.description,
      dependencies: [],
      files: [
        {
          path: `${kit}/${source}`,
          type: "registry:file",
          target: `@components/bera/${target}`,
          content: css,
        },
      ],
      docs: `${metadata.integration} Read the adaptation guide: ${homepage}/adapters/${metadata.id}.agent.md. Live example: ${homepage}${metadata.page}.`,
      categories: ["adapter", "motion"],
    };
    registryItems.push(item);
    write(`public/r/${metadata.id}.json`, json(item));
    return {
      ...metadata,
      dependencies: [],
      files: [{ source, target }],
      recipe,
    };
  },
);
const catalog = { name: "bera/ui", version: 2, transitions, adapters };
write(`${kit}/catalog.json`, json(catalog));
write(`${kit}/LICENSE`, license);
const registryIndex = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "bera",
  homepage,
  // The discovery index needs metadata, not a second copy of every source file.
  items: registryItems.map((item) => ({
    ...item,
    files: item.files.map(({ path, type, target }) => ({ path, type, target })),
  })),
};
write("public/r/registry.json", json(registryIndex));
// The same source index supports shadcn build and GitHub registry discovery.
write("registry.json", json(registryIndex));
write(
  "public/transitions/manifest.json",
  json({
    ...catalog,
    registry,
    compatibility,
    adapters: adapters.map((item) => ({
      ...item,
      files: item.files.map((file) => ({
        ...file,
        source: `/adapters/${file.target}`,
      })),
      recipe: `/adapters/${item.id}.agent.md`,
      registry: `/r/${item.id}.json`,
    })),
    transitions: transitions.map((item) => ({
      ...item,
      source: `/transitions/${item.id}.tsx`,
      styles: `/transitions/${item.id}.css`,
      recipe: `/transitions/${item.id}.agent.md`,
      asset: `/transitions/${item.id}.json`,
      registry: `/r/${item.id}.json`,
    })),
  }),
);
write(
  "public/llms.txt",
  `# bera/ui\n\n> Reusable motion for existing React interfaces: ${transitions.length} standalone transition recipes, CSS host adapters, live tuning, and an optional coding-agent skill.\n\nRead the host project and preserve its primitives, state ownership, and styles. Standalone components default to natural sizing and preview=false. Standalone registry installation adds the original recipe; pass chosen speed and radius in the consuming code. CSS host adapters use their documented custom properties instead. Review dependency changes and each recipe's integration boundary.\n\n## Integration\n\n- [Agent guide](${homepage}/agents): choose a registry install, portable kit, or skill.\n- [Catalog](${homepage}/transitions/manifest.json): IDs, props, compatibility, and source paths.\n- [shadcn registry](${homepage}/r/registry.json): discover recipes; install with npx shadcn@latest add ${homepage}/r/<id>.json.\n- [Skill](${homepage}/bera-motion.SKILL.md): discover, review, apply, and refine workflow.\n- [Portable kit](${homepage}/bera-motion.tar.gz): complete source, styles, recipes, and zero-dependency local installer.\n\n## Recipes\n\n${transitions.map((entry) => `- [${entry.name}](${homepage}/transitions/${entry.id}.agent.md): ${entry.when}`).join("\n")}\n\n## Host adapters\n\n${adapters.map((entry) => `- [${entry.name}](${homepage}/adapters/${entry.id}.agent.md): ${entry.when}`).join("\n")}\n\n## Optional\n\n${transitions.map((entry) => `- [${entry.name} registry item](${homepage}/r/${entry.id}.json): installable source, companion CSS, and dependencies.`).join("\n")}\n`,
);
if (!existsSync(`${kit}/SKILL.md`))
  throw new Error(
    "Author skills/bera-motion/SKILL.md before generating the kit.",
  );
// Publish guidance with working website links; the archived skill keeps its
// portable relative links for local agent use.
let publicSkill = readFileSync(`${kit}/SKILL.md`, "utf8");
for (const adapter of adapters) {
  publicSkill = publicSkill.replaceAll(
    `](references/${adapter.id}.md)`,
    `](${homepage}/adapters/${adapter.id}.agent.md)`,
  );
}
publicSkill = publicSkill.replaceAll(
  "](catalog.json)",
  `](${homepage}/transitions/manifest.json)`,
);
for (const reference of ["integration", "motion"]) {
  publicSkill = publicSkill.replaceAll(
    `](references/${reference}.md)`,
    `](${homepage}/transitions/${reference}.md)`,
  );
  let guidance = readFileSync(`${kit}/references/${reference}.md`, "utf8");
  for (const adapter of adapters) {
    guidance = guidance.replaceAll(
      `](${adapter.id}.md)`,
      `](${homepage}/adapters/${adapter.id}.agent.md)`,
    );
  }
  if (reference === "integration") {
    guidance = guidance.replace(
      "Read the selected entry in `../catalog.json`, then its declared reference and source files.",
      `Read the selected entry in the [catalog](${homepage}/transitions/manifest.json), then follow its declared recipe and source URLs relative to ${homepage}.`,
    );
  }
  write(`public/transitions/${reference}.md`, guidance);
}
write("public/bera-motion.SKILL.md", publicSkill);

// Deterministic USTAR+gzip, using only Node built-ins so CI needs no archive utility.
const blocks = [];
function archiveFile(path, name) {
  if (Buffer.byteLength(name) > 100)
    throw new Error(`Archive path too long: ${name}`);
  const data = readFileSync(path),
    header = Buffer.alloc(512);
  const field = (value, offset, length) =>
    header.write(value, offset, length, "ascii");
  field(name, 0, 100);
  field("0000644\0", 100, 8);
  field("0000000\0", 108, 8);
  field("0000000\0", 116, 8);
  field(data.length.toString(8).padStart(11, "0") + "\0", 124, 12);
  field("00000000000\0", 136, 12);
  field("        ", 148, 8);
  field("0", 156, 1);
  field("ustar\0", 257, 6);
  field("00", 263, 2);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  field(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8);
  blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
}
function walk(path, relative = "bera-motion") {
  for (const file of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  )) {
    if (file.isDirectory())
      walk(join(path, file.name), `${relative}/${file.name}`);
    else if (file.isFile())
      archiveFile(join(path, file.name), `${relative}/${file.name}`);
    else throw new Error("Agent kit cannot include symbolic links.");
  }
}
walk(kit);
blocks.push(Buffer.alloc(1024));
const archive = gzipSync(Buffer.concat(blocks), { level: 9 });
// Gzip otherwise embeds the builder OS (Darwin=19, Unix=3). This kit is portable.
archive[9] = 255;
write("public/bera-motion.tar.gz", archive);
console.log(
  `Generated ${transitions.length} standalone transitions, ${adapters.length} host adapters, and the portable agent kit.`,
);
