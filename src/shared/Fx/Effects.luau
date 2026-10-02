--!strict
-- Custom particle effects. Every emitter uses our own textures from AssetIds.Fx; there
-- are no stock Roblox textures or Sparkles/Fire/Smoke/Explosion objects anywhere.
--
-- Client:  Effects.burst("HatchBurst", cframe, { color = Color3 })   -- one-shot
--          local h = Effects.attach("RarityBeam", part, { color = ... }); h:Stop()  -- looping
-- Server:  require(Fx.FxService).play("Pickup", position, opts)  -- replicates to clients
--
-- Presets mirror the previews in assets/fx/previews (tools/art/fx.js).

local Debris = game:GetService("Debris")
local AssetIds = require(script.Parent.Parent.AssetIds)

local Effects = {}

local ELEMENT_COLORS = {
	Fire = { Color3.fromRGB(255, 211, 107), Color3.fromRGB(255, 94, 20) },
	Storm = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(63, 220, 255) },
	Ice = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(143, 232, 255) },
	Shadow = { Color3.fromRGB(243, 205, 255), Color3.fromRGB(165, 77, 255) },
	Water = { Color3.fromRGB(220, 255, 255), Color3.fromRGB(56, 226, 255) },
	Nature = { Color3.fromRGB(196, 255, 122), Color3.fromRGB(95, 174, 69) },
}
Effects.RarityColors = {
	Common = Color3.fromRGB(201, 194, 180),
	Uncommon = Color3.fromRGB(111, 207, 74),
	Rare = Color3.fromRGB(79, 143, 230),
	Epic = Color3.fromRGB(166, 90, 230),
	Legendary = Color3.fromRGB(242, 179, 61),
	Mythic = Color3.fromRGB(255, 79, 154),
}

type EmitterDef = {
	tex: string,
	count: number?, -- burst count (one-shots)
	rate: number?, -- per second (looping)
	life: NumberRange,
	size: NumberSequence,
	speed: NumberRange?,
	spread: Vector2?,
	accel: Vector3?,
	drag: number?,
	rot: NumberRange?,
	rotSpeed: NumberRange?,
	transparency: NumberSequence?,
	light: number?, -- LightEmission
	colorIndex: number?, -- 1 or 2: which preset colour
	raw: boolean?, -- keep texture colours (leaf, coin)
	face: Enum.ParticleOrientation?,
	shape: Enum.ParticleEmitterShape?,
	shapeSize: Vector3?, -- attachment-relative emission box (uses a part when set)
	flipbook: Enum.ParticleFlipbookLayout?,
	delay: number?,
	emitDir: Enum.NormalId?, -- emit along this face of the host part (wind uses Front)
	squash: NumberSequence?, -- stretch/squash over life (cartoon pop)
	windDrag: boolean?, -- drift with Workspace.GlobalWind (needs drag > 0)
	z: number?, -- ZOffset, draws in front (+) or behind (-) other emitters
	flipOnce: boolean?, -- flipbook plays once over the particle's life (smoke, twinkle)
}

local function seq(...: number): NumberSequence
	local args = { ... }
	local kps = {}
	for k = 1, #args, 2 do
		table.insert(kps, NumberSequenceKeypoint.new(args[k], args[k + 1]))
	end
	return NumberSequence.new(kps)
end
local FADE = seq(0, 0, 0.7, 0.2, 1, 1)
local POP = seq(0, 0, 1, 1)
local FLASH = seq(0, 0, 0.5, 0.4, 1, 1)
local INOUT = seq(0, 1, 0.15, 0, 0.8, 0, 1, 1) -- fade in, hold, fade out
local function grow(a: number, b: number): NumberSequence
	return NumberSequence.new(a, b)
end
-- cartoon pop: overshoot then settle, then shrink away
local function popSize(peak: number): NumberSequence
	return seq(0, peak * 0.3, 0.18, peak * 1.15, 0.35, peak, 1, 0)
end
local STRETCH = seq(0, -0.5, 0.3, 0, 1, 0.3) -- squash tall -> round -> wide
local FLIP = Enum.ParticleFlipbookLayout.Grid4x4
local PERP = Enum.ParticleOrientation.VelocityPerpendicular
local PARA = Enum.ParticleOrientation.VelocityParallel

-- shared building blocks
local function flash(size: number): EmitterDef
	return { tex = "SoftGlow", count = 1, life = NumberRange.new(0.18), size = grow(size * 0.6, size), transparency = FLASH, light = 1, z = 2 }
