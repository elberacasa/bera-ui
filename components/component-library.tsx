"use client";

import Link from "next/link";

import { useState, useRef, useEffect } from "react";
import sourceText from "./origin-popover/origin-popover.tsx?raw";
import stylesText from "./origin-popover/origin-popover.css?raw";
import {
  Download,
  SlidersHorizontal,
  Link2,
  Check,
  Copy,
  ChevronRight,
  FileCode2,
  FileJson2,
  ArrowUpRight,
  Code2,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";
import { OriginPopover } from "@/components/origin-popover/origin-popover";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const agentBrief = `Add bera/ui's Origin Popover to this project.\n\nUse the existing shadcn Popover primitive (Radix) and the supplied origin-popover.tsx and origin-popover.css. Do not install another animation library.\n\nThe API accepts trigger (an accessible button), label, children, optional controlled open/onOpenChange, side, align, and reduceMotion.\n\nPreserve Radix focus management, Escape and outside-click dismissal, collision handling, and reduced-motion support. This is a popover, not a menu with arrow-key navigation. Adapt the content, width, typography, colors and icons to the host project; use its existing design tokens.\n\nMotion: 180ms open, 120ms close, 25ms content delay, with the origin set by Radix's collision-adjusted placement. No looping effects.\n\nImplement the real action inside the panel. Test keyboard focus, phone width, the actual action, and reduced motion.\n\nFiles: /components/origin-popover.tsx and /components/origin-popover.css.\nNo backend, account, analytics, or external service is required.`;
const completeAgentBrief = `${agentBrief}\n\nSource (origin-popover.tsx):\n\x60\x60\x60tsx\n${sourceText}\n\x60\x60\x60\n\nStyles (origin-popover.css):\n\x60\x60\x60css\n${stylesText}\n\x60\x60\x60`;

const snippet = `import { OriginPopover } from "@/components/origin-popover";

<OriginPopover
  label="Share this page"
  trigger={<Button>Share</Button>}
>
  <ShareOptions />
</OriginPopover>`;

function CopyButton({
  text,
  children,
  className = "",
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
    }
  }
  return (
    <button
      type="button"
      aria-label={
        status === "copied"
          ? "Copied"
          : status === "error"
            ? "Copy unavailable"
            : typeof children === "string"
              ? children
              : "Copy"
      }
      className={`copy-control ${className}`}
      onClick={copy}
    >
      <span className="copy-icon" key={status}>
        {status === "copied" ? <Check size={14} /> : <Copy size={14} />}
      </span>
      <span role="status">
        {status === "copied"
          ? "Copied"
          : status === "error"
            ? "Copy unavailable"
            : children}
      </span>
    </button>
  );
}

