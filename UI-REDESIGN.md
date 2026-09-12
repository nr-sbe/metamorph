# Interface redesign 04

## Attack-number cleanup

The old basic-attack label cycled through `1 / 2 / 3`. Its counter had no effect on damage, animation, unlocks or score. The counter, timer and repeated basic-attack label are removed. Charged attacks, named special moves and warnings still provide feedback. Health, Critical Mass, evolution score and keyboard shortcut numbers remain because they convey actual state or controls.

## Visual direction

The design was informed by actual [Persona 5 Royal combat screenshots](https://www.gcores.com/articles/111263) and a [NieR: Automata gameplay screenshot](https://blog.lhyeung.net/2017/04/09/nier-automata-review/). Persona's angular panels, bold display type and explicit input prompts informed the menus and mutation selector. NieR's restrained gauges and open central view informed the gameplay layout. Reference images are research material only; none are bundled in the game.

The original MORPH interface uses paper white, near-black and acid green, angled labels, poster-style menu art and five original SVG weapon silhouettes. Hammerfists is represented by two crushing gauntlets to distinguish it from the single Unarmed fist. The Whipfist silhouette depicts its coiled spine and split harpoon.

## Changes

- Rebuilt main menu, loading screen, HUD, mutation selector, pause panel and field manual.
- Moved vitality and Critical Mass to the lower left, mutation controls to the lower right and the compact radar to the upper right.
- Added selected-form emphasis, weapon roles, accessible button names, hover labels and keyboard focus states.
- Kept direct 1–5 selection and held-Q slow time. The Change Mutation button also opens the selector; clicking a weapon selects it and returns to combat. Escape dismisses the selector.
- Added an actual Devastator-ready indication and low-health styling. Performance diagnostics are collapsed in the field manual.
- Added responsive layouts and reduced-motion support. The fonts remain the locally bundled free Barlow family; no new paid assets or services are required.

## Validation

Browser review covers the main menu, HUD, all five weapon icons, the selector's active state, choosing a form, Escape dismissal, the controls/settings panel, and gameplay. The production TypeScript/Vite build and all 16 existing combat/lifecycle tests pass. A browser check confirms the normal-attack callout remains hidden after attacking. Hardware gamepad and physical pointer-lock behavior still need testing outside the embedded browser, which does not grant pointer capture in this session.
