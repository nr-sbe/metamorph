# Metamorph — update 05

## Completed

- Renamed the title, menus, loading screen, HUD mark and city sign to Metamorph.
- Added a skinned cotton shirt, olive trousers with cargo pockets, belt and leather boots. Covered body triangles are removed to prevent skin showing through the outfit.
- Interpolated the rendered player position between physics steps, smoothed visible turns and replaced the competing camera position/look-at filters with one stable anchor. Whipfist framing now uses camera orientation. Camera collision retracts immediately and eases back out.
- Added directional blood droplets, brief textured mist and wet ground splatters. Pools are bounded at 120 shared particles, 16 mist planes and 32 blood stains; the existing 96-body debris limit remains. Reduced gore suppresses the new effects.
- Added a locally bundled dark ambient Ogg loop, separate music/effects volume controls and brief music ducking for incoming hits.
- Added limestone vertical piers, bronze inlays, layered entrances, sunburst reliefs and stepped rooftop crowns. Crown volumes have traversal collision. Existing destruction remains on props and designated panels.
- Added up to six source-anchored attack warnings, distance labels, off-screen arrows, timing rings and persistent hit-origin feedback. Yellow attacks can be blocked; red boss rushes/slams require evasion. Ranged attacks now use bounded visible projectiles, fixed aim, finite range and cover checks.
- Fixed damage overflow: a partial Critical Mass charge or nearly broken shield only absorbs its remaining capacity. Remaining damage reaches the next resource. Hit feedback distinguishes shield, Mass and vitality.
- Added forgiving nearby grab acquisition with line of sight, automatic facing toward the selected target and contextual grab/consume prompts. Holding no longer turns the victim around when strafing. Consumption has a short pull-in and organic strands.
- Revised keyboard/gamepad mappings, preserved analog movement and added a radial stick deadzone. Controls are always available with H.

## Validation

The 27-test suite passed before the Whipfist follow-up; its four affected tests (including two new tests) also pass, including damage overflow, shield bypass, camera direction changes and frame-rate consistency, grab selection through cover, feeding completion, projectile travel/range/cover, input separation, blood pool bounds, Undertow and the existing 20-minute simulated reset/destruction soak. Production TypeScript/Vite compilation passes. Browser checks cover the new outfit, grabbing and consuming, input hints, music playback, and rendered scenery; final release checks are recorded below.

Physical controller feel and pointer capture must still be checked in a browser that supports pointer lock and with actual hardware. This session's embedded browser uses Alt + drag. The art remains a browser prototype; these changes do not establish AAA fidelity or the target hardware's 1080p/60 fps performance.

Asset sources and licenses are listed in CREDITS.md and the asset manifest.


## Whipfist special follow-up

Right click / RT now directly performs Undertow (R remains a shortcut). Acquisition includes every eligible on-screen enemy within 18 m and line of sight, up to the active encounter budget of 20. Every victim gets an individual tendril and torso restraint. The attack extends strands, lifts vertically 9.5–10.5 m where geometry allows, holds briefly and slams the group. Its 1.2-second timing and one-charge cost remain; camera pullback and lift framing, ascending/descending tones and layered bass/percussion emphasize the motion and impact. Unstaggered brutes and bosses remain resistant. New tests cover one tendril per victim, vertical paths, screen filtering and low ceilings.

Browser validation: the visible-crowd lift, individual strands, grab/consume prompt, blood aftermath and attacker distance labels render without console errors. Music playback advances and loops. The production build contains about 88.4 MB of runtime files; 79 downloaded asset entries pass SHA-256 verification. The final visual pass adds darker textured tendrils, wider lift framing and transparent pavement fracture marks.


## Enemy wardrobe

Enemy roles now select their own skinned outfit: ochre containment gear and head protection for grunts, navy uniform/vest/helmet for ranged squads, plum hooded sleeveless clothing and a pale mask for hunters, and bulky grey-green padded equipment for brutes and the Apex. All include trousers and boots, with restrained reflective strips on containment vests. Outfits share the existing CC0 skeleton but have distinct colors, garment coverage and head silhouettes. Garments are batched into two skinned meshes per actor. The protagonist retains his separate grey-and-olive outfit. No new downloads or paid resources were required.

The ambient soundtrack now uses a decoded Web Audio buffer with looping enabled, avoiding media-element seek delays between repetitions.


## Update 06 — fracture effects and automatic charged specials

Destruction now uses shared, irregular meshes instead of cubes: chipped pavement and masonry, bent sheet metal, thin glass slivers, long wood splinters, wet tissue, and pointed organic spikes. Vehicle destruction selects metal and glass; scaffolds select metal and wood. Short dust plumes and soft ground-pressure dust replace the glowing impact rings. Existing local free textures are reused, with no additional downloads. Debris remains capped at 96 physical bodies; 32 pooled dust plumes fade quickly so the next threat stays visible. Gore-off removes tissue while preserving organic attack spikes.

Holding primary for one second automatically triggers the active form’s secondary, including its aerial variant. The held input can trigger only once; releasing afterward does not add a primary strike. Releasing earlier retains the primary / partially charged primary. Whipfist still requires one Critical Mass charge. Empty or depleted attempts never fall back into an unexpected strike. Held-enemy and object throws remain charged on release; contextual weapon fire is preserved. Direct secondary input and switching forms cancel any pending charge. The controls screen and charge caption explain the new behavior for keyboard/mouse and gamepad.

Validation: all 37 automated tests pass, including five new charge-behavior tests, three fragment geometry/pool tests, all existing combat and movement checks, and 20 simulated minutes of destruction and resets. Production compilation passes. Browser testing confirms the revised controls, one Undertow capture/slam for each of 20 eligible targets, the bounded 96-fragment aftermath and no console errors. Full-charge timing was verified through the actual input/state simulation; hardware gamepad feel remains untested. Dense combat still falls below the intended 60 fps in this embedded browser; this update does not claim a performance target has been met.

The final visual review replaced pale, thick stone chunks with thin asymmetric pavement flakes, dark asphalt faces and cool-grey fracture edges. The three affected geometry/pool tests pass after that refinement.

See COMBAT-EVOLUTION.md for four proposed follow-up abilities. Those are design ideas, not implemented attacks.


## Update 07 — four signature abilities

Faultline, Guillotine, Aftershock and Battering Ram are implemented. See SIGNATURE-ABILITIES.md for controls, behavior, collision rules, validation and performance limits. The field manual now includes individual Signature Practice setups; the HUD displays the active secondary name and reuse cooldown. All four consume no Critical Mass and have independent two-second reuse timers. Undertow retains its existing resource cost.
