# Included resources

All downloaded resources are stored locally. `public/assets/manifest.json` records original source URLs, author, license, size and SHA-256 for each downloaded file. `tools/fetch_assets.py` and `tools/fetch_characters.py` record the import procedures.

| Resource | Author / source | License | Use |
|---|---|---|---|
| Universal Animation Library Standard | [Quaternius](https://quaternius.itch.io/universal-animation-library), [glTF mirror by J-Ponzo](https://github.com/J-Ponzo/gltf-universal-animation-library) | CC0 1.0 | Mannequin and movement/combat animations; material and mutation attachments are applied at runtime |
| Asphalt 02 and Concrete Floor 02 | [Poly Haven](https://polyhaven.com/license) | CC0 1.0 | Road and pavement textures; downloaded diffuse, normal and roughness maps |
| Impact Sounds | [Kenney](https://kenney.nl/assets/impact-sounds) | CC0 1.0 | Punches, metal impacts and footsteps; selected wood/generic sounds are also bundled |
| The Insurgent | [Eponasoft / OpenGameArt](https://opengameart.org/content/insurgent) | CC0 1.0 | Background music |
| Barlow and Barlow Condensed | [Jeremy Tribby and contributors / Google Fonts](https://github.com/google/fonts/tree/main/ofl/barlow) | SIL Open Font License 1.1 | Locally hosted interface typography |

The initial version's Quaternius `.gltf` is retained as `organism.gltf` with its binary unmodified. Visual upgrade 02 uses `hero.glb` and twelve clips from `motion.glb` instead. The newer asphalt, concrete, brick and character materials use their roughness maps.

Babylon.js and its glTF loader are Apache-2.0; Rapier is Apache-2.0. TypeScript is Apache-2.0; Vite and tsx are MIT. Package-specific notices remain in their packages and the lockfile pins dependencies. Runtime license notices are copied into `public/assets/licenses` and therefore included in the built game.

Prototype, Spider-Man 2 and God of War are design references only. No proprietary characters, environments, music, game code or extracted assets from those titles are included. MORPH / NYC is an original unofficial prototype, not a licensed sequel.

Reference for the opening's design: [Santa Monica Studio's account of creating the Stranger fight](https://blog.playstation.com/archive/2018/08/16/santa-monica-studio-details-the-epic-creation-of-god-of-wars-unforgettable-stranger-fight). The implementation borrows pacing principles, escalating rival behavior and readable attacks rather than reproducing the scene or its characters.


## Visual upgrade 02 — free resources only

- **Quaternius Universal Base Characters Standard:** textured Superhero Male base, facial features, normal/roughness maps, and compatible Universal Animation Library. Official license: https://quaternius.com/packs/universalbasecharacters.html (CC0). Imported from the public glTF conversion mirror at https://github.com/Seyamalam/blood-league-kickoff/tree/main/public/assets/vendor/quaternius. Original license notice is bundled. The game applies vertex color changes for the organic suit and new procedural weapon attachments; it does not alter the distributed source textures.
- **Poly Haven scans (CC0):** Brick Wall 001, Concrete Wall 008, Metal Plate, Aerial Asphalt 01, Urban Street 02 HDRI, Covered Car, Metal Trash Can and Trashbag. Original diffuse, normal and roughness/ARM textures and model data are stored locally. Metal Plate maps are included for subsequent prop-material work; remaining listed resources are integrated.
- **Original geometry:** curved mutation lofts and tendon meshes, unused sedan body panel experiments, window reveals, fire escapes, storefront details, curb stones, drains and manholes were authored in this project.

No paid assets, subscriptions, proprietary extracted game assets or paid-generation services were used. https://polyhaven.com/license confirms that its downloadable assets may be used and redistributed under CC0.

- **Car Concept** — model and textures by Eric Chadwick / Darmstadt Graphics Group GmbH (2024), original base by Unity Fan. Free under **CC BY 4.0**, with Khronos trademarks excluded. Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept . License: https://creativecommons.org/licenses/by/4.0/ . Runtime adaptations: scale/orientation fit, simplified glass/iridescence and clearcoat-texture rendering, and a blank plate. License and attribution metadata are bundled in `public/assets/licenses`. This is an asset attribution, not an endorsement by its creators.

## Mutation redesign 03

New weapon meshes, capillary details and the articulated Whipfist rig are original project geometry. No extracted Prototype models are used.

- [Brown Leather](https://polyhaven.com/a/brown_leather): 1K OpenGL normal and roughness maps used on connective tissue.
- [Pine Bark](https://polyhaven.com/a/pine_bark): 1K OpenGL normal and roughness maps used for carapace fissures. The original bark color is not used.

Both map sets are free under [Poly Haven's CC0 license](https://polyhaven.com/license). The source URLs, file sizes and SHA-256 hashes are in the asset manifest; `tools/fetch_mutation_surfaces.py` reproduces the imports.

## Interface redesign 04

The five SVG weapon icons, vitality emblem, menu illustration and interface layouts are original project artwork. Persona 5 Royal and NieR: Automata screenshots were studied as visual references only; their artwork is not included in the game. Reference links are recorded in `UI-REDESIGN.md`.


## Metamorph update 05

- **Dark Ambience Loop by Iwan Gabovitch qubodup.net** — [original release](https://opengameart.org/content/dark-ambience-loop), used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The original Ogg is bundled unchanged and loops during gameplay. Playback volume and temporary ducking are applied in code. The prior Eponasoft music remains in the source asset archive but is no longer the default track.
- **Raffaele Picca — raffaelepicca.com** — [GitHub particle and VFX textures](https://github.com/RPicster/Godot-particle-and-vfx-textures), CC0. The 256 px alpha effect_4 texture is tinted in the blood-mist material. Original license bundled at `public/assets/licenses/rpicster-CC0.txt`.
- **ExileGL, Blood Splatter** — [original release](https://opengameart.org/content/blood-splatter), CC0. Original high-resolution PNG, used for bounded ground splatter meshes.
- Original project work: skinned shirt, trousers, pockets, belt and boots derived from the CC0 character mesh; procedural woven fabric texture; Art Deco crown, pier, canopy and sunburst geometry. Boots reuse the credited Poly Haven Brown Leather normal map.

Architecture reference: [Empire State Building architecture and design](https://www.esbnyc.com/about/architecture-design). Control and warning reference: [PlayStation's God of War guide](https://www.playstation.com/en-ca/editorial/the-playstation-guide-to-god-of-war/). These supplied design references, not copied game assets.

Enemy uniforms, protective vests, masks, hoods, helmets and padded gear are original derived geometry made from the already credited CC0 base character. No external costume assets were downloaded.
