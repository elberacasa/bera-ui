# Roadmap

bera/ui turns useful interface changes into deliberate, reusable motion. The next milestone is reliable adoption in an existing application. The number of patterns is secondary to the quality of their integration.

This file tracks the product's direction. GitHub issues track individual pieces of work and their acceptance criteria. Check an item only after the implementation and its relevant checks are complete.

## Established foundation

- [x] Nine directly interactive patterns across feedback, navigation, and surfaces.
- [x] Dark, neutral gallery with category filters, replay, and slow playback.
- [x] Source inspection and per-pattern integration guidance.
- [x] Preserved Iris study at `/studies/iris`.

## Current milestone: take one transition into a real project

- [x] **Individual exports.** Every download contains one public component and the helpers it needs. A consumer imports it without gallery styles or preview framing. Generated files match the live implementation.
- [x] **Custom settings that travel.** Tempo and corner changes preview immediately and appear in the copied agent brief. Study playback remains independent from exported settings.
- [x] **Portable agent kit.** A downloaded kit lists patterns, installs a chosen TSX/CSS pair, and installs its skill for the supported agents. It works locally after download, supports a dry run, and protects differing destination files.
- [ ] **Integration proof.** Use the kit in an existing React app. Keep the app's styling, state, accessibility primitive, and callbacks. Verify the behavior at desktop and phone widths.
- [ ] **Repository workflow.** Clear setup and contribution docs, scoped issues, pull request checks, and a connected deployment path. Verify a commit reaches the intended preview or production environment.

## Next: deepen the useful patterns

- [ ] **Adapt an existing shadcn primitive.** Publish a concrete example that transfers motion into an existing menu or accordion while retaining its focus management and DOM relationships.
- [ ] **Notification provider integration.** Demonstrate the stack motion with a real provider. Verify expiry, pause behavior, announcements, and dismissal; preserve the host provider's responsibilities.
- [ ] **Counter range design.** Decide how signed values and additional digits behave. Verify crossings through zero, digit-width changes, rapid input, and controlled updates before expanding the current 0–999 contract.
- [ ] **Reduced-motion evidence.** Record actual browser checks with the preference enabled for every pattern; compare final state, focus, and announcements with normal playback.
- [ ] **Theme and layout examples.** Demonstrate the same selected transition inside both a dense desktop interface and a narrow touch interface using their own tokens and content.
- [ ] **Reproducible motion capture.** Add a small capture workflow for reviewing timing changes at normal and slow speed without making screenshots the only correctness check.

## After adoption is proven

Consider additional recipes only when a real interface need is missing from the collection. Candidate areas include list reordering, inline editing, and continuity between a thumbnail and its detail view. Each proposal needs an ordinary use case, a constrained source API, and an integration example.

A public registry or package is a distribution decision, not a prerequisite for the local kit. Add one when it reduces friction without obscuring the source or imposing a second runtime. Avoid a separate agent service unless a concrete use case requires one.

## A pattern is ready when

Its intended action is obvious, its normal playback feels immediate, and interruptions settle correctly. It works with pointer and keyboard input, respects reduced motion, and fits a narrow phone layout. The exported source matches the gallery, its adaptation guidance identifies the real application state, and a consumer can use it without importing the showcase.
