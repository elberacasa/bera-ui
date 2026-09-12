"use client";
import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Accordion } from "@/components/transitions/surfaces";
import "./accordion-preview.css";
type MemberRole = "editor" | "viewer";
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

export function AccordionComparisonPreview({
  enhanced,
  speed,
  open,
  onOpenChange,
  invites,
  onInvitesChange,
  role,
  onRoleChange,
}: {
  enhanced: boolean;
  speed: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invites: boolean;
  onInvitesChange: (value: boolean) => void;
  role: MemberRole;
  onRoleChange: (role: MemberRole) => void;
}) {
  const fields = (
    <SettingsFields
      invites={invites}
      role={role}
      onInvitesChange={onInvitesChange}
      onRoleChange={onRoleChange}
    />
  );
  return (
    <div className="cx-accordion-host">
      <div className="cx-workspace-label">Workspace settings</div>
      {enhanced ? (
        <Accordion
          className="mc-accordion"
          radius={0}
          speed={speed}
          value={open ? 0 : null}
          onValueChange={(value) => onOpenChange(value === 0)}
          items={[{ title: "Member access", body: fields }]}
        />
      ) : (
        <InstantDisclosure open={open} onOpenChange={onOpenChange}>
          {fields}
        </InstantDisclosure>
      )}
      <div className="cx-sharing-summary">
        <span>Shared link</span>
        <span>Members only</span>
      </div>
    </div>
  );
}
