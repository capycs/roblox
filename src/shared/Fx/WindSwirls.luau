--!strict
-- Anime-style wind swirls: thin white Trails that blow along the wind, wobble, and curl
-- into one or two loops before fading. Spawned at random over sky islands by
-- WindSwirls.client.luau. The path maths here is mirrored in tools/art/fx.js
-- (windSwirlPath) for the design previews.
--
--   local g = WindSwirls.spawn(origin, windDir, { color = Color3.new(1, 1, 1) })
--   -- g:Step(dt) every frame until it returns false (it cleans itself up)

local AssetIds = require(script.Parent.Parent.AssetIds)

local WindSwirls = {}

export type Params = {
	speed: number, -- studs/sec along the wind
	duration: number, -- seconds the head keeps moving
	wobbleAmp: number, -- side-to-side drift (studs)
	wobbleFreq: number, -- wobbles per stud
	rise: number, -- gentle up/down drift (studs)
	loops: { { at: number, radius: number, tilt: number } }, -- at = 0..1 along the path
	phase: number,
}

local LOOP_STRETCH = 1.8 -- >1 turns the cycloid into a real loop-de-loop

-- Offset of the swirl head from its origin after travelling for t seconds, in the
-- (forward, up, side) basis. Pure function so it can be tested and previewed.
function WindSwirls.offset(p: Params, t: number): (number, number, number)
	local d = p.speed * t
	local length = p.speed * p.duration
	local fwd = d
	local up = p.rise * math.sin(d * 0.05 + p.phase * 2)
	local side = p.wobbleAmp * math.sin(d * p.wobbleFreq * math.pi * 2 + p.phase)
	for _, loop in p.loops do
		local d0 = loop.at * length
		local span = 2 * math.pi * loop.radius
		if d > d0 then
			local u = math.min((d - d0) / span, 1)
			local phi = u * 2 * math.pi
			local back = LOOP_STRETCH * loop.radius * math.sin(phi)
			local lift = loop.radius * (1 - math.cos(phi))
			fwd -= back
			-- the loop plane leans sideways by tilt (radians)
			up += lift * math.cos(loop.tilt)
			side += lift * math.sin(loop.tilt)
		end
	end
	return fwd, up, side
end

local rng = Random.new()

function WindSwirls.randomParams(strength: number?): Params
	local s = strength or 1
	local loops = {}
	local n = if rng:NextNumber() < 0.25 then 0 elseif rng:NextNumber() < 0.7 then 1 else 2
	for i = 1, n do
		table.insert(loops, { at = 0.25 + (i - 1) * 0.3 + rng:NextNumber() * 0.1, radius = rng:NextNumber(2.2, 4), tilt = rng:NextNumber(-0.6, 0.6) })
	end
	return {
		speed = rng:NextNumber(26, 38) * s,
		duration = rng:NextNumber(1.3, 2.1),
		wobbleAmp = rng:NextNumber(0.6, 1.8),
		wobbleFreq = rng:NextNumber(0.02, 0.05),
		rise = rng:NextNumber(0.5, 2),
		loops = loops,
		phase = rng:NextNumber(0, math.pi * 2),
	}
end

export type Opts = { color: Color3?, strands: number?, strength: number?, width: number?, lifetime: number? }
export type Gust = { Step: (self: Gust, dt: number) -> boolean, Destroy: (self: Gust) -> () }

local TRAIL_WIDTH = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 0.15),
	NumberSequenceKeypoint.new(0.12, 1),
	NumberSequenceKeypoint.new(0.65, 0.7),
	NumberSequenceKeypoint.new(1, 0),
})
local TRAIL_ALPHA = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 0.1),
	NumberSequenceKeypoint.new(0.5, 0.3),
	NumberSequenceKeypoint.new(1, 1),
})

-- Spawns one gust (1-3 parallel strands). Returns nil if the WindTrail texture has no
-- asset ID yet.
function WindSwirls.spawn(origin: Vector3, windDir: Vector3, opts: Opts?): Gust?
	local o = opts or {}
	local tex = AssetIds.get(AssetIds.Fx.WindTrail)
	if not tex then
		return nil
	end
	local f = Vector3.new(windDir.X, 0, windDir.Z)
	f = if f.Magnitude > 1e-3 then f.Unit else Vector3.xAxis
	local upV = Vector3.yAxis
	local sideV = f:Cross(upV).Unit
	local params = WindSwirls.randomParams(o.strength)
	local lifetime = o.lifetime or rng:NextNumber(0.45, 0.7)

	type Strand = { a0: Attachment, a1: Attachment, trail: Trail, delay: number, offset: Vector3, width: number }
	local strands: { Strand } = {}
	for i = 1, o.strands or rng:NextInteger(1, 3) do
		local a0, a1 = Instance.new("Attachment"), Instance.new("Attachment")
		a0.Name, a1.Name = "Swirl0", "Swirl1"
		a0.WorldPosition, a1.WorldPosition = origin, origin
		a0.Parent, a1.Parent = workspace.Terrain, workspace.Terrain
		local t = Instance.new("Trail")
		t.Attachment0, t.Attachment1 = a0, a1
		t.Texture = tex
		t.TextureMode = Enum.TextureMode.Stretch
		t.FaceCamera = true
		t.Lifetime = lifetime * (1 - (i - 1) * 0.15)
		t.MinLength = 0.05
		t.LightEmission = 0.7
		t.LightInfluence = 0.2
		t.WidthScale = TRAIL_WIDTH
		t.Transparency = TRAIL_ALPHA
		t.Color = ColorSequence.new(o.color or Color3.new(1, 1, 1))
		t.Parent = a0
		table.insert(strands, {
			a0 = a0,
			a1 = a1,
			trail = t,
			delay = (i - 1) * rng:NextNumber(0.04, 0.12),
			offset = sideV * ((i - 1) * rng:NextNumber(0.7, 1.4) * (if i % 2 == 0 then 1 else -1)) + upV * ((i - 1) * rng:NextNumber(-0.5, 0.5)),
			width = (o.width or 0.6) * (1 - (i - 1) * 0.25),
		})
	end

	local age = 0
	local gust = {}
	function gust.Step(_self, dt: number): boolean
		age += dt
		local moving = false
		for _, s in strands do
			local t = age - s.delay
			if t >= 0 and t <= params.duration then
				moving = true
				local fw, up, sd = WindSwirls.offset(params, t)
				local pos = origin + s.offset + f * fw + upV * up + sideV * sd
				s.a0.WorldPosition = pos
				s.a1.WorldPosition = pos + upV * s.width
			elseif t > params.duration then
				s.trail.Enabled = false
			end
		end
		if not moving and age > params.duration + lifetime + 0.3 then
			gust:Destroy()
			return false
		end
		return true
	end
	function gust.Destroy(_self)
		for _, s in strands do
			s.a0:Destroy()
			s.a1:Destroy()
		end
		table.clear(strands)
	end
	return gust :: any
end

-- Length of a gust's path in studs (for placing the origin upwind of a target point).
function WindSwirls.typicalLength(): number
	return 32 * 1.7
end

return WindSwirls
