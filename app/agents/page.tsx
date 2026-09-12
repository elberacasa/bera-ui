import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { CopyControl } from "@/components/copy-control";
import { MotionComparison } from "@/components/motion-comparison";
import "../transition-library.css";
import "./agents.css";

export const metadata = {
  title: "The motion skill — bera/ui",
  description:
    "See the difference motion makes. Give your coding agent complete React source and the guidance to adapt it to your existing interface.",
};
const quickInstall = "npx skills add elberacasa/bera-ui --skill bera-motion";
const install = "node bera-motion/install.mjs skill --project . --agent codex";
const add = "node bera-motion/install.mjs add sliding-tabs --project .";
const request =
  "Use bera-motion to refine my existing tabs. Keep their content, design tokens, accessibility primitive, and state behavior. Adapt the appropriate motion recipe, then verify keyboard navigation and reduced motion.";

export default function AgentsPage() {
  return (
    <main className="transition-library ba-guide">
      <header className="tl-header">
        <Brand />
        <Link className="ba-back" href="/">
          <ArrowLeft size={14} />
          Collection
        </Link>
      </header>
      <section className="ba-intro">
        <h1>
          Your interface.
          <br />
          Better in motion.
        </h1>
        <p>
          Give your coding agent the source and guidance to refine what you
          already have.
        </p>
        <div className="ba-command ba-install-command" id="installation">
          <code>{quickInstall}</code>
          <CopyControl value={quickInstall} label="Copy install command" />
        </div>
        <p className="ba-small">
          Run from your project directory and choose your agent.
        </p>
      </section>
      <MotionComparison className="ba-comparison" showHeading />
      <Link className="ba-example-link" href="/#accordion">
        Explore the accordion recipe <ArrowUpRight size={13} />
      </Link>
      <section className="ba-section">
        <div className="ba-section-title">
          <h2>Your components stay yours.</h2>
        </div>
        <div className="ba-section-body">
          <p>
            The skill includes complete React and CSS recipes, a catalog, and
            integration notes. Your agent reads the existing component first,
            preserves its behavior, and adapts the motion to your fonts, colors,
            and layout.
          </p>
          <p>
            Use it with Codex, Claude Code, Cursor, or another agent that
            supports project skills. Start with the component you want to
            improve:
          </p>
          <div className="ba-request">
            <p>{request}</p>
            <CopyControl value={request} label="Copy request" />
          </div>
          <p>
            For one specific detail, open the{" "}
            <Link href="/#transitions">collection</Link>, customize a
            transition, and choose <strong>Copy for agent</strong>. The handoff
            contains your settings and the complete source.
          </p>
        </div>
      </section>
      <section className="ba-section">
        <div className="ba-section-title">
          <h2>
            A small workflow.
            <br />A visible difference.
          </h2>
        </div>
        <div className="ba-section-body">
          <dl className="ba-workflow">
            <div>
              <dt>Discover</dt>
              <dd>
                Ask your agent which transition fits the action and the states
                it connects.
              </dd>
            </div>
            <div>
              <dt>Apply</dt>
              <dd>
                Adapt the recipe to the existing component. Keep its real data,
                callbacks, and accessibility behavior.
              </dd>
            </div>
            <div>
              <dt>Refine</dt>
              <dd>
                Adjust timing and shape in the collection, then copy the chosen
                settings into your project.
              </dd>
            </div>
            <div>
              <dt>Verify</dt>
              <dd>
                Test the action, keyboard focus, interruption, narrow layouts,
                and reduced motion.
              </dd>
            </div>
          </dl>
          <p>
            These are instructions for your coding agent. The kit works locally;
            the gallery previews and exports recipes.
          </p>
        </div>
      </section>
      <section className="ba-section">
        <div className="ba-section-title">
          <h2>Take the source.</h2>
        </div>
        <div className="ba-section-body">
          <p>
            Prefer direct installation? Download and extract the portable kit
            into your project root.
          </p>
          <a className="tl-agent-button" href="/bera-motion.tar.gz" download>
            <ArrowDownToLine size={15} />
            Download the kit
          </a>
          <div className="ba-command">
            <code>{add}</code>
            <CopyControl value={add} label="Copy add command" />
          </div>
          <p>
            This copies one TSX file and its CSS into{" "}
            <code>components/bera</code>. The installer reports missing
            dependencies and preserves differing files. It needs Node.js 18 or
            newer. Use <code>--dry-run</code> to inspect the result or{" "}
            <code>--dir src/components/bera</code> to choose the destination.
          </p>
          <details className="ba-details">
            <summary>Install the skill from the offline kit</summary>
            <div className="ba-command">
              <code>{install}</code>
              <CopyControl
                value={install}
                label="Copy offline install command"
              />
            </div>
            <p>
              Choose your project-local destination with <code>--agent</code>:
            </p>
            <dl className="ba-agent-paths">
              <div>
                <dt>codex</dt>
                <dd>.agents/skills/bera-motion</dd>
              </div>
              <div>
                <dt>claude</dt>
                <dd>.claude/skills/bera-motion</dd>
              </div>
              <div>
                <dt>cursor</dt>
                <dd>.cursor/skills/bera-motion</dd>
              </div>
              <div>
                <dt>copilot</dt>
                <dd>.github/skills/bera-motion</dd>
              </div>
            </dl>
            <p>
              Start a fresh conversation if your agent has already loaded its
              skill list. For other tools, provide{" "}
              <code>bera-motion/SKILL.md</code> as context.
            </p>
          </details>
          <details className="ba-details">
            <summary>Component integration boundaries</summary>
            <p>
              Components use natural sizing. Leave <code>preview</code> off in
              your application; it enables gallery spacing and demonstration
              controls. Connect actual data and callbacks.
            </p>
            <p>
              The save button requires a real <code>onAction</code>. Toast stack
              is a motion reference for an existing notification provider. Each
              recipe documents the behavior your application owns.
            </p>
          </details>
          <div className="ba-resources">
            <a href="https://github.com/elberacasa/bera-ui">
              GitHub
              <ArrowUpRight size={13} />
            </a>
            <a href="/bera-motion.SKILL.md">
              Read the skill
              <ArrowUpRight size={13} />
            </a>
            <a href="/transitions/manifest.json">
              Catalog JSON
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </section>
      <footer className="tl-footer">
        <span>bera/ui</span>
        <Link href="/">
          Explore the collection
          <ArrowUpRight size={13} />
        </Link>
      </footer>
    </main>
  );
}
