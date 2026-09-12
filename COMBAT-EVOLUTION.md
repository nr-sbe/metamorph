# Metamorph — proposed combat extensions

These designs are implemented in update 07; see SIGNATURE-ABILITIES.md for current behavior and validation. Keep Prototype 1’s distinct form roles, short recoveries and freedom to switch forms. Undertow remains the crowd-seizure showcase; the other forms should solve different combat problems.

| Form | Proposal | Player payoff and presentation |
|---|---|---|
| Claws | **Faultline** | Drag claws through the street to send a narrow, traveling chain of organic spikes toward the aim point. Launch enemies in sequence; switch to Blade for an aerial finish. Fractures race ahead of rising spikes, with tearing asphalt and a rising crackle. Stagger heavy enemies instead of lifting them automatically. |
| Blade | **Guillotine** | An upward cleave leads into a steerable descending slice through aligned targets. The cut ends in a narrow pavement scar and slices eligible props. Reward angle and positioning with a sharp contact pause, directional reactions and a brief metallic-organic snap. |
| Hammerfists | **Aftershock** | A double-fist impact sends a visible wave along the ground, buckling designated pavement and overturning cars into enemies. Greater drop height strengthens the wave. A compressed first hit, rolling bass and delayed secondary debris impacts give it weight. Keep the wave grounded and block it with solid architecture. |
| Unarmed | **Battering Ram** | Grab a hostile, carry them through nearby enemies in a short shoulder rush, then aim a throw into a wall or vehicle. Allow an early throw or dodge cancel. The victim and environment visibly absorb the force; emphasize cloth movement, body reactions and object impacts rather than a large energy effect. |

## Implementation order

1. Faultline: immediately adds launch-and-switch combinations, building on the current Groundspike.
2. Guillotine: completes that aerial chain and gives Blade a clear precision role.
3. Aftershock: emphasizes city destruction and vehicle collateral; needs reliable damage from moving props.
4. Battering Ram: expands the physical move family; needs a collision-safe carry controller and synchronized paired animation.

## Rules shared by all four

- Tap for primary; full charge triggers the grounded or aerial secondary automatically. Critical Mass remains reserved for Devastators.
- Telegraph the trajectory, keep contact effects brief, and return control promptly. Damage and stagger should stay understandable with gore and shake disabled.
- Use one primary hit per victim per pass. Prevent multiple fragments from multiplying damage without a bound.
- Respect cover, grounded surfaces and heavy-enemy resistance. Clamp travel before walls and ceilings.
- Share the existing bounded debris, blood and sound pools. Favor a clear attack shape over filling the screen with effects.

## Combinations to playtest

- Faultline → air dash → Blade descending slice.
- Aftershock → grab an overturned car → charged throw.
- Battering Ram → throw → Whipfist ranged grab → consume.
- Undertow → switch to Claws as control returns → launch a surviving armored target after its stagger.
