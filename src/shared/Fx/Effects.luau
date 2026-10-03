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
	Cosmic = { Color3.fromRGB(255, 236, 170), Color3.fromRGB(134, 120, 255) },
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
	color: Color3?, -- fixed colour for this emitter (overrides the preset colours)
	rainbow: boolean?, -- colour cycles through the rainbow over the particle's life
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
	Cosmic = {
		{ tex = "Star", count = 12, life = NumberRange.new(0.6, 0.9), size = popSize(1.2), speed = NumberRange.new(10, 20), drag = 3, rotSpeed = NumberRange.new(-260, 260), light = 0.8 },
		{ tex = "SparkleFlipbook", count = 14, life = NumberRange.new(0.5, 0.8), size = grow(1, 0.6), speed = NumberRange.new(8, 16), drag = 3, flipbook = FLIP, flipOnce = true, light = 1, colorIndex = 2 },
		{ tex = "Swirl", count = 1, life = NumberRange.new(0.5), size = grow(2, 7), rotSpeed = NumberRange.new(300), transparency = POP, light = 1, colorIndex = 2 },
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
-- ---- creature abilities (CreatureInfo.ability.effect) ----
-- Effects.burst(info.ability.effect, creatureRoot.CFrame). Sizes assume a ~5 stud creature;
-- the burst host sits at the creature's feet/centre. Flat rings lie on the ground (PERP + no speed).
local RING_OUT = Vector2.new(180, 0) -- outward fan, same convention as KnockedDown
local function floor(tex: string, size: number, life: number?, spin: number?, colorIndex: number?): EmitterDef
	return { tex = tex, count = 1, life = NumberRange.new(life or 0.5), size = grow(size * 0.15, size), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(spin or 0), transparency = seq(0, 0.1, 0.6, 0.3, 1, 1), light = 1, colorIndex = colorIndex or 2 }
end
local function rise(tex: string, count: number, size: number, life: number, colorIndex: number?): EmitterDef
	return { tex = tex, count = count, life = NumberRange.new(life * 0.7, life), size = seq(0, 0, 0.2, size, 1, 0), speed = NumberRange.new(2, 6), spread = Vector2.new(60, 60), accel = Vector3.new(0, 3, 0), drag = 1, transparency = INOUT, light = 1, colorIndex = colorIndex or 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(8, 0.2, 8) }
end
local SUN = { Color3.fromRGB(255, 250, 210), Color3.fromRGB(255, 160, 40) }
local AURORA = { Color3.fromRGB(170, 255, 230), Color3.fromRGB(150, 120, 255) }
local SPORE = { Color3.fromRGB(255, 190, 240), Color3.fromRGB(170, 255, 140) }
local LAVA = { Color3.fromRGB(255, 190, 80), Color3.fromRGB(255, 70, 20) }

local ABILITIES: { [string]: { colors: { Color3 }?, light: { range: number, brightness: number }?, emitters: { EmitterDef } } } = {
	-- Common
	ThornBurst = { colors = ELEMENT_COLORS.Nature, emitters = {
		flash(6), floor("Shockwave", 18, 0.45),
		{ tex = "Spark", count = 18, life = NumberRange.new(0.35, 0.5), size = grow(2.2, 0.6), speed = NumberRange.new(30, 42), spread = RING_OUT, drag = 3, face = PARA, light = 0.6, colorIndex = 2 },
		{ tex = "Leaf", count = 10, life = NumberRange.new(0.8, 1.1), size = popSize(1.1), speed = NumberRange.new(14, 22), spread = RING_OUT, drag = 3, accel = Vector3.new(0, -8, 0), rotSpeed = NumberRange.new(-300, 300), raw = true },
		{ tex = "Petal", count = 12, life = NumberRange.new(0.9, 1.3), size = popSize(0.7), speed = NumberRange.new(8, 16), spread = Vector2.new(180, 60), drag = 3, accel = Vector3.new(0, -5, 0), rotSpeed = NumberRange.new(-300, 300), raw = true, delay = 0.1 },
		twinkles(8, 10, 1),
	} },
	TidalShell = { colors = ELEMENT_COLORS.Water, emitters = {
		flash(6), floor("Splash", 20, 0.6), floor("Shockwave", 22, 0.5),
		{ tex = "Droplet", count = 26, life = NumberRange.new(0.6, 0.9), size = grow(0.9, 0.4), speed = NumberRange.new(24, 36), spread = RING_OUT, accel = Vector3.new(0, -60, 0), face = PARA, light = 0.3 },
		{ tex = "Bubble", count = 12, life = NumberRange.new(0.8, 1.2), size = popSize(0.8), speed = NumberRange.new(4, 10), drag = 2, accel = Vector3.new(0, 6, 0), light = 0.3, colorIndex = 2 },
		{ tex = "Swirl", count = 1, life = NumberRange.new(0.5), size = grow(3, 9), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(720), transparency = POP, light = 1, colorIndex = 2 },
	} },
	-- Uncommon
	StaticDash = { colors = ELEMENT_COLORS.Storm, emitters = {
		flash(5), impact(5, 2),
		{ tex = "SpeedLine", count = 12, life = NumberRange.new(0.25, 0.4), size = grow(3, 1), speed = NumberRange.new(36, 56), spread = Vector2.new(20, 20), face = PARA, transparency = FADE, light = 0.6, emitDir = Enum.NormalId.Back },
		{ tex = "Bolt", count = 6, life = NumberRange.new(0.15, 0.25), size = popSize(2.2), speed = NumberRange.new(3, 6), rot = NumberRange.new(-60, 60), transparency = seq(0, 0, 0.5, 0, 0.6, 0.8, 0.7, 0, 1, 1), light = 1 },
		{ tex = "Spark", count = 24, life = NumberRange.new(0.2, 0.35), size = grow(1.4, 0.2), speed = NumberRange.new(24, 40), drag = 5, face = PARA, light = 1, colorIndex = 2 },
	} },
	SporeBloom = { colors = SPORE, emitters = {
		floor("RuneCircle", 22, 1.6, 40), floor("Ring", 24, 0.8),
		rise("SoftGlow", 26, 1.2, 3.5, 1), rise("Mote", 30, 0.5, 3, 2),
		{ tex = "Petal", count = 14, life = NumberRange.new(1, 1.4), size = popSize(0.8), speed = NumberRange.new(10, 16), spread = Vector2.new(50, 50), accel = Vector3.new(0, -6, 0), drag = 2, rotSpeed = NumberRange.new(-260, 260), raw = true },
		twinkles(14, 8, 1.1),
	} },
	-- Rare
	RiptideSpiral = { colors = ELEMENT_COLORS.Water, emitters = {
		{ tex = "Swirl", count = 1, life = NumberRange.new(1.2), size = seq(0, 18, 1, 4), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(540), transparency = INOUT, light = 1, colorIndex = 2 },
		{ tex = "Swirl", count = 1, life = NumberRange.new(1.2), size = seq(0, 12, 1, 2), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(-720), transparency = INOUT, light = 1, colorIndex = 1, delay = 0.1 },
		{ tex = "Bubble", count = 20, life = NumberRange.new(1, 1.4), size = popSize(0.7), speed = NumberRange.new(2, 6), accel = Vector3.new(0, 8, 0), drag = 1, light = 0.3, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(12, 0.2, 12) },
		{ tex = "Splash", count = 1, life = NumberRange.new(0.5), size = grow(4, 12), transparency = POP, light = 0.5, delay = 1.1 },
		{ tex = "Droplet", count = 24, life = NumberRange.new(0.6, 0.9), size = grow(0.9, 0.4), speed = NumberRange.new(20, 32), spread = Vector2.new(60, 60), accel = Vector3.new(0, -70, 0), face = PARA, light = 0.3, delay = 1.1 },
	} },
	MagmaCharge = { colors = LAVA, light = { range = 18, brightness = 4 }, emitters = {
		flash(9), impact(8, 1), floor("CrackBurst", 12, 0.8),
		{ tex = "FlameFlipbook", count = 16, life = NumberRange.new(0.5, 0.8), size = popSize(2.6), speed = NumberRange.new(20, 34), spread = Vector2.new(35, 35), accel = Vector3.new(0, -30, 0), drag = 1, flipbook = FLIP, light = 1 },
		{ tex = "Ember", count = 30, life = NumberRange.new(0.8, 1.3), size = grow(0.5, 0.1), speed = NumberRange.new(24, 40), spread = Vector2.new(45, 45), accel = Vector3.new(0, -40, 0), light = 1, colorIndex = 2 },
		{ tex = "Dust", count = 10, life = NumberRange.new(0.7, 1), size = grow(0.8, 0.5), speed = NumberRange.new(20, 30), spread = Vector2.new(40, 40), accel = Vector3.new(0, -60, 0), rotSpeed = NumberRange.new(-200, 200), color = Color3.fromRGB(70, 40, 35) },
		smoke(7, 2.6, 2),
	} },
	AuroraVeil = { colors = AURORA, emitters = {
		{ tex = "SoftGlow", count = 1, life = NumberRange.new(1.4), size = grow(14, 18), transparency = seq(0, 1, 0.2, 0.55, 0.7, 0.6, 1, 1), light = 1, colorIndex = 1 },
		floor("Ring", 20, 1.2, 0, 2),
		{ tex = "LightShaft", count = 10, life = NumberRange.new(1.2, 1.6), size = grow(2.5, 3.5), rot = NumberRange.new(0), squash = NumberSequence.new(-1.5), -- tall, upright shafts
			speed = NumberRange.new(2, 4), spread = Vector2.new(30, 30), transparency = INOUT, light = 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(10, 0.2, 10) },
		{ tex = "Snowflake", count = 14, life = NumberRange.new(1.2, 1.8), size = popSize(0.8), speed = NumberRange.new(2, 5), drag = 1, rotSpeed = NumberRange.new(-120, 120), light = 0.6, color = Color3.fromRGB(255, 255, 255) },
		twinkles(18, 6, 1.2),
	} },
	-- Epic
	FlamePounce = { colors = ELEMENT_COLORS.Fire, light = { range = 16, brightness = 4 }, emitters = {
		flash(8), impact(7, 1), floor("Shockwave", 18, 0.45),
		{ tex = "FlameFlipbook", count = 20, life = NumberRange.new(0.6, 0.9), size = popSize(2.2), speed = NumberRange.new(16, 24), spread = RING_OUT, drag = 3, accel = Vector3.new(0, 12, 0), flipbook = FLIP, light = 1 },
		{ tex = "Ember", count = 24, life = NumberRange.new(0.6, 1.1), size = grow(0.5, 0.1), speed = NumberRange.new(14, 30), drag = 2.5, accel = Vector3.new(0, 8, 0), light = 1, colorIndex = 2 },
		smoke(5, 2, 1),
	} },
	GlacierStomp = { colors = ELEMENT_COLORS.Ice, emitters = {
		flash(8), impact(8, 2), floor("CrackBurst", 18, 0.9), floor("Shockwave", 24, 0.5),
		{ tex = "Spark", count = 22, life = NumberRange.new(0.35, 0.5), size = grow(2.6, 0.5), speed = NumberRange.new(30, 46), spread = RING_OUT, drag = 4, face = PARA, light = 1, colorIndex = 2 },
		{ tex = "Snowflake", count = 14, life = NumberRange.new(0.7, 1), size = popSize(1.2), speed = NumberRange.new(10, 18), drag = 3, rotSpeed = NumberRange.new(-220, 220), light = 0.6 },
		smoke(6, 2.4, 1),
	} },
	ShadeStep = { colors = ELEMENT_COLORS.Shadow, emitters = {
		{ tex = "Swirl", count = 1, life = NumberRange.new(0.45), size = seq(0, 8, 1, 1), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(-600), transparency = POP, light = 1, colorIndex = 2 },
		{ tex = "Wisp", count = 16, life = NumberRange.new(0.6, 1), size = grow(1.5, 3.5), speed = NumberRange.new(4, 10), drag = 3, rotSpeed = NumberRange.new(-180, 180), transparency = FADE, light = 0.8 },
		{ tex = "SmokeFlipbook", count = 6, life = NumberRange.new(0.5, 0.8), size = grow(2, 3.5), speed = NumberRange.new(2, 5), drag = 3, transparency = seq(0, 0.1, 1, 0.5), flipbook = FLIP, flipOnce = true, color = Color3.fromRGB(40, 20, 60), z = -1 },
		{ tex = "Ember", count = 12, life = NumberRange.new(0.6, 0.9), size = grow(0.45, 0.1), speed = NumberRange.new(8, 18), drag = 2, light = 1, colorIndex = 2 },
	} },
	-- Legendary
	ThunderDive = { colors = ELEMENT_COLORS.Storm, light = { range = 30, brightness = 8 }, emitters = {
		{ tex = "Bolt", count = 3, life = NumberRange.new(0.25, 0.35), size = popSize(14), speed = NumberRange.new(0), rot = NumberRange.new(-15, 15), transparency = seq(0, 0, 0.4, 0, 0.5, 0.8, 0.6, 0, 1, 1), light = 1, z = 3 },
		flash(14), impact(12, 2), floor("Shockwave", 26, 0.6), floor("CrackBurst", 14, 0.8, 0, 1),
		{ tex = "Spark", count = 36, life = NumberRange.new(0.3, 0.5), size = grow(2, 0.3), speed = NumberRange.new(30, 55), drag = 5, face = PARA, light = 1, colorIndex = 2 },
		smoke(8, 3, 1),
	} },
	UmbralVeil = { colors = ELEMENT_COLORS.Shadow, emitters = {
		{ tex = "Wisp", count = 24, life = NumberRange.new(1, 1.6), size = grow(2, 5), speed = NumberRange.new(3, 8), drag = 2, rotSpeed = NumberRange.new(-200, 200), transparency = INOUT, light = 0.5, color = Color3.fromRGB(70, 30, 110) },
		{ tex = "Swirl", count = 1, life = NumberRange.new(1), size = grow(4, 12), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(-300), transparency = INOUT, light = 1, colorIndex = 2 },
		{ tex = "SmokeFlipbook", count = 10, life = NumberRange.new(0.8, 1.2), size = grow(3, 5), speed = NumberRange.new(2, 5), drag = 2, transparency = seq(0, 0.2, 1, 0.6), flipbook = FLIP, flipOnce = true, color = Color3.fromRGB(30, 15, 45), z = -1 },
		twinkles(16, 10, 1.1),
	} },
	SolarFlare = { colors = SUN, light = { range = 34, brightness = 7 }, emitters = {
		flash(16),
		{ tex = "Rays", count = 1, life = NumberRange.new(1.2), size = seq(0, 3, 0.25, 22, 1, 26), rotSpeed = NumberRange.new(40), transparency = seq(0, 0, 0.6, 0.3, 1, 1), light = 1, z = -2 },
		impact(12, 1), floor("Shockwave", 30, 0.7), floor("RuneCircle", 18, 1, 90, 2),
		{ tex = "FlameFlipbook", count = 22, life = NumberRange.new(0.6, 0.9), size = popSize(3), speed = NumberRange.new(16, 30), drag = 2.5, accel = Vector3.new(0, 14, 0), flipbook = FLIP, light = 1, colorIndex = 2 },
		{ tex = "Ember", count = 40, life = NumberRange.new(0.8, 1.3), size = grow(0.6, 0.1), speed = NumberRange.new(20, 40), drag = 2, accel = Vector3.new(0, 6, 0), light = 1 },
		twinkles(20, 24, 1.6),
	} },
	AbsoluteZero = { colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(120, 210, 255) }, light = { range = 30, brightness = 5 }, emitters = {
		flash(14), floor("CrackBurst", 30, 1.2), floor("RuneCircle", 34, 1.4, -40), floor("Shockwave", 36, 0.8),
		{ tex = "Snowflake", count = 40, life = NumberRange.new(1.2, 1.8), size = popSize(1.6), speed = NumberRange.new(16, 34), drag = 2, rotSpeed = NumberRange.new(-260, 260), light = 0.6 },
		{ tex = "Spark", count = 30, life = NumberRange.new(0.4, 0.6), size = grow(3, 0.5), speed = NumberRange.new(30, 50), spread = RING_OUT, drag = 4, face = PARA, light = 1, colorIndex = 2 },
		{ tex = "SmokeFlipbook", count = 14, life = NumberRange.new(1, 1.4), size = grow(3, 6), speed = NumberRange.new(10, 18), drag = 2, rotSpeed = NumberRange.new(-60, 60), transparency = seq(0, 0.2, 1, 0.7), flipbook = FLIP, flipOnce = true, z = -1 },
		twinkles(30, 20, 1.6),
	} },
	AncientGrove = { colors = { Color3.fromRGB(220, 255, 150), Color3.fromRGB(80, 200, 90) }, light = { range = 24, brightness = 3 }, emitters = {
		flash(10), floor("RuneCircle", 32, 1.6, 30, 1), floor("Ring", 34, 1),
		{ tex = "LightShaft", count = 12, life = NumberRange.new(1.2, 1.8), size = grow(2.5, 4), rot = NumberRange.new(0), squash = NumberSequence.new(-1.5), -- tall, upright shafts
			speed = NumberRange.new(2, 4), spread = Vector2.new(20, 20), transparency = INOUT, light = 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(26, 0.2, 26) },
		{ tex = "Leaf", count = 30, life = NumberRange.new(1.2, 1.8), size = popSize(1.2), speed = NumberRange.new(16, 28), spread = Vector2.new(40, 40), accel = Vector3.new(0, -10, 0), drag = 1.5, rotSpeed = NumberRange.new(-300, 300), squash = seq(0, 0, 0.3, 0.6, 0.6, -0.4, 1, 0.4), raw = true },
		{ tex = "Petal", count = 20, life = NumberRange.new(1.2, 1.8), size = grow(0.6, 0.6), speed = NumberRange.new(10, 20), spread = Vector2.new(60, 60), accel = Vector3.new(0, -6, 0), drag = 2, rotSpeed = NumberRange.new(-300, 300), raw = true },
		rise("SoftGlow", 20, 1, 3, 1),
		twinkles(20, 12, 1.3),
	} },
	-- the second wave of creatures
	PuffballBounce = { colors = { Color3.fromRGB(236, 255, 190), Color3.fromRGB(184, 255, 106) }, emitters = {
		flash(6), floor("Shockwave", 18, 0.45), floor("Ring", 14, 0.6, 0, 1),
		{ tex = "Puff", count = 10, life = NumberRange.new(0.8, 1.2), size = popSize(2.2), speed = NumberRange.new(10, 18), spread = RING_OUT, drag = 3, accel = Vector3.new(0, 2, 0), rotSpeed = NumberRange.new(-60, 60), transparency = seq(0, 0.1, 0.7, 0.3, 1, 1), light = 0.3, colorIndex = 1 },
		{ tex = "SoftGlow", count = 16, life = NumberRange.new(1.4, 2), size = seq(0, 0, 0.2, 0.9, 1, 0), speed = NumberRange.new(2, 6), drag = 1, accel = Vector3.new(0, 1.5, 0), transparency = INOUT, light = 1, colorIndex = 2, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(10, 0.2, 10), delay = 0.1 },
		{ tex = "Mote", count = 20, life = NumberRange.new(1.5, 2.2), size = seq(0, 0, 0.2, 0.35, 1, 0), speed = NumberRange.new(1, 3), accel = Vector3.new(0, 2, 0), transparency = INOUT, light = 1, colorIndex = 2, delay = 0.2 },
		smoke(5, 2, 1),
	} },
	LanternPop = { colors = { Color3.fromRGB(255, 226, 120), Color3.fromRGB(255, 130, 30) }, light = { range = 18, brightness = 4 }, emitters = {
		flash(8), impact(7, 1), floor("Shockwave", 16, 0.45),
		{ tex = "FlameFlipbook", count = 12, life = NumberRange.new(0.8, 1.1), size = popSize(1.6), speed = NumberRange.new(12, 16), spread = RING_OUT, drag = 4, accel = Vector3.new(0, 6, 0), flipbook = FLIP, light = 1 },
		{ tex = "SoftGlow", count = 8, life = NumberRange.new(1.2, 1.6), size = seq(0, 0, 0.15, 2.2, 1, 0), speed = NumberRange.new(12, 16), spread = RING_OUT, drag = 4, transparency = INOUT, light = 1, colorIndex = 1 },
		{ tex = "Ember", count = 24, life = NumberRange.new(0.6, 1.1), size = grow(0.5, 0.1), speed = NumberRange.new(12, 26), drag = 2.5, accel = Vector3.new(0, 8, 0), light = 1, colorIndex = 2 },
		smoke(4, 1.8, 2),
	} },
	DazzleDust = { colors = ELEMENT_COLORS.Storm, emitters = {
		{ tex = "SparkleFlipbook", count = 40, life = NumberRange.new(0.9, 1.4), size = grow(1.4, 0.8), speed = NumberRange.new(14, 26), spread = Vector2.new(70, 70), drag = 2.5, accel = Vector3.new(0, -3, 0), flipbook = FLIP, flipOnce = true, light = 1, color = Color3.fromRGB(255, 247, 168) },
		{ tex = "Ring", count = 6, life = NumberRange.new(0.6, 0.9), size = popSize(2), speed = NumberRange.new(10, 20), spread = Vector2.new(60, 60), drag = 3, transparency = FADE, light = 1, colorIndex = 2 },
		{ tex = "Spark", count = 20, life = NumberRange.new(0.2, 0.35), size = grow(1.4, 0.2), speed = NumberRange.new(20, 34), drag = 5, face = PARA, light = 1, colorIndex = 2, delay = 0.15 },
		{ tex = "Mote", count = 30, life = NumberRange.new(1.4, 2), size = seq(0, 0, 0.2, 0.3, 1, 0), speed = NumberRange.new(4, 10), drag = 1.5, transparency = INOUT, light = 1, color = Color3.fromRGB(200, 210, 255) },
	} },
	GeodeRoll = { colors = ELEMENT_COLORS.Shadow, emitters = {
		flash(8), impact(7, 2), floor("CrackBurst", 12, 0.8), floor("Shockwave", 16, 0.45),
		{ tex = "Gem", count = 18, life = NumberRange.new(0.7, 1), size = popSize(1.1), speed = NumberRange.new(24, 38), spread = RING_OUT, drag = 2, accel = Vector3.new(0, -30, 0), rotSpeed = NumberRange.new(-300, 300), raw = true },
		{ tex = "Spark", count = 20, life = NumberRange.new(0.3, 0.45), size = grow(1.8, 0.3), speed = NumberRange.new(30, 46), spread = RING_OUT, drag = 4, face = PARA, light = 1, colorIndex = 2 },
		{ tex = "Dust", count = 10, life = NumberRange.new(0.6, 0.9), size = grow(0.8, 0.4), speed = NumberRange.new(14, 22), spread = Vector2.new(60, 20), accel = Vector3.new(0, -40, 0), color = Color3.fromRGB(110, 90, 120) },
		smoke(6, 2.2, 1),
	} },
	AbyssalLure = { colors = { Color3.fromRGB(230, 255, 255), Color3.fromRGB(56, 240, 255) }, light = { range = 30, brightness = 6 }, emitters = {
		flash(14),
		{ tex = "Swirl", count = 1, life = NumberRange.new(1.1), size = seq(0, 30, 1, 3), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(-480), transparency = INOUT, light = 1, colorIndex = 2 },
		{ tex = "Shockwave", count = 1, life = NumberRange.new(0.9), size = seq(0, 32, 1, 2), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, transparency = seq(0, 0.2, 1, 1), light = 1, colorIndex = 1 },
		{ tex = "Bubble", count = 30, life = NumberRange.new(1, 1.4), size = popSize(0.9), speed = NumberRange.new(2, 6), accel = Vector3.new(0, 6, 0), light = 0.4, colorIndex = 2, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(30, 0.2, 30) },
		impact(14, 2),
		{ tex = "Splash", count = 1, life = NumberRange.new(0.6), size = grow(5, 16), transparency = POP, light = 0.5, delay = 1.0 },
		{ tex = "Droplet", count = 36, life = NumberRange.new(0.7, 1), size = grow(1.1, 0.5), speed = NumberRange.new(26, 44), spread = Vector2.new(70, 70), accel = Vector3.new(0, -70, 0), face = PARA, light = 0.4, delay = 1.0 },
		twinkles(24, 18, 1.4),
	} },
	-- new body types
	Haymaker = { colors = { Color3.fromRGB(255, 240, 150), Color3.fromRGB(255, 225, 74) }, light = { range = 16, brightness = 4 }, emitters = {
		flash(8), impact(9, 1), floor("Shockwave", 14, 0.4),
		{ tex = "Bolt", count = 5, life = NumberRange.new(0.18, 0.28), size = popSize(3), speed = NumberRange.new(6, 12), rot = NumberRange.new(-50, 50), transparency = seq(0, 0, 0.5, 0, 0.6, 0.8, 0.7, 0, 1, 1), light = 1 },
		{ tex = "SpeedLine", count = 10, life = NumberRange.new(0.2, 0.3), size = grow(3, 1), speed = NumberRange.new(30, 46), spread = Vector2.new(20, 20), face = PARA, transparency = FADE, light = 0.6, emitDir = Enum.NormalId.Front },
		{ tex = "Spark", count = 24, life = NumberRange.new(0.25, 0.4), size = grow(1.5, 0.2), speed = NumberRange.new(26, 42), drag = 5, face = PARA, light = 1, colorIndex = 2 },
		{ tex = "Star", count = 6, life = NumberRange.new(0.6, 0.9), size = popSize(1), speed = NumberRange.new(10, 16), spread = Vector2.new(60, 60), accel = Vector3.new(0, -20, 0), rotSpeed = NumberRange.new(-300, 300), light = 0.6 },
	} },
	MoonScreech = { colors = { Color3.fromRGB(255, 246, 200), Color3.fromRGB(168, 140, 255) }, emitters = {
		{ tex = "Ring", count = 4, life = NumberRange.new(0.7, 0.9), size = grow(2, 16), speed = NumberRange.new(0.01), spread = Vector2.zero, transparency = seq(0, 0.2, 1, 1), light = 1, colorIndex = 2 },
		{ tex = "Ring", count = 3, life = NumberRange.new(0.8, 1.0), size = grow(1, 12), speed = NumberRange.new(0.01), spread = Vector2.zero, transparency = seq(0, 0.3, 1, 1), light = 1, colorIndex = 1, delay = 0.15 },
		{ tex = "Wisp", count = 14, life = NumberRange.new(0.8, 1.2), size = grow(1.5, 3), speed = NumberRange.new(8, 16), drag = 2, rotSpeed = NumberRange.new(-120, 120), transparency = FADE, light = 0.6, color = Color3.fromRGB(110, 90, 200) },
		{ tex = "SparkleFlipbook", count = 24, life = NumberRange.new(0.8, 1.2), size = grow(1.1, 0.6), speed = NumberRange.new(10, 20), drag = 2, flipbook = FLIP, flipOnce = true, light = 1 },
		{ tex = "Leaf", count = 10, life = NumberRange.new(1, 1.4), size = popSize(0.9), speed = NumberRange.new(10, 16), drag = 3, accel = Vector3.new(0, -6, 0), rotSpeed = NumberRange.new(-300, 300), color = Color3.fromRGB(90, 80, 170) },
	} },
	PearlSurge = { colors = { Color3.fromRGB(230, 255, 255), Color3.fromRGB(111, 244, 255) }, light = { range = 20, brightness = 4 }, emitters = {
		flash(10), floor("Splash", 20, 0.7), floor("Ring", 18, 0.8),
		{ tex = "SoftGlow", count = 1, life = NumberRange.new(0.9), size = seq(0, 2, 0.3, 6, 1, 8), transparency = seq(0, 0, 0.5, 0.3, 1, 1), light = 1 },
		{ tex = "Droplet", count = 32, life = NumberRange.new(0.7, 1), size = grow(1, 0.5), speed = NumberRange.new(20, 34), spread = Vector2.new(70, 70), accel = Vector3.new(0, -60, 0), face = PARA, light = 0.4 },
		{ tex = "Bubble", count = 24, life = NumberRange.new(1, 1.6), size = popSize(0.9), speed = NumberRange.new(4, 10), drag = 1.5, accel = Vector3.new(0, 6, 0), light = 0.4, colorIndex = 2 },
		{ tex = "Petal", count = 12, life = NumberRange.new(1.2, 1.6), size = popSize(0.7), speed = NumberRange.new(8, 14), drag = 2, accel = Vector3.new(0, -4, 0), rotSpeed = NumberRange.new(-300, 300), color = Color3.fromRGB(255, 140, 100) },
		twinkles(20, 14, 1.2),
	} },
	Starfall = { colors = { Color3.fromRGB(255, 240, 176), Color3.fromRGB(134, 120, 255) }, light = { range = 50, brightness = 10 }, emitters = {
		{ tex = "LightShaft", count = 8, life = NumberRange.new(0.5, 0.8), size = grow(3, 5), rot = NumberRange.new(0), squash = NumberSequence.new(-2), speed = NumberRange.new(0.01), spread = Vector2.zero, transparency = seq(0, 0, 0.7, 0.3, 1, 1), light = 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(30, 0.2, 30) },
		flash(22), impact(18, 1),
		{ tex = "RuneCircle", count = 1, life = NumberRange.new(2), size = grow(10, 40), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(40), transparency = seq(0, 0, 0.7, 0.3, 1, 1), light = 1, colorIndex = 2 },
		floor("CrackBurst", 30, 1.4, 0, 1), floor("Shockwave", 46, 0.9),
		{ tex = "Star", count = 40, life = NumberRange.new(1.4, 2), size = popSize(1.8), speed = NumberRange.new(20, 44), spread = Vector2.new(70, 70), drag = 1, accel = Vector3.new(0, -16, 0), rotSpeed = NumberRange.new(-200, 200), light = 0.9 },
		{ tex = "Swirl", count = 2, life = NumberRange.new(1.4), size = grow(6, 26), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(-240), transparency = INOUT, light = 1, color = Color3.fromRGB(255, 122, 217) },
		{ tex = "SparkleFlipbook", count = 60, life = NumberRange.new(1, 1.6), size = grow(2, 1), speed = NumberRange.new(16, 40), drag = 2.5, flipbook = FLIP, flipOnce = true, light = 1, colorIndex = 2 },
		smoke(12, 4, 2),
	} },
	-- ---- boss: Pyrothrax ----
	-- looping from the Jaw bone while the breath lasts (Effects.attach(..., jawBone, { duration = ... }))
	BossFireBreath = { loop = true, colors = { Color3.fromRGB(255, 230, 120), Color3.fromRGB(255, 90, 20) }, emitters = {
		{ tex = "FlameFlipbook", rate = 90, life = NumberRange.new(0.6, 0.85), size = seq(0, 1.2, 0.3, 4.5, 1, 7), speed = NumberRange.new(36, 46), spread = Vector2.new(9, 9), drag = 0.8, flipbook = FLIP, light = 1, emitDir = Enum.NormalId.Front, transparency = seq(0, 0.1, 0.7, 0.3, 1, 1), z = 1 },
		{ tex = "SoftGlow", rate = 30, life = NumberRange.new(0.4, 0.6), size = grow(2, 6), speed = NumberRange.new(30, 40), spread = Vector2.new(6, 6), transparency = seq(0, 0.3, 1, 1), light = 1, colorIndex = 1, emitDir = Enum.NormalId.Front },
		{ tex = "Ember", rate = 60, life = NumberRange.new(0.8, 1.2), size = grow(0.5, 0.1), speed = NumberRange.new(30, 50), spread = Vector2.new(16, 16), accel = Vector3.new(0, 6, 0), light = 1, colorIndex = 2, emitDir = Enum.NormalId.Front },
		{ tex = "SmokeFlipbook", rate = 14, life = NumberRange.new(1, 1.4), size = grow(4, 8), speed = NumberRange.new(24, 32), spread = Vector2.new(12, 12), drag = 1, accel = Vector3.new(0, 4, 0), transparency = seq(0, 0.5, 1, 1), flipbook = FLIP, flipOnce = true, color = Color3.fromRGB(70, 50, 50), emitDir = Enum.NormalId.Front, z = -1 },
	} },
	BossTailSwipe = { colors = { Color3.fromRGB(255, 210, 110), Color3.fromRGB(255, 90, 20) }, emitters = {
		flash(10), floor("Shockwave", 42, 0.5), floor("Ring", 40, 0.6, 0, 1),
		{ tex = "FlameFlipbook", count = 28, life = NumberRange.new(0.6, 0.9), size = popSize(3), speed = NumberRange.new(30, 44), spread = RING_OUT, drag = 3, accel = Vector3.new(0, 10, 0), flipbook = FLIP, light = 1 },
		{ tex = "Dust", count = 18, life = NumberRange.new(0.6, 1), size = grow(1.2, 0.6), speed = NumberRange.new(20, 34), spread = RING_OUT, accel = Vector3.new(0, -30, 0), color = Color3.fromRGB(90, 70, 60) },
		smoke(10, 4, 1),
	} },
	BossStomp = { colors = { Color3.fromRGB(255, 220, 120), Color3.fromRGB(255, 80, 20) }, light = { range = 40, brightness = 8 }, emitters = {
		flash(18), impact(16, 1), floor("CrackBurst", 30, 1.4), floor("Shockwave", 40, 0.7), floor("Ring", 34, 0.9, 0, 1),
		{ tex = "FlameFlipbook", count = 30, life = NumberRange.new(0.7, 1.1), size = popSize(4), speed = NumberRange.new(24, 40), spread = RING_OUT, drag = 2.5, accel = Vector3.new(0, 14, 0), flipbook = FLIP, light = 1 },
		{ tex = "Dust", count = 24, life = NumberRange.new(0.9, 1.3), size = grow(1.6, 0.8), speed = NumberRange.new(26, 40), spread = Vector2.new(60, 60), accel = Vector3.new(0, -50, 0), rotSpeed = NumberRange.new(-200, 200), color = Color3.fromRGB(60, 45, 45) },
		{ tex = "Ember", count = 50, life = NumberRange.new(1, 1.6), size = grow(0.7, 0.1), speed = NumberRange.new(26, 50), spread = Vector2.new(70, 70), accel = Vector3.new(0, -12, 0), light = 1, colorIndex = 2 },
		smoke(16, 6, 1),
	} },
	-- falling meteor (client moves a host part down from the sky, this trails behind it)
	BossMeteorTrail = { loop = true, colors = { Color3.fromRGB(255, 220, 120), Color3.fromRGB(255, 90, 20) }, emitters = {
		{ tex = "FlameFlipbook", rate = 60, life = NumberRange.new(0.3, 0.5), size = grow(3.5, 1), speed = NumberRange.new(2, 4), flipbook = FLIP, light = 1 },
		{ tex = "SmokeFlipbook", rate = 20, life = NumberRange.new(0.8, 1.2), size = grow(2, 5), speed = NumberRange.new(1, 2), transparency = seq(0, 0.4, 1, 1), flipbook = FLIP, flipOnce = true, color = Color3.fromRGB(60, 45, 45), z = -1 },
		{ tex = "Ember", rate = 40, life = NumberRange.new(0.5, 0.9), size = grow(0.5, 0.1), speed = NumberRange.new(4, 10), light = 1, colorIndex = 2 },
	} },
	BossMeteorImpact = { colors = { Color3.fromRGB(255, 220, 120), Color3.fromRGB(255, 80, 20) }, light = { range = 24, brightness = 6 }, emitters = {
		flash(12), impact(10, 1), floor("CrackBurst", 16, 1.2), floor("Shockwave", 20, 0.5),
		{ tex = "FlameFlipbook", count = 18, life = NumberRange.new(0.6, 0.9), size = popSize(3), speed = NumberRange.new(16, 30), spread = Vector2.new(60, 60), drag = 2, accel = Vector3.new(0, 16, 0), flipbook = FLIP, light = 1 },
		{ tex = "Dust", count = 14, life = NumberRange.new(0.8, 1.1), size = grow(1.2, 0.6), speed = NumberRange.new(18, 30), spread = Vector2.new(50, 50), accel = Vector3.new(0, -50, 0), color = Color3.fromRGB(60, 45, 45) },
		{ tex = "Ember", count = 26, life = NumberRange.new(0.8, 1.3), size = grow(0.6, 0.1), speed = NumberRange.new(18, 36), spread = Vector2.new(60, 60), accel = Vector3.new(0, -16, 0), light = 1, colorIndex = 2 },
		smoke(8, 4, 1),
	} },
	BossEnrage = { colors = { Color3.fromRGB(255, 240, 160), Color3.fromRGB(255, 60, 20) }, light = { range = 60, brightness = 10 }, emitters = {
		flash(30),
		{ tex = "Rays", count = 1, life = NumberRange.new(1.6), size = seq(0, 6, 0.25, 40, 1, 46), rotSpeed = NumberRange.new(30), transparency = seq(0, 0, 0.6, 0.3, 1, 1), light = 1, z = -2 },
		floor("Shockwave", 60, 0.9), floor("RuneCircle", 40, 1.8, 50, 2),
		{ tex = "FlameFlipbook", count = 40, life = NumberRange.new(0.9, 1.4), size = popSize(5), speed = NumberRange.new(20, 40), spread = Vector2.new(40, 40), accel = Vector3.new(0, 20, 0), drag = 1.5, flipbook = FLIP, light = 1 },
		{ tex = "Ember", count = 80, life = NumberRange.new(1.2, 2), size = grow(0.8, 0.1), speed = NumberRange.new(20, 50), drag = 1.5, accel = Vector3.new(0, 10, 0), light = 1, colorIndex = 2 },
		smoke(14, 7, 2),
	} },
	BossDeath = { colors = { Color3.fromRGB(255, 220, 140), Color3.fromRGB(255, 90, 20) }, light = { range = 50, brightness = 8 }, emitters = {
		flash(26), floor("Shockwave", 50, 1.0),
		{ tex = "SmokeFlipbook", count = 30, life = NumberRange.new(2, 3), size = grow(6, 14), speed = NumberRange.new(4, 12), drag = 1, accel = Vector3.new(0, 4, 0), transparency = seq(0, 0.2, 1, 1), flipbook = FLIP, flipOnce = true, color = Color3.fromRGB(70, 55, 55), z = -1 },
		{ tex = "Ember", count = 100, life = NumberRange.new(1.5, 2.5), size = grow(0.8, 0.1), speed = NumberRange.new(10, 30), drag = 1, accel = Vector3.new(0, 8, 0), light = 1, colorIndex = 2 },
		{ tex = "Coin", count = 30, life = NumberRange.new(1.2, 1.6), size = popSize(1.6), speed = NumberRange.new(20, 36), spread = Vector2.new(50, 50), accel = Vector3.new(0, -50, 0), rotSpeed = NumberRange.new(-300, 300), raw = true, delay = 0.4 },
		twinkles(40, 30, 2),
	} },
	-- looping on the MagmaOrbit bone above the crater: smoke plume and rising embers (x1.8 in phase 2)
	BossVolcanoAura = { loop = true, colors = { Color3.fromRGB(255, 200, 100), Color3.fromRGB(255, 90, 20) }, emitters = {
		{ tex = "SmokeFlipbook", rate = 6, life = NumberRange.new(3, 4), size = grow(3, 9), speed = NumberRange.new(3, 5), spread = Vector2.new(15, 15), accel = Vector3.new(0, 2, 0), drag = 0.3, windDrag = true, transparency = seq(0, 0.4, 1, 1), flipbook = FLIP, flipOnce = true, color = Color3.fromRGB(60, 50, 50), emitDir = Enum.NormalId.Top, z = -1 },
		{ tex = "Ember", rate = 22, life = NumberRange.new(1.5, 2.5), size = grow(0.5, 0.05), speed = NumberRange.new(5, 10), spread = Vector2.new(25, 25), accel = Vector3.new(0, 3, 0), light = 1, colorIndex = 2, emitDir = Enum.NormalId.Top },
		{ tex = "FlameFlipbook", rate = 6, life = NumberRange.new(0.5, 0.8), size = grow(2, 0.5), speed = NumberRange.new(2, 4), spread = Vector2.new(10, 10), flipbook = FLIP, light = 1, emitDir = Enum.NormalId.Top },
	} },
	-- Mythic: every element at once, then a rainbow nova.
	PrismJudgement = { colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(255, 140, 230) }, light = { range = 50, brightness = 10 }, emitters = {
		flash(24),
		{ tex = "Rays", count = 1, life = NumberRange.new(1.6), size = seq(0, 4, 0.25, 32, 1, 38), rotSpeed = NumberRange.new(50), transparency = seq(0, 0, 0.6, 0.3, 1, 1), light = 1, rainbow = true, z = -2 },
		impact(18, 1),
		{ tex = "RuneCircle", count = 1, life = NumberRange.new(1.8), size = grow(8, 44), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, rotSpeed = NumberRange.new(60), transparency = seq(0, 0, 0.7, 0.3, 1, 1), light = 1, rainbow = true },
		{ tex = "Shockwave", count = 1, life = NumberRange.new(0.8), size = grow(4, 46), transparency = POP, light = 1, rainbow = true, delay = 0.15 },
		{ tex = "FlameFlipbook", count = 10, life = NumberRange.new(0.6, 0.9), size = popSize(3), speed = NumberRange.new(20, 34), drag = 2.5, flipbook = FLIP, light = 1, color = Color3.fromRGB(255, 120, 40) },
		{ tex = "Snowflake", count = 10, life = NumberRange.new(0.8, 1.1), size = popSize(1.8), speed = NumberRange.new(20, 34), drag = 2.5, rotSpeed = NumberRange.new(-220, 220), light = 0.8, color = Color3.fromRGB(150, 230, 255) },
		{ tex = "Bolt", count = 6, life = NumberRange.new(0.2, 0.3), size = popSize(4), speed = NumberRange.new(10, 20), rot = NumberRange.new(-40, 40), light = 1, color = Color3.fromRGB(90, 220, 255) },
		{ tex = "Wisp", count = 10, life = NumberRange.new(0.8, 1.2), size = grow(2, 4.5), speed = NumberRange.new(10, 20), drag = 3, rotSpeed = NumberRange.new(-180, 180), transparency = FADE, light = 0.8, color = Color3.fromRGB(176, 77, 255) },
		{ tex = "Droplet", count = 14, life = NumberRange.new(0.7, 1), size = grow(1, 0.5), speed = NumberRange.new(24, 36), spread = Vector2.new(60, 60), accel = Vector3.new(0, -60, 0), face = PARA, light = 0.4, color = Color3.fromRGB(56, 226, 255) },
		{ tex = "Leaf", count = 12, life = NumberRange.new(0.9, 1.3), size = popSize(1.3), speed = NumberRange.new(18, 30), drag = 3, rotSpeed = NumberRange.new(-300, 300), raw = true },
		{ tex = "Star", count = 30, life = NumberRange.new(1.2, 1.8), size = popSize(1.6), speed = NumberRange.new(20, 40), drag = 1, accel = Vector3.new(0, -14, 0), rotSpeed = NumberRange.new(-200, 200), light = 0.8, rainbow = true, delay = 0.25 },
		{ tex = "SparkleFlipbook", count = 50, life = NumberRange.new(0.8, 1.3), size = grow(2, 1), speed = NumberRange.new(20, 44), drag = 3, flipbook = FLIP, flipOnce = true, light = 1, rainbow = true, delay = 0.25 },
		{ tex = "SmokeFlipbook", count = 10, life = NumberRange.new(0.8, 1.1), size = grow(3, 6), speed = NumberRange.new(8, 16), drag = 4, transparency = seq(0, 0.2, 1, 0.6), flipbook = FLIP, flipOnce = true, rainbow = true, z = -1, delay = 0.25 },
	} },
}
for name, preset in ABILITIES do
	PRESETS[name] = preset
