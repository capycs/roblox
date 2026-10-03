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
	phase2: { [string]: number }?, -- fields that change in phase 2 (more circles, more lines)
	damage: number,
	knockback: number?,
	effect: string, -- Effects preset played at every circle when it lands
	breath: string?, -- looping Effects preset on the jaw while the circles land
	meteor: boolean?, -- a burning rock falls onto each circle
	shake: number?, -- camera shake when a circle lands
	cooldown: number,
	weight: number, -- pick chance
	phase: number, -- minimum phase that uses it
	maxRange: number?, -- only picked when the nearest player is this close
}

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
} :: { [string]: Boss }

return BossConfig
