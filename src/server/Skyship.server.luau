--!strict
-- The skyship loop: docked at Haven for BoardingSeconds, then it flies off with up to
-- MaxPassengers players standing on the deck and drops them in the Wilds.
-- State is published as attributes on the ship model (State, DepartIn, Aboard) so the
-- UI can show "Skyship leaves in 0:42 · 7/12 aboard".

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TeleportService = game:GetService("TeleportService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Skyship"):WaitForChild("SkyshipConfig"))
local PropSetup = require(Shared:WaitForChild("Props"):WaitForChild("PropSetup"))

if not Config.Enabled then
	return -- boss runs replaced the Wilds; see SkyshipConfig.Enabled
end

local template: Instance? = game
for _, n in Config.ShipTemplatePath do
	template = template and (template :: Instance):FindFirstChild(n)
end
local dock = workspace:FindFirstChild(Config.DockMarker, true)
if not template or not template:IsA("Model") or not dock or not dock:IsA("BasePart") then
	warn(`[Skyship] Needs the Skyship model at {table.concat(Config.ShipTemplatePath, "/")} and a Part named {Config.DockMarker} in Workspace. See SETUP.md.`)
	return
end

local fadeEvent = Instance.new("RemoteEvent")
fadeEvent.Name = "SkyshipFade"
fadeEvent.Parent = ReplicatedStorage

local ship = (template :: Model):Clone()
PropSetup.prepare(ship, "Skyship")
ship.Name = "Skyship"
local dockCf = (dock :: BasePart).CFrame
ship:PivotTo(dockCf)
ship.Parent = workspace
dock.Transparency = 1

-- Deck volume in ship space, from the model's bounding box.
local bbCf, bbSize = ship:GetBoundingBox()
local deckCenter = dockCf:ToObjectSpace(bbCf).Position
local function onDeck(pos: Vector3): boolean
	local p = ship:GetPivot():PointToObjectSpace(pos) - deckCenter
	return math.abs(p.X) < bbSize.X * 0.3 and math.abs(p.Z) < bbSize.Z * 0.48 and p.Y > -bbSize.Y * 0.4 and p.Y < -bbSize.Y * 0.05
end

local function passengers(): { Player }
	local list = {}
	for _, plr in Players:GetPlayers() do
		local root = plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root and onDeck(root.Position) and #list < Config.MaxPassengers then
			table.insert(list, plr)
		end
	end
	return list
end

local function fly(from: CFrame, to: CFrame, seconds: number, riders: { [BasePart]: CFrame }?)
	local t = 0
	while t < seconds do
		t += RunService.Heartbeat:Wait()
		local a = math.clamp(t / seconds, 0, 1)
		local e = a * a * (3 - 2 * a)
		local cf = from:Lerp(to, e) * CFrame.Angles(math.sin(e * math.pi) * -0.08, 0, 0)
		ship:PivotTo(cf)
		if riders then
			for root, rel in riders do
				root.CFrame = cf * rel
			end
		end
	end
end

local function deliver(list: { Player })
	local useTeleport = Config.WildsPlaceId ~= 0 and not RunService:IsStudio()
	if useTeleport then
		local ok, err = pcall(function()
			TeleportService:TeleportAsync(Config.WildsPlaceId, list)
		end)
		if ok then
			return
		end
		warn("[Skyship] Teleport failed, using local mode: " .. tostring(err))
	end
	local drop = workspace:FindFirstChild(Config.WildsDropMarker, true) :: BasePart?
	if not drop then
		warn(`[Skyship] No Part named {Config.WildsDropMarker} in Workspace; passengers stay in Haven.`)
		return
	end
	for i, plr in list do
		local char = plr.Character
		if char then
			local a = (i / math.max(1, #list)) * math.pi * 2
			char:PivotTo(drop.CFrame * CFrame.new(math.cos(a) * 6, 4, math.sin(a) * 6))
		end
	end
end

while true do
	-- Boarding
	ship:SetAttribute("State", "Boarding")
	local deadline = os.clock() + Config.BoardingSeconds
	while os.clock() < deadline do
		ship:SetAttribute("DepartIn", math.ceil(deadline - os.clock()))
		ship:SetAttribute("Aboard", #passengers())
		task.wait(0.5)
	end

	-- Departure: lock riders to the deck so they move with the ship.
	local list = passengers()
	ship:SetAttribute("State", "Departing")
	ship:SetAttribute("DepartIn", 0)
	local riders: { [BasePart]: CFrame } = {}
	for _, plr in list do
		local root = plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root then
			root.Anchored = true
			riders[root] = ship:GetPivot():ToObjectSpace(root.CFrame)
			fadeEvent:FireClient(plr, Config.FlightSeconds)
		end
	end
	local away = dockCf * CFrame.new(Config.DepartOffset)
	fly(dockCf, away, Config.FlightSeconds, riders)
	for root in riders do
		if root.Parent then
			root.Anchored = false
		end
	end
	deliver(list)

	-- Fly back in empty
	ship:SetAttribute("State", "Returning")
	fly(dockCf * CFrame.new(Config.DepartOffset * Vector3.new(1, 1, -1)), dockCf, Config.ReturnSeconds)
end
