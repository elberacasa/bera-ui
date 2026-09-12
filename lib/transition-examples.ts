import { normalizeTuning } from "./motion-tuning";

export function supportsRadius(id: string): boolean {
  return id !== "text-swap";
}

export function transitionUsage(
  item: { id: string; exportName: string },
  tuning: { tempo: number; radius: number },
): string {
  const { tempo, radius } = normalizeTuning(tuning);
  const motion = `speed={${tempo}}${supportsRadius(item.id) ? ` radius={${radius}}` : ""}`;
  const component = `import { ${item.exportName} } from "./components/bera/${item.id}";`;
  const example = (imports: string, body: string) =>
    `"use client";\n\n${imports ? `${imports}\n` : ""}${component}\n\n${body}\n`;

  switch (item.id) {
    case "state-button":
      return example(
        "",
        `// Pass your real save operation. Reject its promise when saving fails.
export function SaveExample({ onSave }: { onSave: () => Promise<void> }) {
  return <StateButton onAction={onSave} ${motion} />;
}`,
      );

    case "sliding-tabs":
      return example(
        'import { useState, type ReactNode } from "react";',
        `export function TabsExample({ overview, activity }: {
  overview: ReactNode;
  activity: ReactNode;
}) {
  const [view, setView] = useState("overview");
  return (
    <SlidingTabs
      items={[
        { value: "overview", label: "Overview", content: overview },
        { value: "activity", label: "Activity", content: activity },
      ]}
      value={view}
      onValueChange={setView}
      ariaLabel="Project views"
      ${motion}
    />
  );
}`,
      );

    case "morphing-menu":
      return example(
        "",
        `export function ActionsExample({ onEdit, onDuplicate }: {
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  return (
    <MorphingMenu
      label="Project actions"
      actions={[
        { label: "Edit", onSelect: onEdit },
        { label: "Duplicate", onSelect: onDuplicate },
      ]}
      ${motion}
    />
  );
}`,
      );

    case "text-swap":
      return example(
        'import { Circle, LoaderCircle, Check } from "lucide-react";',
        `const statuses = [
  { text: "Unsaved changes", Icon: Circle },
  { text: "Saving changes", Icon: LoaderCircle },
  { text: "Changes saved", Icon: Check },
];
const statusIndex = { draft: 0, saving: 1, saved: 2 } as const;

// The application supplies its actual status; motion does not simulate saving.
export function StatusExample({ status }: {
  status: "draft" | "saving" | "saved";
}) {
  return <TextSwap statuses={statuses} value={statusIndex[status]} ${motion} />;
}`,
      );

    case "expanding-search":
      return example(
        'import { useState } from "react";',
        `export function SearchExample({ componentNames, onSearch }: {
  componentNames: readonly string[];
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  return (
    <ExpandingSearch
      items={componentNames}
      value={query}
      onValueChange={setQuery}
      onSearch={onSearch}
      ${motion}
    />
  );
}`,
      );

    case "toast-stack":
      return example(
        "",
        `// Local motion reference. Adapt its animation to your existing toast provider.
export function ToastMotionReference() {
  return (
    <section aria-label="Local notification motion reference">
      <p>Local preview only. This is not connected to application events.</p>
      <ToastStack
        preview
        title="Preview notification"
        description="Created only in this local motion reference."
        ${motion}
      />
    </section>
  );
}`,
      );

    case "copy-button":
      return example(
        "",
        `export function CopyExample({ text }: { text: string }) {
  return <CopyButton text={text} ${motion} />;
}`,
      );

    case "rolling-counter":
      return example(
        "",
        `export function QuantityExample({ quantity, onQuantityChange }: {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <RollingCounter
      value={quantity}
      onValueChange={onQuantityChange}
      min={0}
      max={99}
      label="Quantity"
      ${motion}
    />
  );
}`,
      );

    case "accordion":
      return example(
        'import { useState, type ReactNode } from "react";',
        `export function DetailsExample({ sections }: {
  sections: readonly { title: string; body: ReactNode }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Accordion
      items={sections}
      value={open}
      onValueChange={setOpen}
      ${motion}
    />
  );
}`,
      );

    case "morphing-icon-button":
      return example(
        'import type { Ref } from "react";',
        `// Keep the host panel's state, Escape handling, and focus return.
export function PanelToggle({ open, onOpenChange, panelId, buttonRef }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelId: string;
  buttonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <MorphingIconButton
      pressed={open}
      onPressedChange={onOpenChange}
      aria-controls={panelId}
      aria-expanded={open}
      buttonRef={buttonRef}
      label="Navigation"
      ${motion}
    />
  );
}`,
      );

    default:
      throw new Error(`Missing integration example for "${item.id}".`);
  }
}