end
local function impact(size: number, colorIndex: number?): EmitterDef
	return { tex = "ImpactStar", count = 1, life = NumberRange.new(0.22), size = grow(size * 0.4, size), transparency = seq(0, 0, 0.6, 0.2, 1, 1), light = 1, colorIndex = colorIndex or 1, z = 1 }
end
local function ring(size: number, life: number?): EmitterDef
	return { tex = "Shockwave", count = 1, life = NumberRange.new(life or 0.4), size = grow(size * 0.1, size), transparency = POP, light = 1, colorIndex = 2 }
end
local function smoke(count: number, size: number, color: number?): EmitterDef
	return { tex = "SmokeFlipbook", count = count, life = NumberRange.new(0.55, 0.85), size = grow(size * 0.7, size * 1.3), speed = NumberRange.new(3, 7), spread = Vector2.new(180, 180), drag = 4, rotSpeed = NumberRange.new(-40, 40), transparency = seq(0, 0.05, 1, 0.3), flipbook = FLIP, flipOnce = true, colorIndex = color or 1, z = -1 }
end
local function twinkles(count: number, speed: number, size: number): EmitterDef
	return { tex = "SparkleFlipbook", count = count, life = NumberRange.new(0.5, 0.9), size = grow(size, size * 0.6), speed = NumberRange.new(speed * 0.5, speed), spread = Vector2.new(180, 180), drag = 3, transparency = seq(0, 0, 1, 0.1), flipbook = FLIP, flipOnce = true, light = 1, colorIndex = 2 }
end

