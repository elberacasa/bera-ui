import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight } from "lucide-react";
import { CopyControl } from "@/components/copy-control";
import "../transition-library.css";
import "./agents.css";

export const metadata = {
  title: "For agents — bera/ui",
  description:
    "A portable motion skill. Copy one transition or teach your coding agent to adapt motion to the interface you already have.",
};
const quickInstall = "npx skills add elberacasa/bera-ui --skill bera-motion";
const install =
  "node ./bera-motion/install.mjs skill --project . --agent codex";
const add = "node ./bera-motion/install.mjs add sliding-tabs --project .";
const requests = [
  {
    title: "Apply to an existing component",
    text: "Use bera-motion to refine the transitions in my existing tabs. Read the current component first. Keep its layout, design tokens, accessibility primitive, and state behavior. Choose an appropriate recipe, implement the motion, and verify keyboard navigation and reduced motion.",
  },
  {
    title: "Use your chosen settings",
    text: "Use bera-motion to add copy feedback to this command. Use speed 1.3 and radius 8. Connect the exact text to the clipboard action and show success only after the copy succeeds. Match the existing button style.",
  },
  {
    title: "Review before changing",
    text: "Use bera-motion to review the motion in this interface. Identify three specific improvements to continuity, timing, or feedback, with the relevant recipes. Explain the tradeoffs. Do not edit files yet.",
  },
];
export default function AgentsPage() {
  return (
    <main className="transition-library ba-guide">
      <header className="tl-header">
        <Link className="tl-wordmark" href="/" aria-label="bera/ui home">
          bera<span>/</span>ui
        </Link>
        <Link className="ba-back" href="/">
          <ArrowLeft size={14} />
          Transitions
        </Link>
      </header>
      <section className="ba-intro">
        <span className="ba-eyebrow">FOR CODING AGENTS</span>
        <h1>
          Your interface.
          <br />A better way to move.
        </h1>
        <p>
          Give your agent the recipes, the source, and the judgment to make
          motion fit what you already have.
        </p>
        <div className="ba-intro-actions">
          <a className="tl-agent-button" href="/bera-motion.tar.gz" download>
            <ArrowDownToLine size={15} />
            Download agent kit
          </a>
          <a
            className="ba-text-link"
            href="https://github.com/elberacasa/bera-ui"
          >
            View source
            <ArrowUpRight size={15} />
          </a>
        </div>
        <p className="ba-small">
          Nine transitions · React + Motion · MIT · Runs locally
        </p>
      </section>
      <section className="ba-section">
        <div className="ba-section-title">
          <span>01</span>
          <h2>One transition? Copy and go.</h2>
        </div>
        <div className="ba-section-body">
          <p>
            Open a transition in the <Link href="/">collection</Link>, set its
            tempo and corners, then choose <strong>Copy for agent</strong>.
            Paste it into your coding agent with the component you want to
            improve.
          </p>
          <p>
            The handoff includes your settings, one standalone component,
            matching styles, and instructions for adapting it. Your agent can
            apply the motion directly to an existing shadcn or Radix component.
          </p>
        </div>
      </section>
      <section className="ba-section">
        <div className="ba-section-title">
          <span>02</span>
          <h2>Keep the whole collection close.</h2>
        </div>
        <div className="ba-section-body">
          <p>
            From your project directory, add the skill through the open skills
            CLI:
          </p>
          <div className="ba-command">
            <code>{quickInstall}</code>
            <CopyControl value={quickInstall} label="Copy command" />
          </div>
          <p>
            Choose your agent when prompted. The skill includes every recipe,
            source file, and integration guide.
          </p>
          <p>
            Prefer an offline kit? Download and extract the kit into your
            project root. You should see a <code>bera-motion</code> folder. From
            your project root, run:
          </p>
          <div className="ba-command">
            <code>{install}</code>
            <CopyControl value={install} label="Copy command" />
          </div>
          <p>
            The installer creates a project-local skill with all recipes and
            source. It needs Node 18 or newer and works without network access.
            It never installs dependencies or overwrites a different file.
          </p>
          <div className="ba-agent-paths">
            <span>
              Use <code>--agent</code> to choose your tool:
            </span>
            <dl>
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
          </div>
          <p>
            Your tool must support project skills. Start a fresh conversation if
            it has already loaded its skill list. For any other agent, provide{" "}
            <code>bera-motion/SKILL.md</code> as context directly.
          </p>
        </div>
      </section>
      <section className="ba-section">
        <div className="ba-section-title">
          <span>03</span>
          <h2>Say what should feel better.</h2>
        </div>
        <div className="ba-section-body">
          <p>
            These are prompts for your coding agent. It reads your project,
            chooses a recipe, and makes the changes.
          </p>
          <div className="ba-prompts">
            {requests.map((request) => (
              <article key={request.title}>
                <div>
                  <h3>{request.title}</h3>
                  <CopyControl value={request.text} label="Copy prompt" />
                </div>
                <p>{request.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="ba-section">
        <div className="ba-section-title">
          <span>04</span>
          <h2>Prefer the source?</h2>
        </div>
        <div className="ba-section-body">
          <p>
            Install a single TSX file and its CSS directly. The command reports
            any missing dependencies; use your project’s package manager to add
            them.
          </p>
          <div className="ba-command">
            <code>{add}</code>
            <CopyControl value={add} label="Copy command" />
          </div>
          <p>
            Files go into <code>components/bera</code>. Use{" "}
            <code>--dir src/components/bera</code> to choose another
            project-relative folder, or <code>--dry-run</code> to inspect the
            result first.
          </p>
          <p>
            Components use natural sizing by default. Connect your own data and
            callbacks, set <code>speed</code> and <code>radius</code>, and
            inherit your site’s styles. <code>preview</code> enables gallery
            spacing and demonstration controls; leave it off in your app.
          </p>
          <p>
            The toast stack is a motion reference for your notification
            provider. The save button requires a real <code>onAction</code>{" "}
            callback outside its labeled preview. Each recipe documents its
            integration boundaries.
          </p>
          <div className="ba-resources">
            <a href="/bera-motion.SKILL.md" download>
              Read the skill
              <ArrowUpRight size={13} />
            </a>
            <a href="/transitions/manifest.json">
              Machine-readable catalog
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </section>
      <footer className="tl-footer">
        <p>A little motion. A lot of care.</p>
        <Link href="/">
          Back to the collection <ArrowUpRight size={13} />
        </Link>
      </footer>
    </main>
  );
}
