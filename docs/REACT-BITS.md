# React Bits → Tabayyan native motion

Upstream: David Haz / DavidHDev/react-bits

Pinned commit: `9481af758aae6cfb34c3652ec40a1c099360331f` · retrieved 2026-09-22.

Original source snapshots in `react-bits-originals/` are documentation only, excluded from TypeScript compilation and not imported into Metro. Adapted app components are in `src/components/experience/`. The app does not install the DOM-based React Bits library or run it in a WebView.

## Rubber Segment

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Micro/RubberSegment/RubberSegment.tsx)

App: `RubberSegment.tsx`

Independent leading/trailing edges, 190ms dilation, 300ms land, 3px squash and 160ms relaxation; rubberband 0.55 and projected pan release. Native gestures replace pointer events. Handoff runs after dilation instead of overlapping at 150ms. Accessible native tabs replace clipped DOM label copies.

## Specular Button

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Components/SpecularButton/SpecularButton.tsx)

App: `SpecularRim.tsx + specularShader.ts`

Original signed-distance rounded rectangle, Gaussian rim, elliptical-normal lighting, angle and brightness damping. GLSL ES 1 syntax and Expo GL replace OGL. Touch replaces cursor proximity. Finite idle animation replaces permanent RAF; primary action only.

## Silk

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Backgrounds/Silk/Silk.tsx)

App: `SilkField.tsx + silkShader.ts`

Original UV rotation, procedural folds/noise and 0.1× delta time. Expo GL replaces three.js. Green uniforms, lower opacity, ~30 redraw/sec cap, finite idle settling and scene lifecycle gating.

## Prompt Bar

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Micro/PromptBar/PromptBar.tsx)

App: `GlassAction.tsx`

Original ARROW_UP and SQUARE seven-vertex arrays, interpolated SVG path, sine squash/tilt. Reanimated replaces Motion values. Not the complete web command/model picker.

## Lattice Loader

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Micro/LatticeLoader/LatticeLoader.tsx)

App: `LatticeLoader.tsx`

Original 3×3 orbit cells [0,1,2,7,null,3,6,5,4], 108ms phase step, 864ms cycle and done/error masks. Native shared clock; opacity curve is a piecewise interpolation of the CSS keyframes. No fabricated percentage or staged completion.

## Animated Content

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Animations/AnimatedContent/AnimatedContent.tsx)

App: `AnimatedContent.tsx`

Distance/opacity/easing translated to Reanimated entry/exit plus layout transitions. 16px mobile distance. Native mounting/FlatList lifecycle replaces browser ScrollTrigger.

## Thought Line

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Micro/ThoughtLine/ThoughtLine.tsx)

App: `ThoughtLine.tsx`

Expandable trace, elapsed timer, active/settled labels and collapse-on-settle. Actual server messages populate trace. Lattice replaces sparkle; no DOM text shimmer or text blur claimed.

## Swipe Toast

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Micro/SwipeToast/SwipeToast.tsx)

App: `SwipeToast.tsx`

Vertical swipe, 24px rubberband resistance, 40px travel and 110px/s velocity thresholds. Native gesture/exit replaces pointer samples. Errors persist until dismissed or retried; no timeout fuse.

## Glass Surface

[Exact upstream source](https://github.com/DavidHDev/react-bits/blob/9481af758aae6cfb34c3652ec40a1c099360331f/src/ts-default/Components/GlassSurface/GlassSurface.tsx)

App: `Glass.tsx`

Material reference, NOT a port of SVG displacement or chromatic aberration. Native GlassView on supported iOS, real BlurView on older iOS/web, layered translucency on Android. Native material intentionally replaces the DOM-only effect.

## Attribution

MIT + Commons Clause, copyright (c) 2026 David Haz. License is retained in `THIRD-PARTY-NOTICES.md` and the upstream snapshot. These adaptations are part of Tabayyan, not a standalone component library.

## Visual limitations

No claim of measured FPS, thermal behavior, battery usage, or pixel equivalence to the web component is made. iOS native glass, keyboard transitions and touch feel require review on a physical iPhone.
