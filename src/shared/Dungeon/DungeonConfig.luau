--!strict
-- Boss runs. A party stands on a BossRunPortal pad in the lobby, a countdown runs, and they're
-- teleported into their own copy of the boss's lair. The boss stands in the middle guarding its
-- eggs and throws red-circle attacks (BossConfig). Kill it and the eggs unlock: grab them from
-- the nest and carry them out through the exit portal before the cave collapses. Every egg that
-- makes it out fires DungeonService.EggExtracted.
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
	collapse: { every: number, radius: number, warn: number, damage: number }, -- falling rocks while escaping
	unlockDelay: number, -- seconds after the kill before the eggs can be grabbed (death animation)
}

local DungeonConfig = {}

DungeonConfig.LairFolder = { "ServerStorage", "Dungeons" }
DungeonConfig.EggFolder = { "ServerStorage", "Props", "Eggs" }
DungeonConfig.InstanceOrigin = Vector3.new(0, 3000, 0) -- copies of the lair are built up here, out of sight
DungeonConfig.InstanceSpacing = 400

DungeonConfig.Queue = {
	Tag = "BossRunPortal", -- tag the PyroGate model (or any Part); attribute Run = "Pyrothrax" picks the run
	PadRadius = 8, -- players within this many studs of the portal's pivot join
	Countdown = 10, -- seconds after the first player steps on
	RequeueCooldown = 6, -- seconds before a returning player can join again
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
		layout = {
			arenaRadius = 50,
			boss = Vector3.new(0, 0, 0),
			spawn = Vector3.new(0, 0, -36),
			exit = Vector3.new(0, 0, -46),
			exitRadius = 6,
			eggs = { Vector3.new(-3.2, 0.7, 29), Vector3.new(3.2, 0.7, 29.6), Vector3.new(0, 0.7, 33.2) },
		},
		maxPlayers = 4,
		hpPerExtraPlayer = 0.6,
		maxCarry = 3,
		carrySpeed = 0.85,
		dropOnHit = true,
		escapeTime = 45,
		collapse = { every = 1.1, radius = 7, warn = 1.3, damage = 20 },
		unlockDelay = 2.5,
	},
} :: { [string]: Run }

return DungeonConfig
