# Bosses

## Pyrothrax, the Volcano Tyrant (Fire)

A kaiju dragon about 26 studs long at boss scale (the model is 16 studs; `BossConfig.scale` is 1.6).

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

### Design

Built from the usual boss-design rules (sources at the bottom):
- **Every attack telegraphs.** A wind-up pose plays, and at the same time a red shape appears on the ground. An inner fill grows to the edge at the exact moment the hit lands, so the timing reads at a glance, even on a phone (`Fx/Telegraph.luau`).
- **Readable silhouette.** The volcano, horns and wings read from any distance. Each attack has a different body shape: head reared back, coiled sideways, rearing up, crouched low.
- **Recovery windows.** Each clip has a slow recovery after the strike, plus a 1.4 to 2.4 second breather before the next attack. That is the time for players to punish it.
- **Phases.** At 50% HP it plays **Enrage**:
  - it gets 30% faster and hits 25% harder;
  - **Eruption** is unlocked;
  - the volcano smoke and embers nearly double;
  - the HP bar border turns red and shows ENRAGED.
- **Impact.** Every big hit has flashes, shockwaves, debris and distance-scaled camera shake.

### Attacks

Timings are fractions of the clip. They live in `BossConfig.luau` and match the poses in `Poses/Boss.luau`.

| Attack | Clip | Wind-up (telegraph) | Hit | Shape | Damage | Notes |
|---|---|---|---|---|---|---|
| Bite | Attack | 0.39s, head pulls back | 0.55s | cone 14 studs, 70° | 30 + knockback | close range only |
| Fire Breath | FireBreath (3.0s) | 0.84s, rears its head, chest swells | 0.9s to 2.55s | cone 32 studs, 50° | 12 per 0.25s | the head sweeps left and right; the flame stream comes from the Jaw bone |
| Tail Swipe | TailSwipe (1.8s) | 0.68s, coils, tail drawn to one side | 0.83s | ring 20 studs around it | 45 + big knockback | stand far away or jump the tail |
| Stomp | Stomp (2.2s) | 0.97s, rears up on its hind legs, wings spread | 1.03s | circle 18 studs, 6 in front | 60 + knockback | heaviest camera shake |
| Eruption | Eruption (3.2s), phase 2 | 1.1s, crouches and trembles | 1.28s to 2.56s | 8 meteor circles, 8 studs each | 55 each | one meteor targets each player, the rest are random; the circles land in sequence |
| Enrage | Enrage (3.0s) | none | none | none | none | phase change; interrupts whatever it was doing |
| Hurt | Hurt (0.6s) | none | none | none | none | flinch when damaged, at most every 2s |
| Death | Death (3.0s) | none | none | none | none | collapses and holds the last frame; burst of smoke, embers and coins |

### How it runs

- **Server:** `src/server/BossService.luau`.
  - `BossService.spawn("Pyrothrax", cframe)` clones the model from `ServerStorage/Creatures` and prepares it.
  - It then scales it, rolls mutations and starts its brain.
  - The brain turns toward and walks to the nearest player, picks a weighted attack (by phase, cooldown and distance band), and fires the telegraph.
  - It then plays the clip, applies damage at the strike, and waits out the recovery.
  - `BossService.damage(boss, amount, player)` takes damage, plays Hurt, triggers phase 2 and kills it.
  - `BossService.Defeated` fires `(model, species, rewards, topDamager, damageByPlayer)`. Hook rewards in there. Coins are already multiplied by the mutation's coins stat.
- **Client:** `src/client/BossFx.client.luau`. It handles:
  - telegraphs;
  - attack effects;
  - the fire breath stream;
  - falling meteors (a glowing rock with a flame trail drops onto each circle);
  - camera shake;
  - the volcano aura;
  - the boss HP bar at the top of the screen (shown within 120 studs).
- **Demo:** `src/server/BossDemo.server.luau` spawns the boss on a Part named `Workspace/BossArena` and respawns it 20s after it's defeated. To test phase 2 and the death, run this in the command bar: `require(game.ServerScriptService.Server.BossService).damage(workspace.Pyrothrax, 5000)`.
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
