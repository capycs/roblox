--!strict
-- Emberfang animation poses. Mirrors tools/emberfang/poses.js 1:1 (that file bakes
-- the same motion into the GLB and the preview renders). Keep both in sync.
--
-- pose(clip, t) -> rot: { [boneName]: Vector3 (rx, ry, rz radians) }, hips: Vector3 (stud offset)
-- Bone rest frames are axis-aligned with the model: +rx swings a leg's paw forward,
-- +rx tips an ear or tail segment backward, -rx on Jaw opens the mouth.

local TAU = math.pi * 2
local sin, cos, max, min = math.sin, math.cos, math.max, math.min

local function ss(a: number, b: number, x: number): number
	local t = min(1, max(0, (x - a) / (b - a)))
	return t * t * (3 - 2 * t)
end

local Poses = {}

Poses.Clips = {
	Idle = { duration = 2.4, loop = true },
	Walk = { duration = 1.0, loop = true },
	Run = { duration = 0.6, loop = true },
	Attack = { duration = 1.1, loop = false },
	Roar = { duration = 2.2, loop = false },
}

-- Bones the animator smooths with springs (secondary motion) and how loose they are.
Poses.SpringBones = {
	Head = 26, Neck = 30,
	EarL = 18, EarR = 18,
	Tail1 = 22, Tail2 = 16, Tail3 = 12, Tail4 = 9, TailFlame = 14,
}
-- How much each bone leans into turns (multiplied by yaw rate, radians/sec).
Poses.TurnLean = {
	Head = { y = 0.12 }, Neck = { y = 0.06 },
	Tail1 = { y = -0.05 }, Tail2 = { y = -0.08 }, Tail3 = { y = -0.11 }, Tail4 = { y = -0.14 },
}

type Rot = { [string]: Vector3 }

function Poses.pose(name: string, t: number): (Rot, Vector3)
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
	local T = Poses.Clips[name].duration
	local p = TAU * t / T

	local function legs(off: { number }, fu: number, fl: number, bu: number, bl: number)
		local defs = {
			{ "FrontL", off[1], fu, fl }, { "FrontR", off[2], fu, fl },
			{ "BackL", off[3], bu, bl }, { "BackR", off[4], bu, bl },
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
	local function flicker(k: number)
		add("TailFlame", k * (0.07 * sin(5 * p) + 0.04 * sin(9 * p + 1)), 0, k * 0.07 * sin(7 * p + 2))
	end

	if name == "Idle" then
		hy = 0.025 * sin(p)
		add("Spine", 0.02 * sin(p)); add("Chest", 0.035 * sin(p))
		add("Neck", -0.03 * sin(p))
		add("Head", 0.04 * sin(p + 1), 0.1 * sin(p), 0.05 * sin(p + 0.5))
		add("EarL", 0, 0, -0.06 * sin(2 * p))
		add("EarR", 0.25 * ss(1.4, 1.5, t) * (1 - ss(1.6, 1.75, t)), 0, 0.06 * sin(2 * p + 1))
		for i = 1, 4 do
			add("Tail" .. i, 0.05 * sin(2 * p - i * 0.5), 0.18 * sin(p - i * 0.7) * (0.6 + 0.25 * i))
		end
		flicker(1)
	elseif name == "Walk" then
		legs({ 0, 0.5, 0.5, 0 }, 0.45, 0.7, 0.4, 0.5)
		hy = 0.035 * cos(2 * p)
		add("Spine", 0, 0.05 * sin(p)); add("Chest", 0, -0.05 * sin(p), 0.03 * sin(p))
		add("Head", 0.04 * sin(2 * p), -0.04 * sin(p))
		add("EarL", 0.05 * sin(2 * p + 1)); add("EarR", 0.05 * sin(2 * p + 2))
		for i = 1, 4 do
			add("Tail" .. i, -0.06, 0.22 * sin(p - i * 0.6))
		end
		flicker(1)
	elseif name == "Run" then
		legs({ 0, 0.08, 0.5, 0.58 }, 0.85, 1.0, 0.8, 0.8)
		hy = 0.12 * sin(p - 0.8) + 0.05
		add("Hips", 0.08 * sin(p))
		add("Spine", 0.12 * sin(p)); add("Chest", -0.1 * sin(p))
		add("Neck", -0.15); add("Head", -0.12 + 0.08 * sin(p + 1))
		add("EarL", 0.55 + 0.05 * sin(2 * p)); add("EarR", 0.55 + 0.05 * sin(2 * p + 1))
		add("Jaw", -0.12)
		for i = 1, 4 do
			add("Tail" .. i, 0.14 + 0.12 * sin(p - i * 0.8), 0.05 * sin(p - i))
		end
		flicker(0.6)
	elseif name == "Attack" then
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
		add("Neck", -0.25 * w + 0.2 * l); add("Head", -0.2 * w + 0.15 * l)
		add("Jaw", -0.65 * open)
		add("EarL", 0.5 * (w + l)); add("EarR", 0.5 * (w + l))
		for i = 1, 4 do
			add("Tail" .. i, -0.25 * w + 0.3 * l, 0.06 * w * sin(TAU * t * 8 - i))
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
			add("Tail" .. i, -0.35 * roar / 2, 0.15 * roar * sin(TAU * t * 3 - i))
		end
		flicker(1 + 2.5 * roar)
	end

	local rot: Rot = {}
	for b, r in acc do
		rot[b] = Vector3.new(r[1], r[2], r[3])
	end
	return rot, Vector3.new(hx, hy, hz)
end

return Poses
