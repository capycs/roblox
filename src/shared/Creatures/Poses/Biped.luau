--!strict
-- Two-legged animation (boxers, birds, floating titans). Mirrors poseBiped in
-- tools/art/poses.js 1:1. Same bone names as Quadruped: Front* bones are arms
-- (hang down; +rx swings the hand forward, +rx on the forearm bends the elbow),
-- Back* bones are legs. +rx on Spine/Chest/Head pitches up, -rx on Jaw opens.
--
-- Style keys on top of Quadruped's: hover (float instead of stepping, bob height),
-- armSwing, guard (fists modelled up: punches straighten the elbow), attack =
-- "punch" | "slam" | "peck", hop (both legs together).

local TAU = math.pi * 2
local sin, cos, max, min = math.sin, math.cos, math.max, math.min

local function ss(a: number, b: number, x: number): number
	local t = min(1, max(0, (x - a) / (b - a)))
	return t * t * (3 - 2 * t)
end

local DEFAULT = {
	tip = "TailTip",
	dur = { Idle = 2.4, Walk = 1.0, Run = 0.6, Attack = 1.1, Roar = 2.2 },
	walk = { 0.45, 0.7, 0.4, 0.5 },
	run = { 0.85, 1.0, 0.8, 0.8 },
	bob = 1,
	sway = 1,
	roll = 0,
	tail = 1,
	attack = "punch",
	wings = false,
	wingRest = 0,
	hop = 0,
	hover = 0,
	armSwing = 0.45,
	guard = false,
}
local LOOPS = { Idle = true, Walk = true, Run = true, Attack = false, Roar = false }

local Biped = {}

