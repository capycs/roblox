--!strict
-- Boss fight data. The model is a normal creature (CreatureConfig, body = "boss"); this is how
-- it fights. Bosses stand still in the middle of their dungeon (see DungeonConfig) and throw
-- attacks. Every attack is a set of red circles on the floor that fill up until the hit: step
-- out of the circle before it fills. Phase 2 at half HP adds circles and attacks faster.
--
-- Timing: `warn` is how long the circles show before they land (the dodge window, in seconds).
-- `hit` is the strike frame of the clip (fraction of it); the clip is started so its strike
-- lines up with the first circle landing. `stagger` lands the circles one after another.
--
-- Circle patterns:
--   "front"    one circle `offset` studs in front of the boss
--   "self"     one big circle centred on the boss (get away from it)
--   "targets"  one circle under every player, plus `extra` random ones in the arena
--   "line"     `count` circles in a line from the boss toward a player (`lines` fans out more)
--   "random"   `count` circles at random spots in the arena
--   "ring"     `count` circles in a ring `distance` studs round the boss (`rings` more rings
--              `ringGap` further out, each offset so there are gaps to slip through)
--
-- Clip names are pose names from Poses/Boss.luau (FireBreath, TailSwipe, Stomp, Eruption):
-- a water boss plays the FireBreath pose for its water beam.

export type Attack = {
	clip: string,
	hit: number,
	warn: number,
	pattern: string,
	radius: number,
	offset: number?, -- front: studs ahead of the boss
	count: number?, -- line/random: circles per line / total
	start: number?, -- line: studs from the boss to the first circle
	spacing: number?, -- line: studs between circles
	lines: number?, -- line: how many lines (fanned out)
	spread: number?, -- line: degrees between lines
	stagger: number?, -- seconds between circles landing
	extra: number?, -- targets: extra random circles
	distance: number?, -- ring: studs from the boss
	rings: number?, -- ring: how many rings
	ringGap: number?, -- ring: studs between rings
	phase2: { [string]: number }?, -- fields that change in phase 2 (more circles, more lines)
	damage: number,
	knockback: number?,
	effect: string, -- Effects preset played at every circle when it lands
	breath: string?, -- looping Effects preset on the jaw while the circles land
	meteor: boolean?, -- the boss's projectile (fx.projectile) falls onto each circle
	shake: number?, -- camera shake when a circle lands
	cooldown: number,
	weight: number, -- pick chance
	phase: number, -- minimum phase that uses it
	maxRange: number?, -- only picked when the nearest player is this close
}

export type Projectile = { color: Color3, trail: string, size: number? }

export type Boss = {
	species: string,
	displayName: string,
	element: string,
	hp: number,
	scale: number,
	aggroRange: number, -- players this close are targeted (the arena radius in a dungeon)
	turnSpeed: number, -- radians/sec turning in place toward its target
	idleBetween: NumberRange, -- breather between attacks (the window to hit it)
	introTime: number, -- seconds of roar before the first attack
	phase2At: number, -- fraction of HP that triggers Enrage
	phase2Speed: number, -- cooldown/idle multiplier in phase 2
	phase2Damage: number,
	mutationLuck: number, -- multiplies Mutations.roll chances for this boss
	aura: string, -- looping Effects preset on the boss
	auraBone: string, -- bone/attachment the aura sits on
	fx: {
		enrage: string, -- Effects preset when phase 2 starts
		death: string, -- Effects preset when it dies
		projectile: Projectile, -- what falls onto `meteor` circles
	},
	attacks: { [string]: Attack },
	rewards: { coins: number, gems: number },
}

local BossConfig = {}

BossConfig.TemplateFolder = { "ServerStorage", "Creatures" }
BossConfig.Tag = "Boss"

