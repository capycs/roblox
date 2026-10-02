--!strict
-- Studio test: spawns Emberfang near the spawn point and has it idle, walk, run,
-- roar and attack on a loop so every animation can be checked in a playtest.
-- Turn off with CreatureConfig.DemoEnabled = false.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Creatures = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures")
local Config = require(Creatures.CreatureConfig)
local CreatureSetup = require(Creatures.CreatureSetup)

if not Config.DemoEnabled then
	return
end

local template: Instance? = game
for _, name in Config.DemoTemplatePath do
	template = template and (template :: Instance):FindFirstChild(name)
end
if not template or not template:IsA("Model") then
	warn("[EmberfangDemo] Import Emberfang.glb and put the model at " .. table.concat(Config.DemoTemplatePath, "/") .. " (see assets/creatures/Emberfang/README.md).")
	return
end

local model = template:Clone()
for _, d in model:GetDescendants() do
	if d:IsA("BasePart") then
		d.Anchored = true
	end
end
CreatureSetup.prepare(model, "Emberfang")

-- Ground offset: how far the pivot sits above the paws.
local bbCf, bbSize = model:GetBoundingBox()
local footOffset = model:GetPivot().Y - (bbCf.Y - bbSize.Y / 2)
local yawOffset = math.rad(Config.Species.Emberfang.yawOffset)

local spawn = workspace:FindFirstChildWhichIsA("SpawnLocation", true)
local home = (spawn and spawn.Position or Vector3.zero) + Vector3.new(0, 0, -24)

local rayParams = RaycastParams.new()
rayParams.FilterDescendantsInstances = { model }
local function groundY(p: Vector3): number
	local hit = workspace:Raycast(p + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0), rayParams)
	return hit and hit.Position.Y or home.Y
end

local position = home
local facing = 0
local function place()
	model:PivotTo(CFrame.new(position.X, groundY(position) + footOffset, position.Z) * CFrame.Angles(0, facing + yawOffset, 0))
end
place()
model.Parent = workspace

local function moveTo(target: Vector3, speed: number)
	while true do
		local dt = RunService.Heartbeat:Wait()
		local d = Vector3.new(target.X - position.X, 0, target.Z - position.Z)
		if d.Magnitude < 0.5 then
			return
		end
		local want = math.atan2(-d.X, -d.Z)
		local diff = (want - facing + math.pi) % (2 * math.pi) - math.pi
		facing += math.clamp(diff, -4 * dt, 4 * dt)
		position += Vector3.new(-math.sin(facing), 0, -math.cos(facing)) * math.min(speed * dt, d.Magnitude)
		place()
	end
end

local route = {
	{ offset = Vector3.new(16, 0, 0), speed = 7 },
	{ offset = Vector3.new(16, 0, -18), speed = 7, action = "Roar" },
	{ offset = Vector3.new(-14, 0, -18), speed = 20 },
	{ offset = Vector3.new(-14, 0, 0), speed = 20, action = "Attack" },
	{ offset = Vector3.new(0, 0, 0), speed = 7 },
}

task.spawn(function()
	while model.Parent do
		for _, leg in route do
			moveTo(home + leg.offset, leg.speed)
			task.wait(1.2)
			if leg.action then
				CreatureSetup.playAction(model, leg.action)
				task.wait(2.6)
			end
		end
	end
end)