local PRESETS: { [string]: { colors: { Color3 }?, loop: boolean?, emitters: { EmitterDef }, light: { range: number, brightness: number }? } } = {
	HatchBurst = {
		colors = { Color3.fromRGB(255, 243, 176), Color3.fromRGB(255, 210, 63) },
		light = { range = 26, brightness = 5 },
		emitters = {
			flash(18),
			{ tex = "Rays", count = 1, life = NumberRange.new(1.3), size = seq(0, 3, 0.25, 20, 1, 24), rotSpeed = NumberRange.new(35), transparency = seq(0, 0, 0.6, 0.3, 1, 1), light = 1, z = -2 },
			ring(28, 0.6),
			impact(10, 1),
			twinkles(30, 30, 1.8),
			{ tex = "Star", count = 16, life = NumberRange.new(1, 1.6), size = popSize(1.1), speed = NumberRange.new(12, 22), spread = Vector2.new(70, 70), accel = Vector3.new(0, -26, 0), drag = 0.6, rotSpeed = NumberRange.new(-200, 200), transparency = seq(0, 0, 0.8, 0, 1, 1), light = 0.6, delay = 0.05 },
			smoke(6, 3, 1),
		},
	},
	RarityBeam = {
		loop = true,
		emitters = {
			{ tex = "SparkleFlipbook", rate = 16, life = NumberRange.new(1.2, 1.8), size = grow(1, 0.5), speed = NumberRange.new(4, 9), spread = Vector2.new(12, 12), transparency = INOUT, flipbook = FLIP, flipOnce = true, light = 1 },
			{ tex = "SoftGlow", rate = 3, life = NumberRange.new(1.5), size = grow(4, 6.5), speed = NumberRange.new(0.5), transparency = NumberSequence.new(0.6, 1), light = 1, z = -1 },
			{ tex = "Ring", rate = 1.2, life = NumberRange.new(1.2), size = grow(1, 7), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, transparency = seq(0, 0.2, 1, 1), light = 1 },
		},
	},
	Pickup = {
		colors = { Color3.fromRGB(255, 224, 122), Color3.fromRGB(255, 255, 255) },
		emitters = {
			flash(5),
			{ tex = "Coin", count = 7, life = NumberRange.new(0.7, 0.9), size = popSize(1.2), speed = NumberRange.new(12, 20), spread = Vector2.new(35, 35), accel = Vector3.new(0, -50, 0), rotSpeed = NumberRange.new(-260, 260), transparency = seq(0, 0, 0.8, 0, 1, 1), raw = true },
			twinkles(10, 14, 1.1),
			{ tex = "Ring", count = 1, life = NumberRange.new(0.35), size = grow(0.5, 7), transparency = POP, light = 1, colorIndex = 2 },
		},
	},
	ExtractPortal = {
		loop = true,
		colors = { Color3.fromRGB(230, 255, 255), Color3.fromRGB(95, 240, 255) },
		light = { range = 20, brightness = 3 },
		emitters = {
			{ tex = "Swirl", rate = 1.5, life = NumberRange.new(2), size = grow(10, 12), rotSpeed = NumberRange.new(140), transparency = seq(0, 1, 0.3, 0.2, 1, 1), light = 1, face = PERP, speed = NumberRange.new(0.01), spread = Vector2.zero, colorIndex = 2 },
			{ tex = "RuneCircle", rate = 0.8, life = NumberRange.new(2.5), size = grow(13, 13), rotSpeed = NumberRange.new(-30), transparency = seq(0, 1, 0.3, 0.3, 1, 1), light = 1, face = PERP, speed = NumberRange.new(0.01), spread = Vector2.zero },
			{ tex = "SparkleFlipbook", rate = 22, life = NumberRange.new(1, 1.4), size = grow(1, 0.5), speed = NumberRange.new(8, 14), spread = Vector2.new(15, 15), transparency = INOUT, flipbook = FLIP, flipOnce = true, light = 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(10, 0.2, 10) },
			{ tex = "WindCurl", rate = 2, life = NumberRange.new(0.9, 1.2), size = grow(3, 4), speed = NumberRange.new(10, 14), spread = Vector2.new(10, 10), face = PARA, transparency = INOUT, light = 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(8, 0.2, 8) },
		},
	},
	KnockedDown = {
		loop = true,
		colors = { Color3.fromRGB(255, 224, 122), Color3.fromRGB(255, 210, 63) },
		emitters = {
			{ tex = "Star", rate = 5, life = NumberRange.new(0.9), size = popSize(0.8), speed = NumberRange.new(3), spread = Vector2.new(180, 0), rotSpeed = NumberRange.new(-180, 180), transparency = seq(0, 0, 0.8, 0, 1, 1), light = 0.5 },
			{ tex = "SparkleFlipbook", rate = 4, life = NumberRange.new(0.6), size = grow(0.6, 0.4), speed = NumberRange.new(1, 2), spread = Vector2.new(180, 30), flipbook = FLIP, flipOnce = true, light = 1, colorIndex = 2 },
		},
	},
	Dust = {
		colors = { Color3.fromRGB(226, 210, 184), Color3.fromRGB(190, 170, 140) },
		emitters = {
			smoke(7, 1.8, 1),
			{ tex = "Dust", count = 6, life = NumberRange.new(0.4, 0.6), size = grow(0.5, 0.2), speed = NumberRange.new(6, 12), spread = Vector2.new(80, 10), drag = 3, accel = Vector3.new(0, -20, 0), colorIndex = 2 },
		},
	},
	Dash = {
		colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(220, 240, 255) },
		emitters = {
			{ tex = "SpeedLine", count = 10, life = NumberRange.new(0.25, 0.4), size = grow(2.5, 1), speed = NumberRange.new(30, 50), spread = Vector2.new(25, 25), face = PARA, transparency = FADE, light = 0.5 },
			smoke(4, 1.4, 1),
		},
	},
	GoldShimmer = {
		loop = true,
		colors = { Color3.fromRGB(255, 230, 140), Color3.fromRGB(242, 179, 61) },
		emitters = {
			{ tex = "SparkleFlipbook", rate = 9, life = NumberRange.new(0.6, 1), size = grow(1, 0.8), speed = NumberRange.new(0.3, 1), spread = Vector2.new(180, 180), flipbook = FLIP, flipOnce = true, light = 1, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(5, 4, 6) },
		},
	},
	-- Twinkles on crystals and glowing props: Effects.attach("CrystalGlint", part, { color = ... })
	CrystalGlint = {
		loop = true,
		emitters = {
			{ tex = "SparkleFlipbook", rate = 3, life = NumberRange.new(0.7, 1), size = grow(1.2, 0.9), speed = NumberRange.new(0), flipbook = FLIP, flipOnce = true, light = 1, shape = Enum.ParticleEmitterShape.Box },
		},
	},
	-- Skyship cruising / fast travel: speed lines streaming past (emitDir Back of the host).
	SpeedLines = { loop = true, colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(230, 245, 255) }, emitters = { { tex = "SpeedLine", rate = 25, life = NumberRange.new(0.5, 0.8), size = grow(5, 3), speed = NumberRange.new(60, 90), spread = Vector2.new(3, 3), face = PARA, transparency = INOUT, light = 0.4, emitDir = Enum.NormalId.Back, shape = Enum.ParticleEmitterShape.Box } } },
	-- Biome ambience: attach to a big invisible part over the area.
	BiomeEmbers = { loop = true, colors = ELEMENT_COLORS.Fire, emitters = { { tex = "Ember", rate = 30, life = NumberRange.new(3, 5), size = seq(0, 0, 0.1, 0.45, 1, 0), speed = NumberRange.new(2, 5), spread = Vector2.new(30, 30), accel = Vector3.new(0, 1.5, 0), drag = 0.5, windDrag = true, transparency = FADE, light = 1, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(120, 4, 120) } } },
	BiomeSnow = { loop = true, colors = ELEMENT_COLORS.Ice, emitters = {
		{ tex = "Snowflake", rate = 45, life = NumberRange.new(6, 9), size = grow(0.45, 0.45), speed = NumberRange.new(3, 5), spread = Vector2.new(15, 15), drag = 0.6, windDrag = true, rotSpeed = NumberRange.new(-60, 60), transparency = INOUT, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(140, 2, 140), emitDir = Enum.NormalId.Bottom },
		{ tex = "Mote", rate = 40, life = NumberRange.new(6, 9), size = grow(0.25, 0.25), speed = NumberRange.new(3, 5), spread = Vector2.new(15, 15), drag = 0.6, windDrag = true, transparency = INOUT, light = 0.3, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(140, 2, 140), emitDir = Enum.NormalId.Bottom },
	} },
	BiomeFireflies = { loop = true, colors = { Color3.fromRGB(255, 247, 160), Color3.fromRGB(168, 255, 79) }, emitters = { { tex = "SoftGlow", rate = 10, life = NumberRange.new(4, 6), size = seq(0, 0, 0.2, 0.7, 0.5, 0.35, 0.8, 0.7, 1, 0), speed = NumberRange.new(0.5, 1.5), spread = Vector2.new(180, 180), transparency = NumberSequence.new(0.1), light = 1, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 10, 100) } } },
	BiomeBubbles = { loop = true, colors = ELEMENT_COLORS.Water, emitters = { { tex = "Bubble", rate = 20, life = NumberRange.new(4, 6), size = grow(0.4, 0.8), speed = NumberRange.new(2, 4), spread = Vector2.new(10, 10), squash = seq(0, 0, 0.5, 0.15, 1, -0.1), transparency = INOUT, light = 0.3, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 2, 100) } } },
	BiomeSparks = { loop = true, colors = ELEMENT_COLORS.Storm, emitters = { { tex = "Spark", rate = 15, life = NumberRange.new(0.25, 0.45), size = grow(1.4, 0.2), speed = NumberRange.new(14, 24), spread = Vector2.new(180, 180), drag = 2, transparency = FADE, light = 1, face = PARA, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 20, 100) } } },
	-- Atmosphere: Atmosphere.client keeps these on a box that follows the camera,
	-- facing down-wind (emitDir Front). The big curly swirls are WindSwirls (3D trails).
	Wind = { loop = true, colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(223, 244, 255) }, emitters = {
		{ tex = "WindStreak", rate = 3, life = NumberRange.new(1.2, 1.8), size = grow(5, 7), speed = NumberRange.new(30, 42), spread = Vector2.new(3, 3), transparency = seq(0, 1, 0.3, 0.45, 0.7, 0.55, 1, 1), light = 0.4, face = PARA, emitDir = Enum.NormalId.Front },
		{ tex = "WindCurl", rate = 0.5, life = NumberRange.new(1.1, 1.5), size = grow(6, 7), speed = NumberRange.new(30, 40), spread = Vector2.new(3, 3), transparency = seq(0, 1, 0.3, 0.35, 0.7, 0.45, 1, 1), light = 0.4, face = PARA, emitDir = Enum.NormalId.Front },
	} },
	WindLeaves = { loop = true, emitters = {
		{ tex = "Leaf", rate = 4, life = NumberRange.new(3, 5), size = grow(0.7, 0.7), speed = NumberRange.new(10, 16), spread = Vector2.new(15, 15), accel = Vector3.new(0, -1.5, 0), drag = 0.5, windDrag = true, rotSpeed = NumberRange.new(-220, 220), squash = seq(0, 0, 0.25, 0.6, 0.5, -0.4, 0.75, 0.6, 1, 0), transparency = seq(0, 1, 0.1, 0, 0.85, 0, 1, 1), raw = true, emitDir = Enum.NormalId.Front },
		{ tex = "Petal", rate = 3, life = NumberRange.new(3, 5), size = grow(0.5, 0.5), speed = NumberRange.new(10, 16), spread = Vector2.new(15, 15), accel = Vector3.new(0, -1, 0), drag = 0.5, windDrag = true, rotSpeed = NumberRange.new(-260, 260), squash = seq(0, 0.5, 0.33, -0.5, 0.66, 0.5, 1, -0.5), transparency = seq(0, 1, 0.1, 0, 0.85, 0, 1, 1), raw = true, emitDir = Enum.NormalId.Front },
	} },
	Motes = { loop = true, colors = { Color3.fromRGB(255, 246, 216), Color3.fromRGB(255, 231, 160) }, emitters = { { tex = "Mote", rate = 18, life = NumberRange.new(4, 7), size = seq(0, 0, 0.3, 0.25, 1, 0), speed = NumberRange.new(0.3, 1), spread = Vector2.new(180, 180), drag = 0.3, windDrag = true, transparency = NumberSequence.new(0.2), light = 1 } } },
	Pollen = { loop = true, colors = { Color3.fromRGB(255, 248, 190), Color3.fromRGB(220, 255, 170) }, emitters = { { tex = "Mote", rate = 25, life = NumberRange.new(5, 8), size = grow(0.15, 0.1), speed = NumberRange.new(2, 4), spread = Vector2.new(30, 30), drag = 0.5, windDrag = true, transparency = FADE, light = 0.6, emitDir = Enum.NormalId.Front } } },
	Rain = { loop = true, colors = { Color3.fromRGB(207, 230, 255), Color3.fromRGB(159, 200, 240) }, emitters = { { tex = "Rain", rate = 260, life = NumberRange.new(0.8), size = grow(1.6, 1.6), speed = NumberRange.new(70, 80), spread = Vector2.new(3, 3), transparency = NumberSequence.new(0.35), face = PARA, emitDir = Enum.NormalId.Bottom } } },
	CloudLayer = { loop = true, colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(235, 242, 255) }, emitters = { { tex = "CloudSoft", rate = 2, life = NumberRange.new(30, 40), size = grow(60, 80), speed = NumberRange.new(1, 2), spread = Vector2.new(5, 5), transparency = seq(0, 1, 0.2, 0.15, 0.8, 0.15, 1, 1), rotSpeed = NumberRange.new(-2, 2), emitDir = Enum.NormalId.Front } } },
	FogSheet = { loop = true, colors = { Color3.fromRGB(230, 236, 245), Color3.fromRGB(210, 220, 235) }, emitters = { { tex = "Fog", rate = 3, life = NumberRange.new(10, 14), size = grow(30, 40), speed = NumberRange.new(0.5, 1.5), spread = Vector2.new(180, 0), transparency = seq(0, 1, 0.3, 0.6, 0.7, 0.6, 1, 1) } } },
	Splash = { loop = true, colors = { Color3.fromRGB(230, 250, 255), Color3.fromRGB(180, 235, 255) }, emitters = {
		{ tex = "Splash", rate = 4, life = NumberRange.new(0.6), size = grow(3, 7), transparency = POP, face = PERP, speed = NumberRange.new(0.01), spread = Vector2.zero },
		{ tex = "SmokeFlipbook", rate = 5, life = NumberRange.new(1, 1.4), size = grow(2, 5), speed = NumberRange.new(3, 6), spread = Vector2.new(70, 70), drag = 1, transparency = seq(0, 0.3, 1, 0.6), flipbook = FLIP, flipOnce = true },
		{ tex = "Droplet", rate = 20, life = NumberRange.new(0.6, 0.9), size = grow(0.4, 0.2), speed = NumberRange.new(12, 20), spread = Vector2.new(50, 50), accel = Vector3.new(0, -60, 0), face = PARA, transparency = FADE, colorIndex = 2 },
	} },
	BiomeWisps = { loop = true, colors = ELEMENT_COLORS.Shadow, emitters = { { tex = "Wisp", rate = 12, life = NumberRange.new(3, 5), size = grow(2, 4), speed = NumberRange.new(1, 2), spread = Vector2.new(40, 40), drag = 0.4, windDrag = true, rotSpeed = NumberRange.new(-40, 40), transparency = seq(0, 1, 0.4, 0.5, 1, 1), light = 0.5, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 6, 100) } } },
}