BossConfig.Bosses = {
	Pyrothrax = {
		species = "Pyrothrax",
		displayName = "Pyrothrax, the Volcano Tyrant",
		element = "Fire",
		hp = 25000,
		scale = 1.6,
		aggroRange = 54,
		turnSpeed = 2.2,
		idleBetween = NumberRange.new(1.6, 2.6),
		introTime = 3,
		phase2At = 0.5,
		phase2Speed = 0.7,
		phase2Damage = 1.25,
		mutationLuck = 25, -- bosses mutate far more often than hatches (1 in 2 for Shiny at luck 25)
		aura = "BossVolcanoAura",
		auraBone = "MagmaOrbit",
		fx = {
			enrage = "BossEnrage",
			death = "BossDeath",
			projectile = { color = Color3.fromRGB(255, 120, 40), trail = "BossMeteorTrail", size = 3 },
		},
		attacks = {
			-- snaps at whoever is closest
			Bite = { clip = "Attack", hit = 0.42, warn = 1.0, pattern = "front", radius = 11, offset = 15,
				damage = 35, knockback = 45, effect = "FireHit", cooldown = 4, weight = 3, phase = 1, maxRange = 30 },
			-- a line of fire from its mouth toward a player, landing one circle after another; 3 lines in phase 2
			FireBreath = { clip = "FireBreath", hit = 0.3, warn = 1.3, pattern = "line", radius = 6.5, count = 7, start = 12, spacing = 6.5,
				lines = 1, spread = 28, stagger = 0.16, phase2 = { lines = 3 },
				damage = 35, effect = "FireHit", breath = "BossFireBreath", cooldown = 8, weight = 3, phase = 1 },
			-- huge circle around itself: get away
			TailSwipe = { clip = "TailSwipe", hit = 0.46, warn = 1.4, pattern = "self", radius = 24,
				damage = 45, knockback = 85, effect = "BossTailSwipe", shake = 0.5, cooldown = 9, weight = 2, phase = 1, maxRange = 30 },
			-- slams the ground: lava geysers burst under every player (more in phase 2)
			Stomp = { clip = "Stomp", hit = 0.47, warn = 1.4, pattern = "targets", radius = 9, extra = 0, stagger = 0, phase2 = { extra = 3 },
				damage = 50, knockback = 40, effect = "BossStomp", shake = 1.0, cooldown = 7, weight = 3, phase = 1 },
			-- phase 2: meteors rain on every player and all over the arena
			Eruption = { clip = "Eruption", hit = 0.4, warn = 1.3, pattern = "targets", radius = 8, extra = 9, stagger = 0.14, meteor = true,
				damage = 55, knockback = 30, effect = "BossMeteorImpact", shake = 0.6, cooldown = 13, weight = 3, phase = 2 },
		},
		rewards = { coins = 25000, gems = 150 },
	},

	Thalassor = {
		species = "Thalassor",
		displayName = "Thalassor, the Tidal Colossus",
		element = "Water",
		hp = 28000,
		scale = 1.6,
		aggroRange = 54,
		turnSpeed = 1.8,
		idleBetween = NumberRange.new(1.8, 2.8),
		introTime = 3,
		phase2At = 0.5,
		phase2Speed = 0.7,
		phase2Damage = 1.25,
		mutationLuck = 25,
		aura = "BossTideAura",
		auraBone = "TideOrbit",
		fx = {
			enrage = "BossTideEnrage",
			death = "BossTideDeath",
			projectile = { color = Color3.fromRGB(110, 220, 255), trail = "BossOrbTrail", size = 3.2 },
		},
		attacks = {
			-- snaps its beak at whoever is closest
			Snap = { clip = "Attack", hit = 0.42, warn = 1.0, pattern = "front", radius = 11, offset = 15,
				damage = 35, knockback = 45, effect = "WaterHit", cooldown = 4, weight = 3, phase = 1, maxRange = 30 },
			-- water beam: a line of circles toward a player; in phase 2 an X of four beams
			HydroBeam = { clip = "FireBreath", hit = 0.3, warn = 1.3, pattern = "line", radius = 6, count = 7, start = 12, spacing = 6.5,
				lines = 1, spread = 90, stagger = 0.15, phase2 = { lines = 4 },
				damage = 32, effect = "BossSplashImpact", breath = "BossWaterBeam", cooldown = 8, weight = 3, phase = 1 },
			-- whirlpool: a ring of circles round itself, sweeping round; hug the boss or stay far out.
			-- Phase 2 adds a second ring further out, offset so there's a gap to slip through
			Whirlpool = { clip = "TailSwipe", hit = 0.46, warn = 1.4, pattern = "ring", radius = 6.5, count = 12, distance = 20, rings = 1, ringGap = 12,
				stagger = 0.05, phase2 = { rings = 2 },
				damage = 40, knockback = 60, effect = "BossTideSwipe", shake = 0.4, cooldown = 9, weight = 3, phase = 1 },
			-- slams the ground: geysers burst under every player (more in phase 2)
			GeyserSlam = { clip = "Stomp", hit = 0.47, warn = 1.4, pattern = "targets", radius = 9, extra = 1, stagger = 0, phase2 = { extra = 4 },
				damage = 50, knockback = 40, effect = "BossGeyser", shake = 0.9, cooldown = 7, weight = 3, phase = 1 },
			-- phase 2: the spout throws water orbs that rain on every player and all over the arena
			Monsoon = { clip = "Eruption", hit = 0.4, warn = 1.3, pattern = "targets", radius = 8, extra = 10, stagger = 0.13, meteor = true,
				damage = 50, knockback = 30, effect = "BossSplashImpact", shake = 0.5, cooldown = 13, weight = 3, phase = 2 },
		},
		rewards = { coins = 30000, gems = 180 },
	},
} :: { [string]: Boss }

return BossConfig
