--!strict
-- Fish animation: swims in the air. Mirrors poseFish in tools/art/poses.js 1:1.
-- The body undulates from head to tail (ry waves), Front* bones are pectoral fins,
-- Back* bones are pelvic fins, Ear* bones are whiskers. Same bone names as Quadruped.

local TAU = math.pi * 2
local sin, max, min = math.sin, math.max, math.min

local function ss(a: number, b: number, x: number): number
	local t = min(1, max(0, (x - a) / (b - a)))
	return t * t * (3 - 2 * t)
end

local DEFAULT = {
	tip = "TailTip",
	dur = { Idle = 2.4, Walk = 1.2, Run = 0.7, Attack = 1.0, Roar = 2.4 },
	tail = 1,
}
local LOOPS = { Idle = true, Walk = true, Run = true, Attack = false, Roar = false }

local Fish = {}

function Fish.make(over: any?)
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
	Poses.SpringBones = {
		Head = 20, EarL = 12, EarR = 12,
		Tail1 = 18, Tail2 = 14, Tail3 = 11, Tail4 = 9, [S.tip] = 8,
		FrontLLower = 12, FrontRLower = 12, FrontLPaw = 10, FrontRPaw = 10,
	}
	Poses.TurnLean = {
		Head = { y = 0.15 }, Chest = { y = 0.05 },
		Tail1 = { y = -0.08 }, Tail2 = { y = -0.12 }, Tail3 = { y = -0.16 }, Tail4 = { y = -0.2 },
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
		local T = S.dur[name]
		local p = TAU * t / T
		local u = t / T
		local function swim(amp: number, ph: number?)
			local q = ph or p
			add("Head", 0, 0.12 * amp * sin(q + 0.6)); add("Chest", 0, -0.06 * amp * sin(q + 0.3))
			add("Hips", 0, 0.1 * amp * sin(q)); add("Spine", 0, -0.15 * amp * sin(q - 0.3))
			for i = 1, 4 do
				add("Tail" .. i, 0, (0.22 + 0.1 * i) * amp * sin(q - 0.8 - i * 0.7) * S.tail)
			end
			add("TailTip", 0, 0.4 * amp * sin(q - 4.0))
		end
		local function fins(amp: number, ph: number, rest: number?)
			local r = rest or 0
			add("FrontLUpper", 0, -r * 0.5, -(amp * sin(ph) + r)); add("FrontRUpper", 0, r * 0.5, amp * sin(ph) + r)
			add("FrontLLower", 0, 0, -amp * 0.6 * sin(ph - 0.7)); add("FrontRLower", 0, 0, amp * 0.6 * sin(ph - 0.7))
			add("BackLUpper", 0, 0, -amp * 0.5 * sin(ph + 1)); add("BackRUpper", 0, 0, amp * 0.5 * sin(ph + 1))
		end
		local function whiskers(amp: number, ph: number)
			add("EarL", amp * sin(ph), 0.5 * amp * sin(ph * 0.7))
			add("EarR", amp * sin(ph + 0.8), -0.5 * amp * sin(ph * 0.7 + 1))
		end

		if name == "Idle" then
			hy = 0.18 * sin(p); add("Spine", 0.03 * sin(p + 1))
			swim(0.5); fins(0.35, 2 * p); whiskers(0.15, p); add("Jaw", -0.06 * (0.5 + 0.5 * sin(2 * p)))
		elseif name == "Walk" or name == "Run" then
			local run = name == "Run"
			hy = (if run then 0.1 else 0.14) * sin(2 * p); add("Spine", if run then -0.08 else -0.03)
			swim(if run then 1.0 else 0.75)
			fins(if run then 0.15 else 0.3, 2 * p, if run then 0.6 else 0.15)
			whiskers(if run then 0.35 else 0.2, p)
		elseif name == "Attack" then
			local w = ss(0, 0.3, u) * (1 - ss(0.33, 0.42, u))
			local l = ss(0.32, 0.42, u) * (1 - ss(0.6, 1.0, u))
			hz = 0.4 * w - 1.4 * l; hy = 0.1 * w
			add("Spine", 0.1 * w - 0.08 * l); add("Head", 0.15 * w - 0.1 * l)
			add("Jaw", -0.7 * ss(0.28, 0.38, u) * (1 - ss(0.48, 0.6, u)))
			for i = 1, 4 do
				add("Tail" .. i, 0, (0.5 * w - 0.6 * l) * (0.6 + 0.2 * i))
			end
			fins(0.2, TAU * u * 4, 0.8 * l - 0.3 * w); whiskers(0.4 * (w + l), TAU * u * 3)
		elseif name == "Roar" then
			-- leaps up in an arc, arches, fans everything out, splashes back down
			local rise = ss(0, 0.35, u) * (1 - ss(0.6, 0.95, u))
			local arch = ss(0.15, 0.4, u) * (1 - ss(0.55, 0.85, u))
			hy = 1.6 * rise
			add("Hips", 0.35 * arch - 0.15 * ss(0.55, 0.8, u) * (1 - ss(0.85, 1, u)))
			add("Spine", 0.2 * arch); add("Chest", 0.15 * arch); add("Head", 0.25 * arch)
			for i = 1, 4 do
				add("Tail" .. i, 0.18 * arch, 0.25 * sin(TAU * u * 4 - i) * arch)
			end
			add("Jaw", -0.6 * arch); fins(0.25, TAU * u * 6, 0.9 * arch); whiskers(0.5 * arch, TAU * u * 4)
			swim(0.4 * (1 - arch))
		end

		local rot: { [string]: Vector3 } = {}
		for b, r in acc do
			rot[b] = Vector3.new(r[1], r[2], r[3])
		end
		return rot, Vector3.new(hx, hy, hz)
	end

	return Poses
end

return Fish