-- One hit preset per element: flash -> comic impact -> element shapes + sparks -> ring -> smoke.
local HITS: { [string]: { EmitterDef } } = {
	Fire = {
		{ tex = "FlameFlipbook", count = 10, life = NumberRange.new(0.45, 0.7), size = popSize(2.2), speed = NumberRange.new(8, 16), spread = Vector2.new(180, 180), drag = 3, accel = Vector3.new(0, 18, 0), flipbook = FLIP, light = 1 },
		{ tex = "Ember", count = 22, life = NumberRange.new(0.6, 1.1), size = grow(0.5, 0.1), speed = NumberRange.new(14, 30), spread = Vector2.new(180, 180), drag = 2.5, accel = Vector3.new(0, 8, 0), light = 1, colorIndex = 2 },
	},
	Storm = {
		{ tex = "Bolt", count = 5, life = NumberRange.new(0.2, 0.3), size = popSize(2.6), speed = NumberRange.new(4, 8), spread = Vector2.new(180, 180), rot = NumberRange.new(-40, 40), transparency = seq(0, 0, 0.5, 0, 0.6, 0.8, 0.7, 0, 1, 1), light = 1 },
		{ tex = "Spark", count = 18, life = NumberRange.new(0.25, 0.4), size = grow(1.6, 0.2), speed = NumberRange.new(26, 44), spread = Vector2.new(180, 180), drag = 5, face = PARA, light = 1, colorIndex = 2 },
	},
	Ice = {
		{ tex = "Snowflake", count = 10, life = NumberRange.new(0.6, 0.9), size = popSize(1.4), speed = NumberRange.new(10, 18), spread = Vector2.new(180, 180), drag = 3, rotSpeed = NumberRange.new(-220, 220), light = 0.6 },
		{ tex = "CrackBurst", count = 1, life = NumberRange.new(0.5), size = grow(4, 7), transparency = seq(0, 0, 0.6, 0.2, 1, 1), light = 1, colorIndex = 2 },
		{ tex = "SparkleFlipbook", count = 12, life = NumberRange.new(0.5, 0.8), size = grow(1, 0.6), speed = NumberRange.new(6, 14), spread = Vector2.new(180, 180), drag = 3, flipbook = FLIP, flipOnce = true, light = 1 },
	},
	Shadow = {
		{ tex = "Wisp", count = 10, life = NumberRange.new(0.6, 1), size = grow(1.5, 3), speed = NumberRange.new(6, 14), spread = Vector2.new(180, 180), drag = 3, rotSpeed = NumberRange.new(-180, 180), transparency = FADE, light = 0.8 },
		{ tex = "Swirl", count = 1, life = NumberRange.new(0.6), size = grow(2, 8), rotSpeed = NumberRange.new(-400), transparency = POP, light = 1, colorIndex = 2 },
		{ tex = "Ember", count = 14, life = NumberRange.new(0.6, 0.9), size = grow(0.45, 0.1), speed = NumberRange.new(8, 20), spread = Vector2.new(180, 180), drag = 2, light = 1, colorIndex = 2 },
	},
	Water = {
		{ tex = "Droplet", count = 16, life = NumberRange.new(0.6, 0.9), size = grow(0.8, 0.4), speed = NumberRange.new(16, 26), spread = Vector2.new(60, 60), accel = Vector3.new(0, -70, 0), face = PARA, light = 0.3 },
		{ tex = "Bubble", count = 10, life = NumberRange.new(0.7, 1.1), size = popSize(0.9), speed = NumberRange.new(4, 10), spread = Vector2.new(180, 180), drag = 2, accel = Vector3.new(0, 6, 0), light = 0.3, colorIndex = 2 },
		{ tex = "Splash", count = 1, life = NumberRange.new(0.45), size = grow(3, 7), transparency = POP, light = 0.5 },
	},
	Nature = {
		{ tex = "Leaf", count = 14, life = NumberRange.new(0.8, 1.2), size = popSize(1.1), speed = NumberRange.new(12, 22), spread = Vector2.new(180, 180), drag = 3, accel = Vector3.new(0, -8, 0), rotSpeed = NumberRange.new(-300, 300), squash = seq(0, 0, 0.3, 0.6, 0.6, -0.4, 1, 0.4), raw = true },
		{ tex = "Petal", count = 8, life = NumberRange.new(0.8, 1.2), size = grow(0.6, 0.6), speed = NumberRange.new(10, 18), spread = Vector2.new(180, 180), drag = 3, accel = Vector3.new(0, -6, 0), rotSpeed = NumberRange.new(-300, 300), raw = true },
		{ tex = "SparkleFlipbook", count = 8, life = NumberRange.new(0.5, 0.8), size = grow(0.9, 0.5), speed = NumberRange.new(6, 12), spread = Vector2.new(180, 180), drag = 3, flipbook = FLIP, flipOnce = true, light = 1 },
	},
}
for element, shapes in HITS do
	local emitters: { EmitterDef } = { flash(7), impact(6, 1), ring(11) }
	for _, e in shapes do
		table.insert(emitters, e)
	end
	local puff = smoke(3, 1.3, 1)
	puff.transparency = seq(0, 0.3, 1, 0.6)
	puff.delay = 0.06
	table.insert(emitters, puff)
	PRESETS[element .. "Hit"] = { colors = ELEMENT_COLORS[element], emitters = emitters }
