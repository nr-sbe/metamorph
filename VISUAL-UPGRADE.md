# Visual upgrade 02

This pass uses free resources only. It replaces major placeholder assets and rendering choices while preserving the combat systems. It is an intermediate art pass; the current-day AAA visual target still requires bespoke character, animation and environment production.

## Changes

- Replaced the untextured mannequin with Quaternius's textured, rigged character base. Preserved facial, normal and roughness textures; retargeted twelve compatible animation clips; added vertex coloration for the dark organic body covering.
- Rebuilt all six form presentations with smooth anatomical lofts, curved claws, a swept blade, layered fists, forearm grafts and a continuous barbed whip. Separate roughness and material responses distinguish keratin, cutting edges and exposed tissue. Generated mutation geometry is batched by parent and material; imported car parts preserve their original geometry.
- Added 2K scanned asphalt, brick and concrete surfaces with normal and roughness maps, HDR image-based lighting, cascaded directional shadows, character shadows, contact shading and multisample antialiasing. High uses contact shading and 2048-pixel cascaded shadows. Performance removes the contact-shading geometry pass, uses 1024-pixel shadows and reduces resolution. Repeated scanned objects use GPU instances.
- Added geometric window recesses, frames, mullions, sills, fire escapes, storefront piers, cornices, curb stones, drains, manholes and hydrants to the near-street environment.
- Imported scanned covered cars, metal trash cans and bags from Poly Haven. Added the free CC-BY Car Concept model with attribution. Parked car art remains attached to the throwable physics objects.
- Added **Visual Study** to the main menu: no encounter pressure, 1–6 to inspect mutations, O to orbit, and WASD to explore. Avoided constructing throwaway crowds when entering this mode or the focused practice encounters.

## Verification and limits

TypeScript checks and the fourteen gameplay/lifecycle checks passed during this pass, including the twenty-simulated-minute reset/Undertow soak. Browser checks cover visual initialization, weapon selection, animation, resource loading, practice/reset and Undertow. The older `VALIDATION.md` records the initial version's historical observations and performance; those numbers are not a certification of this heavier art pass.

The whole scene has not become photorealistic. The character base remains a general-purpose game asset; it needs original sculpted detail, clothing/organic surface work and bespoke mutation animation. Distant architecture and military vehicles still need replacement. General fracture, advanced ragdolls and streaming remain outside this art pass. Do not interpret the additions of PBR, HDR or contact shading as proof of AAA visual quality or the 1080p/60 target being met.

Free assets, sources, licenses and hashes are in `CREDITS.md` and `public/assets/manifest.json`. No purchase is required to run or modify this version.


The rebuilt static package is 82.0 MB uncompressed. All 71 asset-manifest hashes were checked. In the embedded 761 x 791 viewport, High-quality Visual Study reached about 46 fps after instancing. The twenty-enemy scene measured roughly 14–20 fps on High and 18–21 fps on Performance after the slam effects settled. These are local observations, not target-hardware benchmarks; the 1080p/60 target remains unmet. The browser crowd check captured 20 targets, recorded 20 primary slam hits and spent exactly one Critical Mass charge. A repeated real-asset practice reset returned to the same 1,212 scene meshes, 299 materials and one dynamic body; this short check supplements the longer simulation-only lifecycle tests. The final production preview had no new rendering errors; Rapier emits a deprecated-initialization warning.