export function ComponentLibrary() {
  const [active, setActive] = useState<string | null>("download");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [tab, setTab] = useState("preview");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [url, setUrl] = useState("");
  const [density, setDensity] = useState(2);
  const [downloaded, setDownloaded] = useState("");
  const setOpen = (id: string) => (open: boolean) => {
    setActive((current) => (open ? id : current === id ? null : current));
    if (id === "share" && open) {
      setUrl(window.location.href);
      setShareStatus("idle");
    }
  };
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  }
  return (
    <main
      className={`library ${contrast ? "high-contrast" : ""} ${reduceMotion ? "reduce-motion" : ""}`}
    >
      <header className="library-header">
        <Link href="/" className="library-wordmark" aria-label="Bera UI home">
          bera<span>/</span>ui
        </Link>
        <nav aria-label="Main navigation">
          <a href="#component" className="current">
            Components
          </a>
          <a href="/studies/iris">
            Iris study <ArrowUpRight size={12} />
          </a>
        </nav>
        <a
          aria-label="Download component source"
          className="source-link"
          href="/components/origin-popover.tsx"
          download
        >
          <Code2 size={15} />
          <span>Source</span>
        </a>
      </header>
      <div className="library-intro">
        <div>
          <h1>Good interfaces live in the details.</h1>
          <p>Useful components. Thoughtful motion. Yours to make your own.</p>
        </div>
        <CopyButton text={completeAgentBrief} className="agent-button">
          Copy for your agent
        </CopyButton>
      </div>
      <section
        id="component"
        className="component-section"
        aria-labelledby="component-title"
      >
        <div className="component-heading">
          <div className="component-name">
            <h2 id="component-title">Origin Popover</h2>
            <span className="component-tag">First release</span>
          </div>
          <span className="component-stack">
            React <span>/</span> shadcn <span>/</span> CSS
          </span>
        </div>
        <p className="component-description">
          A small surface for whatever comes next. Opens from its trigger,
          settles gently, gets out of the way.
        </p>
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setActive(null);
          }}
          className="component-tabs"
        >
          <div className="preview-toolbar">
            <TabsList className="preview-tabs" aria-label="Component view">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">
                <Code2 size={13} /> Code
              </TabsTrigger>
            </TabsList>
            <button
              type="button"
              className="reset-demos"
              onClick={() => {
                setActive(null);
                setReduceMotion(false);
                setContrast(false);
                setDensity(2);
                setDownloaded("");
                setShareStatus("idle");
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
          <TabsContent value="preview">
            <div
              className="demo-grid"
              style={
                { "--row-space": `${density * 2 + 6}px` } as React.CSSProperties
              }
            >
              <article className="demo-card">
                <div className="demo-stage">
                  <OriginPopover
                    label="Download component files"
                    trigger={
                      <button type="button" className="demo-trigger">
                        <Download size={15} />
                        <span>Download</span>
                        <ChevronRight className="trigger-chevron" size={14} />
                      </button>
                    }
                    className={`preview-density-${density}${contrast ? " strong-contrast" : ""}`}
                    open={active === "download"}
                    onOpenChange={setOpen("download")}
                    reduceMotion={reduceMotion}
                  >
                    <div className="panel-heading">
                      <strong>Take what you need.</strong>
                      <p>Real files. Ready for your project.</p>
                    </div>
                    <a
                      className="panel-action"
                      href="/components/origin-popover.tsx"
                      download
                      onClick={() => setDownloaded("React component")}
                    >
                      <FileCode2 size={17} />
                      <span>
                        React component<small>origin-popover.tsx</small>
                      </span>
                      <Download size={13} />
                    </a>
                    <a
                      className="panel-action"
                      href="/components/origin-popover.css"
                      download
                      onClick={() => setDownloaded("Styles")}
                    >
                      <Code2 size={17} />
                      <span>
                        Styles<small>origin-popover.css</small>
                      </span>
                      <Download size={13} />
                    </a>
                    <a
                      className="panel-action"
                      href="/components/origin-popover.agent.md"
                      download
                      onClick={() => setDownloaded("Agent brief")}
                    >
                      <FileJson2 size={17} />
                      <span>
                        Agent brief
                        <small>Instructions for your coding agent</small>
                      </span>
                      <Download size={13} />
                    </a>
                    {downloaded && (
                      <div className="panel-notice" role="status">
                        <Check size={12} />
                        {downloaded} download started
                      </div>
                    )}
                  </OriginPopover>
                </div>
                <div className="demo-caption">
                  <div>
                    <h3>Actions, within reach.</h3>
                    <p>A home for the things people do next.</p>
                  </div>
                  <span className="demo-number" aria-hidden="true">
                    <Download size={15} />
                  </span>
                </div>
              </article>
              <article className="demo-card">
                <div className="demo-stage">
                  <OriginPopover
                    label="Preview preferences"
                    trigger={
                      <button type="button" className="demo-trigger">
                        <SlidersHorizontal size={15} />
                        <span>Preferences</span>
                        <ChevronRight className="trigger-chevron" size={14} />
                      </button>
                    }
                    className={`preview-density-${density}${contrast ? " strong-contrast" : ""}`}
                    open={active === "settings"}
                    onOpenChange={setOpen("settings")}
                    reduceMotion={reduceMotion}
                  >
                    <div className="panel-heading">
                      <strong>A little more you.</strong>
                      <p>These settings change this preview.</p>
                    </div>
                    <label className="setting-row">
                      <span>
                        Reduce motion<small>Keep every transition still</small>
                      </span>
                      <Switch
                        aria-label="Reduce motion"
                        checked={reduceMotion}
                        onCheckedChange={setReduceMotion}
                      />
                    </label>
                    <label className="setting-row">
                      <span>
                        Stronger contrast
                        <small>Brighter text and borders</small>
                      </span>
                      <Switch
                        aria-label="Stronger contrast"
                        checked={contrast}
                        onCheckedChange={setContrast}
                      />
                    </label>
                    <div className="panel-divider" />
                    <div className="density-row">
                      <span>Row spacing</span>
                      <div>
                        <button
                          type="button"
                          aria-label="Decrease row spacing"
                          disabled={density === 0}
                          onClick={() => setDensity((d) => Math.max(0, d - 1))}
                        >
                          <Minus size={13} />
                        </button>
                        <output aria-label="Row spacing">
                          {density === 0
                            ? "Tight"
                            : density === 1
                              ? "Compact"
                              : density === 2
                                ? "Default"
                                : "Relaxed"}
                        </output>
                        <button
                          type="button"
                          aria-label="Increase row spacing"
                          disabled={density === 3}
                          onClick={() => setDensity((d) => Math.min(3, d + 1))}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </OriginPopover>
                </div>
                <div className="demo-caption">
                  <div>
                    <h3>Control, without the detour.</h3>
                    <p>Quick settings, right where you are.</p>
                  </div>
                  <span className="demo-number" aria-hidden="true">
                    <SlidersHorizontal size={15} />
                  </span>
                </div>
              </article>
              <article className="demo-card">
                <div className="demo-stage">
                  <OriginPopover
                    label="Share this component"
                    trigger={
                      <button type="button" className="demo-trigger">
                        <Link2 size={15} />
                        <span>Share</span>
                        <ChevronRight className="trigger-chevron" size={14} />
                      </button>
                    }
                    className={`preview-density-${density}${contrast ? " strong-contrast" : ""}`}
                    open={active === "share"}
                    onOpenChange={setOpen("share")}
                    reduceMotion={reduceMotion}
                  >
                    <div className="panel-heading">
                      <strong>Worth passing along.</strong>
                      <p>Copy a link to this collection.</p>
                    </div>
                    <label className="share-label" htmlFor="share-url">
                      Page link
                    </label>
                    <div className="share-input">
                      <Link2 size={13} />
                      <input
                        id="share-url"
                        value={url}
                        readOnly
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                    <button
                      type="button"
                      className="share-copy"
                      onClick={copyLink}
                    >
                      <span key={shareStatus}>
                        {shareStatus === "copied" ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </span>
                      {shareStatus === "copied" ? "Link copied" : "Copy link"}
                    </button>
                    <p className="share-note" role="status">
                      {shareStatus === "error"
                        ? "Select and copy the link above instead."
                        : shareStatus === "copied"
                          ? "Ready to paste wherever you need it."
                          : "Existing access permissions still apply."}
                    </p>
                  </OriginPopover>
                </div>
                <div className="demo-caption">
                  <div>
                    <h3>A link, a little closer.</h3>
                    <p>Useful feedback, without a toast.</p>
                  </div>
                  <span className="demo-number" aria-hidden="true">
                    <Link2 size={15} />
                  </span>
                </div>
              </article>
            </div>
            <div className="preview-bottom">
              <span>One component. Three real uses.</span>
              <span>
                Click any button to try it <span aria-hidden="true">↗</span>
              </span>
            </div>
          </TabsContent>
          <TabsContent value="code">
            <div className="code-panel">
              <div className="code-panel-header">
                <span>Composes with your components.</span>
                <CopyButton text={snippet}>Copy example</CopyButton>
              </div>
              <pre>
                <code>{snippet}</code>
              </pre>
              <div className="code-footnote">
                Use your existing button, content, and design tokens. Origin
                handles the opening, closing, and placement.
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="component-details">
          <div>
            <h3>Small by design.</h3>
            <p>
              Built on the primitives you already trust.
              <br />
              No animation library. No hidden service.
            </p>
          </div>
          <div className="detail-links">
            <a href="/components/origin-popover.tsx" download>
              Get the component <ArrowUpRight size={14} />
            </a>
            <a href="/components/origin-popover.agent.md" download>
              Get the agent brief <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="detail-spec">
            <span>Keyboard & touch</span>
            <span>Reduced motion</span>
            <span>Collision-aware placement</span>
          </div>
        </div>
      </section>
      <footer className="library-footer">
        <span>bera/ui</span>
        <span>A collection, built one good component at a time.</span>
      </footer>
    </main>
  );
}
