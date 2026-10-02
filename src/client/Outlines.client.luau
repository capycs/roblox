--!strict
-- Cartoon outlines via Highlight (outline only, no fill). Roblox renders a limited number
-- of Highlights at once, so a pool of MaxHighlights is handed to the nearest tagged models
-- every few frames. Creatures and players are boosted so they always keep theirs.
-- Settings: AtmosphereConfig.Outlines. Tag anything else with "Outline" to include it.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Atmosphere"):WaitForChild("AtmosphereConfig"))
local O = Config.Outlines

local folder = Instance.new("Folder")
folder.Name = "Outlines"
folder.Parent = workspace

local pool: { Highlight } = {}
for i = 1, O.MaxHighlights do
	local h = Instance.new("Highlight")
	h.Name = "Outline" .. i
	h.FillTransparency = 1
	h.OutlineColor = O.Color
	h.OutlineTransparency = O.Thickness
	h.DepthMode = Enum.HighlightDepthMode.Occluded
	h.Enabled = false
	h.Parent = folder
	pool[i] = h
end

type Candidate = { model: Instance, score: number }

local function position(x: Instance): Vector3?
	if x:IsA("Model") then
		return x:GetPivot().Position
	elseif x:IsA("BasePart") then
		return x.Position
	end
	return nil
end

local timer = 0
RunService.Heartbeat:Connect(function(dt)
	timer += dt
	if timer < 0.25 then
		return
	end
	timer = 0
	local cam = workspace.CurrentCamera
	if not cam then
		return
	end
	local camPos = cam.CFrame.Position
	local list: { Candidate } = {}
	local seen: { [Instance]: boolean } = {}
	local function consider(x: Instance, boost: number)
		if seen[x] or not x:IsDescendantOf(workspace) then
			return
		end
		seen[x] = true
		local p = position(x)
		if p then
			local d = (p - camPos).Magnitude
			if d <= O.MaxDistance then
				table.insert(list, { model = x, score = d * boost })
			end
		end
	end
	for _, tag in O.Tags do
		local boost = O.PriorityBoost[tag] or 1
		for _, x in CollectionService:GetTagged(tag) do
			consider(x, boost)
		end
	end
	if O.Players then
		for _, plr in Players:GetPlayers() do
			if plr.Character then
				consider(plr.Character, O.PriorityBoost.Player or 1)
			end
		end
	end
	table.sort(list, function(a, b)
		return a.score < b.score
	end)
	for i, h in pool do
		local c = list[i]
		if c then
			if h.Adornee ~= c.model then
				h.Adornee = c.model
			end
			h.Enabled = true
		else
			h.Enabled = false
			h.Adornee = nil
		end
	end
end)
