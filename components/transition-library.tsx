"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
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
import { MorphingIconButton } from "@/components/transitions/icons";
import { MotionComparison } from "@/components/motion-comparison";
import { GithubMark } from "@/components/github-mark";
import { Brand } from "@/components/brand";
import { TransitionInspector } from "@/components/transition-inspector";
import { useMotionPreference } from "@/components/transitions/use-motion-preference";
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
  MorphingIconButton,
};
const collectionOrder = [
  "sliding-tabs",
  "expanding-search",
  "state-button",
  "morphing-icon-button",
  "accordion",
  "rolling-counter",
  "morphing-menu",
  "copy-button",
  "text-swap",
  "toast-stack",
];
const transitions = catalog
  .map((item) => ({
    ...item,
    component: components[item.exportName as keyof typeof components],
  }))
  .sort(
    (a, b) => collectionOrder.indexOf(a.id) - collectionOrder.indexOf(b.id),
  );
const categories = ["All", "Feedback", "Navigation", "Surfaces"];
const readHash = () => window.location.hash;
const serverHash = () => "";

export function TransitionLibrary() {
  const [category, setCategory] = useState("All");
  const [slow, setSlow] = useState(false);
  const [replays, setReplays] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, MotionTuning>>({});
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const reduced = useMotionPreference();
  const subscribeNavigation = useCallback((notify: () => void) => {
    const onHashChange = () => {
      if (transitions.some((item) => `#${item.id}` === window.location.hash)) {
        setCategory("All");
      }
      notify();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const hash = useSyncExternalStore(subscribeNavigation, readHash, serverHash);
  const comparing = hash === "#compare" || hash.startsWith("#compare-");

  useEffect(() => {
    if (!hash) return;
    // The hash can point into the inactive view. Reveal it before native scrolling.
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1));
      target?.scrollIntoView({ block: "start" });
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);
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
  return (
    <MotionConfig reducedMotion="user">
      <main className="transition-library" id="top" tabIndex={-1}>
        <a
          className="tl-skip-link"
          href={comparing ? "#compare" : "#transitions"}
        >
          Skip to {comparing ? "comparisons" : "components"}
        </a>
        <header className="tl-header">
          <Brand href="#top" />
          <nav aria-label="Main navigation">
            <a
              href="#transitions"
              aria-current={!comparing ? "page" : undefined}
            >
              Components
            </a>
            <Link href="/integrations/radix-menu">Integrations</Link>
            <Link href="/agents">Skill</Link>
            <a
              href="https://github.com/elberacasa/bera-ui"
              className="tl-github"
              aria-label="GitHub repository"
            >
              <GithubMark /> <span>GitHub</span>
            </a>
          </nav>
        </header>
        <section className="tl-intro">
          <h1>
            Interfaces,
            <br />
            in motion.
          </h1>
          <div className="tl-intro-detail">
            <p>
              Carefully made transitions for the interfaces you already have.
              Try them here. Take the source. Make them yours.
            </p>
            <div className="tl-intro-actions">
              <Link href="/agents" className="tl-agent-button">
                <Braces size={16} /> Install the skill{" "}
                <ArrowUpRight size={14} />
              </Link>
              <span className="tl-intro-note">
                React. Motion. Yours to adapt.
              </span>
            </div>
          </div>
        </section>
        <nav className="tl-view-nav" aria-label="Gallery views">
          <a href="#transitions" aria-current={!comparing ? "page" : undefined}>
            Components <span aria-hidden="true">{catalog.length}</span>
          </a>
          <a href="#compare" aria-current={comparing ? "page" : undefined}>
            Compare motion <span aria-hidden="true">6</span>
          </a>
          <span className="tl-view-hint">Interact. Inspect. Adapt.</span>
        </nav>
        {!comparing && (
          <p className="tl-motion-notice" role="status">
            Reduced motion is on in your system. Interactions stay available;
            movement is minimized.
          </p>
        )}
        <div hidden={!comparing}>
          <MotionComparison
            className="tl-hero-comparison"
            showHeading={false}
            onExplore={(id) => {
              returnFocus.current =
                document.activeElement instanceof HTMLButtonElement
                  ? document.activeElement
                  : null;
              setSelectedId(id);
            }}
          />
        </div>
        <section
          id="transitions"
          aria-label="Transition collection"
          hidden={comparing}
          tabIndex={-1}
        >
          <h2 className="sr-only">Transition collection</h2>
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
                disabled={reduced}
                className={slow ? "is-active" : ""}
                onClick={() => setSlow((v) => !v)}
              >
                <Gauge size={14} />
                <span>{slow ? "0.35× playback" : "Slow motion"}</span>
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
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className="tl-specimen"
                    tabIndex={-1}
                  >
                    <div className="tl-caption">
                      <div>
                        <h3>{item.name}</h3>
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
                        <SlidersHorizontal size={14} />
                        <span>Customize</span>
                      </button>
                    </div>
                    <div className={`tl-preview tl-preview-${item.id}`}>
                      <Demo
                        preview
                        speed={tuning.tempo * (slow ? 0.35 : 1)}
                        radius={tuning.radius}
                        replayKey={replays[item.id] || 0}
                      />
                      {item.id !== "state-button" && (
                        <button
                          type="button"
                          className="tl-replay"
                          aria-label={`Replay ${item.name}`}
                          onClick={() => replay(item.id)}
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
          <div className="tl-collection-end">
            <span>{shown.length} transitions, ready to adapt</span>
            <Link href="https://github.com/elberacasa/bera-ui/issues">
              Suggest a transition <ArrowUpRight size={12} />
            </Link>
          </div>
        </section>
        <footer className="tl-footer">
          <span>bera/ui</span>
          <span className="tl-footer-note">
            Small details. Better interfaces.
          </span>
          <a href="https://github.com/elberacasa/bera-ui/blob/main/LICENSE">
            Open source. MIT.
          </a>
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