end
Effects.Presets = PRESETS

local warned: { [string]: boolean } = {}
local function texture(name: string): string?
	local id = AssetIds.get(AssetIds.Fx[name])
	if not id and not warned[name] then
		warned[name] = true
		warn(`[Effects] Fx texture "{name}" has no asset ID yet (src/shared/AssetIds.luau). Skipping it.`)
	end
	return id
end

local function makeEmitter(def: EmitterDef, colors: { Color3 }, color: Color3?): ParticleEmitter?
	local id = texture(def.tex)
	if not id then
		return nil
	end
	local e = Instance.new("ParticleEmitter")
	e.Name = def.tex
	e.Texture = id
	e.Lifetime = def.life
	e.Size = def.size
	e.Speed = def.speed or NumberRange.new(0)
	e.SpreadAngle = def.spread or Vector2.new(180, 180)
	e.Acceleration = def.accel or Vector3.zero
	e.Drag = def.drag or 0
	e.Rotation = def.rot or NumberRange.new(0, 360)
	e.RotSpeed = def.rotSpeed or NumberRange.new(0)
	e.Transparency = def.transparency or FADE
	e.LightEmission = def.light or 0
	e.Orientation = def.face or Enum.ParticleOrientation.FacingCamera
	e.Rate = def.rate or 0
	e.LockedToPart = false
	if def.emitDir then
		e.EmissionDirection = def.emitDir
	end
	if def.flipbook then
		e.FlipbookLayout = def.flipbook
		e.FlipbookMode = if def.flipOnce then Enum.ParticleFlipbookMode.OneShot else Enum.ParticleFlipbookMode.Loop
		e.FlipbookStartRandom = not def.flipOnce
		e.FlipbookFramerate = NumberRange.new(16, 20)
	end
	if def.squash then
		e.Squash = def.squash
	end
	if def.windDrag then
		e.WindAffectsDrag = true
	end
	e.ZOffset = def.z or 0
	if def.shape then
		e.Shape = def.shape
		e.ShapeStyle = Enum.ParticleEmitterShapeStyle.Volume
	end
	if not def.raw then
		local c = color or colors[def.colorIndex or 1] or Color3.new(1, 1, 1)
		e.Color = ColorSequence.new(c)
	end
	return e