function Biped.make(over: any?)
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
		Head = 24, Neck = 28, EarL = 18, EarR = 18,
		Tail1 = 22, Tail2 = 16, Tail3 = 12, Tail4 = 9, [S.tip] = 14,
		FrontLPaw = 20, FrontRPaw = 20,
	}
	if S.wings then
		for _, s in { "L", "R" } do
			Poses.SpringBones["Wing" .. s .. "Lower"] = 20
			Poses.SpringBones["Wing" .. s .. "Tip"] = 14
		end
	end
	Poses.TurnLean = {
		Head = { y = 0.12 }, Neck = { y = 0.06 }, Chest = { y = 0.04 },
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
		local T = S.dur[name]
		local p = TAU * t / T
		local u = t / T
		local hov = S.hover or 0
		local function wing(part: string, v: number, sweep: number?)
			local sw = sweep or 0
			add("WingL" .. part, 0, sw, -v)
			add("WingR" .. part, 0, -sw, v)
		end
		local function arms(rx: number, rz: number, lower: number)
			add("FrontLUpper", rx, 0, -rz); add("FrontRUpper", rx, 0, rz)
			add("FrontLLower", lower); add("FrontRLower", lower)
		end
		local function tail(k: number, sway: number)
			for i = 1, 4 do
				add("Tail" .. i, k, sway * sin(p - i * 0.6) * S.tail)
			end
		end
		local function limbs(off: { number }, a: { number }, names: { string })
			for i, leg in names do
				local ph = p + TAU * off[i]
				local uu = a[1] * sin(ph)
				local l = -a[2] * max(0, cos(ph))
				add(leg .. "Upper", uu); add(leg .. "Lower", l); add(leg .. "Paw", -(uu + l) * 0.8)
			end
		end
		if S.wings and S.wingRest and S.wingRest ~= 0 then
			wing("Upper", S.wingRest, -S.wingRest * 0.4); wing("Lower", S.wingRest * 0.4)
		end

		if name == "Idle" then
			hy = 0.03 * sin(p) * S.bob + hov * sin(p)
			add("Spine", 0.02 * sin(p)); add("Chest", 0.035 * sin(p + 0.4))
			add("Neck", -0.02 * sin(p)); add("Head", 0.05 * sin(p + 1), 0.14 * sin(p * 0.5), 0.04 * sin(p + 0.5))
			arms(0.06 * sin(p + 0.3), 0.1 + 0.03 * sin(p), 0.2 + 0.05 * sin(p + 0.6))
			if hov ~= 0 then
				add("BackLUpper", 0.12 + 0.05 * sin(p)); add("BackLLower", -0.15)
				add("BackRUpper", 0.12 + 0.05 * sin(p + 1)); add("BackRLower", -0.15)
			end
			add("EarL", 0, 0, -0.06 * sin(2 * p)); add("EarR", 0, 0, 0.06 * sin(2 * p + 1))
			add("Jaw", -0.03 * (0.5 + 0.5 * sin(p)))
			tail(0.03 * sin(2 * p), 0.15)
			if S.wings then
				wing("Upper", 0.05 * sin(p), 0.05); wing("Lower", 0.04 * sin(p - 0.6)); wing("Tip", 0.04 * sin(p - 1.2))
			end
		elseif name == "Walk" or name == "Run" then
			local run = name == "Run"
			local k = if run then 1.6 else 1
			if hov ~= 0 then
				hy = hov * sin(p) * 0.6
				add("Spine", -0.1 * k); add("Chest", -0.05 * k + 0.03 * sin(p)); add("Head", 0.12 * k)
				for _, s in { "L", "R" } do
					add("Back" .. s .. "Upper", 0.3 * k + 0.08 * sin(p)); add("Back" .. s .. "Lower", -0.25 * k)
				end
				arms(-0.25 * k + 0.15 * sin(p), 0.18, 0.35 * k)
				add("FrontLUpper", 0.12 * sin(p)); add("FrontRUpper", -0.12 * sin(p))
			elseif S.hop ~= 0 then
				hy = S.hop * k * max(0, sin(p)); add("Hips", -0.1 * cos(p)); add("Spine", -0.12 * k)
				for _, s in { "L", "R" } do
					add("Back" .. s .. "Upper", -0.5 * k * cos(p))
					add("Back" .. s .. "Lower", -0.6 * k * max(0, -sin(p)) - 0.2)
					add("Back" .. s .. "Paw", 0.4 * k * cos(p))
				end
				arms(0.7, 0.12, 1.4); add("Head", 0.1 * k + 0.08 * cos(p))
				for i = 1, 4 do
					add("Tail" .. i, 0.12 * cos(p - i * 0.5))
				end
			else
				local legA = if run then { S.run[3], S.run[4] } else { S.walk[3], S.walk[4] }
				limbs({ 0, 0.5 }, legA, { "BackL", "BackR" })
				limbs({ 0.5, 0 }, { S.armSwing * k, 0 }, { "FrontL", "FrontR" })
				add("FrontLLower", if run then 1.2 else 0.25); add("FrontRLower", if run then 1.2 else 0.25)
				add("FrontLUpper", 0, 0, -0.08); add("FrontRUpper", 0, 0, 0.08)
				hy = (if run then 0.09 else 0.04) * cos(2 * p) * S.bob + (if run then 0.06 else 0)
				add("Hips", 0, 0.06 * sin(p) * S.sway)
				add("Spine", if run then -0.2 else -0.04, -0.05 * sin(p) * S.sway)
				add("Chest", 0, -0.06 * sin(p) * S.sway, 0.03 * sin(p) + S.roll * sin(p))
				add("Head", (if run then 0.15 else 0.04) + 0.03 * sin(2 * p), 0.05 * sin(p))
				tail(if run then 0.1 else 0, 0.2)
			end
			add("EarL", (if run then 0.4 else 0) + 0.05 * sin(2 * p + 1)); add("EarR", (if run then 0.4 else 0) + 0.05 * sin(2 * p + 2))
			if S.wings then
				local f = if run then 0.5 else 0.08
				wing("Upper", (if run then 0.2 else -0.1) + f * sin(2 * p), if run then 0.1 else 0.3)
				wing("Lower", f * 0.7 * sin(2 * p - 0.8), 0.2); wing("Tip", f * 0.6 * sin(2 * p - 1.6))
			end
		elseif name == "Attack" then
			local w = ss(0, 0.3, u) * (1 - ss(0.33, 0.42, u))
			local l = ss(0.32, 0.42, u) * (1 - ss(0.6, 1.0, u))
			if S.attack == "slam" then
				local raise = ss(0, 0.35, u) * (1 - ss(0.42, 0.5, u))
				local slam = ss(0.42, 0.5, u) * (1 - ss(0.7, 1.0, u))
				arms(2.5 * raise + 1.0 * slam, 0.15 + 0.2 * raise, 0.5 * raise + 0.1 * slam)
				add("Spine", 0.15 * raise - 0.4 * slam); add("Chest", 0.1 * raise - 0.15 * slam); add("Head", 0.25 * raise - 0.1 * slam)
				hy = 0.35 * raise - 0.4 * slam
				for _, s in { "L", "R" } do
					add("Back" .. s .. "Upper", 0.4 * slam); add("Back" .. s .. "Lower", -0.5 * slam)
				end
			elseif S.attack == "peck" then
				add("Spine", 0.1 * w - 0.35 * l); add("Neck", 0.25 * w - 0.4 * l); add("Head", 0.3 * w - 0.5 * l)
				add("Jaw", -0.5 * ss(0.25, 0.38, u) * (1 - ss(0.45, 0.55, u)))
				hy = 0.25 * w; hz = 0.2 * w - 0.6 * l
				for _, s in { "L", "R" } do
					add("Back" .. s .. "Upper", -0.3 * w + 0.4 * l); add("Back" .. s .. "Lower", -0.5 * w)
				end
				if S.wings then
					wing("Upper", 0.9 * w + 0.3 * l, -0.3 * w + 0.5 * l); wing("Lower", 0.4 * w); wing("Tip", 0.3 * w + 0.2 * l)
				end
			else -- punch: right jab, left guard
				if S.guard then
					add("FrontRUpper", -0.3 * w + 1.35 * l, 0, 0.1); add("FrontRLower", 0.5 * w - 0.85 * l)
				else
					add("FrontRUpper", -0.4 * w + 1.55 * l, 0, 0.1); add("FrontRLower", 1.7 * w + 0.15 * l)
				end
				add("FrontLUpper", (if S.guard then 0.25 else 0.9) * (w + l), 0, -0.1)
				add("FrontLLower", (if S.guard then 0.2 else 1.5) * (w + l))
				add("Chest", 0, 0.45 * w - 0.55 * l); add("Spine", -0.05 * w - 0.15 * l, 0.1 * w - 0.15 * l)
				add("Head", 0.05 * w - 0.05 * l, -0.2 * w + 0.2 * l)
				hy = -0.12 * w; hz = 0.15 * w - 0.5 * l
				add("BackLUpper", 0.35 * l); add("BackLLower", -0.4 * l); add("BackRUpper", -0.3 * l); add("BackRLower", -0.2 * w)
				if S.hop ~= 0 then
					for i = 1, 4 do
						add("Tail" .. i, -0.15 * l)
					end
				end
			end
			add("EarL", 0.4 * (w + l)); add("EarR", 0.4 * (w + l))
		elseif name == "Roar" then
			local rise = ss(0, 0.2, u) * (1 - ss(0.78, 0.98, u))
			local roar = ss(0.15, 0.25, u) * (1 - ss(0.7, 0.85, u))
			hy = 0.12 * rise + hov * 1.5 * rise
			add("Spine", 0.1 * rise); add("Chest", 0.15 * rise)
			add("Head", 0.35 * rise - 0.1 * roar, 0.1 * roar * sin(TAU * u * 3), 0.03 * roar * sin(TAU * u * 25))
			add("Jaw", -0.7 * roar - 0.05 * roar * sin(TAU * u * 36))
			arms(0.3 * rise, 1.15 * roar + 0.1, 0.35 * rise)
			add("FrontLUpper", 0, 0.3 * roar); add("FrontRUpper", 0, -0.3 * roar)
			for _, s in { "L", "R" } do
				add("Back" .. s .. "Upper", -0.1 * rise); add("Back" .. s .. "Lower", 0.15 * rise)
			end
			add("EarL", 0.6 * roar); add("EarR", 0.6 * roar)
			tail(-0.15 * roar, 0.15 * roar)
			if S.wings then
				wing("Upper", 0.7 * rise + 0.25 * roar * sin(TAU * u * 5), -0.2 * rise)
				wing("Lower", 0.25 * rise + 0.2 * roar * sin(TAU * u * 5 - 0.8))
				wing("Tip", 0.2 * rise + 0.18 * roar * sin(TAU * u * 5 - 1.6))
			end
		end

		local rot: { [string]: Vector3 } = {}
		for b, r in acc do
			rot[b] = Vector3.new(r[1], r[2], r[3])
		end
		return rot, Vector3.new(hx, hy, hz)
	end

	return Poses
end

return Biped
