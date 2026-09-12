import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("public/components", { recursive: true });
for (const file of ["origin-popover.tsx", "origin-popover.css"]) {
  copyFileSync(
    `components/origin-popover/${file}`,
    `public/components/${file}`,
  );
}

const catalog = [
  ["state-button", "StateButton", "feedback", "Feedback"],
  ["sliding-tabs", "SlidingTabs", "selection", "Navigation"],
  ["morphing-menu", "MorphingMenu", "surfaces", "Surfaces"],
  ["text-swap", "TextSwap", "feedback", "Feedback"],
  ["expanding-search", "ExpandingSearch", "selection", "Navigation"],
  ["toast-stack", "ToastStack", "surfaces", "Surfaces"],
  ["copy-button", "CopyButton", "feedback", "Feedback"],
  ["rolling-counter", "RollingCounter", "selection", "Navigation"],
  ["accordion", "Accordion", "surfaces", "Surfaces"],
];
const modules = {};
mkdirSync("public/transitions", { recursive: true });
for (const group of ["feedback", "selection", "surfaces"]) {
  modules[group] = {};
  for (const ext of ["tsx", "css"]) {
    const name = `${group}.${ext}`;
    copyFileSync(
      `components/transitions/${name}`,
      `public/transitions/${name}`,
    );
    modules[group][ext] = readFileSync(
      `components/transitions/${name}`,
      "utf8",
    );
  }
}
const manifest = catalog.map(([id, exportName, group, category]) => {
  const brief = `# Integrate bera/ui: ${exportName}\n\nRead the host project first. Bring this transition into the existing interface, preserving its fonts, colors, content, semantics, and real behavior.\n\nDependencies: React, motion/react, lucide-react. Import the matching CSS alongside the module. Keep only the selected export and its shared helpers. Remove the outer preview frame, helper captions, sample data, and demo controls where they are not part of the host interaction. Do not add another animation engine.\n\nConnect actions and controlled props to real application state. StateButton without onAction is an explicitly labeled save simulation; ToastStack uses local demonstration notifications. Never claim a real action succeeded based only on a timer. Clipboard confirmation must follow a successful write.\n\nNormal playback is speed=1. The speed and replayKey props are preview controls; replay must not repeat real side effects or steal focus. Preserve reduced motion, focus return, keyboard navigation, and interruption behavior. Validate on a narrow phone viewport and desktop.\n\nSelected export: ${exportName}\nSource group: ${group}\n\n## React\n\n\`\`\`tsx\n${modules[group].tsx}\n\`\`\`\n\n## CSS\n\n\`\`\`css\n${modules[group].css}\n\`\`\`\n`;
  writeFileSync(`public/transitions/${id}.agent.md`, brief);
  return {
    id,
    exportName,
    category,
    source: `/transitions/${group}.tsx`,
    styles: `/transitions/${group}.css`,
    agentBrief: `/transitions/${id}.agent.md`,
  };
});
writeFileSync(
  "public/transitions/manifest.json",
  JSON.stringify(
    {
      name: "bera/ui",
      version: 1,
      dependencies: ["react", "motion", "lucide-react"],
      transitions: manifest,
    },
    null,
    2,
  ) + "\n",
);
