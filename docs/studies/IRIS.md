# Iris

Iris is an interactive optical surface at `/studies/iris`. Material choices, a dial, and an intensity slider control a shared light field. Its rendering and controls are isolated from the transition collection.

## Appearance

The surface combines a defined rim, ridged geometry, reflected light, and a contact shadow. Each material coordinates its surface, text, and accent colors.

| Role    | Dusk      | Pearl     | Ember     |
| ------- | --------- | --------- | --------- |
| Surface | `#e6e7ed` | `#e9eae7` | `#ede3db` |
| Text    | `#2c3044` | `#292c32` | `#45372e` |
| Accent  | `#626dab` | `#506662` | `#a95c36` |

## Behavior

Pointer lighting uses time-based interpolation. Material changes interpolate the same shader fields, and both intensity controls share one state. Rendering settles when the input stops changing.

Reduced motion applies color and value changes immediately and disables pointer-follow lighting. Controls remain available if graphics initialization fails.

## Integration boundaries

The route lives in `app/studies/iris/`; its implementation lives in `components/iris/`. Keep graphics dependencies isolated from the transition gallery and exported recipes.

Preserve dial bounds, keyboard values, touch scrolling outside drag controls, and dialog focus return. Verify narrow layouts and the graphics fallback when changing the implementation.
