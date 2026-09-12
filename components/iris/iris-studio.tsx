"use client";

import Link from "next/link";
import { useState, useRef, type CSSProperties } from "react";
import { Iris, IrisAtmospheres } from "./iris";
import { useIrisAgent } from "./use-iris-agent";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { atmospheres, defaultIrisValue, type IrisValue } from "./atmospheres";
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: diagonal ? "rotate(-45deg)" : undefined }}
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function IrisStudio() {
  const [value, setValue] = useState<IrisValue>(defaultIrisValue),
    [panel, setPanel] = useState<"system" | "use" | null>(null),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const openPanel = (kind: "system" | "use", button: HTMLButtonElement) => {
    opener.current = button;
    setPanel(kind);
  };
  useIrisAgent(value, setValue);
  const theme = atmospheres.find((a) => a.id === value.atmosphere)!;
  const style = {
    "--surface": theme.background,
    "--ink": theme.ink,
    "--accent": theme.accent,
  } as CSSProperties;
  const copy = async () => {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            component: "Iris",
            version: "0.1.0",
            value,
            tokens: {
              surface: theme.background,
              ink: theme.ink,
              accent: theme.accent,
            },
          },
          null,
          2,
        ),
      );
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };
  return (
    <main className="studio" style={style}>
      <header className="studio-header">
        <Link className="wordmark" href="/" aria-label="Bera home">
          bera
        </Link>
        <span className="header-caption">Objects for the web.</span>
        <button
          className="text-button"
          onClick={(e) => openPanel("system", e.currentTarget)}
        >
          The thinking <span className="plus">+</span>
        </button>
      </header>
      <section className="object-stage" aria-labelledby="iris-title">
        <div className="object-copy">
          <div className="collection-note">
            <span className="object-symbol" aria-hidden="true">
              ◉
            </span>{" "}
            The first object
          </div>
          <h1 id="iris-title">Iris</h1>
          <p className="object-category">An atmosphere selector.</p>
          <p className="object-instruction">
            Turn down the noise.
            <br />
            Find your light.
          </p>
          <button
            className="use-button"
            onClick={(e) => {
              setCopied(false);
              setCopyError(false);
              openPanel("use", e.currentTarget);
            }}
          >
            Make it yours <Arrow diagonal />
          </button>
        </div>
        <div className="object-display">
          <Iris value={value} onChange={setValue} />
          <p className="interaction-hint">
            <span className="pointer-symbol" aria-hidden="true">
              ↗
            </span>
            <span className="mouse-hint">
              Move across the lens. Drag the small dial.
            </span>
            <span className="touch-hint">
              Drag the small dial to change the light.
            </span>
          </p>
        </div>
      </section>
      <section className="atmosphere-bar" aria-label="Choose an atmosphere">
        <div className="atmosphere-label">
          Set the atmosphere<span key={theme.id}>{theme.note}</span>
        </div>
        <IrisAtmospheres value={value} onChange={setValue} />
      </section>
      <footer className="studio-footer">
        <span>Independent in spirit. Precise by design.</span>
        <span>
          Bera collection <span className="footer-dot">/</span> Iris
        </span>
        <button
          className="text-button"
          onClick={() => setValue(defaultIrisValue)}
        >
          Reset the light{" "}
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5a5 5 0 1 1-.5 5M3 1v4h4"
              stroke="currentColor"
              strokeWidth="1.25"
            />
          </svg>
        </button>
      </footer>
      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <DialogContent
          className="studio-dialog"
          style={style}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener.current?.focus();
          }}
        >
          <DialogTitle>
            {panel === "system"
              ? "Interfaces as objects."
              : "Take the atmosphere with you."}
          </DialogTitle>
          <DialogDescription>
            {panel === "system"
              ? "Iris is the first piece in the Bera collection. A small, useful interaction, treated with the care of a physical object."
              : "Your current selection, ready to become part of another interface."}
          </DialogDescription>
          {panel === "system" ? (
            <>
              <div className="principle">
                <span>Material</span>
                <p>
                  Light has an edge. Surfaces have depth. Detail earns its
                  place.
                </p>
              </div>
              <div className="principle">
                <span>Response</span>
                <p>
                  Every movement answers a gesture. At rest, the object is
                  still.
                </p>
              </div>
              <div className="principle">
                <span>Clarity</span>
                <p>
                  One object. One purpose. Equally at home under a cursor or a
                  fingertip.
                </p>
              </div>
              <a className="dialog-download" href="/iris.design.json" download>
                Download the design contract <Arrow />
              </a>
            </>
          ) : (
            <>
              <div className="chosen-atmosphere">
                <span className={`material-swatch swatch-${theme.id}`} />
                <div>
                  <strong>{theme.name}</strong>
                  <span>Light at {value.intensity}%</span>
                </div>
              </div>
              <div className="token-strip">
                {[
                  ["Surface", theme.background],
                  ["Ink", theme.ink],
                  ["Accent", theme.accent],
                ].map(([name, color]) => (
                  <div key={name}>
                    <span style={{ background: color }} />
                    <p>{name}</p>
                    <code>{color}</code>
                  </div>
                ))}
              </div>
              <button className="copy-button" onClick={copy}>
                {copied ? "Selection copied" : "Copy this selection"}
                <Arrow />
              </button>
              <p className="copy-status" role="status">
                {copyError
                  ? "Clipboard unavailable. Download the selection below."
                  : copied
                    ? "Ready to paste into your project or coding agent."
                    : "Includes the atmosphere, light level, and color values."}
              </p>
              <a
                className="dialog-download"
                href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ component: "Iris", value, tokens: { surface: theme.background, ink: theme.ink, accent: theme.accent } }, null, 2))}`}
                download="iris-selection.json"
              >
                Download this selection <Arrow />
              </a>
              <a className="dialog-download" href="/iris.design.json" download>
                Get the full design contract <Arrow />
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
