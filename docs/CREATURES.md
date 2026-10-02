# Eggnappers creatures

16 creatures across 7 elements and 6 rarities. The design data (rarity, description, ability, passive) is in `src/shared/Creatures/CreatureInfo.luau`, which the game reads. This page is the readable version. Cooldowns and power are starting values to tune.

Models: `assets/creatures/<Name>/<Name>.glb`. Animation setup: `src/shared/Creatures/CreatureConfig.luau`. Ability particles: the `effect` preset in `src/shared/Fx/Effects.luau`, with previews in `assets/fx/previews/<Effect>.png`.

Play an ability: `Effects.burst(CreatureInfo.Species[name].ability.effect, creature.PrimaryPart.CFrame)` on the client, or `FxService.play(...)` from the server.

## Common

### Bramblepup (Nature)
A round, leafy puppy with a flower on its head. Follows you everywhere and sneezes pollen when happy.
- **Thorn Burst** (`ThornBurst`, 6s cooldown, 8 stud radius): shakes its leaf collar and fires thorny seeds in a ring. Each seed nicks enemies and sprouts a flower that slows them for 2s.
- Particles: green ground shockwave, a ring of thorn streaks, leaves and petals bursting out.

### Shellsnap (Water)
A stout reef turtle with coral growing on its shell. Slow, stubborn and very hard to knock over.
- **Tidal Shell** (`TidalShell`, 8s, 10 studs): pulls into its shell and spins, sending out a ring-shaped wave that knocks enemies back and soaks them (-20% speed for 3s).
- Particles: flat splash ring, droplets fanning outward, a fast spinning swirl, bubbles.

## Uncommon

### Sparkit (Storm)
A twitchy fox-squirrel with a lightning-bolt tail. Can't sit still for more than a second.
- **Static Dash** (`StaticDash`, 6s): zig-zags forward at blinding speed. Sparks chain from it to up to 3 nearby enemies, each zap weaker than the last.
- Particles: speed lines streaming back, flickering bolts, spark spray. Play it at the start and end of the dash.

### Mossback (Nature)
A sturdy boar wearing a garden of mossy stones and glowing spore flowers on its back.
- **Spore Bloom** (`SporeBloom`, 12s, 12 studs): its back-flowers burst open and release glowing spores that heal you and nearby friendly creatures over 4s.
- Particles: slowly turning rune circle on the ground, pink and green spores floating up, petals.

## Rare

### Tidefin (Water)
A sleek otter-axolotl with glowing gill fronds. Loves rivers, hates being dry.
- **Riptide Spiral** (`RiptideSpiral`, 9s, 10 studs): spins up a whirlpool around itself that drags nearby enemies inward, then bursts in a splash.
- Particles: two counter-rotating whirlpool swirls that shrink inward, rising bubbles, then a splash and droplet burst after 1.1s.

### Blazehorn (Fire)
A woolly lava ram with molten-tipped horns. Its fleece is always slightly smoking.
- **Magma Charge** (`MagmaCharge`, 9s): charges in a straight line leaving burning hoofprints, and ends with a small eruption that launches enemies upward.
- Particles (the eruption at the end): cracked ground, a column of flame, embers and dark rock chunks thrown up and falling back.

### Frostfawn (Ice)
A graceful snow deer with crystal antlers that chime in the wind.
- **Aurora Veil** (`AuroraVeil`, 15s, 10 studs): raises a shimmering aurora that blocks the next hit for you and allies inside it, and slows enemies who walk in.
- Particles: soft teal/violet glow, upright light shafts, drifting snowflakes, twinkles.

## Epic

### Emberfang (Fire)
A young fire wolf. The flame on its tail burns brighter the more excited it gets.
- **Flame Pounce** (`FlamePounce`, 8s, 8 studs): leaps onto a target and lands in a ring of fire that burns nearby enemies for 3s.
- Particles: impact flash, ground shockwave, a ring of flames rolling outward, embers.

### Frostusk (Ice)
A shaggy frost beast with tusks and a back full of ice crystals. Gentle until provoked.
- **Glacier Stomp** (`GlacierStomp`, 10s, 12 studs): rears up and stomps. Ice spikes burst outward in a ring and slow every enemy they hit by 40% for 4s.
- Particles: ice crack decal on the ground, shockwave, ice-shard streaks fanning out, snowflakes.

### Umbrapaw (Shadow)
A shadow panther with a crescent moon on its brow. Moves without a sound.
- **Shade Step** (`ShadeStep`, 7s): melts into a puddle of shadow and reappears behind its target, striking first for bonus damage.
- Particles: a collapsing shadow vortex, wisps, dark smoke, violet embers. Play it where it vanishes and where it reappears.

## Legendary

Legendaries have a passive and moving parts on the model (spinner bones, glow pulse).

### Voltgriff (Storm)
A storm griffin whose feathers crackle with static. Thunder follows wherever it flies.
- **Thunder Dive** (`ThunderDive`, 12s, 10 studs): soars upward, then dives and calls down a lightning strike that stuns everything in a 10-stud circle for 1.5s.
- **Passive, Static Charge:** every third hit zaps a second enemy.
- Particles: giant bolt, white flash, crack and shockwave on the ground, sparks.

### Nyxwing (Shadow)
A young shadow drake wrapped in violet flame. Said to be born from the darkest night of the year.
- **Umbral Veil** (`UmbralVeil`, 14s): wraps itself in shadow and turns nearly invisible for 3s. Its next bite deals double damage.
- **Passive, Night Hunter:** 20% stronger in the Shadow zone and at dusk.
- Particles: dark wisps and smoke closing in, a slow vortex. Set the model's transparency to ~0.8 for the duration.

