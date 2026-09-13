# Confirm action

Make room for a deliberate second click.

## Choose this for

Confirming an archive, removal, reset, or other consequential action in context.

## Integration

Supply the real onConfirm operation. Opening only arms the control and focuses Cancel; Enter or Space cannot confirm through a held key. Cancel and Escape return to the original action before commitment. Pending operations cannot overlap or be canceled by closing the control. Rejection keeps confirmation available with an error; success persists until the host remounts for a restored or different resource. Keep resource state and restoration in the host. Without onConfirm the production control is disabled. The preview archives and restores local data only. Replay changes presentation without changing state, invoking callbacks, or moving focus.

Read the host component before making changes. Preserve its accessibility primitive, content, state ownership, fonts, colors, and layout. Adapt motion in place when an existing component already handles behavior. Otherwise copy the standalone TSX and matching CSS together. Do not introduce a second animation engine just to reproduce this recipe.

Export: `ConfirmAction`

Props: onConfirm, label, confirmLabel, cancelLabel, pendingLabel, successLabel, speed, radius, className, style.

Defaults: `speed={1}`, `radius={12}`, `preview={false}`. Speed scales timing; radius is in pixels. The gallery's 0.35× playback is for inspection only. Omit `preview` in applications: it enables gallery framing, helper labels, and demo controls. Connect actual data and callbacks.

Source: `../recipes/confirm-action.tsx`
Styles: `../recipes/confirm-action.css`
Dependencies: React, motion, lucide-react. Styles use namespaced selectors and inherit the host's neutral tokens.

## Verify

Exercise the actual host action, interruption and reversal, keyboard focus, narrow layouts, and OS reduced motion. Do not report a real save, search, copy, or notification event as successful based on a demo timer.
