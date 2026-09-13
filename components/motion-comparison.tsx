"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Gauge, Play } from "lucide-react";
import { MotionConfig } from "motion/react";
import { useMotionPreference } from "./transitions/use-motion-preference";
import { AccordionComparisonPreview } from "./comparisons/accordion-preview";
import {
  TabsComparisonPreview,
  CounterComparisonPreview,
  type TabsComparisonValue,
} from "./comparisons/selection-previews";
import {
  IconComparisonPreview,
  TextComparisonPreview,
} from "./comparisons/state-previews";
import { SearchComparisonPreview } from "./comparisons/search-preview";
import {
  ListComparisonPreview,
  type FileComparisonId,
} from "./comparisons/list-preview";
import "../app/motion-comparison.css";

type View = "without" | "with";
type Row = {
  id: string;
  name: string;
  description: string;
  action: string;
  play: () => void;
  preview: (enhanced: boolean) => ReactNode;
};
export const comparisonCount = 7;
const defaultFileOrder: FileComparisonId[] = ["brief", "tokens", "readme"];
const tabs: TabsComparisonValue[] = ["all", "code", "docs"];
const statuses = ["Draft saved", "Ready for review", "Changes approved"];

export interface MotionComparisonProps {
  className?: string;
  onExplore?: (id: string) => void;
  showHeading?: boolean;
}

