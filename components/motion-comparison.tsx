"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Accordion } from "./transitions/surfaces";
import "../app/motion-comparison.css";

type MemberRole = "editor" | "viewer";
type ComparisonView = "without" | "with";

export interface MotionComparisonProps {
  className?: string;
  /** Open the actual Accordion recipe or its customizer. */
  onExplore?: () => void;
  /** Omit the heading when the host page supplies its own introduction. */
  showHeading?: boolean;
}

interface SettingsFieldsProps {
  invites: boolean;
  role: MemberRole;
  onInvitesChange: (invites: boolean) => void;
  onRoleChange: (role: MemberRole) => void;
}

function SettingsFields({
  invites,
  role,
  onInvitesChange,
  onRoleChange,
}: SettingsFieldsProps) {
  const id = useId();
  return (
    <div className="mc-settings-fields">
      <label className="mc-invite-row">
        <span className="mc-field-copy">
          <span>Allow member invites</span>
          <span>Teammates can invite new members.</span>
        </span>
        <input
          type="checkbox"
          aria-label="Allow member invites"
          checked={invites}
          onChange={(event) => onInvitesChange(event.target.checked)}
        />
      </label>
      <div className="mc-role-row">
        <label htmlFor={`${id}-role`} className="mc-field-copy">
          <span>Default role</span>
          <span>Access for new members.</span>
        </label>
        <select
          id={`${id}-role`}
          value={role}
          onChange={(event) =>
            onRoleChange(event.target.value === "viewer" ? "viewer" : "editor")
          }
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
    </div>
  );
}

/** Matches the recipe's rendered structure, with native instant disclosure. */
function InstantDisclosure({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className="bt-surface-demo bt-accordion-preview mc-accordion"
      data-preview="false"
    >
      <div className="bt-accordion">
        <div className="bt-accordion-item" data-open={open}>
          <h3 className="bt-accordion-heading">
            <button
              id={`${id}-trigger`}
              type="button"
              className="bt-accordion-trigger"
              aria-expanded={open}
              aria-controls={`${id}-panel`}
              onClick={() => onOpenChange(!open)}
            >
              <span>Member access</span>
              <span
                className="bt-disclosure"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <ChevronDown size={15} aria-hidden="true" />
              </span>
            </button>
          </h3>
          <div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            aria-hidden={!open}
            hidden={!open}
            inert={!open}
            className="bt-accordion-panel"
          >
            <div className="bt-accordion-body">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One local settings model, shown with and without the real Accordion recipe. */
export function MotionComparison({
  className = "",
  onExplore,
  showHeading = false,
}: MotionComparisonProps) {
  const id = useId();
  const [open, setOpen] = useState(true);
  const [invites, setInvites] = useState(true);
  const [role, setRole] = useState<MemberRole>("editor");
  const [view, setView] = useState<ComparisonView>("with");
  const [slow, setSlow] = useState(false);
  const fields = () => (
    <SettingsFields
      invites={invites}
      role={role}
      onInvitesChange={setInvites}
      onRoleChange={setRole}
    />
  );

  return (
    <section
      className={`mc-comparison ${className}`}
      aria-label="Interface motion comparison"
    >
      {showHeading ? (
        <h2 className="mc-heading">Same interface. Different feeling.</h2>
      ) : null}

      <div
        className="mc-mobile-switch"
        role="group"
        aria-label="Comparison view"
      >
        {(["without", "with"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            aria-controls={`${id}-${option}`}
            onClick={() => setView(option)}
          >
            {option === "without" ? "Without motion" : "With bera"}
          </button>
        ))}
      </div>

      <div className="mc-grid" id={`${id}-previews`}>
        {(["without", "with"] as const).map((option) => (
          <section
            key={option}
            id={`${id}-${option}`}
            className={`mc-view mc-${option}`}
            data-selected={view === option}
            aria-labelledby={`${id}-${option}-label`}
          >
            <h3 className="mc-view-label" id={`${id}-${option}-label`}>
              {option === "without" ? "Without motion" : "With bera"}
            </h3>
            <div className="mc-workspace">
              <div className="mc-workspace-heading">
                <span className="mc-workspace-avatar" aria-hidden="true">
                  W
                </span>
                <div>
                  <p>Workspace settings</p>
                  <span>Local preview</span>
                </div>
              </div>
              {option === "with" ? (
                <Accordion
                  className="mc-accordion"
                  radius={0}
                  speed={slow ? 0.4 : 1}
                  value={open ? 0 : null}
                  onValueChange={(value) => setOpen(value === 0)}
                  items={[{ title: "Member access", body: fields() }]}
                />
              ) : (
                <InstantDisclosure open={open} onOpenChange={setOpen}>
                  {fields()}
                </InstantDisclosure>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mc-controls">
        <button
          type="button"
          className="mc-shared-toggle"
          aria-expanded={open}
          aria-controls={`${id}-previews`}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="mc-desktop-copy">
            {open ? "Close both" : "Open both"}
          </span>
          <span className="mc-mobile-copy">
            {open ? "Close settings" : "Open settings"}
          </span>
        </button>
        <button
          type="button"
          className="mc-speed-toggle"
          aria-pressed={slow}
          title="Inspect motion at 0.4× speed"
          onClick={() => setSlow((current) => !current)}
        >
          Slow motion
        </button>
        {onExplore ? (
          <button type="button" className="mc-explore" onClick={onExplore}>
            Explore this transition
          </button>
        ) : null}
      </div>
      <p className="mc-helper">
        <span className="mc-desktop-copy">
          Try either preview. Both stay in sync.
        </span>
        <span className="mc-mobile-copy">
          Try a setting, then switch views.
        </span>
      </p>
    </section>
  );
}
