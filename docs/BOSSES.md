# Bosses

## Pyrothrax, the Volcano Tyrant (Fire)

A kaiju dragon about 26 studs long at boss scale (the model is 16 studs; `BossConfig.scale` is 1.6). It guards its eggs in the middle of its own lair: players fight it in a boss run, then grab the eggs and run out.

**Look**
- Crimson scales under obsidian armour plates, with magma glowing through every seam and down cracks in its flanks, legs and tail.
- An active volcano on its back, with lava drips running down the cone, flames in the crater and four molten rocks orbiting above it (`MagmaOrbit` spinner bone).
- A horned skull, burning eyes, fangs, a glowing throat and molten drool.
- Tattered wings with burning trailing edges and flame-tipped fingers.
- A spiked tail ending in a molten mace.

**Model:** `assets/creatures/Pyrothrax/Pyrothrax.glb`, 33 bones. Meshes:

| Mesh | Triangles |
|---|---|
| Body | 19,950 |
| Magma | 5,520 |
| Flame | 1,990 |
| Eyes | 704 |
| GlowCore | 240 |

Mutations work like every other creature: `mutations/<Mutation>.png` holds the textures, and `previews/mut_*.png` the renders.

### Boss runs

Bosses only show up in boss runs:
1. **Queue.** Players stand on the pad of a PyroGate tagged `BossRunPortal` in the lobby. A 10 second countdown starts with the first player, then the group (up to 4) is sent in together.
2. **Arrive.** Each group gets its own copy of **PyroLair**, built out of sight at y = 3000, so several groups can run at once. Players arrive inside the gate, facing the boss.
3. **Fight.** Pyrothrax stands on the dark disc in the middle and never moves; it only turns to face its target. Its three eggs sit in the nest behind it, locked. Every attack is red circles on the floor (below).
4. **Escape.** When it dies, the eggs unlock after its death animation and the cave starts collapsing:
   - Hold the prompt on an egg to grab it. Eggs stack on your head, up to 3, and each one slows you down (×0.85 walk speed per egg).
   - Rocks fall on red circles around the players, more often around whoever is carrying.
   - Get hit while carrying and you drop your eggs where you stand. Anyone can pick them back up.
   - The EXIT marker shows over the portal in the gate. Walk into it to leave with whatever you're carrying.
   - 45 seconds on the clock. When it runs out, anyone still inside is sent back and the eggs they were holding are lost.
5. **Rewards.** Every egg carried out fires `DungeonService.EggExtracted(player, "EggPyrothrax", info)`. Hook it to give the egg.

If everyone dies during the fight, the run fails and the copy is cleaned up. Boss HP goes up 60% for each extra player.

### Attacks: red circles

Every attack puts red circles on the floor. Each circle fills from the middle and reaches its edge at the exact moment the hit lands, then flashes white. Step out before it fills. The animation is timed so the strike lands with the circle.

| Attack | Clip | Circles | Warning | Damage | Notes |
|---|---|---|---|---|---|
| Bite | Attack | one circle (radius 11) right in front of its mouth | 1.0s | 35 + knockback | only when someone is within 30 studs |
| Fire Breath | FireBreath | a line of 7 circles (radius 6.5) from its mouth toward a player, landing one after another | 1.3s, then 0.16s each | 35 per circle | fire stream from the jaw; **3 lines** fanned out in phase 2 |
| Tail Swipe | TailSwipe | one huge circle (radius 24) around itself | 1.4s | 45 + big knockback | only when someone is within 30 studs; run away |
| Stomp | Stomp | a circle (radius 9) under every player | 1.4s | 50 + knockback | heaviest camera shake; **3 extra random circles** in phase 2 |
| Eruption | Eruption, phase 2 only | a circle under every player plus 9 random ones across the arena, landing in sequence | 1.3s, then 0.14s each | 55 per circle | a burning meteor falls onto each circle |
| Enrage | Enrage | none | none | none | phase change at 50% HP; interrupts whatever it was doing |
| Hurt | Hurt | none | none | none | flinch when damaged, at most every 2s |
| Death | Death | none | none | none | collapses and holds the last frame; burst of smoke and embers |

It waits 1.6 to 2.6 seconds between attacks (30% less in phase 2). That's the window to hit it.

**Phase 2 at 50% HP:** plays Enrage, attacks come 30% faster and hit 25% harder, Eruption unlocks, Fire Breath and Stomp add circles, the volcano smoke nearly doubles, and the HP bar border turns red with ENRAGED.

Everything is tunable in `src/shared/Creatures/BossConfig.luau` (patterns: `front`, `self`, `targets`, `line`, `random`; `warn` is the dodge time) and `src/shared/Dungeon/DungeonConfig.luau` (party size, eggs, carry limit and slowdown, escape timer, falling rocks).

