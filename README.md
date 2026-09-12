# Metamorph — signature abilities update 07

A playable, original browser action prototype built around Prototype 1's weapon roles, traversal and consumption economy. The opening introduces five enemies, then an early rival with three escalating phases inspired by God of War 2018's first major confrontation. The emphasis is on readable windups, violent impacts and opportunities to retaliate while retaining superhuman speed.

## Play

Hosted on GitHub Pages: **https://nr-sbe.github.io/metamorph/**

Pushes to `main` rebuild and publish the game through `.github/workflows/pages.yml`. Use `pnpm build:pages` for the `/metamorph/` deployment path; `pnpm build` continues to build for a site root.

Requires a desktop browser with WebGPU or WebGL 2 and hardware acceleration. Keyboard/mouse recommended. Everything needed at runtime is included locally; no account, API key or paid service is used.

With Node.js 20.19+ installed, build the game from a fresh clone:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
```

Then start the local server (the downloadable ZIP already includes a built `dist`):

```sh
node tools/serve.mjs
```

Open **http://127.0.0.1:4173**. Alternatively, serve `dist` using any static HTTP server. Opening `index.html` as a `file://` URL will not work. For deployment, upload the contents of `dist` to the root of a static HTTPS site. GitHub Pages deployment is automated from `main`.