end

-- ---- mutation auras (Mutations.Defs[*].aura), looping on the creature's Body ----
-- Effects.attach(def.aura, body). Box emitters fill the Body's bounding box.
local BODY = Enum.ParticleEmitterShape.Box
local AURAS: { [string]: { colors: { Color3 }, loop: boolean, emitters: { EmitterDef } } } = {
	MutShiny = { loop = true, colors = { Color3.fromRGB(200, 250, 255), Color3.fromRGB(255, 255, 255) }, emitters = {
		{ tex = "SparkleFlipbook", rate = 4, life = NumberRange.new(0.6, 0.9), size = grow(1, 0.7), speed = NumberRange.new(0), flipbook = FLIP, flipOnce = true, light = 1, shape = BODY },
		{ tex = "Sparkle4", rate = 1.5, life = NumberRange.new(0.5), size = popSize(1.2), speed = NumberRange.new(0), rotSpeed = NumberRange.new(90), light = 1, colorIndex = 2, shape = BODY },
	} },
	MutGolden = { loop = true, colors = { Color3.fromRGB(255, 230, 140), Color3.fromRGB(255, 190, 40) }, emitters = {
		{ tex = "SparkleFlipbook", rate = 8, life = NumberRange.new(0.6, 1), size = grow(1, 0.8), speed = NumberRange.new(0.3, 1), flipbook = FLIP, flipOnce = true, light = 1, shape = BODY },
		{ tex = "Mote", rate = 6, life = NumberRange.new(1.5, 2.2), size = seq(0, 0, 0.2, 0.35, 1, 0), speed = NumberRange.new(0.5, 1), accel = Vector3.new(0, 1.5, 0), light = 1, colorIndex = 2, shape = BODY },
	} },
	MutCrystal = { loop = true, colors = { Color3.fromRGB(191, 244, 255), Color3.fromRGB(255, 255, 255) }, emitters = {
		{ tex = "SparkleFlipbook", rate = 5, life = NumberRange.new(0.7, 1), size = grow(1.2, 0.9), speed = NumberRange.new(0), flipbook = FLIP, flipOnce = true, light = 1, shape = BODY },
		{ tex = "Sparkle8", rate = 2, life = NumberRange.new(0.6), size = popSize(1.4), speed = NumberRange.new(0), rotSpeed = NumberRange.new(-60, 60), light = 1, colorIndex = 2, shape = BODY },
	} },
	MutVoid = { loop = true, colors = { Color3.fromRGB(50, 15, 80), Color3.fromRGB(176, 77, 255) }, emitters = {
		{ tex = "Wisp", rate = 6, life = NumberRange.new(1.5, 2.5), size = grow(1.5, 3), speed = NumberRange.new(0.5, 1.5), accel = Vector3.new(0, 1.5, 0), rotSpeed = NumberRange.new(-60, 60), transparency = INOUT, light = 0, shape = BODY, z = -1 },
		{ tex = "Ember", rate = 8, life = NumberRange.new(1, 1.6), size = grow(0.35, 0.05), speed = NumberRange.new(1, 2), accel = Vector3.new(0, 2, 0), light = 1, colorIndex = 2, shape = BODY },
	} },
	MutRainbow = { loop = true, colors = { Color3.new(1, 1, 1), Color3.new(1, 1, 1) }, emitters = {
		{ tex = "SparkleFlipbook", rate = 8, life = NumberRange.new(0.7, 1.1), size = grow(1.1, 0.8), speed = NumberRange.new(0.3, 1), flipbook = FLIP, flipOnce = true, light = 1, rainbow = true, shape = BODY },
		{ tex = "Star", rate = 1.5, life = NumberRange.new(1, 1.4), size = popSize(0.8), speed = NumberRange.new(1, 2), accel = Vector3.new(0, 2, 0), rotSpeed = NumberRange.new(-120, 120), light = 0.8, rainbow = true, shape = BODY },
		{ tex = "Mote", rate = 5, life = NumberRange.new(1.5, 2.2), size = seq(0, 0, 0.2, 0.35, 1, 0), speed = NumberRange.new(0.5, 1), accel = Vector3.new(0, 1.5, 0), light = 1, rainbow = true, shape = BODY },
	} },
	MutGiant = { loop = true, colors = { Color3.fromRGB(255, 200, 120), Color3.fromRGB(255, 150, 70) }, emitters = {
		{ tex = "Mote", rate = 3, life = NumberRange.new(1.5, 2), size = seq(0, 0, 0.2, 0.4, 1, 0), speed = NumberRange.new(0.5, 1), accel = Vector3.new(0, 1, 0), light = 1, shape = BODY },
		{ tex = "Ring", rate = 0.4, life = NumberRange.new(1.6), size = grow(2, 12), speed = NumberRange.new(0.01), spread = Vector2.zero, face = PERP, transparency = seq(0, 0.5, 1, 1), light = 1, colorIndex = 2, emitDir = Enum.NormalId.Bottom },
	} },
	MutCharged = { loop = true, colors = { Color3.fromRGB(255, 250, 200), Color3.fromRGB(255, 230, 80) }, emitters = {
		{ tex = "Spark", rate = 16, life = NumberRange.new(0.15, 0.25), size = grow(1.3, 0.2), speed = NumberRange.new(8, 14), drag = 4, face = PARA, light = 1, shape = BODY },
		{ tex = "Bolt", rate = 1.5, life = NumberRange.new(0.15, 0.2), size = popSize(1.6), speed = NumberRange.new(0), rot = NumberRange.new(-50, 50), transparency = seq(0, 0, 0.5, 0, 0.6, 0.8, 0.7, 0, 1, 1), light = 1, colorIndex = 2, shape = BODY },
	} },
}
for name, preset in AURAS do
	PRESETS[name] = preset
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

local RAINBOW = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 110, 110)),
	ColorSequenceKeypoint.new(0.2, Color3.fromRGB(255, 200, 90)),
	ColorSequenceKeypoint.new(0.4, Color3.fromRGB(140, 255, 120)),
	ColorSequenceKeypoint.new(0.6, Color3.fromRGB(100, 220, 255)),
	ColorSequenceKeypoint.new(0.8, Color3.fromRGB(170, 120, 255)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 120, 220)),
})

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
	if def.rainbow then
		e.Color = RAINBOW
	elseif not def.raw then
		local c = def.color or color or colors[def.colorIndex or 1] or Color3.new(1, 1, 1)
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
