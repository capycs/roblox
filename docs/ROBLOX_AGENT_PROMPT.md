# Prompt for the Roblox code agent

Paste everything in the box below into the agent that works inside Roblox Studio. The sections after it are reference material it can read in this repo.

---

```text
You are setting up the art for the Roblox game "Eggnappers" in this place. Everything
(models, textures, particles, icons, sky, and the Luau that drives them) is generated in
the git repo capycs/roblox (branch claude/eloquent-thompson-n0s31k). Your job is to swap
every old/placeholder model in the place for the new ones, wire up textures and effects,
and check it all works. Read docs/ROBLOX_AGENT_PROMPT.md and SETUP.md in the repo first.

RULES
- Keep every model's name exactly as its file name (TreeOak, Voltgriff, ...). The code
  finds parts by name (mesh names inside each model matter too: Body, Glow, Canopy,
  PropL, Flag1, HoverOrb, Halo... never rename children).
- assets/v2 holds the newest props (Zelda-style trees and bushes, restyled clutter, new
  clutter, eggs, 3D icon models, gameplay-system props). When a name exists in both
  assets/props and assets/v2/props (TreeOak, Bush, Bench, Well, ...), ALWAYS use the v2 one.
- Don't edit generated files except to paste asset IDs: src/shared/AssetIds.luau (fill IDs
  only) and src/shared/Props/PropAnimData.luau (never). Gameplay numbers live in config
  modules (CreatureConfig, AtmosphereConfig, SkyshipConfig, ShopCatalog).
- No stock Roblox effects: no Sparkles, Fire, Smoke, Explosion, ForceField, or default
  particle textures. Use src/shared/Fx/Effects.luau presets only.
- Server-authoritative gameplay; visuals (particles, outlines, wind, prop animation) are
  client-only and already written.
- Sync code with Rojo using default.project.json (src/shared -> ReplicatedStorage.Shared,
  src/server -> ServerScriptService.Server, src/client -> StarterPlayerScripts.Client).

STEP 1 - Import the 3D models (Import 3D, scale unit Stud, rotation 0, keep skinning)
- 21 creatures: assets/creatures/<Name>/<Name>.glb -> ServerStorage/Creatures/<Name>
  (Bramblepup, Shellsnap, Shroomtoad, Sparkit, Mossback, Pumpkit, Tidefin, Blazehorn,
  Frostfawn, Glimmoth, Emberfang, Frostusk, Umbrapaw, Geodillo, Voltgriff, Nyxwing,
  Solarion, Glaciarch, Sylvanthorn, Lumenjaw, Aetherion).
  Keep the rig. Legendaries/mythic have extra spinner bones (Halo, SunOrbit, FrostOrbit,
  CrownHover, WispOrbit, RuneRing, Halo1-3, Crown, ElementOrbit, Rune*, Lure, AbyssOrbit) that
  CreatureAnimator spins; they must survive the import.
- v2 props: assets/v2/props/<Category>/<Name>/<Name>.glb -> ServerStorage/Props/<Category>/<Name>
  (categories Nature, Clutter, Eggs, Icons, Systems; full list in the reference below).
  Every v2 GLB has a baked "Idle" clip, and PropAnimation.client animates the same parts
  in code (PropAnimData). Use the code path (it's distance-culled); don't also play the
  baked clip on the same model.
- Skyship: assets/props/Skyship/Skyship/Skyship.glb -> ServerStorage/Props/Skyship
- Ambient critters: Butterfly, Bird (assets/props/Atmosphere/...) ->
  ReplicatedStorage/Props/Ambient
- Every other prop: assets/props/<Category>/<Name>/<Name>.glb -> keep one master copy in
  ServerStorage/Props/<Category>/<Name>; clone those into the map (skip any name v2 has).
  meta.json next to each GLB lists its meshes, triangle counts and animated parts.

STEP 2 - Replace the old models in the map
- Find every existing model in Workspace that is an older version or placeholder of one
  of the props/creatures (same or similar name: "Tree", "OakTree", "Rock1", old
  "Skyship", etc.). Build a mapping table oldName -> new prop name and show it to me
  before replacing anything ambiguous.
- For each one: clone the new master, PivotTo(old:GetPivot()), match its size (use
  Model:ScaleTo so the new bounding-box height matches the old one, unless the old one
  was a crude placeholder - then keep the new model's native scale), parent it where the
  old one was, copy over any Attributes/Tags the old one had, then delete the old one.
  Use ChangeHistoryService so I can undo the whole batch.
- Then run once in the command bar:
    require(game.ReplicatedStorage.Shared.Props.PropSetup).prepareAll(workspace)
    require(game.ReplicatedStorage.Shared.Props.PropSetup).prepareAll(game.ServerStorage.Props)
  This sets glow meshes to Neon, glass to Glass, makes grass/flowers walk-through, tags
  moving props "PropAnim" (client animates them) and tags props "Outline". Eggs bob and
  wobble and 3D icons spin as whole models (PropAnimData.Whole); they get the tag too.

STEP 3 - Upload images and paste their IDs into src/shared/AssetIds.luau
- Asset Manager > Bulk Import, then copy each ID into the matching key:
  assets/fx/textures/*.png (41 particle textures, AssetIds.Fx)
  assets/ui/icons/*.png (55 icons incl. ElementPrism, AssetIds.Icons)
  assets/creatures/<Name>/mutations/<Mutation>.png (105 mutation body textures,
    AssetIds.Mutations[species][mutation])
  assets/textures/<Name>/{color,normal,roughness}.png (14 ground materials, AssetIds.Textures)
  assets/sky/{Day,Dusk}/{Bk,Dn,Ft,Lf,Rt,Up}.png (AssetIds.Sky)
  assets/creatures/<Name>/previews/hero.png (21 portraits, AssetIds.Portraits)
- Optional: assets/v2/icons/*.png are transparent renders of the 3D icon models (coins,
  gems, potions, trophy...) for shop/reward UI. Not wired to any key yet.
- Anything left at rbxassetid://0 is skipped with a warning, so missing IDs show up in
  Output. Fix every "[Effects] Fx texture ... has no asset ID" warning.

STEP 4 - Terrain and buildings textures
- TerrainMaterials.server creates MaterialVariants from AssetIds.Textures and overrides
  the terrain materials (Grass, LeafyGrass, Ground, Mud, Rock, Slate, Sand, Snow, Glacier,
  Basalt, CrackedLava, Cobblestone, WoodPlanks, Pavement). Paint terrain with those base
  materials. Props already carry their own palette texture; don't retexture them.

STEP 5 - Markers and tags
- Workspace/SkyshipDock (Part) where the skyship docks; Workspace/WildsDrop (Part).
- Workspace/Zones/<Preset>: invisible, non-colliding Parts named Haven, Verdant, Ember,
  Frost, Storm, Tide, Shadow covering each area (lighting, sky, ambience, wind swirls).
- Tag every floating/sky island model "SkyIsland" (CollectionService). Anime wind swirls
  spawn over these at random (WindSwirls.client). FloatingIsland and SkyDock props count.
- Tag flower beds "ButterflySpot" and a Part above Haven "BirdCircle".
- Creatures are tagged "Creature" by CreatureSetup automatically.

STEP 6 - Cartoon outlines
- Outlines.client already gives the nearest ~28 tagged models (tags "Creature" and
  "Outline", plus player characters) an outline-only Highlight. Roblox renders at most
  31 Highlights at once, so do NOT add Highlights by hand anywhere else.
- To outline something extra, add the "Outline" tag. Tune colour/count/distance in
  AtmosphereConfig.Outlines. Grass/flowers/reeds/ferns are excluded on purpose.

STEP 7 - Effects (particles)
- Use Effects.burst(name, cframeOrPart, { color = ... }) for one-shots and
  Effects.attach(name, part) for loops on the client; FxService.play(...) from the server.
- Presets: HatchBurst, RarityBeam, Pickup, ExtractPortal, KnockedDown, Dust, Dash,
  GoldShimmer, CrystalGlint, SpeedLines, FireHit, StormHit, IceHit, ShadowHit, WaterHit,
  NatureHit, plus ambient ones the zones run (Wind, WindLeaves, Motes, Pollen, Rain,
  CloudLayer, FogSheet, BiomeEmbers/Snow/Fireflies/Bubbles/Sparks/Wisps, Splash).
- Hook them up: hatching -> HatchBurst + RarityBeam (rarity colour from
  Effects.RarityColors); creature attacks -> <Element>Hit at the target; coin/egg pickup
  -> Pickup; dodge/dash -> Dash; knocked down -> KnockedDown; extraction point ->
  ExtractPortal; Crystal* props -> attach CrystalGlint with the crystal's glow colour;
  skyship travel -> attach SpeedLines to a box part ahead of the ship.
- Waterfalls: Effects.waterfall(topAttachment, bottomAttachment, width).
- Creature abilities: one preset per creature, named in CreatureInfo.Species[name].ability.effect
  (ThornBurst, TidalShell, StaticDash, SporeBloom, RiptideSpiral, MagmaCharge, AuroraVeil,
  FlamePounce, GlacierStomp, ShadeStep, ThunderDive, UmbralVeil, SolarFlare, AbsoluteZero,
  AncientGrove, PrismJudgement, PuffballBounce, LanternPop, DazzleDust, GeodeRoll,
  AbyssalLure). Burst at the creature's PrimaryPart CFrame when it uses
  its ability. Previews: assets/fx/previews/<Name>.png.
- Mutation auras (MutShiny, MutGolden, MutCrystal, MutVoid, MutRainbow, MutGiant,
  MutCharged) are attached automatically by MutationVisuals.client - don't add them by hand.

STEP 7b - Creature data, abilities and mutations (server)
- src/shared/Creatures/CreatureInfo.luau: rarity, element, description, ability
  (name, description, effect, cooldown, power, radius) and passive for all 21. Index order:
  CreatureInfo.Order. Build the hatch tables from it (pick species by egg rarity).
- src/shared/Creatures/Mutations.luau: on hatch, muts = Mutations.roll(rng, luck) then
  Mutations.applyServer(model, muts) after CreatureSetup.prepare. That sets the
  "Mutations" attribute (saved as Mutations.encode(muts)) and scales Giants. Stats:
  Mutations.stat(muts, "power" | "coins" | "hp" | "defense" | "ability").
  Save the mutation string with the pet in the player's data and re-apply on spawn.
- MutationVisuals.client handles textures, glow colour, Rainbow cycling and auras from
  the attribute. The UI hatch reveal takes info.mutations; the Incubators screen
  currently does a demo client roll - replace it with the server result.
- Abilities: implement the gameplay described in each ability.description on the
  server (damage = power x creature stat x Mutations.stat(muts, "ability")), then
  FxService.play the effect preset for everyone nearby.

STEP 7c - Gameplay-system props (assets/v2/props/Systems), suggested wiring
- ZoneGate: zone unlock gate (sign glows). TeleportPortal: zone teleport (ring spins).
- RebirthShrine, EnchantAltar, PetPedestal (pet display), EggCapsule (egg-shop display,
  glass), SpawnPad, VIPRope (VIP area), TradingBooth, PotionShelf, LeaderboardStand
  (put a SurfaceGui on the board), DailyChest, SpinWheel (rotate the Wheel part server-side
  for the result; the idle spin is cosmetic), Hoverboard.
- BreakableCoins/Gems/Chest: farmable breakables; play Pickup on break.
- v2 Eggs (EggCosmic, EggCandy, EggVolcano, ... EggCelestial): world egg stands / shop
  displays; they bob and wobble on their own.

STEP 8 - Check it
- Press Play: creatures walk/run/attack/roar in front of spawn (CreatureDemo); halos,
  orbs and crowns spin on the legendaries/mythic; props animate (propellers, flags,
  swaying trees, rustling ivy, hovering bees, lanterns, eggs wobbling, icons spinning);
  wind swirls curl over tagged islands; outlines show on nearby props and creatures;
  zones change lighting.
- Test mutations: set a creature model's "Mutations" attribute to "Rainbow,Giant" (or
  any of Shiny, Golden, Crystal, Void, Rainbow, Giant, Supercharged) in Studio and check
  texture, glow and aura change.
- Output must have no errors and no missing-asset warnings.
- Check performance with the MicroProfiler and on a phone (Device emulator, low
  graphics): if needed lower AtmosphereConfig.WindSwirls.MaxActive,
  AtmosphereConfig.Outlines.MaxHighlights, or particle rates via Effects.attach opts.scale.
- Report back: what you replaced (old -> new table), anything you couldn't map, any
  warnings left.
```

