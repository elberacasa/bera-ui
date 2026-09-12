# Design principles

bera/ui brings deliberate motion to familiar interface actions. A transition should make the relationship between states clear and remain useful when adapted to a different product.

## Begin with the action

Identify what changes and why: a button starts work, an icon changes meaning, a menu reveals choices, or a value increases. Give the transition one dominant movement. Supporting details follow only when their sequence improves comprehension.

Keep normal playback immediate. Slow playback reveals the construction; it does not determine the timing people use in an application.

## Preserve continuity

Maintain a surface's origin and an object's identity as its state changes. Keep labels sharp while surrounding geometry moves. Interrupt and reverse from the current visual state instead of queuing work or snapping back to an earlier frame.

For SVG morphs, design recognizable endpoints and deliberate intermediate shapes. Match path structure when interpolating geometry, retain consistent optical weight, and keep the icon's meaning clear. The resting image must work without animation.

## Give motion a purpose

Progress follows the lifetime of the actual operation. Confirmation follows actual success. Error feedback preserves the next useful action. A decorative delay must not block input or imply work is complete before it is.

Prefer settled states over perpetual movement. Short brand and control animations can reward interaction without competing with the task. Reduced motion preserves meaning, focus, and feedback while removing unnecessary displacement.

## Keep the visual language precise

Use black, neutral borders, restrained surfaces, and legible typography. Let spacing, contrast, and the motion itself establish hierarchy. The SVG mark and wordmark share the same visual discipline as the controls.

The gallery has its own identity; a copied transition belongs to its host application. Inherit the host's fonts and tokens, connect its data, and preserve its layout and accessibility primitives. Expose only parameters that have a clear effect.

## Make the source usable

Every recipe explains its use case, component API, dependencies, and adaptation boundaries. Source and styles must match the live example. Demonstration content stays distinguishable from real application behavior, and gallery framing remains opt-in.

An agent should be able to identify the relevant source, understand which state the application owns, and make a focused integration. The same files must remain understandable and editable by a developer working directly.