### Solarion (Fire)
An armoured sun-lion. Its halo turns slowly behind its mane and three fire orbs circle it like small suns.
- **Solar Flare** (`SolarFlare`, 14s, 14 studs): its halo blazes white-hot and fires a beam of sunlight in a line; the three orbiting fire orbs fly out and explode where it hits.
- **Passive, Radiance:** nearby friendly creatures deal 10% more damage.
- Moving parts: `Halo` spins behind the mane, `SunOrbit` carries 3 fire orbs around the body; glow pulses.
- Particles: sun rays, flash, rune circle and shockwave, flames, a shower of embers.

### Glaciarch (Ice)
An armoured frost wyvern with a floating crystal crown and a ring of ice shards orbiting its body.
- **Absolute Zero** (`AbsoluteZero`, 16s, 16 studs): beats its wings to summon a blizzard dome. Enemies inside freeze solid for 2s while its orbiting shards rain down on them.
- **Passive, Frozen Armour:** takes 25% less damage while standing still.
- Moving parts: `FrostOrbit` (ice shards orbiting), `CrownHover` (crown bobbing and turning above the head); wings held half open.
- Particles: huge ice crack, turning rune circle, snowflake storm, blizzard smoke, ice shards.

### Sylvanthorn (Nature)
The ancient forest stag. A living tree grows from its head, spirit wisps circle its branches and a rune ring floats around it.
- **Ancient Grove** (`AncientGrove`, 16s, 16 studs): stamps the ground and a ring of glowing saplings bursts up, rooting enemies in place and healing allies for 5s.
- **Passive, Overgrowth:** you and your creatures slowly regenerate health in grassy areas.
- Moving parts: `WispOrbit` (spirit wisps around the antler tree), `RuneRing` (floating rune ring); glow pulses.
- Particles: rune circle, rising light shafts, leaves and petals bursting up, floating spores.

## Mythic

### Aetherion (Prism)
The Prism Sovereign, a celestial lion-dragon of every element. Three halos spin behind it, six element orbs orbit its body and rune discs turn beneath its paws.
- **Prism Judgement** (`PrismJudgement`, 25s, 22 studs): rises with every halo spinning, fires a beam of each element from its six orbs, then detonates a prismatic nova that hits with all elements at once. Your whole party gets +50% power for 10s.
- **Passive, Sovereign:** counts as every element; immune to knockdown.
- Moving parts: `Halo1-3` spin on different axes, a hovering `Crown`, `ElementOrbit` with 6 element orbs (fire, storm, ice, shadow, water, nature), 4 rune discs under the paws; feathered and crystal wings held open; heavy glow pulse.
- Particles: rainbow sun rays, a rainbow rune circle and nova, then one burst of every element (flames, snowflakes, bolts, wisps, droplets, leaves), then rainbow stars and sparkles.

## Mutations

Rolled at hatch with `Mutations.roll(rng, luck)` on the server, then `Mutations.applyServer(model, muts)`. The client (`MutationVisuals.client`) does the visuals. A creature gets at most one colour mutation, and can also be Giant and/or Supercharged.

| Mutation | Chance | Stats | Look |
|---|---|---|---|
| Shiny | 1 in 50 | power x1.15 | body and glow hue-shifted; white sparkle aura |
| Giant | 1 in 100 | hp x1.3, power x1.15 | 1.5x scale; warm motes and a slow ground ring |
| Golden | 1 in 150 | power x1.25, coins x1.5 | gold body, gold glow; gold sparkles and rising motes |
| Crystal | 1 in 300 | power x1.3, defense x1.5 | pale blue crystal body with a reflective sheen; glints |
| Supercharged | 1 in 400 | ability x1.75 | crackling sparks and small bolts |
| Void | 1 in 500 | power x1.6 | near-black body, violet glow; dark wisps and violet embers |
| Rainbow | 1 in 800 | power x2, coins x2, hp x1.5 | rainbow body, glow cycles through the rainbow; rainbow sparkles and stars |

`luck` multiplies every chance (luck potions, game passes). Combine stats with `Mutations.stat(muts, "power")`.

Colour mutations swap the Body texture. The textures are in `assets/creatures/<Name>/mutations/<Mutation>.png` (80 total, 5 per creature): upload them and paste the IDs into `AssetIds.Mutations`. Before then the glow recolour and auras still work, but the body stays its normal colour. Preview renders: `assets/creatures/<Name>/previews/mut_<Mutation>.png`.

## Triangle budget

Every mesh is under Roblox's 20k-per-MeshPart limit.

| Creature | Body | All meshes | Bones |
|---|---|---|---|
| Bramblepup | 13,628 | 14,556 | 26 |
| Shellsnap | 9,040 | 10,232 | 26 |
| Sparkit | 12,416 | 13,580 | 26 |
| Mossback | 14,768 | 17,572 | 26 |
| Tidefin | 12,148 | 17,520 | 26 |
| Blazehorn | 19,368 | 21,128 | 26 |
| Frostfawn | 11,288 | 12,576 | 26 |
| Emberfang | 15,864 | 21,542 | 26 |
| Frostusk | 15,998 | 17,454 | 26 |
| Umbrapaw | 11,084 | 15,366 | 26 |
| Voltgriff | 19,976 | 21,880 | 32 |
| Nyxwing | 16,636 | 18,918 | 32 |
| Solarion | 18,742 | 25,268 | 28 |
| Glaciarch | 17,176 | 19,980 | 34 |
| Sylvanthorn | 19,844 | 24,296 | 28 |
| Aetherion | 19,816 | 36,524 | 41 |