end

local function host(target: CFrame | Vector3 | BasePart | Attachment, size: Vector3?): (Instance, Instance?)
	if typeof(target) == "Instance" and (target:IsA("BasePart") or target:IsA("Attachment")) then
		return target, nil
	end
	local cf = if typeof(target) == "CFrame" then target else CFrame.new(target :: Vector3)
	local p = Instance.new("Part")
	p.Name = "FxHost"
	p.Anchored, p.CanCollide, p.CanQuery, p.CanTouch, p.CastShadow = true, false, false, false, false
	p.Transparency = 1
	p.Size = size or Vector3.new(0.2, 0.2, 0.2)
	p.CFrame = cf
	p.Parent = workspace
	return p, p
end

export type Opts = { color: Color3?, scale: number?, duration: number? }

-- One-shot effect. Returns immediately; everything cleans itself up.
function Effects.burst(name: string, target: CFrame | Vector3 | BasePart | Attachment, opts: Opts?)
	local preset = PRESETS[name]
	if not preset then
		warn("[Effects] unknown preset " .. name)
		return
	end
	local o = opts or {}
	local parent, tmp = host(target)
	local longest = 0
	for _, def in preset.emitters do
		local e = makeEmitter(def, preset.colors or { o.color or Color3.new(1, 1, 1) }, if name == "HatchBurst" or name == "RarityBeam" then o.color else nil)
		if e then
			e.Parent = parent
			longest = math.max(longest, def.life.Max + (def.delay or 0))
			task.delay(def.delay or 0, function()
				e:Emit(def.count or 1)
			end)
			Debris:AddItem(e, def.life.Max + (def.delay or 0) + 0.2)
		end
	end
	if preset.light then
		local l = Instance.new("PointLight")
		l.Range, l.Brightness = preset.light.range, preset.light.brightness
		l.Color = o.color or (preset.colors and preset.colors[2]) or Color3.new(1, 1, 1)
		l.Parent = parent
		Debris:AddItem(l, 0.6)
	end
	if tmp then
		Debris:AddItem(tmp, longest + 0.5)
	end
