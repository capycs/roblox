--!strict
-- Boss fight data. The model is a normal creature (CreatureConfig, body = "boss"); this is how
-- it fights. Design rules (from boss-design research): every attack has a readable wind-up with
-- a ground telegraph that fills up until the hit, a dodge window, then a recovery the players
-- can punish; phase 2 at half HP adds attacks and speeds up; big hits shake the camera.
--
-- Attack timing is in fractions of the clip (`telegraph` = wind-up end, `hit` = strike frame,
-- `hitEnd` = for sustained attacks like breath). These match the poses in Poses/Boss.luau.
-- Shapes: "circle" (radius around a point), "cone" (angle + range from the head), "ring"
-- (around the boss, radius), "rain" (several circles near players).

export type Attack = {
	clip: string,
	shape: string,
	telegraph: number,
	hit: number,
	hitEnd: number?,
	radius: number?,
	range: number?,
	angle: number?, -- cone width in degrees
	offset: number?, -- circle centre in front of the boss (studs)
	count: number?, -- rain: how many impact circles
	damage: number,
	tick: number?, -- sustained: seconds between damage ticks
	knockback: number?,
	effect: string, -- Effects preset at the strike
	cooldown: number,
	weight: number, -- pick chance
	phase: number, -- minimum phase that uses it
	minRange: number?, maxRange: number?, -- only picked when the target is in this distance band
	shake: number?, -- camera shake strength for players nearby
}

export type Boss = {
	species: string,
	displayName: string,
	element: string,
	hp: number,
	scale: number,
	moveSpeed: number,
	aggroRange: number,
	turnSpeed: number, -- radians/sec while tracking its target
	idleBetween: NumberRange, -- breather between attacks (recovery the players can punish)
	phase2At: number, -- fraction of HP that triggers Enrage
	phase2Speed: number, -- cooldown/idle multiplier in phase 2
	phase2Damage: number,
	mutationLuck: number, -- multiplies Mutations.roll chances for this boss
	aura: string, -- looping Effects preset on the boss
	attacks: { [string]: Attack },
	rewards: { coins: number, gems: number, eggChance: number },
}

local BossConfig = {}

BossConfig.DemoEnabled = true -- spawns the boss at Workspace/BossArena (a Part) if the model exists
BossConfig.TemplateFolder = { "ServerStorage", "Creatures" }
BossConfig.Tag = "Boss"

BossConfig.Bosses = {
	Pyrothrax = {
		species = "Pyrothrax",
		displayName = "Pyrothrax, the Volcano Tyrant",
		element = "Fire",
		hp = 25000,
		scale = 1.6,
		moveSpeed = 9,
		aggroRange = 120,
		turnSpeed = 1.6,
		idleBetween = NumberRange.new(1.4, 2.4),
		phase2At = 0.5,
		phase2Speed = 0.7,
		phase2Damage = 1.25,
		mutationLuck = 25, -- bosses mutate far more often than hatches (1 in 2 for Shiny at luck 25)
		aura = "BossVolcanoAura",
		attacks = {
			Bite = { clip = "Attack", shape = "cone", telegraph = 0.3, hit = 0.42, range = 14, angle = 70, damage = 30, knockback = 30, effect = "FireHit", cooldown = 3, weight = 3, phase = 1, maxRange = 16 },
			FireBreath = { clip = "FireBreath", shape = "cone", telegraph = 0.28, hit = 0.3, hitEnd = 0.85, range = 32, angle = 50, damage = 12, tick = 0.25, effect = "BossFireBreath", cooldown = 9, weight = 3, phase = 1, minRange = 8, maxRange = 34 },
			TailSwipe = { clip = "TailSwipe", shape = "ring", telegraph = 0.38, hit = 0.46, radius = 20, damage = 45, knockback = 70, effect = "BossTailSwipe", cooldown = 7, weight = 2, phase = 1, maxRange = 20, shake = 0.4 },
			Stomp = { clip = "Stomp", shape = "circle", telegraph = 0.44, hit = 0.47, radius = 18, offset = 6, damage = 60, knockback = 50, effect = "BossStomp", cooldown = 8, weight = 2, phase = 1, maxRange = 26, shake = 1.0 },
			Eruption = { clip = "Eruption", shape = "rain", telegraph = 0.34, hit = 0.4, hitEnd = 0.8, radius = 8, count = 8, damage = 55, effect = "BossMeteorImpact", cooldown = 14, weight = 3, phase = 2, shake = 0.6 },
		},
		rewards = { coins = 25000, gems = 150, eggChance = 0.35 },
	},
} :: { [string]: Boss }

-- Fraction-of-clip -> seconds using the creature's clip durations.
function BossConfig.seconds(style: any, clip: string, frac: number): number
	local d = style.dur and style.dur[clip] or 1
	return d * frac
end

return BossConfig
