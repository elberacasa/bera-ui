"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import {
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  RotateCcw,
  X,
  Braces,
  ArrowDownToLine,
  Gauge,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  StateButton,
  TextSwap,
  CopyButton as FeedbackCopyButton,
} from "@/components/transitions/feedback";
import {
  SlidingTabs,
  ExpandingSearch,
  RollingCounter,
} from "@/components/transitions/selection";
import {
  MorphingMenu,
  Accordion,
  ToastStack,
} from "@/components/transitions/surfaces";
import feedbackSource from "@/components/transitions/feedback.tsx?raw";
import feedbackCss from "@/components/transitions/feedback.css?raw";
import selectionSource from "@/components/transitions/selection.tsx?raw";
import selectionCss from "@/components/transitions/selection.css?raw";
import surfacesSource from "@/components/transitions/surfaces.tsx?raw";
import surfacesCss from "@/components/transitions/surfaces.css?raw";
import "@/components/transitions/feedback.css";
import "@/components/transitions/selection.css";
import "@/components/transitions/surfaces.css";

const groups = {
  feedback: { source: feedbackSource, css: feedbackCss },
  selection: { source: selectionSource, css: selectionCss },
  surfaces: { source: surfacesSource, css: surfacesCss },
};
const transitions = [
  {
    id: "state-button",
    name: "State button",
    description: "One action. Every state, connected.",
    category: "Feedback",
    group: "feedback",
    component: StateButton,
    exportName: "StateButton",
    detail:
      "A button that carries the action through progress and completion. Use the demo replay to study the state changes.",
  },
  {
    id: "sliding-tabs",
    name: "Sliding tabs",
    description: "A selection that carries its momentum.",
    category: "Navigation",
    group: "selection",
    component: SlidingTabs,
    exportName: "SlidingTabs",
    detail:
      "A shared selection surface follows the active tab. Designed for a small set of modes or views.",
  },
  {
    id: "morphing-menu",
    name: "Morphing menu",
    description: "A small surface becomes the next step.",
    category: "Surfaces",
    group: "surfaces",
    component: MorphingMenu,
    exportName: "MorphingMenu",
    detail:
      "A trigger and its options share one visual surface. Keep the menu close to the action it supports.",
  },
  {
    id: "text-swap",
    name: "Text swap",
    description: "A new thought, without a hard cut.",
    category: "Feedback",
    group: "feedback",
    component: TextSwap,
    exportName: "TextSwap",
    detail:
      "Soft directional transitions for short statuses and labels. Keep essential information readable and announce changes appropriately.",
  },
  {
    id: "expanding-search",
    name: "Expanding search",
    description: "Space appears exactly when you need it.",
    category: "Navigation",
    group: "selection",
    component: ExpandingSearch,
    exportName: "ExpandingSearch",
    detail:
      "A compact search trigger opens into an editable field, with deliberate focus handling and an easy return.",
  },
  {
    id: "toast-stack",
    name: "Toast stack",
    description: "Feedback with a little sense of space.",
    category: "Surfaces",
    group: "surfaces",
    component: ToastStack,
    exportName: "ToastStack",
    detail:
      "Transient feedback stacks and settles as notifications arrive or leave. Preview messages are demonstration data.",
  },
  {
    id: "copy-button",
    name: "Copy feedback",
    description: "A tiny confirmation that feels complete.",
    category: "Feedback",
    group: "feedback",
    component: FeedbackCopyButton,
    exportName: "CopyButton",
    detail:
      "A clipboard action with precise state feedback. Copy succeeds only after the browser accepts the write.",
  },
  {
    id: "rolling-counter",
    name: "Rolling counter",
    description: "Numbers with direction, not distraction.",
    category: "Navigation",
    group: "selection",
    component: RollingCounter,
    exportName: "RollingCounter",
    detail:
      "Digits move in the direction of the value change. Useful for quantities, totals, and compact numerical adjustments.",
  },
  {
    id: "accordion",
    name: "Accordion",
    description: "More detail. The same quiet rhythm.",
    category: "Surfaces",
    group: "surfaces",
    component: Accordion,
    exportName: "Accordion",
    detail:
      "Disclosure with a continuous height change and a coordinated content reveal. Preserve the relationship between heading and content.",
  },
] as const;
type Transition = (typeof transitions)[number];
const categories = ["All", "Feedback", "Navigation", "Surfaces"];