end

export type Handle = { Stop: (self: Handle) -> () }

-- Looping effect attached to a part/attachment (or a temporary host). Call :Stop().
function Effects.attach(name: string, target: CFrame | Vector3 | BasePart | Attachment, opts: Opts?): Handle
	local preset = PRESETS[name]
	assert(preset, "[Effects] unknown preset " .. name)
	local o = opts or {}
	local emitters: { Instance } = {}
	local hosts: { Instance } = {}
	for _, def in preset.emitters do
		local e = makeEmitter(def, preset.colors or { o.color or Color3.new(1, 1, 1) }, o.color)
		if e then
			local parent, tmp = host(target, def.shapeSize)
			if tmp then
				table.insert(hosts, tmp)
			end
			e.Rate = (def.rate or 0) * (o.scale or 1)
			e.Parent = parent
			table.insert(emitters, e)
		end
	end
	local handle = {}
	function handle.Stop(_self)
		for _, e in emitters do
			(e :: ParticleEmitter).Enabled = false
			Debris:AddItem(e, 6)
		end
		for _, h in hosts do
			Debris:AddItem(h, 6)
		end
	end
	if o.duration then
		task.delay(o.duration, function()
			handle:Stop()
		end)
	end
	return handle :: any
end

-- Animated waterfall between two attachments: a scrolling Beam plus splashes at the
-- bottom. Returns a Handle. width in studs.
function Effects.waterfall(top: Attachment, bottom: Attachment, width: number?): Handle
	local beams: { Instance } = {}
	local id = texture("WaterfallStrip")
	if id then
		for i, speed in { 1.6, 2.3 } do
			local b = Instance.new("Beam")
			b.Attachment0, b.Attachment1 = top, bottom
			b.Texture = id
			b.TextureMode = Enum.TextureMode.Wrap
			b.TextureLength = 6
			b.TextureSpeed = speed
			b.Width0, b.Width1 = width or 6, (width or 6) * 1.25
			b.FaceCamera = false
			b.LightEmission = 0.4 * i
			b.Transparency = NumberSequence.new(if i == 1 then 0.1 else 0.45)
			b.Color = ColorSequence.new(Color3.fromRGB(200, 240, 255))
			b.Segments = 12
			b.Parent = top
			table.insert(beams, b)
		end
	end
	local splash = Effects.attach("Splash", bottom)
	local handle = {}
	function handle.Stop(_self)
		splash:Stop()
		for _, b in beams do
			b:Destroy()
		end
	end
	return handle :: any
