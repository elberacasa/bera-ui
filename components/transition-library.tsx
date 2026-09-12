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
  Braces,
  Gauge,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  StateButton,
  TextSwap,
  CopyButton,
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
import { TransitionInspector } from "@/components/transition-inspector";
import catalog from "@/lib/transition-catalog.json";
import { defaultTuning, type MotionTuning } from "@/lib/motion-tuning";
import "@/components/transitions/feedback.css";
import "@/components/transitions/selection.css";
import "@/components/transitions/surfaces.css";

const components = {
  StateButton,
  TextSwap,
  CopyButton,
  SlidingTabs,
  ExpandingSearch,
  RollingCounter,
  MorphingMenu,
  Accordion,
  ToastStack,
};
const transitions = catalog.map((item) => ({
  ...item,
  component: components[item.exportName as keyof typeof components],
}));
const categories = ["All", "Feedback", "Navigation", "Surfaces"];

export function TransitionLibrary() {
  const [category, setCategory] = useState("All");
  const [slow, setSlow] = useState(false);
  const [replays, setReplays] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, MotionTuning>>({});
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();
  const shown = useMemo(
    () =>
      transitions.filter(
        (item) => category === "All" || item.category === category,
      ),
    [category],
  );
  const selected = transitions.find((item) => item.id === selectedId) ?? null;
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
            <a href="#transitions">Transitions</a>
            <Link href="/agents">For agents</Link>
          </nav>
          <span className="tl-header-note">An ongoing collection</span>
        </header>
        <section className="tl-intro">
          <div>
            <h1>Transitions, with feeling.</h1>
            <p>
              Choose a detail. Tune its feel.
              <br />
              Let your agent make it part of your interface.
            </p>
          </div>
          <Link href="/agents" className="tl-agent-button">
            <Braces size={16} />
            Get the agent kit
            <ArrowUpRight size={14} />
          </Link>
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
                  {c === "All" && (
                    <span className="tl-count">{catalog.length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="tl-playback">
              <button
                type="button"
                aria-pressed={slow}
                className={slow ? "is-active" : ""}
                onClick={() => setSlow((v) => !v)}
              >
                <Gauge size={14} />
                <span>{slow ? "0.35× playback" : "Slow motion"}</span>
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
                const tuning = settings[item.id] ?? defaultTuning;
                return (
                  <motion.article
                    id={item.id}
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className="tl-card"
                  >
                    <div className={`tl-preview tl-preview-${item.id}`}>
                      <Demo
                        preview
                        speed={tuning.tempo * (slow ? 0.35 : 1)}
                        radius={tuning.radius}
                        replayKey={replays[item.id] || 0}
                      />
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
                        aria-label={`Customize ${item.name}`}
                        onClick={(event) => {
                          returnFocus.current = event.currentTarget;
                          setSelectedId(item.id);
                        }}
                      >
                        <SlidersHorizontal size={15} />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
          <div className="tl-collection-end">
            <span>{shown.length} transitions, ready to adapt</span>
            <p>Customize a preview. Copy for your agent. Keep your design.</p>
          </div>
        </section>
        <footer className="tl-footer">
          <span>bera/ui</span>
          <Link href="/agents">Install, adapt, refine</Link>
          <Link href="/studies/iris">
            Iris, an earlier study
            <ArrowUpRight size={12} />
          </Link>
        </footer>
        <TransitionInspector
          key={selected?.id ?? "closed"}
          item={selected}
          Demo={selected?.component}
          tuning={
            selected ? (settings[selected.id] ?? defaultTuning) : defaultTuning
          }
          onTuningChange={(value) => {
            if (selected)
              setSettings((current) => ({ ...current, [selected.id]: value }));
          }}
          onClose={() => setSelectedId(null)}
          returnFocus={returnFocus}
        />
      </main>
    </MotionConfig>
  );
}
