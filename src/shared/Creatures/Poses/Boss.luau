--!strict
-- Boss animation: the quadruped base clips (Idle/Walk/Run/Attack/Roar) plus the boss's own
-- attacks. Mirrors poseBoss in tools/art/poses.js 1:1. Every attack is wind-up (telegraph)
-- -> strike -> recovery; the windows match BossConfig (telegraph/hit times are fractions of
-- the clip). Used when CreatureConfig style.body = "boss".

local Quadruped = require(script.Parent.Quadruped)

local TAU = math.pi * 2
local sin, max, min = math.sin, math.max, math.min

local function ss(a: number, b: number, x: number): number
	local t = min(1, max(0, (x - a) / (b - a)))
	return t * t * (3 - 2 * t)
end

local BOSS_CLIPS = { "FireBreath", "TailSwipe", "Stomp", "Eruption", "Enrage", "Hurt", "Death" }
local DEFAULT_DUR = { FireBreath = 3.0, TailSwipe = 1.8, Stomp = 2.2, Eruption = 3.2, Enrage = 3.0, Hurt = 0.6, Death = 3.0 }

local Boss = {}
Boss.Clips = BOSS_CLIPS

function Boss.make(style: any?)
	local st: any = style or {}
	local base = Quadruped.make(st)
	local dur = table.clone(DEFAULT_DUR)
	for k, v in (st.dur or {}) :: { [string]: number } do
		if dur[k] then
			dur[k] = v
		end
	end
	local isBoss: { [string]: boolean } = {}
	for _, name in BOSS_CLIPS do
		isBoss[name] = true
		base.Clips[name] = { duration = dur[name], loop = false, hold = name == "Death" }
	end
	local tailK = st.tail or 1

	local basePose = base.pose
	function base.pose(name: string, t: number): ({ [string]: Vector3 }, Vector3)
		if not isBoss[name] then
			return basePose(name, t)
		end
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
		local u = t / dur[name]
		local p = TAU * u
		local function wing(part: string, v: number, sweep: number?)
			local sw = sweep or 0
			add("WingL" .. part, 0, sw, -v)
			add("WingR" .. part, 0, -sw, v)
		end
		local function legs4(fu: number, fl: number, bu: number, bl: number)
			for _, s in { "L", "R" } do
				add("Front" .. s .. "Upper", fu); add("Front" .. s .. "Lower", fl); add("Front" .. s .. "Paw", -(fu + fl) * 0.7)
				add("Back" .. s .. "Upper", bu); add("Back" .. s .. "Lower", bl); add("Back" .. s .. "Paw", -(bu + bl) * 0.7)
			end
		end
		local function tail(x: number, y: number)
			for i = 1, 4 do
				add("Tail" .. i, x * (0.6 + 0.15 * i), y * (0.5 + 0.2 * i))
			end
		end

		if name == "FireBreath" then
			local wind = ss(0, 0.25, u) * (1 - ss(0.25, 0.32, u))
			local breath = ss(0.27, 0.33, u) * (1 - ss(0.82, 0.92, u))
			add("Chest", 0.18 * wind - 0.05 * breath); add("Spine", 0.08 * wind)
			add("Neck", 0.45 * wind - 0.15 * breath, 0.55 * breath * sin(TAU * (u - 0.3) * 1.6))
			add("Head", 0.35 * wind - 0.2 * breath, 0.25 * breath * sin(TAU * (u - 0.3) * 1.6 - 0.4))
			add("Jaw", -0.25 * wind - 0.85 * breath - 0.06 * breath * sin(TAU * u * 30))
			hy = 0.15 * wind - 0.1 * breath; hz = 0.3 * wind
			legs4(-0.15 * wind + 0.2 * breath, 0.1 * wind, 0.2 * wind, -0.25 * wind)
			wing("Upper", 0.4 * wind + 0.15 * breath, -0.2 * wind); wing("Lower", 0.2 * wind)
			tail(-0.1 * breath, 0.2 * breath * sin(p * 3) * tailK)
		elseif name == "TailSwipe" then
			local wind = ss(0, 0.35, u) * (1 - ss(0.38, 0.45, u))
			local swipe = ss(0.38, 0.52, u) * (1 - ss(0.62, 0.95, u))
			add("Hips", 0, 0.3 * wind - 0.5 * swipe); add("Spine", 0, 0.3 * wind - 0.45 * swipe); add("Chest", 0, 0.15 * wind - 0.3 * swipe)
			add("Neck", 0, 0.35 * wind - 0.25 * swipe); add("Head", 0, 0.3 * wind - 0.2 * swipe)
			for i = 1, 4 do
				add("Tail" .. i, -0.05 * wind, (0.35 * wind - 0.55 * swipe) * (0.7 + 0.15 * i))
			end
			hx = 0.4 * wind - 0.7 * swipe; hy = -0.2 * wind + 0.15 * swipe
			legs4(0.15 * wind - 0.1 * swipe, -0.2 * wind, -0.15 * wind + 0.2 * swipe, 0.15 * wind)
			wing("Upper", 0.25 * swipe, 0.3 * swipe)
		elseif name == "Stomp" then
			local rise = ss(0, 0.4, u) * (1 - ss(0.44, 0.5, u))
			local slam = ss(0.44, 0.5, u) * (1 - ss(0.62, 0.95, u))
			add("Hips", 0.5 * rise - 0.12 * slam); add("Spine", 0.12 * rise); add("Chest", 0.1 * rise - 0.08 * slam)
			add("Neck", 0.2 * rise - 0.25 * slam); add("Head", 0.15 * rise - 0.2 * slam); add("Jaw", -0.5 * rise - 0.3 * slam)
			hy = 1.1 * rise - 0.35 * slam; hz = 0.4 * rise - 0.3 * slam
			for _, s in { "L", "R" } do
				add("Front" .. s .. "Upper", 1.0 * rise + 0.35 * slam); add("Front" .. s .. "Lower", -0.9 * rise - 0.2 * slam); add("Front" .. s .. "Paw", 0.3 * rise)
				add("Back" .. s .. "Upper", -0.55 * rise + 0.25 * slam); add("Back" .. s .. "Lower", 0.2 * rise - 0.35 * slam)
			end
			wing("Upper", 0.8 * rise - 0.2 * slam, -0.3 * rise); wing("Lower", 0.4 * rise); wing("Tip", 0.3 * rise)
			tail(0.15 * rise - 0.2 * slam, 0)
		elseif name == "Eruption" then
			local crouch = ss(0, 0.3, u) * (1 - ss(0.3, 0.36, u))
			local erupt = ss(0.32, 0.38, u) * (1 - ss(0.75, 0.95, u))
			local shake = 0.04 * (crouch + erupt) * sin(TAU * u * 28)
			hy = -0.45 * crouch + 0.2 * erupt; add("Hips", shake * 0.5, 0, shake)
			add("Spine", -0.12 * crouch + 0.22 * erupt, 0, shake); add("Chest", -0.08 * crouch + 0.2 * erupt)
			add("Neck", -0.3 * crouch + 0.5 * erupt); add("Head", -0.2 * crouch + 0.35 * erupt, 0.15 * erupt * sin(TAU * u * 3)); add("Jaw", -0.15 * crouch - 0.8 * erupt)
			legs4(0.25 * crouch - 0.1 * erupt, -0.5 * crouch, 0.35 * crouch, -0.6 * crouch)
			wing("Upper", -0.15 * crouch + 0.9 * erupt + 0.1 * erupt * sin(TAU * u * 6), -0.3 * erupt); wing("Lower", 0.4 * erupt); wing("Tip", 0.35 * erupt)
			tail(-0.2 * crouch + 0.25 * erupt, 0.1 * erupt * sin(p * 4))
		elseif name == "Enrage" then
			local rise = ss(0, 0.25, u) * (1 - ss(0.8, 0.97, u))
			local roar = ss(0.2, 0.3, u) * (1 - ss(0.72, 0.85, u))
			hy = 0.5 * rise; add("Hips", 0.25 * rise); add("Spine", 0.12 * rise); add("Chest", 0.18 * rise)
			add("Neck", 0.4 * rise - 0.1 * roar)
			add("Head", 0.4 * rise - 0.2 * roar, 0.3 * roar * sin(TAU * u * 4), 0.06 * roar * sin(TAU * u * 22)); add("Jaw", -0.95 * roar)
			for _, s in { "L", "R" } do
				add("Front" .. s .. "Upper", 0.5 * rise); add("Front" .. s .. "Lower", -0.5 * rise)
				add("Back" .. s .. "Upper", -0.25 * rise); add("Back" .. s .. "Lower", 0.1 * rise)
			end
			wing("Upper", 1.0 * rise + 0.2 * roar * sin(TAU * u * 5), -0.35 * rise)
			wing("Lower", 0.45 * rise + 0.15 * roar * sin(TAU * u * 5 - 0.8)); wing("Tip", 0.4 * rise)
			tail(0.2 * roar, 0.35 * roar * sin(TAU * u * 3))
		elseif name == "Hurt" then
			local h = ss(0, 0.15, u) * (1 - ss(0.3, 1, u))
			add("Neck", -0.25 * h, 0.2 * h); add("Head", -0.3 * h, 0.15 * h); add("Jaw", -0.4 * h); add("Chest", -0.1 * h)
			hz = 0.35 * h; hy = -0.15 * h; wing("Upper", 0.3 * h, 0.2 * h); tail(0.2 * h, 0.2 * h)
		elseif name == "Death" then
			local stag = ss(0, 0.25, u)
			local fall = ss(0.25, 0.7, u)
			local settle = ss(0.7, 1, u)
			add("Hips", -0.1 * fall, 0, 0.45 * fall); add("Spine", 0, 0, 0.1 * fall); hy = -1.2 * fall; hx = 0.5 * fall
			add("Neck", 0.3 * stag * (1 - fall) - 0.5 * fall, 0.4 * fall); add("Head", -0.3 * fall, 0.2 * fall, 0.3 * fall)
			add("Jaw", -0.5 * stag * (1 - settle) - 0.2 * settle)
			legs4(0.6 * fall, -1.0 * fall, -0.5 * fall, 0.9 * fall)
			wing("Upper", -0.35 * fall, 0.4 * fall); wing("Lower", -0.2 * fall); tail(0.25 * fall, 0.4 * fall)
		end

		local rot: { [string]: Vector3 } = {}
		for b, r in acc do
			rot[b] = Vector3.new(r[1], r[2], r[3])
		end
		return rot, Vector3.new(hx, hy, hz)
	end

	return base
end

return Boss
