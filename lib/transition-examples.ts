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
    case "confirm-action":
      return example(
        "",
        `// Resolve only when the archive succeeds; reject with a useful error.
export function ArchiveProject({ projectId, archiveProject }: {
  projectId: string;
  archiveProject: (id: string) => Promise<void>;
}) {
  return (
    <ConfirmAction
      key={projectId}
      label="Archive project"
      confirmLabel="Archive"
      onConfirm={() => archiveProject(projectId)}
      ${motion}
    />
  );
}`,
      );
    case "playback-toggle":
      return example(
        'import { useRef, useState } from "react";',
        `export function VideoPreview({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const playbackRequest = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <video
        ref={video}
        src={src}
        controls
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onEmptied={() => {
          playbackRequest.current += 1;
          setPlaying(false);
          setError("");
        }}
        aria-label="Video preview"
      />
      <PlaybackToggle
        playing={playing}
        onPlayingChange={(next) => {
          const media = video.current;
          if (!media) return;
          const request = ++playbackRequest.current;
          setError("");
          if (next) {
            void media.play().catch((error: unknown) => {
              if (request !== playbackRequest.current || video.current !== media ||
                  (error instanceof DOMException && error.name === "AbortError")) return;
              setError("Playback could not start. Try the video's controls.");
            });
          } else media.pause();
        }}
        ${motion}
      />
      <p role="status">{error}</p>
    </div>
  );
}`,
      );
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

    case "inline-edit":
      return example(
        'import { useState } from "react";',
        `export function RenameProject({ initialName, saveName }: {
  initialName: string;
  saveName: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  return (
    <InlineEdit
      value={name}
      label="Project name"
      validate={(draft) => draft.trim() ? undefined : "Enter a project name."}
      onCommit={async (draft) => {
        await saveName(draft);
        setName(draft);
      }}
      ${motion}
    />
  );
}`,
      );

    case "animated-list":
      return example(
        'import type { ReactNode } from "react";',
        `// Keep insertion, sorting, and row actions in the host application.
export function FileResults({ files }: {
  files: readonly { id: string; content: ReactNode }[];
}) {
  return (
    <AnimatedList
      items={files}
      ariaLabel="Project files"
      emptyState={<p>No files match your filters.</p>}
      ${motion}
    />
  );
}`,
      );

    case "selection-toolbar":
      return example(
        'import type { Dispatch, RefObject, SetStateAction } from "react";',
        `// Keep selection, archive results, and focus ownership in the host.
export function FileActions({ selectedIds, setSelectedIds, archiveFiles, returnFocusRef }: {
  selectedIds: readonly string[];
  setSelectedIds: Dispatch<SetStateAction<readonly string[]>>;
  archiveFiles: (ids: readonly string[]) => Promise<void>;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  return (
    <SelectionToolbar
      count={selectedIds.length}
      actions={[{
        id: "archive",
        label: "Archive",
        onSelect: async () => {
          const submittedIds = [...selectedIds];
          await archiveFiles(submittedIds);
          const archived = new Set(submittedIds);
          setSelectedIds((current) => current.filter((id) => !archived.has(id)));
        },
      }]}
      onClear={() => setSelectedIds([])}
      returnFocusRef={returnFocusRef}
      ${motion}
    />
  );
}`,
      );

    default:
      throw new Error(`Missing integration example for "${item.id}".`);
  }
}
