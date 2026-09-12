# Validation — 12 September 2026

## Automated checks

`tsc --noEmit`: passed. `vite build`: passed; static output approximately **18.9 MB uncompressed**, 65 files. Largest JS chunk is approximately 8.80 MB / 2.30 MB gzip; Vite warns about chunk size. This is below the 200 MB total-download target, but further code and asset splitting is appropriate.

`node --import tsx --test tests/combat.test.ts`: **14 passed, 0 failed**.

1. All twenty in-cone targets acquired; behind/out-of-range targets excluded.
2. Solid architecture occludes acquisition; destroyed panels cease to occlude.
3. Brutes require stagger; bosses and vehicles remain anchored.
4. Ceiling shortens lift; a platform supplies landing height; removal falls back to street.
5. Actual Undertow state sequence captures twenty, spends one charge, slams once each and releases all.
6. Empty acquisition spends nothing; the grab/secondary chord uses the same selection.
7. Shield absorbs a tested hit, armor refuses dodge, consumption supplies surplus Mass.
8. Thirty repeated resets and all form changes preserve mesh, material and physics-body counts.
9. A fully charged jump reaches a roof-height arc; armor refuses gliding.
10. Opening skirmish, rival phases, crowd encounter and Apex progress into free roam.
11. Challenge launch and district reset safely cancel Undertow captures.
12. The Rapier character controller stops at a real wall collider; sprinting converts the contact into a wall run.
13. Gore disabled leaves the twenty-target kill count, slam count and resource cost unchanged.
14. **72,000 fixed simulation steps** (twenty simulated minutes), with sixty crowd slams and resets, preserve the allocated render-object counts and return physics-body counts to baseline after each cycle. Dynamic effect bodies remain bounded by 96.

The soak uses Babylon NullEngine and actual Rapier physics with a test ground collider and minimal city fixture. It tests gameplay and effect lifecycle, not rendered GPU memory or the complete textured city. It is **not** a twenty-minute real-time rendering benchmark or proof of no JS/WASM/GPU memory growth.

## Browser observations

Used the Codex in-app browser through visible UI controls and actual keyboard input. The browser selected WebGPU and loaded the local animation, texture, music and font resources. No browser errors were reported during the inspected runs.

- Menu, field manual, settings, practice entry, pause and reset worked.
- Undertow with **gore and camera shake disabled** reported 20 captured, 20 slam hits, 2,000 score and Mass falling from 3 to 2. Practice reinforcements subsequently respawned as expected.
- Before the final rigid-prop batching optimization, three repeated twenty-target resets with the real skinned asset held at **1,064 meshes, 161 materials, one rigid body** after effects cleared. This is an allocation-count observation, not a comprehensive memory measurement.
- The rival's health/phase UI advanced to phase 2 after a Devastator; three nearby objects were destroyed during the fight. Boss telegraphs and environmental effects ran.
- Final rigid-prop batching reduced the twenty-target scene to **896 total meshes / 161 materials / one rigid body**, with **175 active meshes and 60 fps** observed at rest in the embedded viewport. This remains a host-specific sample, not a 1080p benchmark.
- The compiled static game was served successfully with `node tools/serve.mjs` on localhost port 4173.
- Observed roughly 49–60 fps during several ordinary scenes at the app's varying pane resolution, with lower readings during resets and effects, including approximately 42 fps with 80 active fragments after a compiled-build crowd slam. Hardware was not identified and the required 1080p RTX 3060 benchmark was not performed. These samples must not be treated as the target specification being achieved.
- Pointer lock was unavailable in the embedded browser; the handled fallback is left Alt + drag. A standalone browser with pointer lock is preferable for play.

All **34 asset-manifest hashes** verified against the local files. The manifest includes the selected downloaded resources and runtime notices; generated game geometry/audio do not require external downloads.

## Still unverified

Prototype 1 player recognition and combat feel; complete keyboard/gamepad move coverage; real gamepad hardware; WebGL fallback; slope/ceiling/wall combinations in complex meshes; moving or dynamically broken platforms; a full twenty-minute rendered soak with heap/GPU profiling; precise 1080p performance on target hardware; campaign difficulty balance; all motion/gore comfort settings with user playtests; full visual fidelity and original-game move-tree parity.

See `IMPLEMENTATION.md` for the production gaps. Passing these tests does not imply the full design acceptance standard has been met.
