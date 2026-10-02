--!strict
-- Animates tagged props on the client: propellers and windmill blades spin, canopies,
-- bushes and grass sway with the wind, lanterns swing, flags wave (bones), crystals and
-- signs hover, flames flicker and glows pulse. Rules live in PropAnimData (generated
-- from tools/art/anim.js, the same rules used for the preview renders).

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Props = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Props")
local PropSetup = require(Props:WaitForChild("PropSetup"))
local Data = require(Props:WaitForChild("PropAnimData"))

local NEAR, FAR = 160, 450 -- full rate inside NEAR, a quarter rate out to FAR, frozen beyond
local TAU = math.pi * 2

type Moving = { part: BasePart, kind: string, rule: any, rel: CFrame, pivot: Vector3 }
type Entry = {
	model: Model,
	phase: number,
	moving: { Moving },
	bones: { { bone: Bone, i: number } },
	flicker: { { part: BasePart, size: Vector3 } },
	pulse: { { part: BasePart, t: number } },
	skip: number,
	whole: string?,
	base: CFrame,
}

local entries: { [Model]: Entry } = {}

local function kindOf(name: string): (string?, any)
	if Data.Spin[name] then return "spin", Data.Spin[name] end
	if Data.Sway[name] then return "sway", Data.Sway[name] end
	if Data.Swing[name] then return "swing", Data.Swing[name] end
	if Data.Float[name] then return "float", Data.Float[name] end
	if Data.Flap[name] then return "flap", Data.Flap[name] end
	if name:sub(1, 5) == "Hover" then return "hover", Data.Hover end
	return nil, nil
end

local function attach(model: Instance)
	if not model:IsA("Model") or entries[model] then
		return
	end
	local propName = (model:GetAttribute("Prop") :: string?) or model.Name
	local pivots = Data.Pivots[propName] or {}
	local pivotCf = model:GetPivot()
	local e: Entry = {
		model = model,
		phase = pivotCf.Position:Dot(Data.Wind.dir) * 0.06 + (pivotCf.Position.Z * 0.013),
		moving = {}, bones = {}, flicker = {}, pulse = {}, skip = 0,
		whole = Data.Whole[propName], base = pivotCf,
	}
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			local kind, rule = kindOf(d.Name)
			if kind then
				table.insert(e.moving, { part = d, kind = kind, rule = rule, rel = pivotCf:ToObjectSpace(d.CFrame), pivot = pivots[d.Name] or Vector3.zero })
			end
			if Data.Flicker.names[d.Name] then
				table.insert(e.flicker, { part = d, size = d.Size })
			elseif Data.Pulse.names[d.Name] then
				table.insert(e.pulse, { part = d, t = d.Transparency })
			end
		elseif d:IsA("Bone") then
			local i = tonumber(d.Name:match("^Flag(%d+)$"))
			if i then
				table.insert(e.bones, { bone = d, i = i })
			end
		end
	end
	entries[model] = e
end

for _, m in CollectionService:GetTagged(PropSetup.AnimTag) do
	attach(m)
end
CollectionService:GetInstanceAddedSignal(PropSetup.AnimTag):Connect(attach)
CollectionService:GetInstanceRemovedSignal(PropSetup.AnimTag):Connect(function(m)
	entries[m :: Model] = nil
end)

local function motion(kind: string, r: any, t: number, ph: number, gust: number): CFrame
	if kind == "spin" then
		return CFrame.fromAxisAngle(r.axis, r.speed * t)
	elseif kind == "sway" then
		local w = TAU * r.freq
		local wind = Data.Wind.dir
		local a = r.amp * Data.Wind.strength * gust * (0.55 + 0.45 * math.sin(w * t + ph) + 0.25 * math.sin(2 * w * t + ph * 1.7))
		return CFrame.Angles(a * wind.Z + r.amp * 0.25 * math.sin(w * 1.5 * t + ph), 0, -a * wind.X)
	elseif kind == "swing" then
		local w = TAU * r.freq
		return CFrame.Angles(r.amp * math.sin(w * t + ph), 0, r.amp * 0.4 * math.sin(w * t * 2 + ph))
	elseif kind == "float" then
		local w = TAU * r.freq
		return CFrame.new(0, r.height * math.sin(w * t + ph), 0) * CFrame.Angles(r.tilt * math.sin(w * t + ph + 1), 0, r.tilt * math.sin(w * t * 2 + ph))
	elseif kind == "flap" then
		return CFrame.Angles(0, 0, r.side * r.amp * (0.35 + 0.65 * math.sin(TAU * r.freq * t + ph)))
	elseif kind == "hover" then
		local w = TAU * r.freq
		return CFrame.new(0, r.height * math.sin(w * t + ph), 0) * CFrame.Angles(0, r.spin * t, 0)
	end
	return CFrame.identity
end

local clock = 0
RunService.RenderStepped:Connect(function(dt)
	clock += dt
	local t = clock
	local cam = workspace.CurrentCamera
	local camPos = cam and cam.CFrame.Position or Vector3.zero
	-- slow gusts shared by everything (wind strength can be changed at runtime)
	local gust = 0.8 + 0.35 * math.sin(t * 0.37) * math.sin(t * 0.13 + 1.2)
	for model, e in entries do
		if not model.Parent then
			entries[model] = nil
			continue
		end
		local dist = (e.base.Position - camPos).Magnitude
		if dist > FAR then
			continue
		elseif dist > NEAR then
			e.skip = (e.skip + 1) % 4
			if e.skip ~= 0 then
				continue
			end
		end
		local ph = e.phase
		-- whole-model idle (eggs wobble, icon models spin + bob) around where it was placed
		if e.whole then
			local r = Data.WholeRules[e.whole]
			local w = TAU * r.freq
			if e.whole == "wobble" then
				model:PivotTo(e.base * CFrame.Angles(r.amp * 0.5 * math.sin(w * 1.3 * t + ph + 1), 0, r.amp * math.sin(w * t + ph) * (0.6 + 0.4 * math.sin(w * 0.37 * t))))
			else
				model:PivotTo(e.base * CFrame.new(0, r.height * math.sin(w * t + ph), 0) * CFrame.Angles(0, r.spin * t, 0))
			end
		end
		local pivotCf = model:GetPivot()
		for _, m in e.moving do
			local p = pivotCf * m.rel * CFrame.new(m.pivot)
			m.part.CFrame = p * motion(m.kind, m.rule, t, ph, gust) * CFrame.new(-m.pivot)
		end
		if #e.bones > 0 then
			local f = Data.Flag
			local w = TAU * f.freq
			for _, b in e.bones do
				local amp = f.amp * gust * (if b.i == 1 then 0.4 else 1)
				b.bone.Transform = CFrame.Angles(0, amp * math.sin(w * t - b.i * f.lag + ph), -f.droop * b.i * 0.3 + 0.04 * math.sin(w * 2 * t - b.i + ph))
			end
		end
		for i, fl in e.flicker do
			local k = 1 + Data.Flicker.amount * (math.sin(t * Data.Flicker.freq + i * 1.7 + ph) * 0.6 + math.sin(t * Data.Flicker.freq * 2.3 + i) * 0.4)
			fl.part.Size = fl.size * Vector3.new(1 / math.sqrt(k), k, 1 / math.sqrt(k))
		end
		for i, pu in e.pulse do
			pu.part.Transparency = pu.t + Data.Pulse.amount * (0.5 + 0.5 * math.sin(TAU * Data.Pulse.freq * t + i * 0.9 + ph))
		end
	end
end)
