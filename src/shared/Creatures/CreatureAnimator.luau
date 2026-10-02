--!strict
-- Code-driven creature animation on skinned-mesh Bones (client side).
-- Blends Idle/Walk/Run from the creature's real movement speed, layers one-shot
-- actions (Attack, Roar) on top, and runs springs on head/ears/tail for follow-through.

local Config = require(script.Parent.CreatureConfig)

local Animator = {}
Animator.__index = Animator

local LOCO = { "Idle", "Walk", "Run" }

-- Exact critically damped spring step (stable at any dt). Works on numbers or Vector3.
local function spring(cur: any, vel: any, target: any, omega: number, dt: number): (any, any)
	local x = cur - target
	local e = math.exp(-omega * dt)
	local k = vel + x * omega
	return target + (x + k * dt) * e, (vel - k * (omega * dt)) * e
end

local function lerp(a: number, b: number, t: number): number
	return a + (b - a) * t
end

export type Animator = typeof(setmetatable({} :: {
	model: Model,
	poses: any,
	bones: { [string]: Bone },
	weights: { [string]: number },
	clocks: { [string]: number },
	springs: { [string]: { cur: Vector3, vel: Vector3 } },
	action: string?,
	actionT: number,
	actionW: number,
	lastPos: Vector3?,
	lastYaw: number?,
	speed: number,
	yawRate: number,
	light: PointLight?,
	lightBase: number,
	time: number,
	def: any,
	glowParts: { { part: BasePart, base: Color3, amount: number } },
}, Animator))

function Animator.new(model: Model, poses: any): Animator
	local bones = {}
	for _, d in model:GetDescendants() do
		if d:IsA("Bone") then
			bones[d.Name] = d
		end
	end
	local light = model:FindFirstChild("GlowLight", true)
	local def = Config.Species[model:GetAttribute("Species") or model.Name] or {}
	-- glow meshes that pulse (def.pulse = { Glow = 0.3, ... }: fraction of brightness lost at the dip)
	local glowParts = {}
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") and def.pulse and def.pulse[d.Name] then
			table.insert(glowParts, { part = d, base = d.Color, amount = def.pulse[d.Name] })
		end
	end
	local self = setmetatable({
		model = model,
		poses = poses,
		bones = bones,
		weights = { Idle = 1, Walk = 0, Run = 0 },
		clocks = { Idle = math.random() * 2, Walk = 0, Run = 0 },
		springs = {},
		action = nil,
		actionT = 0,
		actionW = 0,
		lastPos = nil,
		lastYaw = nil,
		speed = 0,
		yawRate = 0,
		light = if light and light:IsA("PointLight") then light else nil,
		lightBase = if light and light:IsA("PointLight") then light.Brightness else 0,
		time = 0,
		def = def,
		glowParts = glowParts,
	}, Animator)
	return self
end

function Animator.play(self: Animator, action: string)
	local clip = self.poses.Clips[action]
	if clip and not clip.loop then
		self.action = action
		self.actionT = 0
	end
end

