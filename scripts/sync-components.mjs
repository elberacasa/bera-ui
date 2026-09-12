import {
  copyFileSync,
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
const kit = "skills/bera-motion";
const license = readFileSync("LICENSE", "utf8");
const licenseComment = `/*\n${license.trim()}\n*/\n`;
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
};
const json = (value) => JSON.stringify(value, null, 2) + "\n";

// These directories contain generated files only. Authored guidance lives beside them.
for (const path of ["public/transitions", `${kit}/recipes`])
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
  const recipe = `# ${entry.name}\n\n${entry.description}\n\n## Choose this for\n\n${entry.when}\n\n## Integration\n\n${entry.integration}\n\nRead the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.\n\nExport: \`${entry.exportName}\`\n\nProps: ${entry.props}.\n\nDefaults: \`speed={1}\`, \`radius={12}\`, \`preview={false}\`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit \`preview\` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.\n\nSource: \`../recipes/${entry.id}.tsx\`\nStyles: \`../recipes/${entry.id}.css\`\nDependencies: React, ${dependencies.join(", ")}. Styles use namespaced selectors and inherit the host's neutral tokens.\n\n## Verify\n\nExercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.\n`;
  const brief = `${recipe}\n## Complete source\n\nSave as \`${entry.id}.tsx\`:\n\n\`\`\`tsx\n${source}\n\`\`\`\n\nSave as \`${entry.id}.css\`:\n\n\`\`\`css\n${css}\n\`\`\`\n`;
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
  return {
    ...metadata,
    dependencies,
    source: `recipes/${entry.id}.tsx`,
    styles: `recipes/${entry.id}.css`,
    recipe: `references/${entry.id}.md`,
  };
});
const catalog = { name: "bera/ui", version: 2, transitions };
write(`${kit}/catalog.json`, json(catalog));
write(`${kit}/LICENSE`, license);
write(
  "public/transitions/manifest.json",
  json({
    ...catalog,
    transitions: transitions.map((item) => ({
      ...item,
      source: `/transitions/${item.id}.tsx`,
      styles: `/transitions/${item.id}.css`,
      recipe: `/transitions/${item.id}.agent.md`,
      asset: `/transitions/${item.id}.json`,
    })),
  }),
);
write(
  "public/llms.txt",
  `# bera/ui\n\nReusable motion for existing React interfaces. Nine source-available transition recipes, live tempo and radius tuning, and a local coding-agent skill.\n\n- [Agent guide](/agents): download the self-contained kit, install a skill, or copy a selected transition.\n- [Catalog](/transitions/manifest.json): available transitions, props, integration boundaries, and source paths.\n- [Skill](/bera-motion.SKILL.md): discovery, review, apply, and refine workflow.\n- [Portable kit](/bera-motion.tar.gz): all source, styles, recipes, and zero-dependency local installer.\n\nDo not invent an npm package. Read the host project and adapt motion to existing primitives. Components default to natural sizing; preview=true is reserved for the gallery. See each recipe's limitations before integrating.\n`,
);
for (const file of ["origin-popover.tsx", "origin-popover.css"]) {
  mkdirSync("public/components", { recursive: true });
  copyFileSync(
    `components/origin-popover/${file}`,
    `public/components/${file}`,
  );
}
if (!existsSync(`${kit}/SKILL.md`))
  throw new Error(
    "Author skills/bera-motion/SKILL.md before generating the kit.",
  );
copyFileSync(`${kit}/SKILL.md`, "public/bera-motion.SKILL.md");

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
  `Generated ${transitions.length} standalone transitions and the portable agent kit.`,
);