---

## Reference

### What's in the repo

| Path | What |
|---|---|
| `assets/creatures/<Name>/<Name>.glb` | 21 rigged creatures (skinned, 26-41 bones, baked clips incl. spinners). `previews/` has renders, `mutations/` the mutation textures. See `docs/CREATURES.md`. |
| `assets/props/<Category>/<Name>/<Name>.glb` | 96 original props + `meta.json` (meshes, tris, animated parts, pivots) + `hero.png` |
| `assets/v2/props/<Category>/<Name>/<Name>.glb` | 90 new props, each with a baked `Idle` clip. v2 wins on name clashes. |
| `assets/v2/icons/*.png` | 24 transparent renders of the 3D icon models |
| `assets/textures/<Name>/` | 14 tiling ground materials (color, normal, roughness), `index.json` maps them to terrain materials |
| `assets/fx/textures/*.png` | 41 particle textures (white so they tint; flipbooks are 4x4 grids) |
| `assets/fx/previews/*.png` | animated preview strips of every effect preset (`meta.json` has frame counts) |
| `assets/ui/icons/*.png` | 55 UI icons |
| `assets/sky/{Day,Dusk}/` | skybox faces |
| `src/` | all Luau (Rojo) |
| `tools/art/` | the generators (three.js, run headless). `npm run build/props/textures/fx/icons/sky`, then `npm run prop-anim` and `npm run asset-ids` |

