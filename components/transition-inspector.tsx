"use client";
import { useEffect, useState, type ComponentType, type RefObject } from "react";
import { ArrowDownToLine, RotateCcw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyControl } from "@/components/copy-control";
import catalog from "@/lib/transition-catalog.json";
import { registryInstallCommand, registryItemUrl } from "@/lib/registry";
import {
  supportsRadius,
  transitionUsage as usage,
} from "@/lib/transition-examples";
import {
  defaultTuning,
  motionPresets,
  normalizeTuning,
  type MotionTuning,
} from "@/lib/motion-tuning";

type Entry = (typeof catalog)[number];
export type DemoProps = {
  preview?: boolean;
  speed?: number;
  radius?: number;
  replayKey?: number;
};
type Asset = {
  id: string;
  source: string;
  css: string;
  integration: string;
  props: string;
  dependencies: string[];
};

function brief(item: Entry, asset: Asset, tuning: MotionTuning) {
  const settings = {
    transition: item.id,
    tempo: tuning.tempo,
    ...(supportsRadius(item.id) ? { radius: tuning.radius } : {}),
  };
  return `Use bera/ui's ${item.name} in the current project.\n\nSelected settings: ${JSON.stringify(settings)}\nTempo is the speed prop; radius, when present, is in pixels. The gallery's slow-motion playback is not part of these settings.\n\nRead the existing component before editing. Preserve its content, fonts, colors, layout, accessibility primitive, and application behavior. If it already has a good component (such as shadcn/Radix), adapt only the relevant motion to it. Otherwise install the supplied standalone React export and connect the actual props/callbacks. Do not duplicate an existing animation engine unnecessarily.\n\nUse case: ${item.when}\nIntegration: ${item.integration}\nAvailable props: ${item.props}\n\nThis file contains only the selected export and its required helpers. It imports its own CSS. Normal imports use natural sizing; preview=true enables the gallery framing and demo controls and must be omitted from the application. Replace sample data with the host's data. Honor OS reduced motion; preserve keyboard focus and interruptions. Validate the real user action.\n\nDependencies: ${asset.dependencies.join(", ")} plus React. Use the project's package manager for missing dependencies.\n\n${item.id === "toast-stack" ? "Local motion reference (adapt to your actual provider)" : "Usage (connect the relevant application props)"}:\n\`\`\`tsx\n${usage(item, tuning)}\n\`\`\`\n\nFile: ${item.id}.tsx\n\`\`\`tsx\n${asset.source}\n\`\`\`\n\nFile: ${item.id}.css\n\`\`\`css\n${asset.css}\n\`\`\`\n`;
}

