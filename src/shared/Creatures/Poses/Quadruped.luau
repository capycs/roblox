--!strict
-- Shared quadruped animation. Mirrors tools/art/poses.js 1:1 (that file bakes
-- the same motion into each GLB and the preview renders). Keep both in sync.
--
-- Quadruped.make(style) -> poses module with Clips, SpringBones, TurnLean and
-- pose(clip, t) -> rot: { [boneName]: Vector3 (rx, ry, rz radians) }, hips: Vector3 (stud offset)
-- Bone rest frames are axis-aligned with the model: +rx swings a leg's paw forward,
-- +rx tips an ear or tail segment backward, -rx on Jaw opens the mouth, and +rz
-- raises the right wing (-rz raises the left).

local TAU = math.pi * 2
local sin, cos, max, min = math.sin, math.cos, math.max, math.min

local function ss(a: number, b: number, x: number): number
	local t = min(1, max(0, (x - a) / (b - a)))
	return t * t * (3 - 2 * t)
end

export type Style = {
	tip: string?,
	dur: { [string]: number }?,
	walk: { number }?,
	run: { number }?,
	gallop: { number }?,
	bob: number?,
	sway: number?,
	roll: number?,
	tail: number?,
	neck: number?,
	headLow: number?,
	attack: string?,
	wings: boolean?,
	wingRest: number?, -- wings held part-open in every clip (radians)
}

local DEFAULT = {
	tip = "TailFlame",
	dur = { Idle = 2.4, Walk = 1.0, Run = 0.6, Attack = 1.1, Roar = 2.2 },
	walk = { 0.45, 0.7, 0.4, 0.5 }, -- front upper, front lower, back upper, back lower
	run = { 0.85, 1.0, 0.8, 0.8 },
	gallop = { 0, 0.08, 0.5, 0.58 }, -- run phase offsets FL, FR, BL, BR
	bob = 1,
	sway = 1,
	roll = 0,
	tail = 1,
	neck = 0,
	headLow = 0,
	attack = "bite", -- or "charge"
	wings = false,
}

local LOOPS = { Idle = true, Walk = true, Run = true, Attack = false, Roar = false }

local Quadruped = {}