### Props by category

| Category | Count | Props |
|---|---|---|
| Atmosphere | 6 | Bird, Butterfly, CloudLarge, CloudMedium, CloudSmall, FloatingRock |
| Clutter | 17 | BannerPole, Barrel, BarrelGroup, Bench, Bones, BridgeSegment, Campfire, Cart, Crate, CrateStack, FenceSegment, LanternPost, Sack, Signpost, Torch, TreasureChest, Well |
| Eggs | 12 | EggCommon, EggEpic, EggFire, EggIce, EggLegendary, EggMythic, EggNature, EggRare, EggShadow, EggStorm, EggUncommon, EggWater |
| Nature | 21 | Bush, BushBerry, BushFlower, Fern, FlowerPatch, GlowShroom, GrassTuft, GrassTuftSnow, Lilypad, Log, MushroomCluster, Reeds, Stump, TreeBlossom, TreeCrystal, TreeEmber, TreeFrost, TreeOak, TreePalm, TreePine, TreePineSnow |
| Rocks | 18 | BasaltColumns, BoulderMossy, CliffChunk, Coral, CrystalFire, CrystalIce, CrystalNature, CrystalShadow, CrystalStorm, CrystalWater, IceChunk, RockArch, RockLarge, RockMedium, RockMesa, RockSmall, RockSnowy, RockSpire |
| Ruins | 8 | CreatureStatue, Obelisk, RuinArch, RuinPillar, RuinPillarBroken, RuinSteps, RuinWall, RuneStone |
| Shops | 7 | EggShop, GemShop, Incubator, IncubatorStation, IndexKiosk, QuestBoard, UpgradeBooth |
| Skyship | 1 | Skyship |
| Structures | 6 | ExtractionBeacon, FloatingIsland, HavenHouseBlue, HavenHouseRed, HavenWindmill, SkyDock |

