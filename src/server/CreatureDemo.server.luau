--!strict
-- Studio test: spawns every creature model found in ServerStorage/Creatures in a row
-- in front of the spawn point. Each one idles, walks, roars, runs and attacks on a
-- loop so every animation can be checked in a playtest.
-- Turn off with CreatureConfig.DemoEnabled = false.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Creatures = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures")
local Config = require(Creatures.CreatureConfig)
local CreatureSetup = require(Creatures.CreatureSetup)

if not Config.DemoEnabled then
	return
end

local folder: Instance? = game
for _, name in Config.DemoTemplateFolder do
	folder = folder and (folder :: Instance):FindFirstChild(name)
end
if not folder then
	warn("[CreatureDemo] Import the creature GLBs and put the models in " .. table.concat(Config.DemoTemplateFolder, "/") .. " (see assets/creatures/README.md).")
	return
end

local spawnLocation = workspace:FindFirstChildWhichIsA("SpawnLocation", true)
local origin = (spawnLocation and spawnLocation.Position or Vector3.zero) + Vector3.new(0, 0, -30)

local route = {
	{ offset = Vector3.new(0, 0, -16), speed = 7 },
	{ offset = Vector3.new(0, 0, -16), speed = 7, action = "Roar" },
	{ offset = Vector3.new(0, 0, 14), speed = 20 },
	{ offset = Vector3.new(0, 0, 14), speed = 20, action = "Attack" },
	{ offset = Vector3.new(0, 0, 0), speed = 7 },
}

local function runCreature(template: Model, species: string, home: Vector3)
	local model = template:Clone()
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = true
		end
	end
	CreatureSetup.prepare(model, species)

	-- Ground offset: how far the pivot sits above the paws.
	local bbCf, bbSize = model:GetBoundingBox()
	local footOffset = model:GetPivot().Y - (bbCf.Y - bbSize.Y / 2)
	local yawOffset = math.rad(Config.Species[species].yawOffset or 0)

	local rayParams = RaycastParams.new()
	rayParams.FilterDescendantsInstances = { model }
	local function groundY(p: Vector3): number
		local hit = workspace:Raycast(p + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0), rayParams)
		return hit and hit.Position.Y or home.Y
	end

	local position, facing = home, 0
	local function place()
		model:PivotTo(CFrame.new(position.X, groundY(position) + footOffset, position.Z) * CFrame.Angles(0, facing + yawOffset, 0))
	end
	place()
	model.Parent = workspace

	local function moveTo(target: Vector3, speed: number)
		while model.Parent do
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

	while model.Parent do
		for _, leg in route do
			moveTo(home + leg.offset, leg.speed)
			task.wait(1.2)
			if leg.action then
				CreatureSetup.playAction(model, leg.action)
				task.wait(2.8)
			end
		end
	end
end

local lane = 0
for _, template in (folder :: Instance):GetChildren() do
	if template:IsA("Model") and Config.Species[template.Name] and not Config.Species[template.Name].boss then -- bosses only spawn in dungeon runs
		local home = origin + Vector3.new(lane * 14, 0, 0)
		lane += 1
		task.spawn(runCreature, template, template.Name, home)
	end
end
if lane == 0 then
	warn("[CreatureDemo] No creature models in " .. table.concat(Config.DemoTemplateFolder, "/") .. ". Name each model after its species (Emberfang, Voltgriff, ...).")
end
