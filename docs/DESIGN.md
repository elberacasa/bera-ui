# Transitions, with feeling

bera/ui is a source collection for bringing deliberate motion into existing interfaces. Its first edition covers nine everyday patterns across feedback, navigation, and surfaces. The collection—not an unusual branded component—is the product.

The user chose transitions.dev as the reference and a black shadcn-style visual language. Iris remains an earlier visual study. The ordinary Origin Popover is retained in source but does not define the new collection.

## Motion direction

A surface has a believable origin. A changing label carries direction. A number moves through neighboring values. A selected tab travels rather than flashes. Motion should explain what just happened while rewarding attention to detail.

Use one dominant movement per interaction, with smaller details following it: surface first, label second, confirmation last. Favor continuous reversals over queued animation. Keep text crisp instead of scaling a whole container. Short transitions should feel immediate at normal speed; the 0.35× control reveals their construction.

No perpetual ambient animation. No shader machinery in the collection. No ornamental gradients or generic star logo. Contrast comes from neutral layers, a few light controls, and differences in size and rhythm.

## First collection

| Feedback      | Navigation       | Surfaces      |
| ------------- | ---------------- | ------------- |
| State button  | Sliding tabs     | Morphing menu |
| Text swap     | Expanding search | Toast stack   |
| Copy feedback | Rolling counter  | Accordion     |

State button uses a clearly labeled simulated save unless an actual action is supplied. Copy writes to the clipboard. Search filters local demonstration names. Toasts are explicitly local previews. Production integrations must connect the relevant application behavior.

## Agent handoff

The inspector offers React, CSS, and a full agent brief. Briefs include actual source, styles, dependencies, selected export, and integration constraints. Remove the preview frame, helper captions, and sample data when adapting an interaction. Preserve the host application's design and useful behavior. The gallery stylesheet is separate from each module's styles.

`public/transitions/manifest.json` lists downloadable artifacts. Build-time synchronization prevents stale copies. Favor a small, understood source module over a runtime agent service or another framework.
