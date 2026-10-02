--!strict
-- Spawns anime wind swirls at random over sky islands near the camera. Islands are
-- anything tagged Config.WindSwirls.IslandTag (default "SkyIsland"); with none tagged
-- nearby, swirls appear around the camera instead. How often and what colour comes from
-- the current atmosphere preset (AtmosphereConfig.Presets.<Zone>.swirls), which
-- Atmosphere.client publishes as the Lighting attribute "AtmospherePreset".

local CollectionService = game:GetService("CollectionService")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Atmosphere"):WaitForChild("AtmosphereConfig"))
local WindSwirls = require(Shared:WaitForChild("Fx"):WaitForChild("WindSwirls"))

local S = Config.WindSwirls
local windDir = Config.Wind.direction.Unit
local rng = Random.new()
local gusts: { WindSwirls.Gust } = {}
local timer = rng:NextNumber(0.5, 1.5)

local function bounds(x: Instance): (CFrame?, Vector3?)
	if x:IsA("BasePart") then
		return x.CFrame, x.Size
	elseif x:IsA("Model") then
		return x:GetBoundingBox()
	end
	return nil, nil
end

-- Random spot a few studs above the top of an island near the camera, or near the camera.
local function pickSpot(camCF: CFrame): Vector3
	local camPos = camCF.Position
	local candidates = {}
	for _, island in CollectionService:GetTagged(S.IslandTag) do
		local cf, size = bounds(island)
		if cf and size and (cf.Position - camPos).Magnitude < S.MaxDistance then
			table.insert(candidates, { cf = cf, size = size })
		end
	end
	if #candidates > 0 then
		local c = candidates[rng:NextInteger(1, #candidates)]
		local half = c.size / 2
		local local_ = Vector3.new(rng:NextNumber(-0.6, 0.6) * half.X, half.Y + rng:NextNumber(S.HeightAbove.Min, S.HeightAbove.Max), rng:NextNumber(-0.6, 0.6) * half.Z)
		return c.cf:PointToWorldSpace(local_)
	end
	local look = Vector3.new(camCF.LookVector.X, 0, camCF.LookVector.Z)
	look = if look.Magnitude > 1e-3 then look.Unit else Vector3.zAxis
	local yaw = rng:NextNumber(-1.1, 1.1)
	local dir = CFrame.Angles(0, yaw, 0):VectorToWorldSpace(look)
	return camPos + dir * rng:NextNumber(S.CameraRadius.Min, S.CameraRadius.Max) + Vector3.yAxis * rng:NextNumber(-4, 12)
end

RunService.Heartbeat:Connect(function(dt)
	for i = #gusts, 1, -1 do
		if not gusts[i]:Step(dt) then
			table.remove(gusts, i)
		end
	end

	local preset = Config.Presets[Lighting:GetAttribute("AtmospherePreset") or Config.Default]
	local sw = preset and preset.swirls
	local cam = workspace.CurrentCamera
	if not sw or not cam then
		return
	end
	timer -= dt
	if timer > 0 then
		return
	end
	timer = rng:NextNumber(sw.every.Min, sw.every.Max)
	if #gusts >= S.MaxActive then
		return
	end
	local target = pickSpot(cam.CFrame)
	-- only bother if the camera can roughly see it
	if cam.CFrame.LookVector:Dot((target - cam.CFrame.Position).Unit) < -0.1 then
		return
	end
	local dir = CFrame.Angles(0, rng:NextNumber(-0.4, 0.4), 0):VectorToWorldSpace(windDir)
	local origin = target - dir * WindSwirls.typicalLength() * 0.45
	local g = WindSwirls.spawn(origin, dir, { color = sw.color, strength = sw.strength })
	if g then
		table.insert(gusts, g)
	end
end)