function Quadruped.make(over: Style?)
	local o: any = over or {}
	local S: any = {}
	for k, v in DEFAULT do
		S[k] = if o[k] ~= nil then o[k] else v
	end
	S.dur = table.clone(DEFAULT.dur)
	for k, v in (o.dur or {}) :: { [string]: number } do
		S.dur[k] = v
	end

	local Poses = {}

	Poses.Clips = {}
	for name, d in S.dur do
		Poses.Clips[name] = { duration = d, loop = LOOPS[name] }
	end

	-- Bones smoothed with springs (secondary motion) and their stiffness.
	Poses.SpringBones = {
		Head = 26, Neck = 30,
		EarL = 18, EarR = 18,
		Tail1 = 22, Tail2 = 16, Tail3 = 12, Tail4 = 9,
		[S.tip] = 14,
	}
	if S.wings then
		for _, s in { "L", "R" } do
			Poses.SpringBones["Wing" .. s .. "Lower"] = 20
			Poses.SpringBones["Wing" .. s .. "Tip"] = 14
		end
	end
	-- How much each bone leans into turns (multiplied by yaw rate, radians/sec).
	Poses.TurnLean = {
		Head = { y = 0.12 }, Neck = { y = 0.06 },
		Tail1 = { y = -0.05 }, Tail2 = { y = -0.08 }, Tail3 = { y = -0.11 }, Tail4 = { y = -0.14 },
	}

	function Poses.pose(name: string, t: number): ({ [string]: Vector3 }, Vector3)
		local acc: { [string]: { number } } = {}
		local function add(b: string, x: number?, y: number?, z: number?)
			local r = acc[b]
			if not r then
				r = { 0, 0, 0 }
				acc[b] = r
			end
			r[1] += x or 0
			r[2] += y or 0
			r[3] += z or 0
		end
		local hx, hy, hz = 0, 0, 0
		local p = TAU * t / S.dur[name]

		local function legs(off: { number }, a: { number })
			local defs = {
				{ "FrontL", off[1], a[1], a[2] }, { "FrontR", off[2], a[1], a[2] },
				{ "BackL", off[3], a[3], a[4] }, { "BackR", off[4], a[3], a[4] },
			}
			for _, d in defs do
				local ph = p + TAU * d[2]
				local u = d[3] * sin(ph)
				local l = -d[4] * max(0, cos(ph))
				add(d[1] .. "Upper", u)
				add(d[1] .. "Lower", l)
				add(d[1] .. "Paw", -(u + l) * 0.8)
			end
		end
		-- positive v raises both wings, sweep > 0 swings them back
		local function wing(part: string, v: number, sweep: number?)
			local sw = sweep or 0
			add("WingL" .. part, 0, sw, -v)
			add("WingR" .. part, 0, -sw, v)
		end
		local function flicker(k: number)
			add(S.tip, k * (0.07 * sin(5 * p) + 0.04 * sin(9 * p + 1)), 0, k * 0.07 * sin(7 * p + 2))
		end

		if S.wings and S.wingRest then
			wing("Upper", S.wingRest, -S.wingRest * 0.4)
			wing("Lower", S.wingRest * 0.4)
		end

		if name == "Idle" then
			hy = 0.025 * sin(p) * S.bob
			add("Spine", 0.02 * sin(p)); add("Chest", 0.035 * sin(p))
			add("Neck", -0.03 * sin(p), S.neck * 0.08 * sin(p + 0.6))
			add("Head", 0.04 * sin(p + 1), 0.1 * sin(p), 0.05 * sin(p + 0.5))
			add("EarL", 0, 0, -0.06 * sin(2 * p))
			add("EarR", 0.25 * ss(1.4, 1.5, t) * (1 - ss(1.6, 1.75, t)), 0, 0.06 * sin(2 * p + 1))
			for i = 1, 4 do
				add("Tail" .. i, 0.05 * sin(2 * p - i * 0.5), 0.18 * sin(p - i * 0.7) * (0.6 + 0.25 * i) * S.tail)
			end
			if S.wings then
				wing("Upper", 0.06 * sin(p), 0.05); wing("Lower", 0.05 * sin(p - 0.6)); wing("Tip", 0.05 * sin(p - 1.2))
			end
			flicker(1)
		elseif name == "Walk" then
			legs({ 0, 0.5, 0.5, 0 }, S.walk)
			hy = 0.035 * cos(2 * p) * S.bob
			add("Spine", 0, 0.05 * sin(p) * S.sway)
			add("Chest", 0, -0.05 * sin(p) * S.sway, 0.03 * sin(p) + S.roll * sin(p))
			add("Neck", S.headLow * 0.5, S.neck * 0.1 * sin(p + 1))
			add("Head", 0.04 * sin(2 * p) + S.headLow * 0.5, -0.04 * sin(p), -S.roll * 0.7 * sin(p))
			add("EarL", 0.05 * sin(2 * p + 1)); add("EarR", 0.05 * sin(2 * p + 2))
			for i = 1, 4 do
				add("Tail" .. i, -0.06, 0.22 * sin(p - i * 0.6) * S.tail)
			end
			if S.wings then
				wing("Upper", -0.15 + 0.06 * sin(2 * p), 0.35); wing("Lower", 0.08 * sin(2 * p - 0.8), 0.25); wing("Tip", 0.06 * sin(2 * p - 1.6))
			end
			flicker(1)
		elseif name == "Run" then
			legs(S.gallop, S.run)
			hy = (0.12 * sin(p - 0.8) + 0.05) * S.bob
			add("Hips", 0.08 * sin(p))
			add("Spine", 0.12 * sin(p), 0.04 * sin(p) * (S.sway - 1))
			add("Chest", -0.1 * sin(p), 0, S.roll * 0.5 * sin(p))
			add("Neck", -0.15 + S.headLow * 0.5, S.neck * 0.06 * sin(p))
			add("Head", -0.12 + 0.08 * sin(p + 1) + S.headLow * 0.5)
			add("EarL", 0.55 + 0.05 * sin(2 * p)); add("EarR", 0.55 + 0.05 * sin(2 * p + 1))
			add("Jaw", -0.12)
			for i = 1, 4 do
				add("Tail" .. i, 0.14 + 0.12 * sin(p - i * 0.8), 0.05 * sin(p - i) * S.tail)
			end
			if S.wings then
				wing("Upper", 0.1 + 0.55 * sin(p), 0.1); wing("Lower", 0.35 * sin(p - 0.8)); wing("Tip", 0.3 * sin(p - 1.5))
			end
			flicker(0.6)
		elseif name == "Attack" then
			local charge = S.attack == "charge"
			local w = ss(0, 0.3, t) * (1 - ss(0.35, 0.45, t))
			local l = ss(0.33, 0.48, t) * (1 - ss(0.6, 1.0, t))
			local open = ss(0.28, 0.42, t) * (1 - ss(0.5, 0.55, t))
			hy = -0.3 * w + 0.15 * l
			hz = 0.25 * w - 0.9 * l
			add("Hips", -0.12 * w + 0.06 * l)
			add("Spine", -0.08 * w + 0.1 * l); add("Chest", -0.05 * w)
			for _, s in { "L", "R" } do
				add("Front" .. s .. "Upper", 0.35 * w + 0.9 * l); add("Front" .. s .. "Lower", -0.7 * w - 0.3 * l); add("Front" .. s .. "Paw", 0.3 * w - 0.4 * l)
				add("Back" .. s .. "Upper", 0.5 * w - 0.6 * l); add("Back" .. s .. "Lower", -0.6 * w + 0.2 * l); add("Back" .. s .. "Paw", 0.1 * w + 0.3 * l)
			end
			if charge then
				add("Neck", -0.2 * w - 0.35 * l); add("Head", -0.3 * w - 0.45 * l); add("Jaw", -0.2 * open)
			else
				add("Neck", -0.25 * w + 0.2 * l); add("Head", -0.2 * w + 0.15 * l); add("Jaw", -0.65 * open)
			end
			add("EarL", 0.5 * (w + l)); add("EarR", 0.5 * (w + l))
			for i = 1, 4 do
				add("Tail" .. i, -0.25 * w + 0.3 * l, 0.06 * w * sin(TAU * t * 8 - i))
			end
			if S.wings then
				wing("Upper", 0.55 * w - 0.2 * l, -0.2 * w + 0.4 * l); wing("Lower", 0.3 * w, 0.2 * l); wing("Tip", 0.25 * w)
			end
			flicker(1 + 1.5 * (w + l))
		elseif name == "Roar" then
			local rise = ss(0, 0.45, t) * (1 - ss(1.7, 2.15, t))
			local roar = ss(0.35, 0.55, t) * (1 - ss(1.55, 1.85, t))
			hy = 0.12 * rise
			add("Hips", 0.08 * rise)
			add("Spine", 0.08 * rise); add("Chest", 0.12 * rise - 0.05 * roar)
			add("Neck", 0.25 * rise - 0.1 * roar)
			add("Head", 0.45 * rise - 0.25 * roar, 0.12 * roar * sin(TAU * t * 1.5), 0.03 * roar * sin(TAU * t * 12))
			add("Jaw", -0.75 * roar - 0.04 * roar * sin(TAU * t * 18))
			add("EarL", 0.6 * roar); add("EarR", 0.6 * roar)
			for _, s in { "L", "R" } do
				add("Front" .. s .. "Upper", -0.15 * rise); add("Front" .. s .. "Lower", 0.1 * rise); add("Front" .. s .. "Paw", 0.05 * rise)
				add("Back" .. s .. "Upper", 0.15 * rise); add("Back" .. s .. "Lower", -0.25 * rise); add("Back" .. s .. "Paw", 0.1 * rise)
			end
			for i = 1, 4 do
				add("Tail" .. i, -0.35 * roar / 2, 0.15 * roar * sin(TAU * t * 3 - i) * S.tail)
			end
			if S.wings then
				wing("Upper", 0.45 * rise + 0.22 * roar * sin(TAU * t * 2.5), -0.15 * rise)
				wing("Lower", 0.15 * rise + 0.18 * roar * sin(TAU * t * 2.5 - 0.8))
				wing("Tip", 0.1 * rise + 0.15 * roar * sin(TAU * t * 2.5 - 1.6))
			end
			flicker(1 + 2.5 * roar)
		end

		local rot: { [string]: Vector3 } = {}
		for b, r in acc do
			rot[b] = Vector3.new(r[1], r[2], r[3])
		end
		return rot, Vector3.new(hx, hy, hz)
	end

	return Poses
end

return Quadruped
