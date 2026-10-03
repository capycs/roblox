# Bosses and boss runs

The game is Haven (hub) plus boss-run dungeons. Each boss has its own lair, lobby gate and egg:

| Boss | Element | Lair | Lobby gate | Egg |
|---|---|---|---|---|
| Pyrothrax, the Volcano Tyrant | Fire | PyroLair (volcanic arena) | PyroGate | EggPyrothrax |
| Thalassor, the Tidal Colossus | Water | TideLair (sunken temple) | TideGate | EggThalassor |

Reworking a place that still has the old maps? See `docs/GAME_REWORK.md`.

## How a boss run works

1. **Queue.** Players stand on a gate's pad in Haven (a PyroGate or TideGate tagged `BossRunPortal`). A 10 second countdown starts with the first player, then the group (up to 4) is sent in together.
2. **Arrive.** Each group gets its own copy of the lair, built out of sight at y = 3000, so several groups can run at once. Players arrive inside the gate, facing the boss. The lighting switches to Ember or Tide.
3. **Fight.** The boss stands on the dark disc in the middle and never moves; it only turns to face its target. Its three eggs sit in the nest behind it, locked. Every attack is red circles on the floor.
4. **Escape.** When it dies, the eggs unlock after its death animation and the lair starts coming down:
   - Hold the prompt on an egg to grab it. Eggs stack on your head, up to 3, and each one slows you down (×0.85 walk speed per egg).
   - Debris falls on red circles around the players, more often around whoever is carrying: rocks in PyroLair, water orbs in TideLair.
   - Get hit while carrying and you drop your eggs where you stand. Anyone can pick them back up.
   - The EXIT marker shows over the portal in the gate. Walk into it to leave with whatever you're carrying.
   - 45 seconds on the clock. When it runs out, anyone still inside is sent back and the eggs they were holding are lost.
5. **Rewards.** Every egg carried out fires `DungeonService.EggExtracted(player, eggName, info)`. `info.egg` is the egg's hatch data: save it with the egg.

If everyone dies during the fight, the run fails and the copy is cleaned up. Boss HP goes up 60% for each extra player.

## Boss eggs hatch toward the boss

`src/shared/Eggs/BossEggs.luau`. A boss egg remembers which boss it came from and what mutations that boss had:
- **Element:** creatures of the boss's element are **4× more likely**. A Pyrothrax egg hatches a Fire creature about 49% of the time; a Thalassor egg hatches Water about 44% of the time.
- **Mutations:** boss eggs roll mutations at 3× luck, and every mutation the boss had gets another **8×**. A Golden Pyrothrax's eggs hatch Golden about 15% of the time, against about 2% from a normal one. The same goes for Rainbow, Void, Crystal, Shiny, Giant and Supercharged bosses.
- **Rarity:** boss eggs skip Common. Weights: Uncommon 10, Rare 38, Epic 30, Legendary 18, Mythic 4, split evenly over the species in each tier before the element boost.

API:
- `BossEggs.data(eggName, bossMutations)` is what DungeonService puts in `info.egg`: `{ egg, element, mutations }`.
- `BossEggs.hatch(eggData, rng)` returns `species, mutations`.
- `BossEggs.odds(eggData)` and `BossEggs.mutationOdds(eggData)` give the real chances, for an "egg chances" panel.
- `Mutations.roll(rng, luck, boost)` takes per-mutation boosts now, and `Mutations.chances(luck, boost)` gives the exact odds.

## Red circles

Every attack puts red circles on the floor. Each circle fills from the middle and reaches its edge at the exact moment the hit lands, then flashes white. Step out before it fills. The animation is timed so the strike lands with the circle. They're drawn with a SurfaceGui, so the edge stays crisp on phones (`Fx/Telegraph.luau`).

Patterns (BossConfig `pattern`):
- `front`: one circle in front of the mouth.
- `self`: one big circle around the boss.
- `targets`: a circle under every player, plus random extras.
- `line`: a line of circles toward a player, landing one after another; `lines` fans out more lines.
- `random`: circles at random spots.
- `ring`: a ring of circles around the boss, sweeping round; more `rings` go further out, offset so there are gaps to slip through.

`warn` is the dodge time in seconds.

Each boss waits 1.6 to 2.8 seconds between attacks (30% less in phase 2). That's the window to hit it.

**Phase 2 at 50% HP:**
- It plays Enrage, attacks come 30% faster and hit 25% harder, and its phase-2 attack unlocks.
- Several attacks add circles.
- Its aura nearly doubles, and the HP bar border turns red with ENRAGED.

