# Implementation status and continuation

## Present in the playable build

Six offensive forms; separate shield/armor; slowed selection UI and shortcuts; primary, charged and secondary attacks; uppercut; descending attacks amplified by drop height; grabs, pummeling, consumption, enemy throws and physical car throws; basic flying kick, cannonball and body surf; dodge, super sprint, wall run, charge jump, two aerial dashes, dive/pull-up gliding and rooftop boost; four Devastator variants including the timed multi-target Undertow.

The city, props, pickups, armed/hijackable vehicles, opening encounter, rival duel, crowd encounter, finale, free roam, timed route, local settings, gore reduction, shake reduction, sound and music are integrated. God of War 2018 informed the early rival and its windup / attack / recovery cadence. Prototype 1 remains the source for the form roles and movement vocabulary.

## Partial or simplified

- Animation is a licensed general-purpose motion library with runtime weapon attachments. Attack directions, stagger and knockback communicate hits, but there is no bespoke contact animation or skeletal ragdoll.
- Environment destruction changes collision and persists, with pooled fragments. Scaffolds disappear and shed debris as a unit; tower cores are stable. Scars recycle after 48 impacts. Fractures are not modeled through arbitrary meshes.
- Ground and roof tests use AABBs. Walls, flat platforms and ceilings are covered; slopes and moving platforms need geometry-aware sweeps and ground queries.
- Aerial move families are recognizable starting implementations, with limited chains, cancel rules and body-surf contact detail. Combat balance and Prototype player recognition require playtesting.
- Static geometry is merged by material. There is no cell streaming or complete LOD system. Assets have not yet undergone glTF/texture compression.
- Gamepad basics and pause/resume are mapped, but anchor, dive, challenge launch and all Devastator combinations need a complete controller layout and physical hardware verification.

## Remaining production work, in priority order

1. **Contact and animation:** author separate claw, blade, hammer and whip clips in Blender; align damage frames; implement directional hit reactions, bounded skeletal ragdolls, dismemberment caps, consumption and full recovery cancels. Replace immediate long-range flying-kick damage with a swept contact attack, and complete cannonball/body-surf collision behavior.
2. **Encounter quality:** run Prototype 1 player tests, tune attack commitments and threat spacing, add targeting assist, complete the unlocking system and improve encounter navigation. Expand tanks/aircraft from simple timed fire to distinct telegraphed attack sets.
3. **Structural destruction:** author pre-fractured facade panels and small structures with independent supports, physically reachable fragments and stable simplified collision proxies. Preserve destroyed-state flags across streamed cells.
4. **Art:** build original organic hero/enemy meshes and present-day NYC modular environment assets. Use PBR maps, authored lighting, better vehicles and set dressing, contact shadows and restrained post-processing. The current procedural layout is a starting point.
5. **Browser performance:** split city cells, add mesh LODs, move repeated windows/props to instances, compress with meshoptimizer and KTX2, and profile allocations during combat. Measure at 1080p on the specified Ryzen 5 5600 / RTX 3060 rather than extrapolating from this host.
6. **Acceptance:** run a real 20-minute rendered destruction/reset soak with JS/WASM/GPU memory capture, collision tests on slopes and broken moving platforms, gamepad hardware tests, and player studies with gore and shake disabled.

The proposed 1080p/60 fps specification, AAA visual quality, complete original-game fidelity and all acceptance conditions are **not certified by this prototype**. The included validation report distinguishes automated evidence from remaining checks.
