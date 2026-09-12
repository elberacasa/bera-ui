"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { MotionConfig } from "motion/react";
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
  const speed = slow ? 0.35 : 1;
  const playTabs = () =>
    setTab((value) => tabs[(tabs.indexOf(value) + 1) % tabs.length]);
  const playAccordion = () => setOpen((value) => !value);
  const playSearch = () => setSearchOpen((value) => !value);
  const playCounter = () => setCount((value) => (value >= 99 ? 1 : value + 1));
  const playIcon = () => setNavigation((value) => !value);
  const playStatus = () => setStatus((value) => (value + 1) % statuses.length);
  function playAll() {
    playTabs();
    playAccordion();
    playSearch();
    playCounter();
    playIcon();
    playStatus();
  }

  const rows: Row[] = [
    {
      id: "sliding-tabs",
      name: "Selection",
      description: "The active view travels with your attention.",
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
      name: "Disclosure",
      description: "Content unfolds. The space around it follows.",
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
      name: "Expansion",
      description: "A compact control makes room for the next step.",
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
      name: "Numbers",
      description: "Every digit carries the direction of the change.",
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
      name: "SVG morphing",
      description: "The same strokes become a different symbol.",
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
      name: "Status",
      description: "One message gives way to the next.",
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
        className={`cx-comparison ${className}`}
        aria-label="Compare transitions with and without Bera"
      >
        <div className="cx-intro">
          <div>
            {showHeading && <h2>See what motion changes.</h2>}
            <p>Six comparisons. Only the motion changes.</p>
          </div>
          <div className="cx-playback">
            <button type="button" className="cx-play-all" onClick={playAll}>
              <Play size={12} aria-hidden="true" /> Play all
            </button>
            <button
              type="button"
              className="cx-slow"
              aria-pressed={slow}
              onClick={() => setSlow((value) => !value)}
            >
              {slow ? "0.35× playback" : "Slow motion"}
            </button>
          </div>
        </div>
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
              {option === "with" ? "With bera" : "Without bera"}
            </button>
          ))}
        </div>
        <table id={`${id}-table`} className="cx-table" data-view={view}>
          <caption className="cx-sr-only">
            Interactive comparison of six transitions. Change either preview to
            update both.
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
              <tr key={row.id} id={`compare-${row.id}`}>
                <th scope="row" className="cx-description">
                  <h3>{row.name}</h3>
                  <p>{row.description}</p>
                  <button
                    type="button"
                    className="cx-row-play"
                    onClick={row.play}
                  >
                    {row.action}
                    <Play size={10} aria-hidden="true" />
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