## Pyrothrax, the Volcano Tyrant (Fire)

A kaiju dragon about 26 studs long at boss scale (the model is 16 studs; `BossConfig.scale` is 1.6).

**Look**
- Crimson scales under obsidian armour plates, with magma glowing through every seam and down cracks in its flanks, legs and tail.
- An active volcano on its back, with lava drips running down the cone, flames in the crater and four molten rocks orbiting above it (`MagmaOrbit` spinner bone).
- A horned skull, burning eyes, fangs, a glowing throat and molten drool.
- Tattered wings with burning trailing edges, and a spiked tail ending in a molten mace.

**Model:** `assets/creatures/Pyrothrax/Pyrothrax.glb`, 33 bones. Body 19,950 triangles, Magma 5,520, Flame 1,990, Eyes 704, GlowCore 240.

| Attack | Clip | Circles | Warning | Damage |
|---|---|---|---|---|
| Bite | Attack | one (radius 11) in front of its mouth, close range only | 1.0s | 35 + knockback |
| Fire Breath | FireBreath | a line of 7 (radius 6.5) toward a player, landing one after another; **3 lines** in phase 2 | 1.3s, then 0.16s each | 35 each |
| Tail Swipe | TailSwipe | one huge circle (radius 24) around itself, close range only | 1.4s | 45 + big knockback |
| Stomp | Stomp | one (radius 9) under every player; **+3 random** in phase 2 | 1.4s | 50 + knockback |
| Eruption | Eruption, phase 2 | one on every player plus 9 random, each with a falling meteor | 1.3s, then 0.14s each | 55 each |

**PyroLair** (`assets/v2/props/Dungeon/PyroLair`):
- A cracked basalt floor with magma veins, ringed by rock cliffs with lavafalls.
- Obsidian pillars with braziers.
- A dragon-horn gate with a skull keystone and the fire portal exit.
- An obsidian nest on a bed of embers.

## Thalassor, the Tidal Colossus (Water)

A kaiju sea turtle about 26 studs long at boss scale (16-stud model × 1.6).

**Look**
- Deep-teal hex scutes with glowing bioluminescent seams.
- A living coral reef growing on its shell: coral branches, anemones and barnacles.
- A water spout erupting from a reef spire, with four water orbs orbiting it (`TideOrbit` spinner bone).
- A hooked snapping beak with tusks and a coral crown.
- Glowing barbels hanging from its jaw (on the Ear bones).
- Broad flipper feet with claws, and an armoured tail ending in a fan fluke.

**Model:** `assets/creatures/Thalassor/Thalassor.glb`, 27 bones (the quadruped rig without wings). Body 19,904 triangles, Tide 2,320, Water 1,466, Eyes 704, GlowCore 616. It uses the same boss clips as Pyrothrax: the FireBreath pose is its water beam, and the wing parts of the poses do nothing on it.

| Attack | Clip | Circles | Warning | Damage |
|---|---|---|---|---|
| Snap | Attack | one (radius 11) in front of its beak, close range only | 1.0s | 35 + knockback |
| Hydro Beam | FireBreath | a line of 7 (radius 6) toward a player; in phase 2 **an X of 4 lines** | 1.3s, then 0.15s each | 32 each |
| Whirlpool | TailSwipe | a ring of 12 (radius 6.5) 20 studs out, sweeping round; hug the boss or stay far out. **A second ring** 12 studs further in phase 2, offset so there are gaps | 1.4s | 40 + knockback |
| Geyser Slam | Stomp | one (radius 9) under every player plus 1 random; **+4 random** in phase 2 | 1.4s | 50 + knockback |
| Monsoon | Eruption, phase 2 | one on every player plus 10 random, each with a falling water orb | 1.3s, then 0.13s each | 50 each |

HP 28,000. Rewards: 30,000 coins and 180 gems.

**TideLair** (`assets/v2/props/Dungeon/TideLair`):
- A sunken temple on sand: mossy flagstones with glowing tide channels, tide pools and starfish.
- A ring of temple columns, some broken, with clam-shell pearl lamps.
- Coral-crusted cliffs with kelp, and four waterfalls.
- A gate under a stone arch with a golden trident keystone and a water portal exit.
- The nest is a **giant open clam** on a bed of glowing pearls.
- Cliffs and columns are their own `Walls` mesh, which keeps each mesh under 20k triangles.