export function TransitionInspector({
  item,
  Demo,
  tuning,
  onTuningChange,
  onClose,
  returnFocus,
}: {
  item: Entry | null;
  Demo?: ComponentType<DemoProps>;
  tuning: MotionTuning;
  onTuningChange: (value: MotionTuning) => void;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const [tab, setTab] = useState("customize");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [replay, setReplay] = useState(0);
  const [slow, setSlow] = useState(false);
  const id = item?.id;
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetch(`/transitions/${id}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("The source could not be loaded.");
        return response.json() as Promise<Asset>;
      })
      .then((data: Asset) => {
        if (
          data.id !== id ||
          typeof data.source !== "string" ||
          typeof data.css !== "string"
        )
          throw new Error("The source is incomplete.");
        if (!controller.signal.aborted) {
          setAsset(data);
          setFailure(null);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setFailure(
            error instanceof Error ? error.message : "Could not load source.",
          );
      });
    return () => controller.abort();
  }, [id, retry]);
  const loaded = asset?.id === id ? asset : null;
  const text =
    item && tab === "install"
      ? registryInstallCommand(item.id)
      : item && loaded
        ? tab === "react"
          ? loaded.source
          : tab === "css"
            ? loaded.css
            : brief(item, loaded, tuning)
        : "";
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="tl-inspector tl-workbench"
        showCloseButton={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {item && (
          <>
            <div className="tl-inspector-top">
              <div>
                <span className="tl-inspector-category">{item.category}</span>
                <DialogTitle>{item.name}</DialogTitle>
              </div>
              <DialogClose className="tl-close" aria-label="Close transition">
                <X size={18} />
              </DialogClose>
            </div>
            <DialogDescription>{item.detail}</DialogDescription>
            <Tabs value={tab} onValueChange={setTab} className="tl-code-tabs">
              <div className="tl-code-toolbar">
                <TabsList>
                  <TabsTrigger value="customize">Customize</TabsTrigger>
                  <TabsTrigger value="install">Install</TabsTrigger>
                  <TabsTrigger value="react">React</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="agent">Agent</TabsTrigger>
                </TabsList>
                <CopyControl
                  value={text}
                  disabled={tab !== "install" && !loaded}
                  label={
                    tab === "install"
                      ? "Copy command"
                      : tab === "react" || tab === "css"
                        ? "Copy code"
                        : "Copy for agent"
                  }
                />
              </div>
              <TabsContent value="customize">
                <div className="tl-customizer">
                  <div className="tl-tuning-preview">
                    {Demo && (
                      <Demo
                        preview
                        speed={tuning.tempo * (slow ? 0.35 : 1)}
                        radius={tuning.radius}
                        replayKey={replay}
                      />
                    )}
                    <div className="tl-tuning-playback">
                      <button
                        type="button"
                        aria-pressed={slow}
                        onClick={() => setSlow((v) => !v)}
                      >
                        {slow ? "0.35× playback" : "Slow motion"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplay((v) => v + 1)}
                        aria-label={`Replay ${item.name} in customizer`}
                      >
                        <RotateCcw size={13} />
                        Replay
                      </button>
                    </div>
                  </div>
                  <div className="tl-tuning-controls">
                    <p className="tl-control-heading">
                      Make it feel like your product.
                    </p>
                    <div
                      className="tl-presets"
                      role="group"
                      aria-label="Motion presets"
                    >
                      {motionPresets.map((p) => (
                        <button
                          type="button"
                          key={p.name}
                          title={p.description}
                          aria-pressed={
                            p.tempo === tuning.tempo &&
                            (!supportsRadius(item.id) ||
                              p.radius === tuning.radius)
                          }
                          onClick={() => {
                            onTuningChange({
                              tempo: p.tempo,
                              radius: p.radius,
                            });
                            setReplay((v) => v + 1);
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                    <label className="tl-tuning-range">
                      <span>
                        Tempo <output>{tuning.tempo.toFixed(2)}×</output>
                      </span>
                      <input
                        type="range"
                        min=".6"
                        max="1.6"
                        step=".05"
                        value={tuning.tempo}
                        onChange={(e) =>
                          onTuningChange(
                            normalizeTuning({
                              ...tuning,
                              tempo: Number(e.target.value),
                            }),
                          )
                        }
                      />
                      <small>Changes motion timing proportionally.</small>
                    </label>
                    {supportsRadius(item.id) && (
                      <label className="tl-tuning-range">
                        <span>
                          Corners <output>{tuning.radius}px</output>
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          step="1"
                          value={tuning.radius}
                          onChange={(e) =>
                            onTuningChange(
                              normalizeTuning({
                                ...tuning,
                                radius: Number(e.target.value),
                              }),
                            )
                          }
                        />
                        <small>
                          Fits the shape of your existing interface.
                        </small>
                      </label>
                    )}
                    <button
                      className="tl-reset-tuning"
                      type="button"
                      onClick={() => onTuningChange(defaultTuning)}
                    >
                      Reset to original
                    </button>
                  </div>
                </div>
                <div className="tl-integration-note">
                  <strong>Where it belongs</strong>
                  <p>{item.when}</p>
                  <code>{`<${item.exportName} speed={${tuning.tempo}}${supportsRadius(item.id) ? ` radius={${tuning.radius}}` : ""} />`}</code>
                </div>
              </TabsContent>
              <TabsContent value="install">
                <div className="tl-install-content">
                  <div className="tl-install-step">
                    <h3>Add it to your project.</h3>
                    <p>
                      Run this in a project configured with shadcn/ui. It adds
                      this recipe and its stylesheet to your configured
                      components directory, and installs or updates the declared
                      dependencies.
                    </p>
                    <pre className="tl-install-command" tabIndex={0}>
                      <code>{registryInstallCommand(item.id)}</code>
                    </pre>
                    <p className="tl-install-caption">
                      The source is yours to edit. Your global theme stays
                      yours.
                    </p>
                  </div>
                  <div className="tl-install-step">
                    <h3>
                      {item.id === "toast-stack"
                        ? "Study the motion reference."
                        : "Connect your interface."}
                    </h3>
                    <p>{item.integration}</p>
                    <pre className="tl-install-usage" tabIndex={0}>
                      <code>{usage(item, tuning)}</code>
                    </pre>
                    <p className="tl-install-caption">
                      Adjust the import to your component alias. The command
                      installs the original recipe; pass these props to use your
                      selected timing
                      {supportsRadius(item.id) ? " and corners" : ""}.
                    </p>
                  </div>
                  <div className="tl-install-resources">
                    <CopyControl
                      value={loaded ? brief(item, loaded, tuning) : ""}
                      disabled={!loaded}
                      label="Copy for agent"
                    />
                    <a href="/agents#registry">Installation guide</a>
                    <a href={registryItemUrl(item.id)}>Inspect registry JSON</a>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="react">
                <pre tabIndex={0}>
                  <code>
                    {loaded?.source ?? "Loading the standalone source…"}
                  </code>
                </pre>
              </TabsContent>
              <TabsContent value="css">
                <pre tabIndex={0}>
                  <code>{loaded?.css ?? "Loading styles…"}</code>
                </pre>
              </TabsContent>
              <TabsContent value="agent">
                <pre tabIndex={0} className="tl-agent-brief">
                  <code>
                    {loaded
                      ? brief(item, loaded, tuning)
                      : "Preparing the complete handoff…"}
                  </code>
                </pre>
              </TabsContent>
            </Tabs>
            {failure && !loaded && (
              <p className="tl-source-error" role="alert">
                {failure}{" "}
                <button type="button" onClick={() => setRetry((v) => v + 1)}>
                  Try again
                </button>
              </p>
            )}
            <div className="tl-code-bottom">
              <span>
                {tab === "install"
                  ? "Have this component already? Copy for agent to adapt its motion."
                  : tab === "customize"
                    ? "Your settings are included when you copy for an agent."
                    : "One transition, with only its required helpers."}
              </span>
              <a
                href={`/transitions/${item.id}.${tab === "css" ? "css" : "tsx"}`}
                download
              >
                <ArrowDownToLine size={13} /> Download{" "}
                {tab === "css" ? "CSS" : "React"}
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
