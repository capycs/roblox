--!strict
-- Boss runs. A party stands on a BossRunPortal pad in the lobby, a countdown runs, and they're
-- teleported into their own copy of the boss's lair. The boss stands in the middle guarding its
-- eggs and throws red-circle attacks (BossConfig). Kill it and the eggs unlock: grab them from
-- the nest and carry them out through the exit portal before the cave collapses. Every egg that
-- makes it out fires DungeonService.EggExtracted with the egg's hatch data (BossEggs: leans
-- toward the boss's element and its mutations).
--
-- Runs: Pyrothrax (Fire, PyroLair + PyroGate), Thalassor (Water, TideLair + TideGate).
--
-- Layout positions are studs from the centre of the lair's Floor top, with the lair facing -Z
-- toward its gate (as built in tools/art/props/dungeon.js, LAIR). A lair model can override any
-- of them with a Part or Attachment of the same name: BossSpawn, PlayerSpawn, Exit, EggSpot1..N.

export type Run = {
	displayName: string,
	boss: string, -- BossConfig.Bosses key
	lair: string, -- model in DungeonConfig.LairFolder
	egg: string, -- model in DungeonConfig.EggFolder
	eggCount: number,
	eggScale: number,
	zone: string?, -- AtmosphereConfig preset for the lighting inside
	layout: {
		arenaRadius: number, -- invisible wall ring; boss circles land inside this
		boss: Vector3,
		spawn: Vector3, -- players arrive here, facing the boss
		exit: Vector3,
		exitRadius: number,
		eggs: { Vector3 },
	},
	maxPlayers: number,
	hpPerExtraPlayer: number, -- boss HP x (1 + this x (players - 1))
	maxCarry: number, -- eggs one player can carry at once
	carrySpeed: number, -- walk speed multiplier per egg carried
	dropOnHit: boolean, -- getting hit while carrying drops your eggs
	escapeTime: number, -- seconds to get out after the kill
	collapse: { every: number, radius: number, warn: number, damage: number, effect: string, projectile: { color: Color3, trail: string, size: number? } }, -- falling debris while escaping
	unlockDelay: number, -- seconds after the kill before the eggs can be grabbed (death animation)
}

local DungeonConfig = {}

DungeonConfig.LairFolder = { "ServerStorage", "Dungeons" }
DungeonConfig.EggFolder = { "ServerStorage", "Props", "Eggs" }
DungeonConfig.InstanceOrigin = Vector3.new(0, 3000, 0) -- copies of the lair are built up here, out of sight
DungeonConfig.InstanceSpacing = 400

DungeonConfig.Queue = {
	Tag = "BossRunPortal", -- tag the gate model (or any Part); attribute Run = "<run>" picks the run, else GateRuns by name
	GateRuns = { PyroGate = "Pyrothrax", TideGate = "Thalassor" },
	PadRadius = 8, -- players within this many studs of the portal's pivot join
	Countdown = 10, -- seconds after the first player steps on
	RequeueCooldown = 6, -- seconds before a returning player can join again
}

-- every lair is built on the same plan (tools/art/props/dungeon.js, LAIR)
local LAYOUT = {
	arenaRadius = 50,
	boss = Vector3.new(0, 0, 0),
	spawn = Vector3.new(0, 0, -36),
	exit = Vector3.new(0, 0, -46),
	exitRadius = 6,
	-- the 4th spot is for the Boss Key pass bonus egg
	eggs = { Vector3.new(-3.2, 0.7, 29), Vector3.new(3.2, 0.7, 29.6), Vector3.new(0, 0.7, 33.2), Vector3.new(0, 0.7, 26.6) },
}

DungeonConfig.Runs = {
	Pyrothrax = {
		displayName = "Pyrothrax's Lair",
		boss = "Pyrothrax",
		lair = "PyroLair",
		egg = "EggPyrothrax",
		eggCount = 3,
		eggScale = 1.6,
		zone = "Ember",
		layout = LAYOUT,
		maxPlayers = 4,
		hpPerExtraPlayer = 0.6,
		maxCarry = 3,
		carrySpeed = 0.85,
		dropOnHit = true,
		escapeTime = 45,
		collapse = { every = 1.1, radius = 7, warn = 1.3, damage = 20, effect = "BossMeteorImpact",
			projectile = { color = Color3.fromRGB(255, 120, 40), trail = "BossMeteorTrail", size = 3 } },
		unlockDelay = 2.5,
	},
	Thalassor = {
		displayName = "Thalassor's Sunken Temple",
		boss = "Thalassor",
		lair = "TideLair",
		egg = "EggThalassor",
		eggCount = 3,
		eggScale = 1.6,
		zone = "Tide",
		layout = LAYOUT,
		maxPlayers = 4,
		hpPerExtraPlayer = 0.6,
		maxCarry = 3,
		carrySpeed = 0.85,
		dropOnHit = true,
		escapeTime = 45,
		-- the temple floods: water orbs crash down on red circles while you run
		collapse = { every = 1.1, radius = 7, warn = 1.3, damage = 20, effect = "BossSplashImpact",
			projectile = { color = Color3.fromRGB(110, 220, 255), trail = "BossOrbTrail", size = 3 } },
		unlockDelay = 2.5,
	},
} :: { [string]: Run }

return DungeonConfig
