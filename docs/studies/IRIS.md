# Bera — interfaces as objects

Bera is a component studio for designers and developers building expressive websites with coding agents. Its first component, Iris, lets a person select an atmosphere and tune its light. The goal is to establish an original, reusable visual language through one thoroughly resolved interaction.

## The visual thesis

An optical instrument sits in a quiet studio. Its ridged surface catches a coherent light field; a small external handle and a second linear slider control illumination. The page is the setting, not a competing spectacle.

The signature is a boundary: sharp rim, folded light, darker inner return, soft contact shadow. The default Dusk material pairs blue-violet with localized warm reflection. Palette changes are grounded in the selected material.

## Tokens

| Role    | Dusk    | Pearl   | Ember   |
| ------- | ------- | ------- | ------- |
| Surface | #e6e7ed | #e9eae7 | #ede3db |
| Ink     | #2c3044 | #292c32 | #45372e |
| Accent  | #626dab | #506662 | #a95c36 |

Manrope provides both display and functional typography. Iris's large name anchors the asymmetrical desktop composition. On phones, name and action precede the full-width instrument. No horizontal scrolling should be necessary at 320px.

Corners follow function: circular optical geometry and handle; pill-shaped primary entry; modestly rounded material choices; larger dialog corners. They are not all assigned one universal radius.

## Motion

Motion answers the person. Pointer lighting eases toward input using frame-rate independent exponential interpolation. Preset changes interpolate the same shader fields. Intensity controls share one state. There is no autonomous loop once the object settles.

Reduced motion switches color and value changes immediately and disables pointer-follow lighting. The material still has an intentionally composed resting appearance.

## Agent-first architecture

The design contract exposes composition, state, palette, behavior, and guardrails. Supported browsers expose read and set tools that operate on the same controlled React state. Tools validate inputs before mutation and perform no external writes.

Agent-first means an agent can understand, compose, and verify the real object. It does not mean the user interface needs to describe the implementation.

## Acceptance

- The resting image is worth looking at before interaction.
- The object's purpose becomes clear from its controls.
- Dial endpoints do not wrap unexpectedly.
- Touch scrolling works outside the dedicated drag handle and linear slider.
- Keyboard and assistive technologies receive real values and meaningful labels.
- Closing a dialog restores focus to its opener.
- Graphics failure leaves the controls useful.
- A future component can inherit these principles without copying this page's silhouette.
