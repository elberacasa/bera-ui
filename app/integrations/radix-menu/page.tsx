import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { RadixMenuIntegration } from "@/components/integrations/radix-menu-integration";
import "../../transition-library.css";
import "./radix-menu.css";

export const metadata = {
  title: "Your menu, in motion — bera/ui",
  description:
    "Add Bera motion to an existing shadcn / Radix menu. One stylesheet, with your actions, state, positioning, and focus handling intact.",
};

export default function RadixMenuPage() {
  const agentBrief = readFileSync(
    join(process.cwd(), "public/adapters/radix-menu-motion.agent.md"),
    "utf8",
  );
  return (
    <main className="transition-library mi-page">
      <header className="tl-header">
        <Brand />
        <nav aria-label="Main navigation">
          <Link href="/">Collection</Link>
          <Link href="/agents">Skill</Link>
        </nav>
      </header>
      <section className="mi-intro">
        <p className="mi-context">shadcn / Radix</p>
        <h1>Your menu, in motion.</h1>
        <p>
          Add a small motion layer to the menu you already have. Its state,
          actions, and focus handling stay in place.
        </p>
      </section>
      <RadixMenuIntegration agentBrief={agentBrief} />
      <footer className="tl-footer">
        <span>bera/ui</span>
        <Link href="/">Explore the collection</Link>
      </footer>
    </main>
  );
}