### v2 props by category (use these over the originals)

| Category | Count | Props |
|---|---|---|
| Nature | 7 | Bush, BushBerry, BushFlower, TreeBlossom, TreeOak, TreePine, TreePineSnow (Zelda-style leafy canopies; replace the originals) |
| Clutter | 28 | Beehive, Bench, CampTent, ClayPot, ClayPotGroup, FenceSegment, FlowerBed, FlowerPot, GardenArch, HayBale, Haystack, HedgeCorner, HedgeStraight, LanternPost, LeafPile, PicnicSet, Pinwheel, PlanterBox, ProduceCrate, Pumpkins, Scarecrow, SteppingStones, StoneLantern, Topiary, VineCurtain, Well, Wheelbarrow, Woodpile |
| Eggs | 14 | EggCandy, EggCelestial, EggCosmic, EggCrystal, EggDragon, EggForest, EggFrost, EggGoldenHuge, EggOcean, EggRainbow, EggSpooky, EggStorm, EggVoid, EggVolcano |
| Icons | 24 | Bolt3D, ChestRarity, Clover3D, Coin3D, CoinStack, Crown3D, Gem3D, GemPile, GiftBox3D, Heart3D, Hourglass3D, Key3D, Lock3D, Magnet3D, Paw3D, PotionCoins, PotionLuck, PotionPower, PotionSpeed, Scroll3D, Shield3D, Star3D, Ticket3D, Trophy3D |
| Systems | 17 | BreakableChest, BreakableCoins, BreakableGems, DailyChest, EggCapsule, EnchantAltar, Hoverboard, LeaderboardStand, PetPedestal, PotionShelf, RebirthShrine, SpawnPad, SpinWheel, TeleportPortal, TradingBooth, VIPRope, ZoneGate |