function briefFor(item: Transition) {
  const { source, css } = groups[item.group];
  return `Integrate bera/ui's ${item.name} into the current project.\n\nExport: ${item.exportName}. The attached module also contains related transitions; keep only the exports you need. Read the existing project before adapting the component. Preserve its useful semantics and behavior, use the host's fonts, colors, icons, and design tokens, and connect actions to real application state.\n\nDependencies: React, motion/react, lucide-react. Do not add another animation engine.\n\nThe outer preview frame, helper captions, sample data, and replay controls belong to the demo; remove them when integrating just the interaction. The speed and replayKey props are preview controls. Normal playback is speed=1. Honor OS reduced motion. Keep focus, keyboard handling, interruption behavior, and touch targets intact. Test the actual user action on desktop and a narrow phone viewport.\n\nIntent: ${item.detail}\n\nSource (${item.group}.tsx):\n\`\`\`tsx\n${source}\n\`\`\`\n\nStyles (${item.group}.css):\n\`\`\`css\n${css}\n\`\`\``;
}

function CopyControl({
  value,
  label = "Copy code",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      className={`tl-copy ${className}`}
      aria-label={
        status === "done"
          ? "Copied"
          : status === "failed"
            ? "Select and copy below"
            : label
      }
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setStatus("done");
        } catch {
          setStatus("failed");
        }
      }}
    >
      {status === "done" ? <Check size={14} /> : <Copy size={14} />}
      <span role="status">
        {status === "done"
          ? "Copied"
          : status === "failed"
            ? "Select and copy below"
            : label}
      </span>
    </button>
  );
}

