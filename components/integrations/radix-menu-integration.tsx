"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  FileJson2,
  FileText,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyControl } from "@/components/copy-control";
import { registryInstallCommand } from "@/lib/registry";
import "@/components/adapters/radix-menu-motion.css";

const files = [
  {
    name: "release-notes.md",
    edited: "Sep 12",
    order: 3,
    description: "Changes in the latest release",
    kind: "text",
  },
  {
    name: "onboarding.md",
    edited: "Sep 10",
    order: 2,
    description: "Getting started with the project",
    kind: "text",
  },
  {
    name: "design-tokens.json",
    edited: "Sep 8",
    order: 1,
    description: "Color, spacing, and typography",
    kind: "json",
  },
] as const;
type Sort = "edited" | "name";
const narrowQuery = "(max-width: 479px)";
function subscribeToViewport(onChange: () => void) {
  const query = window.matchMedia(narrowQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const isNarrowViewport = () => window.matchMedia(narrowQuery).matches;
const serverViewport = () => false;
const install = registryInstallCommand("radix-menu-motion");
const integration = `import "@/components/bera/radix-menu-motion.css";

// Keep the current items, callbacks, and placement props.
<DropdownMenuContent data-bera-menu-motion>
  {/* Your existing menu items */}
</DropdownMenuContent>

// Apply the same attribute to submenus, when present.
<DropdownMenuSubContent data-bera-menu-motion>
  {/* Your existing submenu items */}
</DropdownMenuSubContent>`;

export function RadixMenuIntegration({ agentBrief }: { agentBrief: string }) {
  const narrow = useSyncExternalStore(
    subscribeToViewport,
    isNarrowViewport,
    serverViewport,
  );
  const [enhanced, setEnhanced] = useState(true);
  const [slow, setSlow] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sort, setSort] = useState<Sort>("edited");
  const [copyResult, setCopyResult] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const ordered = [...files].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name) : b.order - a.order,
  );
  const fileNames = ordered.map((file) => file.name).join("\n");
  const timing = {
    "--bera-menu-enter-duration": slow ? "880ms" : "220ms",
    "--bera-menu-exit-duration": slow ? "400ms" : "100ms",
    "--mi-original-duration": slow ? "600ms" : "150ms",
  } as CSSProperties;

  async function copyNames() {
    const text = fileNames;
    try {
      await navigator.clipboard.writeText(text);
      setCopyResult({ text, ok: true });
    } catch {
      setCopyResult({ text, ok: false });
    }
  }

  return (
    <>
      <section className="mi-study" aria-label="Menu integration comparison">
        <div className="mi-study-controls">
          <div className="mi-modes" role="group" aria-label="Menu motion">
            <button
              type="button"
              aria-pressed={!enhanced}
              onClick={() => setEnhanced(false)}
            >
              Original
            </button>
            <button
              type="button"
              aria-pressed={enhanced}
              onClick={() => setEnhanced(true)}
            >
              With bera
            </button>
          </div>
          <div className="mi-view-options">
            <button
              className="mi-slow"
              type="button"
              aria-pressed={slow}
              onClick={() => setSlow((value) => !value)}
            >
              {slow ? "0.25× playback" : "Slow motion"}
            </button>
            <label className="mi-theme-picker">
              <span className="mi-sr-only">Preview theme</span>
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
          </div>
        </div>
        <div
          className="mi-workspace mi-host-theme"
          data-theme={theme}
          data-compact={compact}
        >
          <div className="mi-workspace-bar">
            <div>
              <h2>Files</h2>
              <span>3 items</span>
            </div>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <button type="button" className="mi-view-trigger">
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  View
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                collisionPadding={16}
                className="mi-menu mi-host-theme"
                data-theme={theme}
                data-bera-menu-motion={enhanced ? "" : undefined}
                style={timing}
              >
                <DropdownMenuLabel>View options</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={compact}
                  onCheckedChange={(checked) => setCompact(checked === true)}
                  onSelect={(event) => event.preventDefault()}
                >
                  Compact rows
                </DropdownMenuCheckboxItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Sort by</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      className="mi-menu mi-submenu mi-host-theme"
                      sideOffset={narrow ? -168 : 6}
                      collisionPadding={16}
                      data-theme={theme}
                      data-bera-menu-motion={enhanced ? "" : undefined}
                      style={timing}
                    >
                      <DropdownMenuRadioGroup
                        value={sort}
                        onValueChange={(value) => {
                          if (value === "edited" || value === "name")
                            setSort(value);
                        }}
                      >
                        <DropdownMenuRadioItem value="edited">
                          Last edited
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="name">
                          Name
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={copyNames}>
                  <Copy size={14} aria-hidden="true" /> Copy file names
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!compact && sort === "edited"}
                  onSelect={() => {
                    setCompact(false);
                    setSort("edited");
                  }}
                >
                  <RotateCcw size={14} aria-hidden="true" /> Reset view
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ul className="mi-files" aria-label="Project files">
            {ordered.map((file) => {
              const Icon = file.kind === "json" ? FileJson2 : FileText;
              return (
                <li key={file.name}>
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <span>{file.name}</span>
                    <p>{file.description}</p>
                  </div>
                  <time>{file.edited}</time>
                </li>
              );
            })}
          </ul>
          <div className="mi-workspace-footer">
            <span>{compact ? "Compact rows" : "Comfortable rows"}</span>
            <span>
              {sort === "name" ? "Sorted by name" : "Last edited first"}
            </span>
          </div>
        </div>
        <div className="mi-study-caption">
          <p>
            Open View. Change the density, sort the files, or copy their names.
          </p>
          <span>Changes stay in this preview.</span>
        </div>
        <p className="mi-action-result" role="status" aria-live="polite">
          {copyResult?.ok
            ? "Copied 3 file names."
            : copyResult
              ? "Clipboard unavailable. Select and copy the names below."
              : ""}
        </p>
        {copyResult && !copyResult.ok && (
          <textarea
            className="mi-copy-fallback"
            aria-label="File names to copy"
            value={copyResult.text}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </section>
      <section className="mi-how" id="installation">
        <div className="mi-section-title">
          <h2>
            Keep your menu.
            <br />
            Add the motion.
          </h2>
          <p>One CSS file. No new runtime dependency.</p>
        </div>
        <div className="mi-install">
          <p>
            Run from a project that already uses the Radix version of shadcn’s
            dropdown menu.
          </p>
          <div className="mi-command">
            <code>{install}</code>
            <CopyControl value={install} label="Copy install command" />
          </div>
          <p>
            Import the stylesheet and mark your existing content. Retain its
            items, application callbacks, portal, positioning, and focus
            handlers.
          </p>
          <pre className="mi-code" tabIndex={0}>
            <code>{integration}</code>
          </pre>
          <p className="mi-note">
            Adjust the import to your component alias. Remove competing
            enter/exit animation utilities from this content; keep its
            appearance classes. The adapter owns opacity, translation, clipping,
            and exit timing.
          </p>
          <div className="mi-handoff">
            <CopyControl
              value={agentBrief}
              label="Copy integration for agent"
            />
            <a href="/adapters/radix-menu-motion.css" download>
              Download CSS <ArrowUpRight size={13} />
            </a>
          </div>
          <details className="mi-details">
            <summary>Timing, browser support, and scope</summary>
            <p>
              Entry takes 220ms, exit 100ms, with 6px of travel. Change{" "}
              <code>--bera-menu-enter-duration</code>,{" "}
              <code>--bera-menu-exit-duration</code>, and{" "}
              <code>--bera-menu-distance</code> on the content. Slow playback
              changes only this preview.
            </p>
            <p>
              The adapter uses <code>@starting-style</code> for entry and
              Radix’s native CSS animation lifecycle for exit. Older browsers
              without starting-style enter instantly. Reduced motion removes the
              movement and exit delay.
            </p>
            <p>
              Radix retains its modal isolation during the short exit. Keep its
              normal mounting lifecycle; do not add <code>forceMount</code>.
              This adapter targets Radix-based menus, including their submenus.
              Other primitives need their own integration.
            </p>
            <a href="/adapters/radix-menu-motion.agent.md">
              Read the complete integration guide
            </a>
          </details>
        </div>
      </section>
    </>
  );
}
