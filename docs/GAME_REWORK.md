# Game rework: boss runs replace the old maps

Eggnappers is moving to **Haven as the hub plus boss-run dungeons**. The old open maps (the Wilds zones the skyship flew to, the expedition areas) go away. Players hatch, shop and manage pets in Haven, then walk onto a dungeon gate to fight a boss, grab its eggs and run out.

What the repo already does (branch `claude/eloquent-thompson-n0s31k`):
- **Two boss runs**:
  - **Pyrothrax's Lair** (Fire): `PyroLair`, `PyroGate`, `EggPyrothrax`.
  - **Thalassor's Sunken Temple** (Water): `TideLair`, `TideGate`, `EggThalassor`.
- **The run itself**: each party gets its own copy of the lair. The boss stands still and throws red-circle attacks. After the kill, players grab the eggs, carry them out, and dodge falling debris on a timer. The code is `DungeonService`, `DungeonPortal.server`, `BossService`, `BossFx.client` and `Dungeon.client`.
- **Boss eggs hatch toward the boss**: creatures of the boss's element are 4× more likely, and every mutation the boss had is 8× more likely (`src/shared/Eggs/BossEggs.luau`). A Golden Pyrothrax drops eggs that hatch Golden about 15% of the time, against about 2% from a normal one. About half of Pyrothrax eggs hatch Fire creatures, and about 45% of Thalassor eggs hatch Water ones.
- **Old systems switched off in code**:
  - The skyship is off (`SkyshipConfig.Enabled = false`).
  - The expedition HUD and skyship timer screens are deleted.
  - The shop's "expedition only" egg is now "boss run only".
  - The Haven HUD hides itself during a run.

What can't be done from the repo: **the place file**. The old maps, any scripts that only live in the place, the hub layout, and connecting your data and combat systems. That's the prompt below.

---

## Prompt for Claude in Roblox Studio

Paste everything in the box into the Claude agent that works inside Studio (with Studio/MCP access to the open place).