function Animator.step(self: Animator, dt: number)
	dt = math.clamp(dt, 1 / 240, 1 / 20)
	self.time += dt
	local poses = self.poses
	local clips = poses.Clips

	-- Measure real movement (works for anchored, CFrame-driven and physics creatures).
	local pivot = self.model:GetPivot()
	local pos = pivot.Position
	local look = pivot.LookVector
	local yaw = math.atan2(-look.X, -look.Z)
	if self.lastPos then
		local d = pos - self.lastPos
		local v = Vector3.new(d.X, 0, d.Z).Magnitude / dt
		self.speed = lerp(self.speed, v, math.min(1, dt * 10))
		local dy = (yaw - (self.lastYaw :: number) + math.pi) % (2 * math.pi) - math.pi
		self.yawRate = lerp(self.yawRate, dy / dt, math.min(1, dt * 8))
	end
	self.lastPos, self.lastYaw = pos, yaw

	-- Locomotion weights and clocks.
	local target = if self.speed < Config.WalkThreshold then "Idle" elseif self.speed < Config.RunThreshold then "Walk" else "Run"
	local blendT = math.min(1, dt * Config.LocomotionBlendRate)
	local rates = {
		Idle = 1,
		Walk = math.clamp(self.speed / Config.WalkReferenceSpeed, Config.PlaybackMin, Config.PlaybackMax),
		Run = math.clamp(self.speed / Config.RunReferenceSpeed, Config.PlaybackMin, Config.PlaybackMax),
	}
	local total = 0
	for _, name in LOCO do
		self.weights[name] = lerp(self.weights[name], if name == target then 1 else 0, blendT)
		total += self.weights[name]
		self.clocks[name] = (self.clocks[name] + dt * rates[name]) % clips[name].duration
	end

	-- Sample and blend.
	local rot: { [string]: Vector3 } = {}
	local hips = Vector3.zero
	for _, name in LOCO do
		local w = self.weights[name] / total
		if w > 0.001 then
			local r, h = poses.pose(name, self.clocks[name])
			for b, v in r do
				rot[b] = (rot[b] or Vector3.zero) + v * w
			end
			hips += h * w
		end
	end

	-- One-shot action layered over locomotion.
	if self.action then
		local clip = clips[self.action]
		self.actionT += dt
		if self.actionT < clip.duration then
			self.actionW = math.min(1, self.actionW + dt / Config.ActionFadeIn)
		else
			self.actionW = math.max(0, self.actionW - dt / Config.ActionFadeOut)
		end
		local aw = self.actionW
		local r, h = poses.pose(self.action, math.min(self.actionT, clip.duration - 1e-3))
		for b, v in rot do
			rot[b] = v * (1 - aw)
		end
		for b, v in r do
			rot[b] = (rot[b] or Vector3.zero) + v * aw
		end
		hips = hips * (1 - aw) + h * aw
		if self.actionT >= clip.duration and aw <= 0 then
			self.action = nil
			self.actionT = 0
		end
	end

	-- Lean into turns.
	local yr = math.clamp(self.yawRate, -Config.TurnLeanMax, Config.TurnLeanMax)
	for b, lean in poses.TurnLean do
		rot[b] = (rot[b] or Vector3.zero) + Vector3.new(0, (lean.y or 0) * yr, 0)
	end

	-- Springs for follow-through.
	for b, omega in poses.SpringBones do
		local goal = rot[b] or Vector3.zero
		local s = self.springs[b]
		if not s then
			s = { cur = goal, vel = Vector3.zero }
			self.springs[b] = s
		end
		s.cur, s.vel = spring(s.cur, s.vel, goal, omega, dt)
		rot[b] = s.cur
	end

	-- Apply to bones.
	for name, bone in self.bones do
		local r = rot[name]
		local cf = if r then CFrame.fromEulerAnglesXYZ(r.X, r.Y, r.Z) else CFrame.identity
		if name == "Hips" then
			cf = CFrame.new(hips) * cf
		end
		bone.Transform = cf
	end

	-- Spinner bones: halos, orbiting orbs and hovering charms on their own clock.
	for _, s in self.def.spinners or {} do
		local bone = self.bones[s.bone]
		if bone then
			local t = self.time
			local bob = (s.bob or 0) * math.sin(t * (s.bobFreq or 1) * 2 * math.pi)
			bone.Transform = CFrame.new(0, bob, 0) * CFrame.fromAxisAngle(s.axis.Unit, (s.speed or 1) * t)
		end
	end
	for i, g in self.glowParts do
		local k = 1 - g.amount * (0.5 + 0.5 * math.sin(self.time * 2.4 + i * 0.9))
		-- MutationVisuals stores a mutated glow colour in GlowBase
		local mut = g.part:GetAttribute("GlowBase")
		local base = if typeof(mut) == "Color3" then mut else g.base
		g.part.Color = Color3.new(base.R * k, base.G * k, base.B * k)
	end

	-- Glow light flicker.
	local light = self.light
	if light then
		local t = self.time
		light.Brightness = self.lightBase * (0.85 + 0.1 * math.sin(t * 13) + 0.08 * math.sin(t * 31 + 1.3))
	end
end

return Animator