### Ground textures -> terrain material

Grass→Grass, GrassLush→LeafyGrass, Dirt→Ground, Mud→Mud, Rock→Rock, Cliff→Slate, Sand→Sand, Snow→Snow, Ice→Glacier, Basalt→Basalt, CrackedLava→CrackedLava, Cobblestone→Cobblestone, WoodPlanks→WoodPlanks, RuinTiles→Pavement

### Client systems already written (src/client)

| Script | Does |
|---|---|
| `CreatureAnimation.client` | drives creature bones (idle/walk/run/attack/roar + springs, spinner bones, glow pulse) |
| `MutationVisuals.client` | mutation textures, glow recolour, Rainbow cycling, Crystal sheen, auras (from the `Mutations` attribute) |
| `PropAnimation.client` | spins propellers/wheels/portal rings, sways trees/grass/ivy, waves flags, swings lanterns and signs, hovers orbs/books/bees, flickers flames, wobbles eggs, spins icons |
| `Atmosphere.client` | per-zone lighting, sky, grade, ambient particles; publishes `Lighting.AtmospherePreset` |
| `WindSwirls.client` | anime wind swirls (3D Trails that curl into loops) over `SkyIsland`-tagged islands |
| `Outlines.client` | outline-only Highlight pool on the nearest `Creature`/`Outline` tagged models |
| `Critters.client` | butterflies and birds |
| `Fx.client` | plays server-requested effects |
| `UIController.client` + `UI/` | HUD, shop, Index, incubators, hatch reveal, expedition HUD (demo data in `UI/State.luau`) |

### Wind swirls

Each gust is 1-3 thin white `Trail`s on attachments under `workspace.Terrain`, moved along a path that drifts with `AtmosphereConfig.Wind.direction`, wobbles, and curls into 0-2 loop-de-loops, then fades (`src/shared/Fx/WindSwirls.luau`). How often and what tint is set per zone (`AtmosphereConfig.Presets.<Zone>.swirls`; remove the field to turn them off in that zone). Global limits are in `AtmosphereConfig.WindSwirls`. They need the `WindTrail` texture ID filled in `AssetIds.Fx`.

### Not verified

None of this has been run inside Roblox Studio yet. The Luau compiles and the creature animation maths matches the previews, but expect small fixes on first run (importer orientation, scale, a property that behaves differently in Studio).
