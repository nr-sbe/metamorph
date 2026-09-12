# Mutation redesign 03

The selectable lineup is now Unarmed, Claws, Blade, Hammerfists and Whipfist. Musclemass is removed from keyboard, wheel and gamepad selection. Hammerfists inherits its stronger throws and object-impact bonus.

## Art changes

- Claws: four hooked, ridged talons per hand, a lateral hook, smaller dorsal spurs and narrow honed edges.
- Blade: an asymmetric cutting profile, continuous ivory bevel, raised central ribs and a serrated back. Its ready animation now uses the included Sword_Idle clip.
- Hammerfists: layered impact plates, recessed connective tissue, knuckle keels and backward-facing spurs replace the rounded fists.
- Whipfist: an armored flexor spine with overlapping segments, helical nerve bundles, alternating barbs and a split harpoon head. A 21-bone rig coils at rest and unfurls during attacks. Its four render meshes share the rig; no physical rope simulation is required.
- All mutations use deep-green tissue and lighter green fissures. Morph particles and long-range organic strands use the same green palette. Dark carapace and ivory cutting surfaces provide contrast.
- Free CC0 scanned normal and roughness maps add shell fissures and connective-tissue grain. Geometry has capped tips and smoothed seams; the scanned maps are shared across actors. See CREDITS.md for the source links and licenses.
- Visual Study starts with Whipfist and frames the larger weapons separately. Use 1–5 for forms and O to orbit.

## Verification

The production TypeScript/Vite build and all 16 tests pass. Tests cover combat, the removed sixth shortcut, Hammerfists' heavy throw, the twenty-simulated-minute destruction/reset soak, finite geometry, normalized skin weights, animated bone transforms, and skeleton disposal across form changes. All 75 asset-manifest hashes match the bundled files.

| Mutation | Render meshes | Triangles | Bones |
|---|---:|---:|---:|
| Claws, both hands | 8 | 67,392 | 0 additional |
| Blade | 4 | 28,320 | 0 additional |
| Hammerfists, both hands | 6 | 60,672 | 0 additional |
| Whipfist | 4 | 80,832 | 21 additional |

The new scanned maps add 3.23 MB. This is a focused weapon-art redesign; it does not establish AAA quality for the whole scene or certify the original 1080p/60 performance target. Earlier visual and performance measurements in VISUAL-UPGRADE.md describe the prior build.

The rebuilt static site totals 85.27 MB before HTTP compression.

The production browser check captured 20 targets, applied 20 primary slam hits and spent one Critical Mass charge. The settled crowd measured about 18 fps on High in this embedded viewport; there were no new renderer errors. Rapier continues to emit its existing initialization-deprecation warning.
