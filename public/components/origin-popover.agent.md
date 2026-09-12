# Origin Popover — integration brief

Add this component to the host project using its existing shadcn Popover primitive and the supplied origin-popover.tsx and origin-popover.css. The source uses React, TypeScript, and Radix through shadcn. Do not add an animation library.

## Files

Place both source files together, adjusting the shadcn Popover import path to match the host. If the host does not already have the shadcn Popover, add that primitive through the host's normal component workflow.

## API

Required: `trigger` (accessible button element), `label` (accessible panel name), and `children` (real content).

Optional: `open`, `onOpenChange`, `defaultOpen`, `side`, `align`, `reduceMotion`, and `className`.

Custom trigger buttons must forward their ref. Use `type="button"` when inside a form. Let the host own state when using controlled mode. Put real actions in children. Do not turn this into a simulated workflow.

## Design and adaptation

Inherit the host's background, foreground, and border tokens. The defaults fit black shadcn interfaces. CSS custom properties `--origin-background`, `--origin-foreground`, and `--origin-border` allow overrides. Set --origin-width, --origin-radius, and --origin-padding in a custom class to adjust dimensions; preserve viewport constraints. These CSS variables avoid specificity conflicts with utility classes. Adapt typography, icons, and content to the actual task.

Motion uses 180ms open, 120ms close, and a short content reveal. The origin follows Radix's final placement, including collision flips. Honor both OS reduced motion and the explicit reduceMotion prop. Do not add a continuous animation loop.

## Semantics and checks

This is a popover with dialog focus behavior, not a menu with automatic arrow-key navigation. Preserve Escape, outside dismissal, focus return to the trigger, and collision-aware positioning. Test the real action, keyboard Tab flow, phone width, long content, and reduced motion. A share action must handle clipboard rejection; a download must produce a real file.

No backend, account, telemetry, or service is required by the component. The component does not send messages or change permissions.