export function TransitionLibrary() {
  const [category, setCategory] = useState("All");
  const [slow, setSlow] = useState(false);
  const [replays, setReplays] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Transition | null>(null);
  const [guide, setGuide] = useState(false);
  const [inspectTab, setInspectTab] = useState("react");
  const inspectorTrigger = useRef<HTMLButtonElement | null>(null);
  const guideTrigger = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();
  const shown = useMemo(
    () =>
      transitions.filter(
        (item) => category === "All" || item.category === category,
      ),
    [category],
  );
  const speed = slow ? 0.35 : 1;
  function replay(id: string) {
    setReplays((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
  }
  function replayAll() {
    setReplays((current) => ({
      ...current,
      ...Object.fromEntries(
        shown.map((item) => [item.id, (current[item.id] || 0) + 1]),
      ),
    }));
  }
  return (
    <MotionConfig reducedMotion="user">
      <main className="transition-library">
        <header className="tl-header">
          <Link href="/" className="tl-wordmark" aria-label="Bera UI home">
            bera<span>/</span>ui
          </Link>
          <nav aria-label="Main navigation">
            <a className="active" href="#transitions">
              Transitions
            </a>
            <button
              type="button"
              onClick={(event) => {
                guideTrigger.current = event.currentTarget;
                setGuide(true);
              }}
            >
              For agents
            </button>
          </nav>
          <span className="tl-header-note">An ongoing collection</span>
        </header>
        <section className="tl-intro">
          <div>
            <h1>Transitions, with feeling.</h1>
            <p>
              Familiar interactions. A little more considered.
              <br />
              Play with the details. Take them into your next project.
            </p>
          </div>
          <button
            className="tl-agent-button"
            type="button"
            onClick={(event) => {
              guideTrigger.current = event.currentTarget;
              setGuide(true);
            }}
          >
            <Braces size={16} /> Made for your coding agent{" "}
            <ArrowUpRight size={14} />
          </button>
        </section>
        <section id="transitions" aria-label="Transition collection">
          <div className="tl-toolbar">
            <div
              className="tl-filters"
              role="group"
              aria-label="Filter transitions"
            >
              {categories.map((c) => (
                <button
                  type="button"
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={category === c ? "selected" : ""}
                >
                  {category === c && (
                    <motion.span
                      className="tl-filter-pill"
                      layoutId="filter-pill"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 38 }
                      }
                    />
                  )}
                  <span>{c}</span>
                  {c === "All" && <span className="tl-count">9</span>}
                </button>
              ))}
            </div>
            <div className="tl-playback">
              <button
                type="button"
                className={slow ? "is-active" : ""}
                aria-pressed={slow}
                onClick={() => setSlow((v) => !v)}
              >
                <Gauge size={14} />
                <span>{slow ? "0.35× speed" : "Slow motion"}</span>
              </button>
              <button
                type="button"
                onClick={replayAll}
                aria-label="Replay all visible transitions"
              >
                <RotateCcw size={14} />
                <span>Replay</span>
              </button>
            </div>
          </div>
          <motion.div
            className="tl-grid"
            layout
            transition={{ duration: reduced ? 0 : 0.22 }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((item) => {
                const Demo = item.component;
                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className="tl-card"
                  >
                    <div className={`tl-preview tl-preview-${item.id}`}>
                      <Demo speed={speed} replayKey={replays[item.id] || 0} />
                      <button
                        type="button"
                        className="tl-replay"
                        aria-label={`Replay ${item.name}`}
                        onClick={() => replay(item.id)}
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                    <div className="tl-caption">
                      <div>
                        <h2>{item.name}</h2>
                        <p>{item.description}</p>
                      </div>
                      <button
                        type="button"
                        className="tl-inspect"
                        aria-label={`Get ${item.name} code`}
                        onClick={(event) => {
                          inspectorTrigger.current = event.currentTarget;
                          setSelected(item);
                          setInspectTab("react");
                        }}
                      >
                        <Code2 size={17} />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
          <div className="tl-collection-end">
            <span>{shown.length} carefully considered transitions</span>
            <p>
              Every example is interactive. Slow it down to see what makes it
              feel right.
            </p>
          </div>
        </section>
        <footer className="tl-footer">
          <span>bera/ui</span>
          <span>Useful by nature. Expressive in motion.</span>
          <a href="/studies/iris">
            Iris, an earlier study <ArrowUpRight size={12} />
          </a>
        </footer>
        <Dialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent
            className="tl-inspector"
            showCloseButton={false}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              inspectorTrigger.current?.focus();
            }}
          >
            {selected && (
              <>
                <div className="tl-inspector-top">
                  <div>
                    <span className="tl-inspector-category">
                      {selected.category}
                    </span>
                    <DialogTitle>{selected.name}</DialogTitle>
                  </div>
                  <DialogClose
                    className="tl-close"
                    aria-label="Close code inspector"
                  >
                    <X size={18} />
                  </DialogClose>
                </div>
                <DialogDescription>{selected.detail}</DialogDescription>
                <Tabs
                  value={inspectTab}
                  onValueChange={setInspectTab}
                  className="tl-code-tabs"
                >
                  <div className="tl-code-toolbar">
                    <TabsList>
                      <TabsTrigger value="react">React</TabsTrigger>
                      <TabsTrigger value="css">CSS</TabsTrigger>
                      <TabsTrigger value="agent">For your agent</TabsTrigger>
                    </TabsList>
                    <CopyControl
                      key={`${selected.id}-${inspectTab}`}
                      value={
                        inspectTab === "react"
                          ? groups[selected.group].source
                          : inspectTab === "css"
                            ? groups[selected.group].css
                            : briefFor(selected)
                      }
                      label={
                        inspectTab === "agent"
                          ? "Copy with instructions"
                          : "Copy code"
                      }
                    />
                  </div>
                  <TabsContent value="react">
                    <pre tabIndex={0}>
                      <code>{groups[selected.group].source}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="css">
                    <pre tabIndex={0}>
                      <code>{groups[selected.group].css}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="agent">
                    <pre className="tl-agent-brief" tabIndex={0}>
                      <code>{briefFor(selected)}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
                <div className="tl-code-bottom">
                  <span>
                    Export <code>{selected.exportName}</code> from the included
                    module.
                  </span>
                  <a
                    href={
                      inspectTab === "agent"
                        ? `/transitions/${selected.id}.agent.md`
                        : `/transitions/${selected.group}.${inspectTab === "css" ? "css" : "tsx"}`
                    }
                    download
                  >
                    <ArrowDownToLine size={13} /> Download
                  </a>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={guide} onOpenChange={setGuide}>
          <DialogContent
            className="tl-guide"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              guideTrigger.current?.focus();
            }}
          >
            <DialogTitle>Bring the feeling with you.</DialogTitle>
            <DialogDescription>
              Each transition comes with its source, styles, and an integration
              brief. Your agent gets the whole picture.
            </DialogDescription>
            <ol>
              <li>
                <strong>Find your detail.</strong>
                <p>
                  Play with a transition. Use slow motion to inspect its timing.
                </p>
              </li>
              <li>
                <strong>Open its code.</strong>
                <p>
                  Choose “For your agent” and copy. The brief includes the
                  actual React and CSS files.
                </p>
              </li>
              <li>
                <strong>Make it fit.</strong>
                <p>
                  Tell your agent where it belongs. Keep your existing design,
                  content, and behavior; bring in the transition.
                </p>
              </li>
            </ol>
            <p className="tl-guide-note">
              React and Motion. Familiar primitives. No account or external
              service inside the components.
            </p>
          </DialogContent>
        </Dialog>
      </main>
    </MotionConfig>
  );
}