**TideGate:** a column arch with a trident, a spinning water portal, a sand queue pad with glowing runes, pearl lamps, coral and kelp.

**EggThalassor:** a teal egg of hex scutes with glowing seams, coral growing out of it, a golden band, a pearl crest with a water swirl, and three orbiting droplets.

## Lair layout (both lairs)

1 unit = 1 stud. Positions are set in `DungeonConfig` (shared `LAYOUT`).
- Arena radius 50.
- Boss on the dark disc in the middle, facing the gate. Nest 30 studs behind it.
- Players arrive 36 studs in front of it; the exit is at 46.
- `Floor` is its own mesh and the only part that collides. DungeonService turns collision off on the rest and builds an invisible wall ring at the arena edge (mesh hulls would fill the arena).
- Parts or Attachments named `BossSpawn`, `PlayerSpawn`, `Exit` or `EggSpot1..3` inside a lair override the positions, so another dungeon can be built by hand.

## Mutations on bosses

Bosses roll mutations on spawn with `mutationLuck = 25`, so about half of all spawns are Shiny and the rarer ones show up regularly. The mutation also carries into their eggs (above).

| Mutation | Effect on the boss |
|---|---|
| Golden | +25% damage, ×1.5 coin reward |
| Rainbow | ×2 damage, ×1.5 HP, ×2 coins |
| Void | +60% damage |
| Crystal | +30% damage |
| Giant | 1.5× bigger (on top of boss scale; its circles reach further too), +30% HP |

The HP bar name gets the prefix, for example "Golden Thalassor, the Tidal Colossus". `MutationVisuals.client` swaps its texture and glow and adds the aura, like any creature.

## How it runs

- **Server:**
  - `src/server/DungeonService.luau`: copies of the lair, the party, the eggs, carrying and dropping, the escape timer, falling debris and the exit.
    - `DungeonService.start(runName, players, returnCFrame)` starts a run directly.
    - Events: `EggExtracted(player, eggName, { run, boss, bossMutations, egg })` and `RunEnded(runName, "cleared" | "failed" | "timeout", players, bossRewards)`.
  - `src/server/DungeonPortal.server.luau`: the queue pads (`BossRunPortal` tag; the run comes from the `Run` attribute or the gate's name) and their countdown signs.
  - `src/server/BossService.luau`: the boss.
    - `BossService.spawn(name, cframe, { arena, players, hpMul })`; the boss stands still at `cframe`.
    - `BossService.damage(boss, amount, player)` takes damage, plays Hurt, triggers phase 2 and kills it.
    - `BossService.circle(...)` drops one red circle anywhere (the falling debris uses it).
    - Events: `Defeated(model, species, rewards, topDamager, damageByPlayer)` and `PlayerHit(player, damage, boss)`.
- **Client:**
  - `src/client/BossFx.client.luau`: circles, attack effects, the breath stream from the jaw, falling projectiles (each boss's own: meteors or water orbs), camera shake, the boss aura and the HP bar.
  - `src/client/Dungeon.client.luau`: the run HUD (objective and escape timer, carried eggs, banners). The Haven HUD hides itself during a run.
- **Config:**
  - `BossConfig.luau`: attacks, circles, phases, per-boss effects and projectile.
  - `DungeonConfig.luau`: runs, party size, eggs, carry, timer, debris, gate names.
  - `BossEggs.luau`: egg odds.
- **Testing in Studio:**
  - Stand on a gate's pad. Nothing in the repo damages the boss yet; hook your combat and abilities to `BossService.damage`.
  - To test phase 2 and the escape, run this twice: `require(game.ServerScriptService.Server.BossService).damage(workspace.Thalassor, 14000)` (or `workspace.Pyrothrax`).
- **Animation:** `style.body = "boss"` makes `CreatureAnimation.client` use `Poses/Boss.luau`: the quadruped base clips plus the boss clips. Death holds its last frame.

Sources (boss design): [Spine dev blog: boss fights](https://spine.game/2025/02/spine-development-blog-bosses/), [Wayline: crafting legendary boss battles](https://www.wayline.io/blog/crafting-legendary-boss-battles), [Choost Games: what makes a good boss fight](https://choostgames.com/blog/what-makes-a-good-boss-fight/), [Bugnet: a boss that teaches its own pattern](https://bugnet.io/blog/how-to-design-a-boss-that-teaches-its-own-pattern), [Roblox DevForum: making boss battles correctly](https://devforum.roblox.com/t/making-boss-battles-correctly/861910).