### Lair layout

`assets/v2/props/Dungeon/PyroLair` (1 unit = 1 stud):
- Arena radius 50: cracked basalt floor with magma veins, ringed by rock cliffs with lavafalls, obsidian pillars with braziers, and a gate with dragon-horn arch, skull keystone and fire portal (the exit).
- Boss on the dark disc in the middle, facing the gate. Nest 30 studs behind it. Players arrive 36 studs in front of it; the exit is at 46.
- `Floor` is its own mesh and the only part that collides. DungeonService turns collision off on the rest and builds an invisible wall ring at the arena edge (mesh hulls would fill the arena).
- Positions are set in `DungeonConfig.layout`. Parts or Attachments named `BossSpawn`, `PlayerSpawn`, `Exit` or `EggSpot1..3` inside the lair override them, so a different dungeon can be built by hand.

**Boss egg:** `assets/v2/props/Eggs/EggPyrothrax`, an obsidian egg with dragon scales, magma cracks, a glowing eye slit, horns, a molten crest and three orbiting ember rocks. It spawns at 1.6× size.

**Lobby gate:** `assets/v2/props/Dungeon/PyroGate`, a rock arch with dragon horns, a spinning fire portal and a rune-circle queue pad. A sign over it shows the run name, players ready and the countdown.

### How it runs

- **Server:**
  - `src/server/DungeonService.luau` runs the boss runs: copies of the lair, the party, the eggs, carrying and dropping, the escape timer, falling rocks and the exit.
    - `DungeonService.start("Pyrothrax", players, returnCFrame)` starts a run directly.
    - Events: `EggExtracted(player, eggName, { run, boss, bossMutations })` and `RunEnded(runName, "cleared" | "failed" | "timeout", players, bossRewards)`.
  - `src/server/DungeonPortal.server.luau` runs the queue pads (`BossRunPortal` tag, optional `Run` attribute) and their countdown signs.
  - `src/server/BossService.luau` runs the boss:
    - `BossService.spawn(name, cframe, { arena, players, hpMul })`; the boss stands still at `cframe`.
    - `BossService.damage(boss, amount, player)` takes damage, plays Hurt, triggers phase 2 and kills it.
    - `BossService.circle(...)` drops one red circle anywhere (used for the falling rocks).
    - Events: `Defeated(model, species, rewards, topDamager, damageByPlayer)` (coins already multiplied by the mutation's coins stat) and `PlayerHit(player, damage, boss)`.
- **Client:**
  - `src/client/BossFx.client.luau`: red circles (`Fx/Telegraph.luau`, drawn with a SurfaceGui so the edge stays crisp on phones), attack effects, the fire breath stream, falling meteors, camera shake, the volcano aura and the boss HP bar.
  - `src/client/Dungeon.client.luau`: run HUD with the objective line and escape timer under the HP bar, a carried-eggs chip, and big banners (run start, lair collapsing, escaped, too slow, knocked out).
- **Testing in Studio:** stand on the gate's pad. Nothing in the repo damages the boss yet (hook your combat/abilities to `BossService.damage`). To test phase 2 and the escape, run this in the command bar twice: `require(game.ServerScriptService.Server.BossService).damage(workspace.Pyrothrax, 14000)`
- **Animation:** `CreatureConfig.Pyrothrax.style.body = "boss"` makes `CreatureAnimation.client` use `Poses/Boss.luau`: the quadruped base clips plus the boss clips. Clips marked `hold` (Death) stay on their last frame.

### Mutations

Bosses roll mutations on spawn with `mutationLuck = 25`, so about half of all spawns are Shiny and the rarer ones show up regularly. Effects of each:

| Mutation | Effect on the boss |
|---|---|
| Golden | +25% damage, ×1.5 coin reward |
| Rainbow | ×2 damage, ×1.5 HP, ×2 coins |
| Void | +60% damage |
| Crystal | +30% damage |
| Giant | 1.5× bigger (on top of boss scale), +30% HP |

The HP bar name gets the prefix, for example "Golden Pyrothrax, the Volcano Tyrant". `MutationVisuals.client` swaps its texture and glow and adds the aura, like any creature.

Sources: [Spine dev blog: boss fights](https://spine.game/2025/02/spine-development-blog-bosses/), [Wayline: crafting legendary boss battles](https://www.wayline.io/blog/crafting-legendary-boss-battles), [Choost Games: what makes a good boss fight](https://choostgames.com/blog/what-makes-a-good-boss-fight/), [Bugnet: a boss that teaches its own pattern](https://bugnet.io/blog/how-to-design-a-boss-that-teaches-its-own-pattern), [Roblox DevForum: making boss battles correctly](https://devforum.roblox.com/t/making-boss-battles-correctly/861910).
