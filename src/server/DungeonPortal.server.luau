--!strict
-- Lobby side of boss runs. Tag the PyroGate model (or any Part) "BossRunPortal"; optional
-- attribute Run = "Pyrothrax" (the DungeonConfig.Runs key, Pyrothrax by default). Players who
-- stand within Queue.PadRadius of it join; a countdown starts with the first one and the
-- whole group (up to the run's maxPlayers) is sent in together when it hits zero.
-- Players come back next to the portal: a child Part/Attachment named "Return" sets the spot,
-- otherwise it's a few studs in front of the pad.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DungeonConfig = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Dungeon"):WaitForChild("DungeonConfig"))
local DungeonService = require(script.Parent:WaitForChild("DungeonService"))
local Q = DungeonConfig.Queue

type Queue = { endsAt: number?, label: TextLabel, sign: BasePart }
local queues: { [Instance]: Queue } = {}

local function pivotOf(inst: Instance): CFrame
	return if inst:IsA("Model") then inst:GetPivot() else (inst :: BasePart).CFrame
end

local function returnSpot(inst: Instance): CFrame
	local r = inst:FindFirstChild("Return", true)
	if r and r:IsA("BasePart") then
		return r.CFrame
	elseif r and r:IsA("Attachment") then
		return r.WorldCFrame
	end
	local cf = pivotOf(inst)
	local look = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z).Unit
	local at = cf.Position + look * (Q.PadRadius + 6)
	return CFrame.lookAt(at, at + look)
end

local function setup(inst: Instance): Queue
	local sign = Instance.new("Part")
	sign.Name = "QueueSign"
	sign.Anchored, sign.CanCollide, sign.CanQuery, sign.CanTouch = true, false, false, false
	sign.Transparency = 1
	sign.Size = Vector3.new(1, 1, 1)
	sign.Position = pivotOf(inst).Position + Vector3.new(0, 12, 0)
	sign.Parent = inst
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(260, 90)
	gui.MaxDistance = 90
	gui.Parent = sign
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.TextScaled = true
	label.FontFace = Font.new("rbxasset://fonts/families/FredokaOne.json")
	label.TextColor3 = Color3.fromRGB(255, 230, 190)
	label.TextStrokeTransparency = 0.1
	label.Parent = gui
	local q = { label = label, sign = sign }
	queues[inst] = q
	return q
end

CollectionService:GetInstanceRemovedSignal(Q.Tag):Connect(function(inst)
	local q = queues[inst]
	if q then
		q.sign:Destroy()
		queues[inst] = nil
	end
end)

while true do
	task.wait(0.25)
	for _, inst in CollectionService:GetTagged(Q.Tag) do
		if not inst:IsA("Model") and not inst:IsA("BasePart") then
			continue
		end
		local runName = (inst:GetAttribute("Run") :: string?) or "Pyrothrax"
		local def = DungeonConfig.Runs[runName]
		if not def then
			continue
		end
		local q = queues[inst] or setup(inst)
		local center = pivotOf(inst).Position
		local on = {}
		for _, pl in Players:GetPlayers() do
			local ch = pl.Character
			local hum = ch and ch:FindFirstChildOfClass("Humanoid")
			local root = ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart?
			if hum and root and hum.Health > 0 and DungeonService.canQueue(pl) then
				local d = root.Position - center
				if Vector3.new(d.X, 0, d.Z).Magnitude <= Q.PadRadius and math.abs(d.Y) < 14 then
					table.insert(on, pl)
				end
			end
		end
		if #on == 0 then
			q.endsAt = nil
			q.label.Text = string.upper(def.displayName) .. "\nStand here to enter (1-" .. def.maxPlayers .. " players)"
			continue
		end
		q.endsAt = q.endsAt or (os.clock() + Q.Countdown)
		local left = math.max(0, math.ceil((q.endsAt :: number) - os.clock()))
		q.label.Text = string.upper(def.displayName) .. "\n" .. math.min(#on, def.maxPlayers) .. "/" .. def.maxPlayers .. " ready - starting in " .. left
		if os.clock() >= (q.endsAt :: number) then
			q.endsAt = nil
			local group = {}
			for i = 1, math.min(#on, def.maxPlayers) do
				group[i] = on[i]
			end
			local back = returnSpot(inst)
			task.spawn(function()
				if not DungeonService.start(runName, group, back) then
					q.label.Text = "Boss run unavailable\n(check Output)"
				end
			end)
		end
	end
end
