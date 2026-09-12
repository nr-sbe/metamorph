# Metamorph — signature abilities update 07

Implemented four specials alongside Undertow, using the existing free local resources.

| Form | Special | Controls and behavior |
|---|---|---|
| Claws | Faultline | Right click / RT, or hold primary for one second. Three branching spike lanes erupt across a 16 m corridor; each victim takes 40 damage and a launch. Control returns after 0.35 s while the wave continues. |
| Blade | Guillotine | Same secondary inputs. A 20-damage rising cleave leads to a 90-damage descending blade cut. Steer at the apex; switch forms or air-dash there to cancel. Air activation skips the launcher. Ceilings limit the rise. |
| Hammerfists | Aftershock | Same secondary inputs. A 100-degree wave travels 14 m, deals 60 damage, and flips eligible cars/barriers. Airborne elbow drops scale to 120 damage and 18 m reach after a 20 m fall. |
| Unarmed | Battering Ram | Grab with F/Y, then secondary while grounded. Rush with the held victim, steer within 45 degrees, and throw at the end. Primary throws early; dodge releases. Empty-handed secondary remains the uppercut. |

All four specials have independent two-second reuse timers and no Critical Mass cost. Held primary still charges an ordinary throw. Undertow retains its cost and input behavior.

## Presentation and implementation

The moves use phase-synchronized poses on the existing rig, launch/fold/recoil/landing/resistance reactions, short material-specific audio layers and music ducking. Faultline uses branching textured organic barbs instead of plain cones. Aftershock uses temporary raised asphalt sections and physical vehicle rotation. Guillotine has a tapered blade wake and narrow ground incisions. Battering Ram maintains a collision-checked player/victim pair.

Traveling waves live independently of the player's motion. Surface paths stop at walls and roof edges and recheck support when moving across damaged platforms. Unstaggered armored enemies resist launches and bosses stay anchored. Player motions use the existing Rapier controller, excluding cosmetic fragments from movement collisions. Unblockable hits interrupt active motions. Reset, death and traversal transitions release captures and clear special effects.

Thrown bodies and objects use swept collision and snapshot their source ownership. All projectiles from one attack share one collateral-hit set: a victim can receive at most one collateral hit, capped at 60 damage, in addition to the move's authored primary damage.

Effects are bounded at 36 organic spike instances, 24 raised pavement instances and eight cutting trails. These cosmetic effects add no rigid bodies. The existing 96 debris-body and 32 dust-plume budgets remain. No new third-party downloads or paid resources were added.

## Play and validation

Press H, then choose a move under Signature Practice. Targets remain passive and the setup provides health/Mass; Battering Ram begins with a held enemy. A parked car is placed in the practice lane to demonstrate Aftershock. Normal encounters remain available from the main menu. The HUD shows the selected secondary and its remaining reuse time.

The 46-test suite passed before final visual refinements. The separate new 20-minute signature attack/reset soak also passed; affected charge, Guillotine, Ram, pose-pool and cleanup paths were rechecked after refinements. Existing Undertow's 20-minute reset soak remains passing. A further reduced-gore test confirms identical damage, displacement and resource use across all four specials. Browser checks covered all four activations, visual poses, effects, hit counts, cooldown labels and uninterrupted controls. Layered Web Audio cues are generated in the running game; subjective speaker/headphone mixing and hardware gamepad feel still need human playtesting.

The visual results remain a browser prototype with procedural poses, not bespoke motion-capture or a full ragdoll system. Dense-city rendering remains below the target 60 fps in this embedded browser. Frame samples are indicative rather than a controlled target-hardware certification; the relative frame-time acceptance threshold is not yet established.


### Indicative browser samples

High-quality WebGPU, same 20-target practice grid, with a five-second warm-up excluded. These samples include active moves and aftermath/idle frames, have different sample counts, and are not a synchronized microbenchmark. They are recorded to expose the current limits rather than certify the acceptance threshold.

| Form | Samples | Median frame | 95th percentile |
|---|---:|---:|---:|
| Undertow | 230 | 66.3 ms | 89.3 ms |
| Faultline | 900 | 40.4 ms | 63.1 ms |
| Guillotine | 531 | 38.8 ms | 57.4 ms |
| Aftershock | 214 | 55.4 ms | 75.2 ms |
| Battering Ram | 900 | 43.6 ms | 61.1 ms |

No sampled new form exceeded Undertow in this pass. Differences in camera framing, animation state and sampling duration mean a controlled repeat is still required to establish the 10% median / 20% tail regression target.

Final browser follow-up: branching Faultline barbs render with the shared dark textured organic material. A Faultline-to-Aftershock sequence produced 40 primary hits and six collateral hits against the passive 20-target grid, without exceeding one collateral hit per target per attack. Twelve signature audio cues fired in that sequence and the browser reported no errors.