end

-- Soft god rays: slanted light-shaft Beams hanging from an attachment (e.g. under a
-- cloud gap or in a cave mouth). Returns a Handle.
function Effects.godRays(at: Attachment, opts: { count: number?, length: number?, color: Color3?, width: number? }?): Handle
	local o = opts or {}
	local id = texture("LightShaft")
	local made: { Instance } = {}
	if id then
		for i = 1, o.count or 4 do
			local a1 = Instance.new("Attachment")
			a1.Position = Vector3.new((i - (o.count or 4) / 2) * 3, -(o.length or 30), 6)
			a1.Parent = at.Parent
			local b = Instance.new("Beam")
			b.Attachment0, b.Attachment1 = at, a1
			b.Texture = id
			b.TextureMode = Enum.TextureMode.Stretch
			b.Width0, b.Width1 = o.width or 5, (o.width or 5) * 2.2
			b.LightEmission = 1
			b.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.55), NumberSequenceKeypoint.new(1, 1) })
			b.Color = ColorSequence.new(o.color or Color3.fromRGB(255, 244, 214))
			b.FaceCamera = true
			b.Parent = at
			table.insert(made, b)
			table.insert(made, a1)
		end
	end
	local handle = {}
	function handle.Stop(_self)
		for _, x in made do
			x:Destroy()
		end
	end
	return handle :: any
end

return Effects
