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
}

local FADE = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.7, 0.2), NumberSequenceKeypoint.new(1, 1) })
local POP = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) })
local function grow(a: number, b: number): NumberSequence
	return NumberSequence.new(a, b)
end

local PRESETS: { [string]: { colors: { Color3 }?, loop: boolean?, emitters: { EmitterDef }, light: { range: number, brightness: number }? } } = {
	HatchBurst = {
		colors = { Color3.fromRGB(255, 243, 176), Color3.fromRGB(255, 210, 63) },
		light = { range = 24, brightness = 4 },
		emitters = {
			{ tex = "Rays", count = 1, life = NumberRange.new(1.2), size = grow(4, 22), rotSpeed = NumberRange.new(40), transparency = POP, light = 1 },
			{ tex = "Shockwave", count = 1, life = NumberRange.new(0.7), size = grow(1, 26), transparency = POP, light = 1, face = Enum.ParticleOrientation.VelocityPerpendicular, speed = NumberRange.new(0.01), spread = Vector2.zero },
			{ tex = "Sparkle4", count = 40, life = NumberRange.new(0.6, 1.1), size = grow(1.4, 0.2), speed = NumberRange.new(14, 30), spread = Vector2.new(180, 180), drag = 3, transparency = FADE, light = 1, colorIndex = 2 },
			{ tex = "SoftGlow", count = 1, life = NumberRange.new(0.9), size = grow(16, 8), transparency = POP, light = 1 },
			{ tex = "Star", count = 14, life = NumberRange.new(1, 1.6), size = grow(1, 0.4), speed = NumberRange.new(10, 20), spread = Vector2.new(60, 60), accel = Vector3.new(0, -20, 0), rotSpeed = NumberRange.new(-180, 180), transparency = FADE, light = 0.6, delay = 0.1 },
		},
	},
	RarityBeam = {
		loop = true,
		emitters = {
			{ tex = "Sparkle4", rate = 14, life = NumberRange.new(1.2, 1.6), size = grow(0.8, 0.2), speed = NumberRange.new(4, 8), spread = Vector2.new(10, 10), transparency = FADE, light = 1 },
			{ tex = "SoftGlow", rate = 3, life = NumberRange.new(1.5), size = grow(4, 6), speed = NumberRange.new(0.5), transparency = NumberSequence.new(0.6, 1), light = 1 },
		},
	},
	Pickup = {
		colors = { Color3.fromRGB(255, 224, 122), Color3.fromRGB(255, 255, 255) },
		emitters = {
			{ tex = "Coin", count = 6, life = NumberRange.new(0.8), size = grow(1.2, 0.8), speed = NumberRange.new(10, 18), spread = Vector2.new(35, 35), accel = Vector3.new(0, -40, 0), rotSpeed = NumberRange.new(-200, 200), transparency = FADE, raw = true },
			{ tex = "Sparkle8", count = 12, life = NumberRange.new(0.5), size = grow(1, 0.1), speed = NumberRange.new(6, 14), spread = Vector2.new(180, 180), transparency = FADE, light = 1, colorIndex = 2 },
			{ tex = "Ring", count = 1, life = NumberRange.new(0.45), size = grow(0.5, 7), transparency = POP, light = 1, face = Enum.ParticleOrientation.VelocityPerpendicular, speed = NumberRange.new(0.01), spread = Vector2.zero },
		},
	},
	ExtractPortal = {
		loop = true,
		colors = { Color3.fromRGB(230, 255, 255), Color3.fromRGB(95, 240, 255) },
		light = { range = 20, brightness = 3 },
		emitters = {
			{ tex = "Swirl", rate = 1.5, life = NumberRange.new(2), size = grow(10, 12), rotSpeed = NumberRange.new(140), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.3, 0.2), NumberSequenceKeypoint.new(1, 1) }), light = 1, face = Enum.ParticleOrientation.VelocityPerpendicular, speed = NumberRange.new(0.01), spread = Vector2.zero, colorIndex = 2 },
			{ tex = "RuneCircle", rate = 0.8, life = NumberRange.new(2.5), size = grow(13, 13), rotSpeed = NumberRange.new(-30), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.3, 0.3), NumberSequenceKeypoint.new(1, 1) }), light = 1, face = Enum.ParticleOrientation.VelocityPerpendicular, speed = NumberRange.new(0.01), spread = Vector2.zero },
			{ tex = "Sparkle4", rate = 20, life = NumberRange.new(1, 1.4), size = grow(0.8, 0.1), speed = NumberRange.new(8, 14), spread = Vector2.new(15, 15), transparency = FADE, light = 1, shape = Enum.ParticleEmitterShape.Disc, shapeSize = Vector3.new(10, 0.2, 10) },
		},
	},
	KnockedDown = {
		loop = true,
		colors = { Color3.fromRGB(255, 224, 122), Color3.fromRGB(255, 210, 63) },
		emitters = {
			{ tex = "Star", rate = 5, life = NumberRange.new(0.9), size = grow(0.8, 0.5), speed = NumberRange.new(3), spread = Vector2.new(180, 0), rotSpeed = NumberRange.new(-180, 180), transparency = FADE, light = 0.5 },
		},
	},
	Dust = {
		colors = { Color3.fromRGB(214, 196, 168), Color3.fromRGB(180, 160, 130) },
		emitters = {
			{ tex = "Puff", count = 8, life = NumberRange.new(0.5, 0.8), size = grow(1.2, 2.6), speed = NumberRange.new(4, 8), spread = Vector2.new(85, 10), drag = 4, transparency = NumberSequence.new(0.3, 1), rotSpeed = NumberRange.new(-60, 60) },
		},
	},
	GoldShimmer = {
		loop = true,
		colors = { Color3.fromRGB(255, 230, 140), Color3.fromRGB(242, 179, 61) },
		emitters = {
			{ tex = "Sparkle8", rate = 8, life = NumberRange.new(0.6, 1), size = grow(0.9, 0.1), speed = NumberRange.new(0.5, 1.5), spread = Vector2.new(180, 180), transparency = FADE, light = 1, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(5, 4, 6) },
		},
	},
	-- Biome ambience: attach to a big invisible part over the area.
	BiomeEmbers = { loop = true, colors = ELEMENT_COLORS.Fire, emitters = { { tex = "Ember", rate = 30, life = NumberRange.new(3, 5), size = grow(0.4, 0.1), speed = NumberRange.new(2, 5), spread = Vector2.new(30, 30), accel = Vector3.new(0, 1.5, 0), transparency = FADE, light = 1, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(120, 4, 120) } } },
	BiomeSnow = { loop = true, colors = ELEMENT_COLORS.Ice, emitters = { { tex = "Snowflake", rate = 60, life = NumberRange.new(6, 9), size = grow(0.5, 0.5), speed = NumberRange.new(4, 6), spread = Vector2.new(15, 15), rotSpeed = NumberRange.new(-60, 60), transparency = NumberSequence.new(0.1, 0.6), shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(140, 2, 140) } } },
	BiomeFireflies = { loop = true, colors = { Color3.fromRGB(255, 247, 160), Color3.fromRGB(168, 255, 79) }, emitters = { { tex = "SoftGlow", rate = 10, life = NumberRange.new(4, 6), size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.5, 0.6), NumberSequenceKeypoint.new(1, 0) }), speed = NumberRange.new(0.5, 1.5), spread = Vector2.new(180, 180), transparency = NumberSequence.new(0.1), light = 1, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 10, 100) } } },
	BiomeBubbles = { loop = true, colors = ELEMENT_COLORS.Water, emitters = { { tex = "Bubble", rate = 20, life = NumberRange.new(4, 6), size = grow(0.4, 0.8), speed = NumberRange.new(2, 4), spread = Vector2.new(10, 10), transparency = FADE, light = 0.3, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 2, 100) } } },
	BiomeSparks = { loop = true, colors = ELEMENT_COLORS.Storm, emitters = { { tex = "Spark", rate = 15, life = NumberRange.new(0.3, 0.5), size = grow(1.2, 0.2), speed = NumberRange.new(10, 20), spread = Vector2.new(180, 180), transparency = FADE, light = 1, face = Enum.ParticleOrientation.VelocityParallel, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 20, 100) } } },
	-- Atmosphere: Atmosphere.client keeps these on a box that follows the camera,
	-- facing down-wind (emitDir Front), so particles always blow with the wind.
	Wind = { loop = true, colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(223, 244, 255) }, emitters = { { tex = "WindStreak", rate = 6, life = NumberRange.new(1.4, 2.2), size = grow(6, 9), speed = NumberRange.new(28, 40), spread = Vector2.new(4, 4), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.25, 0.45), NumberSequenceKeypoint.new(0.75, 0.55), NumberSequenceKeypoint.new(1, 1) }), light = 0.3, face = Enum.ParticleOrientation.VelocityParallel, emitDir = Enum.NormalId.Front } } },
	WindLeaves = { loop = true, emitters = {
		{ tex = "Leaf", rate = 4, life = NumberRange.new(3, 5), size = grow(0.7, 0.7), speed = NumberRange.new(14, 22), spread = Vector2.new(15, 15), accel = Vector3.new(0, -1.5, 0), rotSpeed = NumberRange.new(-220, 220), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.1, 0), NumberSequenceKeypoint.new(0.85, 0), NumberSequenceKeypoint.new(1, 1) }), raw = true, emitDir = Enum.NormalId.Front },
		{ tex = "Petal", rate = 3, life = NumberRange.new(3, 5), size = grow(0.5, 0.5), speed = NumberRange.new(14, 22), spread = Vector2.new(15, 15), accel = Vector3.new(0, -1, 0), rotSpeed = NumberRange.new(-260, 260), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.1, 0), NumberSequenceKeypoint.new(0.85, 0), NumberSequenceKeypoint.new(1, 1) }), raw = true, emitDir = Enum.NormalId.Front },
	} },
	Motes = { loop = true, colors = { Color3.fromRGB(255, 246, 216), Color3.fromRGB(255, 231, 160) }, emitters = { { tex = "Mote", rate = 18, life = NumberRange.new(4, 7), size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.3, 0.25), NumberSequenceKeypoint.new(1, 0) }), speed = NumberRange.new(0.3, 1), spread = Vector2.new(180, 180), transparency = NumberSequence.new(0.2), light = 1 } } },
	Pollen = { loop = true, colors = { Color3.fromRGB(255, 248, 190), Color3.fromRGB(220, 255, 170) }, emitters = { { tex = "Mote", rate = 25, life = NumberRange.new(5, 8), size = grow(0.15, 0.1), speed = NumberRange.new(2, 4), spread = Vector2.new(30, 30), transparency = FADE, light = 0.6, emitDir = Enum.NormalId.Front } } },
	Rain = { loop = true, colors = { Color3.fromRGB(207, 230, 255), Color3.fromRGB(159, 200, 240) }, emitters = { { tex = "Rain", rate = 260, life = NumberRange.new(0.8), size = grow(1.6, 1.6), speed = NumberRange.new(70, 80), spread = Vector2.new(3, 3), transparency = NumberSequence.new(0.35), face = Enum.ParticleOrientation.VelocityParallel, emitDir = Enum.NormalId.Bottom } } },
	CloudLayer = { loop = true, colors = { Color3.fromRGB(255, 255, 255), Color3.fromRGB(235, 242, 255) }, emitters = { { tex = "CloudSoft", rate = 2, life = NumberRange.new(30, 40), size = grow(60, 80), speed = NumberRange.new(1, 2), spread = Vector2.new(5, 5), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.2, 0.15), NumberSequenceKeypoint.new(0.8, 0.15), NumberSequenceKeypoint.new(1, 1) }), rotSpeed = NumberRange.new(-2, 2), emitDir = Enum.NormalId.Front } } },
	FogSheet = { loop = true, colors = { Color3.fromRGB(230, 236, 245), Color3.fromRGB(210, 220, 235) }, emitters = { { tex = "Fog", rate = 3, life = NumberRange.new(10, 14), size = grow(30, 40), speed = NumberRange.new(0.5, 1.5), spread = Vector2.new(180, 0), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.3, 0.6), NumberSequenceKeypoint.new(0.7, 0.6), NumberSequenceKeypoint.new(1, 1) }) } } },
	Splash = { loop = true, colors = { Color3.fromRGB(230, 250, 255), Color3.fromRGB(180, 235, 255) }, emitters = {
		{ tex = "Splash", rate = 4, life = NumberRange.new(0.6), size = grow(3, 7), transparency = POP, face = Enum.ParticleOrientation.VelocityPerpendicular, speed = NumberRange.new(0.01), spread = Vector2.zero },
		{ tex = "Puff", rate = 6, life = NumberRange.new(1, 1.6), size = grow(2, 5), speed = NumberRange.new(3, 6), spread = Vector2.new(70, 70), drag = 1, transparency = NumberSequence.new(0.4, 1) },
		{ tex = "Droplet", rate = 20, life = NumberRange.new(0.6, 0.9), size = grow(0.4, 0.2), speed = NumberRange.new(12, 20), spread = Vector2.new(50, 50), accel = Vector3.new(0, -60, 0), transparency = FADE, colorIndex = 2 },
	} },
	BiomeWisps = { loop = true, colors = ELEMENT_COLORS.Shadow, emitters = { { tex = "Wisp", rate = 12, life = NumberRange.new(3, 5), size = grow(2, 4), speed = NumberRange.new(1, 2), spread = Vector2.new(40, 40), rotSpeed = NumberRange.new(-40, 40), transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.4, 0.5), NumberSequenceKeypoint.new(1, 1) }), light = 0.5, shape = Enum.ParticleEmitterShape.Box, shapeSize = Vector3.new(100, 6, 100) } } },
}