For development:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
corepack pnpm test
corepack pnpm build
```

If Corepack is unavailable, install pnpm or use `npm install`, `npm run dev`, `npm test`, and `npm run build`.

Choose **Visual Study** to inspect the new character, mutations and street art. Press **O** to rotate the camera in 45-degree increments, **1–5** to change mutations, and WASD to explore.

Choose **Enter the City** for the opening and encounter progression. Choose **Combat Sandbox** for twenty enemies and full Critical Mass. The field manual has direct access to **20-target practice**, **Rival duel**, **Skyline run**, and individual **Signature Practice** setups for all five forms. Escape pauses; Reset District restores scenery and encounters. Settings and best score are saved locally.

## Controls

| Action | Keyboard / mouse |
|---|---|
| Move / look | WASD / mouse; left Alt + drag if pointer capture is unavailable |
| Sprint / wall run | Shift + move into a wall |
| Charged jump | Hold Space, release |
| Glide / pull up | Press Space in air; hold Space to trade speed for lift |
| Dive / dodge / air dash | Hold Ctrl in air / C or Mouse 4 / C in air; Ctrl also dodges on ground |
| Primary / charged attack | Tap left click / release before 1 second for a charged strike |
| Automatic secondary | Hold left click for 1 second; triggers once at full charge |
| Secondary / descending attack | Right click on ground / in air |
| Grab / throw / pummel | F / primary while holding / secondary while holding |
| Consume / pickup / hijack / exit | E |
| Body surf | Shift + F in air, facing a nearby small enemy |
| Flying kick / cannonball | Unarmed primary in air / Shift + primary in air |
| Forms | 1 Unarmed, 2 Claws, 3 Blade, 4 Hammerfists, 5 Whipfist |
| Slowed selection wheel | Hold Tab |
| Shield / armor | Hold Q (Z toggles) / X |
| Target cycle / rooftop anchor | Middle mouse or T / V |
| Devastator | R; changes with form |
| Undertow | Whipfist: right click or R; F + right click also works |
| Skyline run / field manual / pause | B / H / Escape |

Gamepad: left stick movement, right stick camera, A jump/glide, B dodge/air dash, X consume/interact, Y grab, RB strike (hold 1 second to automatically use secondary), RT secondary, LB hold shield, LT mutation wheel, L3 toggle sprint, R3 target lock. D-pad left/right changes forms, up Devastator, down armor. RT triggers Undertow with Whipfist; Y + RT also works. LT + A anchors to a roof; LT + B dives. Start pauses/resumes. Stick input now preserves analog speed and uses a radial deadzone. Hardware gamepad testing remains outstanding.

Claws now unleash **Faultline**, a traveling eruption that launches a line of enemies. Blade performs **Guillotine**, a rising cleave followed by a steerable dive; switch forms or air-dash at its apex to cancel the descent. Hammerfists produce **Aftershock**, a ground wave that overturns cars, with stronger waves from higher elbow drops. With Unarmed, grab first and use secondary for **Battering Ram**; tap primary for an early throw or dodge to release. Each new special recharges in two seconds and costs no Critical Mass.

A full charge automatically performs the current form’s secondary (including its aerial variation). Whipfist still requires one Critical Mass charge. Releasing after automatic activation does not strike again. When holding an enemy or object, charging still controls throw strength and releasing throws it. Right click / RT continues to activate secondary directly.

Grab a highlighted nearby hostile with **F**, then **E** to consume, or use **Y → X** on gamepad. Close targets have forgiving acquisition; the player turns toward the chosen enemy. Walls still block grabs and brutes still require stagger. Yellow warning rings indicate blockable attacks; red rings require evasion. Labels identify the attacker and distance, and off-screen arrows show its direction. Incoming rounds now travel visibly and can miss or hit cover.

## Combat and world

- One offensive form and a separate defensive form. Five different ranges, damage values, recovery times and secondary actions. Charged attacks, launchers, air attacks, grabs, enemy/object throws, consumption and four form-dependent Devastators.
- Whipfist secondary seizes every eligible on-screen enemy within 18 m and line of sight, sends a separate tendril to each, lifts vertically roughly 9.5–10.5 m where ceilings permit, and gives each victim one slam hit. One Critical Mass charge powers the whole sequence. Unstaggered brutes resist; bosses and vehicles are anchored. Empty attempts cost nothing.
- Critical Mass has three charges. Consuming a hostile restores 35 health; surplus builds Mass. Incoming damage can deplete Mass before health. Ordinary kills do not replenish it. Shield regenerates after a delay; armor reduces damage and disables dodge/glide.
- A generated, approximately 600 x 600 m Midtown-inspired eight-block district with Art Deco piers, stepped crowns, bronze trim and sunburst entrances. Buildings, rooftop machinery, water towers, alleys, crosswalks, storefronts, cars, barriers, scaffolds, breakable panels and a plaza. The layout is fictional rather than a survey-accurate reconstruction.
- Persistent destroyed props until reset. Throwable cars use Rapier rigid bodies. Pavement fractures, bounded dust plumes and up to 96 irregular physical fragments communicate impacts. Vehicles shed bent metal and glass; scaffolds shed metal and wood; masonry produces chipped slabs; fatal cuts produce optional tissue fragments. Major tower cores remain stable.
- Introductory skirmish, early rival, mixed containment squad, Apex finale, then free roam. The rival and Apex have telegraphed ground slams and rushes with recovery windows. Ranged squads wear navy tactical gear, hunters wear plum hoods and masks, containment grunts wear ochre protective clothing, and brutes wear bulky padded gear. Armed ground/air vehicles threaten nearby players and can be hijacked; a rifle and launcher are available near the start.
- Six aerial route gates, local score records, gore/shake/audio settings and a performance resolution setting.

## What is still prototype quality

This is a working foundation, **not a completed AAA-quality game or a fully faithful recreation of Prototype's entire move tree**. See [implementation status](IMPLEMENTATION.md) and [validation](VALIDATION.md).

Combat uses authored animation clips with simplified hit volumes and reactions; it needs bespoke mutation animation, better contact timing, richer aerial chains, more precise paired contact animation and a full animation-to-ragdoll transition. Dismemberment is an optional simplified forearm removal and tissue fragments. Body surfing and cannonball are initial implementations. Consumption now uses a short pull-in, shrinking victim and organic strands; it still needs bespoke production animation.

The visual upgrade includes a textured character base, redesigned smooth mutation meshes, scanned street props, curved sedan panels, detailed near-street facades, PBR surfaces, HDR environment lighting, cascaded shadows and contact shading. Distant buildings retain the earlier facade treatment. There is no district streaming, arbitrary surface fracture or support-by-support structural collapse. The character base still needs bespoke production art and transformation animation to approach a current AAA release. Undertow has AABB geometry tests; general slopes and moving platforms are not implemented. Progression does not yet unlock move extensions. Physical gamepad validation, formal accessibility review, player combat-fidelity studies and the specified RTX 3060 benchmark remain outstanding.

## Source map

| File | Responsibility |
|---|---|
| `src/main.ts` / `style.css` | WebGPU/WebGL bootstrap, UI, camera, input, fixed-step accumulator |
| `src/game.ts` / `specialCombat.ts` / `specialRules.ts` | Locomotion, combat, special phases, connected-surface waves, swept collateral damage and encounter logic |
| `src/signaturePose.ts` / `signatureFx.ts` | Phase-synchronized character poses, bounded organic spikes, pavement waves, trails and signature audio |
| `src/rules.ts` | Data-driven weapon tuning, cone/LOS/lift/ground rules |
| `src/world.ts` | Generated district, static colliders, destructible props |
| `src/actor.ts` / `characters.ts` | Character instances, animations, mutation attachments |
| `src/fx.ts` / `debrisArt.ts` | Bounded impact/fragment/tendril pools, shared fracture meshes and audio |
| `tests/combat.test.ts` | Geometry, gameplay, traversal, progression and lifecycle checks |
| `public/assets/manifest.json` | Asset provenance, licenses, sizes and hashes |

Free production tools: Babylon.js, Rapier, TypeScript and Vite are used directly. Blender is the intended tool for bespoke characters, mutation animations and pre-fractured glTF scenery; Audacity for sound editing; glTF Transform / meshoptimizer / KTX2 for asset optimization. The runtime art upgrades are in `cityArt.ts`, `scannedProps.ts` and `mutations.ts`; offline Blender/glTF compression pipelines remain future work. See `VISUAL-UPGRADE.md`.

See [CREDITS.md](CREDITS.md) for included free resources and license notices.

## Mutation redesign 03

Musclemass has been removed. Hammerfists retains the crushing role and gains the former heavy-throw and projectile-impact bonuses. The five-slot keyboard, wheel and gamepad selection all use the same form list.

The four organic weapons have new silhouettes, layered carapaces, deep-green recessed tissue, green fissures, honed keratin edges and free scanned surface detail. Whipfist has an animated, armored spine and a split harpoon head. Visual Study starts with Whipfist equipped; press O to orbit and 1–5 to compare forms. Normal combat, long-range grabs and Undertow remain available.

## Interface redesign 04

The HUD and menus now use original illustrated weapon icons, angular paper-and-ink panels and green accents. Click **Change Mutation** or hold Q to open the selector; use 1–5 to switch directly. The decorative basic-attack counter is removed. See `UI-REDESIGN.md` for the screenshot references and interaction changes.


## Update 05

See [the update notes](METAMORPH-UPDATE.md) for clothing, camera, blood, soundtrack, architecture, incoming damage, feeding and controls. The runtime remains free of paid assets and services. Existing local settings and records are preserved across the rename.