```text
You are reworking the Roblox game "Eggnappers" in the open place. The game is becoming
"Haven hub + boss-run dungeons": the old open maps are removed and replaced by dungeon gates
in Haven. All art and code come from the git repo capycs/roblox, branch
claude/eloquent-thompson-n0s31k. Read these in the repo before touching anything:
docs/GAME_REWORK.md (this plan), docs/BOSSES.md (boss runs), SETUP.md and
docs/ROBLOX_AGENT_PROMPT.md (how to import every asset).

HARD RULES
- Nothing gets destroyed until I confirm. "Remove" means: move it into
  ServerStorage/_OldMaps_Backup (keep the folder structure), and record each removal with
  ChangeHistoryService so I can undo it. I'll tell you when to delete the backup for good.
- Before step 2, save a backup copy of the place (File > Save to File As, name it
  "Eggnappers_before_rework.rbxl") and tell me where it is. If you can't save files, stop and
  ask me to do it.
- Keep every model's name exactly as its file name (PyroLair, TideGate, Thalassor...). The code
  finds things by name: lair mesh "Floor", glow meshes, bone names. Never rename children.
- Code comes from Rojo (default.project.json). Don't hand-edit scripts that Rojo syncs. Only paste
  asset IDs into src/shared/AssetIds.luau. Gameplay numbers live in the config modules
  (BossConfig, DungeonConfig, CreatureConfig, AtmosphereConfig, ShopCatalog).
- No stock Roblox effects (Sparkles, Fire, Smoke, Explosion, ForceField, default particle
  textures). Effects come from src/shared/Fx/Effects.luau presets only.
- Server-authoritative: the client never decides damage, eggs or rewards.
- Show me a plan or table and wait for my OK at every point marked [CONFIRM].

STEP 1 - Audit (read only, change nothing)
Make one table of everything in the place, with columns: Path | What it is | Keep / Remove /
Unsure | Why.
- Every top-level child of Workspace (maps, zones, islands, spawn areas, markers).
- Lighting children, Workspace/Zones parts, ServerScriptService, StarterPlayerScripts,
  StarterGui, ReplicatedStorage, ServerStorage.
- Mark as REMOVE anything that only exists for the old maps:
  * the Wilds / expedition areas and their terrain regions (Verdant, Ember, Frost, Storm, Tide,
    Shadow zones and the maps inside them)
  * Workspace/WildsDrop, Workspace/SkyshipDock and the flying Skyship
  * any place-only scripts or GUIs for expeditions, the skyship ferry, extraction points or
    wild-area spawners (scripts that are NOT synced from the repo)
  * Workspace/BossArena (old boss test marker, no longer used)
- Mark as KEEP: Haven (spawn, shops, incubators, Index kiosk, quest board, decoration),
  Workspace/Zones/Haven, anything Rojo syncs, player data / DataStore scripts, monetisation
  scripts, and anything you aren't sure about (put those in Unsure and ask).
- Terrain: say which terrain regions belong to the old maps (rough bounding boxes) so I can
  decide whether to clear them.
[CONFIRM] Show me the table. Do nothing else until I say go.

STEP 2 - Remove the old maps (after my OK)
- Move everything marked REMOVE into ServerStorage/_OldMaps_Backup/<original parent path>.
- Disable (Enabled = false) any place-only script you moved, so nothing runs from the backup.
- Old-map terrain: only after I confirm, clear it with Terrain:FillBlock(cframe, size,
  Enum.Material.Air) region by region. Never touch Haven's terrain.
- Workspace/Zones: keep the Haven part only. The dungeons make their own Ember/Tide zones when a
  run starts.
- Play once: no errors in Output about missing maps, WildsDrop, SkyshipDock or the skyship.
  The skyship script exits quietly because SkyshipConfig.Enabled is false.

STEP 3 - Import the new boss-run assets
(Import 3D, scale unit Stud, rotation 0, keep skinning; same as docs/ROBLOX_AGENT_PROMPT.md STEP 1)
- assets/creatures/Pyrothrax/Pyrothrax.glb  -> ServerStorage/Creatures/Pyrothrax
- assets/creatures/Thalassor/Thalassor.glb  -> ServerStorage/Creatures/Thalassor
  (bosses; 33 and 27 bones, keep the rig incl. MagmaOrbit / TideOrbit)
- assets/v2/props/Dungeon/PyroLair/PyroLair.glb -> ServerStorage/Dungeons/PyroLair
- assets/v2/props/Dungeon/TideLair/TideLair.glb -> ServerStorage/Dungeons/TideLair
  ("Floor" must stay its own MeshPart; TideLair also has a "Walls" mesh)
- assets/v2/props/Eggs/EggPyrothrax and EggThalassor -> ServerStorage/Props/Eggs/<name>
- assets/v2/props/Dungeon/PyroGate and TideGate -> keep master copies in ServerStorage/Props/Dungeon
- Run in the command bar:
    require(game.ReplicatedStorage.Shared.Props.PropSetup).prepareAll(game.ServerStorage)
- Upload the new images and paste their IDs into src/shared/AssetIds.luau (through the repo/Rojo,
  or tell me the IDs and I'll commit them): assets/creatures/Thalassor/previews/hero.png
  (Portraits.Thalassor), assets/creatures/Pyrothrax and Thalassor mutations/*.png
  (Mutations.Pyrothrax / Mutations.Thalassor).

STEP 4 - Build the hub: a "Boss Gates" plaza in Haven
[CONFIRM] First propose where the plaza goes (a screenshot or a top-down sketch with
coordinates). It must be reachable in under 15 seconds from spawn, and visible from it.
- Clone PyroGate and TideGate from ServerStorage/Props/Dungeon into the plaza, about 30 studs
  apart, pads facing the path players walk in on. Keep the names PyroGate / TideGate: the queue
  script picks the run from the name (DungeonConfig.Queue.GateRuns).
- Tag both "BossRunPortal" (CollectionService). The queue sign, countdown and teleport are
  automatic. Optional: a child Part named "Return" on each gate sets where players reappear
  after a run; otherwise it's just in front of the pad.
- Leave about 12 studs of clear floor around each pad (players gather there).
- Dress the plaza with existing v2 props (StoneLantern, FlowerBed, LanternPost...). No new
  collision near the pads.
- Point the existing shops, incubators and Index kiosk so the gates are one short walk away.
  Don't move shops unless I agree.
- Run PropSetup.prepareAll(workspace) again after placing props.

STEP 5 - Connect the game systems (server scripts in the place, or tell me what to add to the
repo). Read src/server/DungeonService.luau and src/shared/Eggs/BossEggs.luau first.
- Egg rewards: DungeonService.EggExtracted.Event:Connect(function(player, eggName, info) ...)
  -> add an egg item to the player's inventory/incubator queue and SAVE info.egg with it
  (it carries the egg name, element and the boss's mutations). When it hatches, call
  BossEggs.hatch(eggData, Random.new()) -> species, mutations, then the normal hatch flow
  (Mutations.applyServer, the hatch reveal UI with info.mutations).
- Odds UI (optional): BossEggs.odds(eggData) and BossEggs.mutationOdds(eggData) give the real
  chances for an "egg chances" panel.
- Damage: hook the player's combat and creature abilities to
  BossService.damage(bossModel, amount, player). Bosses are tagged "Boss"; their HP is in the
  HP / MaxHP attributes. Nothing in the repo damages the boss yet.
- Coins/gems: BossService.Defeated (model, species, rewards, topDamager, damageByPlayer) and
  DungeonService.RunEnded (runName, result, players, rewards). Give rewards once per run, to
  players who were in it.
- Shop: the Mythic egg is now "boss run only" (ShopCatalog bossRunOnly). If the place has its
  own shop or expedition code, remove the expedition references the same way.
- If the place has old expedition data fields in DataStore (carried eggs, run timers), stop
  writing them, but don't wipe saved data.
- Turn off the creature demo for live: CreatureConfig.DemoEnabled = false (repo change; tell me).

STEP 6 - Test (Studio playtest, then a 2-player local server test)
For EACH gate (PyroGate, TideGate):
- Stand on the pad: sign shows "<RUN NAME> 1/4 ready - starting in N", teleport at 0.
- In the lair: boss on the dark disc in the middle facing you, 3 eggs in the nest behind it,
  you arrive inside the gate, the Ember / Tide lighting switches on. If the copy is rotated or
  offset, fix the template rotation or add marker Parts (BossSpawn, PlayerSpawn, Exit,
  EggSpot1..3) inside the lair template and tell me.
- Every attack shows red circles that fill before the hit; standing outside never damages you:
  Pyrothrax: Bite, Fire Breath (line), Tail Swipe (big circle), Stomp (under each player),
  Eruption (phase 2 meteors).
  Thalassor: Snap, Hydro Beam (line; an X of 4 lines in phase 2), Whirlpool (ring of circles
  round it, 2 rings in phase 2), Geyser Slam (under each player), Monsoon (phase 2 water orbs).
- Command bar, twice: require(game.ServerScriptService.Server.BossService).damage(workspace.<Boss>, 14000)
  -> phase 2 at half HP (Enrage, HP bar says ENRAGED), then death (holds the pose).
- Eggs unlock, "Grab egg" prompt works on PC and on a phone emulator, eggs stack on your
  head, you slow down, getting hit drops them, the EXIT sign shows, the 45s timer counts down,
  walking into the portal sends you back to the gate with "ESCAPED! N eggs saved", and
  EggExtracted fired with info.egg (print it).
- Let the timer run out once: you're sent back, the eggs you were holding are lost.
- Two runs at the same time (two players on different gates) don't interfere.
- Output has no errors and no "[Effects] Fx texture ... has no asset ID" warnings left.

STEP 7 - Report
Give me: what you moved to the backup, what you deleted (only after my OK), where the gates
are, which systems you connected and how, anything that needed a repo change (exact file +
change), and every problem you couldn't fix. Don't delete ServerStorage/_OldMaps_Backup until
I say so.
```

---

## Why this order

- **Audit before removing:** the repo can't see the place, so the agent has to list what's actually there before deciding what's an old map. Anything unclear gets asked about instead of guessed.
- **Backup folder instead of delete:** the old maps can be brought back with one move if something depended on them, and ChangeHistoryService makes each batch undoable.
- **Hub before systems:** the gates and queue work on their own, so the runs can be played end to end before the inventory and combat hooks exist.
- **Systems last:** egg saving, hatching and boss damage depend on your data and combat code, which only exists in the place.