-- One hit preset per element.
local HIT_TEX = {
	Fire = { "Flame", "Ember" }, Storm = { "Bolt", "Spark" }, Ice = { "Snowflake", "Sparkle4" },
	Shadow = { "Wisp", "Ember" }, Water = { "Droplet", "Bubble" }, Nature = { "Leaf", "Petal" },
}
for element, tex in HIT_TEX do
	local raw = element == "Nature"
	PRESETS[element .. "Hit"] = {
		colors = ELEMENT_COLORS[element],
		emitters = {
			{ tex = tex[1], count = 14, life = NumberRange.new(0.5, 0.9), size = grow(1.8, 0.4), speed = NumberRange.new(8, 18), spread = Vector2.new(180, 180), drag = 2, rotSpeed = NumberRange.new(-180, 180), transparency = FADE, light = if raw then 0 else 1, raw = raw },
			{ tex = tex[2], count = 18, life = NumberRange.new(0.6, 1), size = grow(0.6, 0.1), speed = NumberRange.new(10, 24), spread = Vector2.new(180, 180), drag = 2, transparency = FADE, light = if raw then 0 else 1, colorIndex = 2, raw = raw },
			{ tex = "Shockwave", count = 1, life = NumberRange.new(0.45), size = grow(1, 12), transparency = POP, light = 1, face = Enum.ParticleOrientation.VelocityPerpendicular, speed = NumberRange.new(0.01), spread = Vector2.zero },
		},
	}
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
		e.FlipbookMode = Enum.ParticleFlipbookMode.Loop
	end
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
