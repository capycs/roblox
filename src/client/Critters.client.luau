--!strict
-- Cosmetic wildlife, client-only: butterflies flutter around Parts tagged
-- "ButterflySpot" and bird flocks circle Parts tagged "BirdCircle". Uses the Butterfly
-- and Bird models from ReplicatedStorage/Props/Ambient (their wings flap through
-- PropAnimation via the WingL/WingR parts).

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local PropSetup = require(Shared:WaitForChild("Props"):WaitForChild("PropSetup"))

local ambient = ReplicatedStorage:FindFirstChild("Props") and (ReplicatedStorage :: any).Props:FindFirstChild("Ambient")
if not ambient then
	return -- import Butterfly/Bird into ReplicatedStorage/Props/Ambient to enable critters
end

local folder = Instance.new("Folder")
folder.Name = "Critters"
folder.Parent = workspace

type Critter = { model: Model, center: Vector3, radius: number, height: number, speed: number, phase: number, kind: string }
local critters: { Critter } = {}

local function spawnAt(spot: BasePart, kind: string, count: number)
	local template = ambient:FindFirstChild(kind)
	if not template or not template:IsA("Model") then
		return
	end
	for i = 1, count do
		local m = template:Clone()
		PropSetup.prepare(m, kind)
		for _, p in m:GetDescendants() do
			if p:IsA("BasePart") then
				p.CanCollide, p.CanQuery, p.CanTouch, p.CastShadow = false, false, false, false
			end
		end
		m.Parent = folder
		table.insert(critters, {
			model = m,
			center = spot.Position,
			radius = if kind == "Bird" then 30 + i * 6 else 3 + math.random() * 5,
			height = if kind == "Bird" then 18 + i * 3 else 2 + math.random() * 2,
			speed = if kind == "Bird" then 0.25 + i * 0.02 else 0.6 + math.random() * 0.6,
			phase = i * 1.3 + math.random() * 6,
			kind = kind,
		})
	end
end

for _, s in CollectionService:GetTagged("ButterflySpot") do
	if s:IsA("BasePart") then
		spawnAt(s, "Butterfly", 3)
	end
end
for _, s in CollectionService:GetTagged("BirdCircle") do
	if s:IsA("BasePart") then
		spawnAt(s, "Bird", 5)
	end
end

local t = 0
RunService.RenderStepped:Connect(function(dt)
	t += dt
	local cam = workspace.CurrentCamera
	local camPos = cam and cam.CFrame.Position or Vector3.zero
	for _, c in critters do
		if (c.center - camPos).Magnitude > 350 then
			continue
		end
		local a = t * c.speed + c.phase
		local pos, ahead
		if c.kind == "Bird" then
			pos = c.center + Vector3.new(math.cos(a) * c.radius, c.height + math.sin(a * 2) * 2, math.sin(a) * c.radius)
			ahead = c.center + Vector3.new(math.cos(a + 0.05) * c.radius, c.height, math.sin(a + 0.05) * c.radius)
		else
			-- figure-eight wander with bobbing
			pos = c.center + Vector3.new(math.sin(a) * c.radius, c.height + math.sin(a * 3.1) * 0.8, math.sin(a * 2) * c.radius * 0.5)
			local b = a + 0.05
			ahead = c.center + Vector3.new(math.sin(b) * c.radius, c.height, math.sin(b * 2) * c.radius * 0.5)
		end
		c.model:PivotTo(CFrame.lookAt(pos, Vector3.new(ahead.X, pos.Y, ahead.Z)))
	end
end)