/** Two presentations of one local model per row. Only motion differs. */
export function MotionComparison({
  className = "",
  onExplore,
  showHeading = true,
}: MotionComparisonProps) {
  const id = useId();
  const [view, setView] = useState<View>("with");
  const [slow, setSlow] = useState(false);
  const [tab, setTab] = useState<TabsComparisonValue>("all");
  const [open, setOpen] = useState(true);
  const [invites, setInvites] = useState(true);
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(8);
  const [navigation, setNavigation] = useState(false);
  const [status, setStatus] = useState(0);
  const [fileOrder, setFileOrder] = useState(defaultFileOrder);
  const reduced = useMotionPreference();
  const speed = slow ? 0.35 : 1;
  const playTabs = () =>
    setTab((value) => tabs[(tabs.indexOf(value) + 1) % tabs.length]);
  const playAccordion = () => setOpen((value) => !value);
  const playSearch = () => setSearchOpen((value) => !value);
  const playCounter = () => setCount((value) => (value >= 99 ? 1 : value + 1));
  const playIcon = () => setNavigation((value) => !value);
  const playStatus = () => setStatus((value) => (value + 1) % statuses.length);
  const rows: Row[] = [
    {
      id: "animated-list",
      name: "Animated list",
      description:
        "Items keep their identity as the list changes. The surrounding space follows.",
      action: fileOrder.length < 2 ? "Restore files" : "Change order",
      play: () =>
        setFileOrder((current) =>
          current.length < 2
            ? defaultFileOrder
            : [...current.slice(1), current[0]],
        ),
      preview: (enhanced) => (
        <ListComparisonPreview
          enhanced={enhanced}
          speed={speed}
          order={fileOrder}
          onRemove={(removed) =>
            setFileOrder((current) => current.filter((id) => id !== removed))
          }
        />
      ),
    },
    {
      id: "sliding-tabs",
      name: "Sliding tabs",
      description:
        "One indicator slides between tabs. The new content follows with a short fade.",
      action: "Switch tab",
      play: playTabs,
      preview: (enhanced) => (
        <TabsComparisonPreview
          enhanced={enhanced}
          speed={speed}
          replayKey={0}
          value={tab}
          onValueChange={setTab}
        />
      ),
    },
    {
      id: "accordion",
      name: "Accordion",
      description:
        "The panel grows to its content height and reverses from its current position.",
      action: open ? "Close details" : "Open details",
      play: playAccordion,
      preview: (enhanced) => (
        <AccordionComparisonPreview
          enhanced={enhanced}
          speed={speed}
          open={open}
          onOpenChange={setOpen}
          invites={invites}
          onInvitesChange={setInvites}
          role={role}
          onRoleChange={setRole}
        />
      ),
    },
    {
      id: "expanding-search",
      name: "Expanding search",
      description:
        "The field grows from its trigger as the input and controls appear.",
      action: searchOpen ? "Close search" : "Open search",
      play: playSearch,
      preview: (enhanced) => (
        <SearchComparisonPreview
          enhanced={enhanced}
          speed={speed}
          replayKey={0}
          open={searchOpen}
          onOpenChange={setSearchOpen}
          value={query}
          onValueChange={setQuery}
        />
      ),
    },
    {
      id: "rolling-counter",
      name: "Rolling counter",
      description:
        "Changed digits roll in the direction of the adjustment. Other digits stay still.",
      action: count >= 99 ? "Reset seats" : "Add a seat",
      play: playCounter,
      preview: (enhanced) => (
        <CounterComparisonPreview
          enhanced={enhanced}
          speed={speed}
          replayKey={0}
          value={count}
          onValueChange={setCount}
        />
      ),
    },
    {
      id: "morphing-icon-button",
      name: "Icon morph",
      description:
        "Three SVG strokes gather and reshape into a close icon, then return.",
      action: navigation ? "Close navigation" : "Open navigation",
      play: playIcon,
      preview: (enhanced) => (
        <IconComparisonPreview
          enhanced={enhanced}
          speed={speed}
          replayKey={0}
          value={navigation}
          onValueChange={setNavigation}
        />
      ),
    },
    {
      id: "text-swap",
      name: "Text swap",
      description:
        "Words and their icon enter and leave in a short, staggered sequence.",
      action: "Next status",
      play: playStatus,
      preview: (enhanced) => (
        <TextComparisonPreview
          enhanced={enhanced}
          speed={speed}
          replayKey={0}
          value={statuses[status]}
        />
      ),
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="compare"
        tabIndex={-1}
        className={`cx-comparison ${className}`}
        aria-label="Compare transitions with and without Bera"
      >
        <div className="cx-intro">
          <div>
            {showHeading && <h2>See what motion changes.</h2>}
            <p>
              Both versions look the same at rest. Use each action to see the
              transition.
            </p>
          </div>
          <div className="cx-playback">
            <button
              type="button"
              className="cx-slow"
              aria-pressed={slow}
              disabled={reduced}
              onClick={() => setSlow((value) => !value)}
            >
              <Gauge size={14} aria-hidden="true" />
              {slow ? "0.35× playback" : "Slow motion"}
            </button>
          </div>
        </div>
        <nav className="cx-index" aria-label="Comparison patterns">
          {rows.map((row) => (
            <a key={row.id} href={`#compare-${row.id}`}>
              {row.name}
            </a>
          ))}
        </nav>
        {reduced && (
          <p className="cx-motion-notice" role="status">
            Reduced motion is on. State changes stay available without the
            movement.
          </p>
        )}
        <div
          className="cx-mobile-switch"
          role="group"
          aria-label="Comparison view"
        >
          {(["without", "with"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              aria-controls={`${id}-table`}
              onClick={() => setView(option)}
            >
              <span>{option === "with" ? "With bera" : "Without bera"}</span>
              <span className="cx-view-detail" aria-hidden="true">
                {option === "with"
                  ? reduced
                    ? "Reduced motion"
                    : "Animated"
                  : "Instant"}
              </span>
            </button>
          ))}
        </div>
        <table id={`${id}-table`} className="cx-table" data-view={view}>
          <caption className="cx-sr-only">
            Interactive comparison of {rows.length} transitions. Resting states
            match. Use the action in each row or change either preview to update
            both.
          </caption>
          <thead>
            <tr>
              <th scope="col">Interaction</th>
              <th scope="col">Without bera</th>
              <th scope="col">With bera</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} id={`compare-${row.id}`} tabIndex={-1}>
                <th scope="row" className="cx-description">
                  <h3>{row.name}</h3>
                  <p>{row.description}</p>
                  <div className="cx-actions">
                    <button
                      type="button"
                      className="cx-row-play"
                      onClick={row.play}
                    >
                      <Play size={11} aria-hidden="true" />
                      <span>{row.action}</span>
                    </button>
                    {onExplore ? (
                      <button
                        type="button"
                        className="cx-explore"
                        onClick={() => onExplore(row.id)}
                      >
                        Get transition{" "}
                        <ArrowUpRight size={12} aria-hidden="true" />
                      </button>
                    ) : (
                      <Link className="cx-explore" href={`/#${row.id}`}>
                        Explore transition{" "}
                        <ArrowUpRight size={12} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </th>
                {(["without", "with"] as const).map((option) => (
                  <td key={option} className={`cx-cell cx-${option}`}>
                    <div
                      className="cx-preview"
                      role="group"
                      aria-label={`${row.name}, ${option === "with" ? "with" : "without"} Bera`}
                    >
                      {row.preview(option === "with")}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cx-footnote">
          <p>
            Try either side. Both stay in sync. All changes stay in this
            preview.
          </p>
          <Link href="/integrations/radix-menu">
            Already have a shadcn menu? Try the adapter{" "}
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </MotionConfig>
  );
}
