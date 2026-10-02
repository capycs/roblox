--!strict
-- Spins tagged moving parts (skyship propellers, windmill blades, beacon rings) on
-- the client, around each part's own centre. Parts far from the camera are skipped.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local PropSetup = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Props"):WaitForChild("PropSetup"))

local MAX_DISTANCE = 400
local spinning: { [BasePart]: { base: CFrame, rel: CFrame?, angle: number, def: any } } = {}

local function attach(inst: Instance)
	if not inst:IsA("BasePart") then
		return
	end
	local def = PropSetup.Spinners[inst.Name]
	if not def then
		return
	end
	-- Remember the offset from the model's pivot so spinners follow a moving ship.
	local model = inst:FindFirstAncestorWhichIsA("Model")
	spinning[inst] = {
		base = inst.CFrame,
		rel = if model then model:GetPivot():ToObjectSpace(inst.CFrame) else nil,
		angle = 0,
		def = def,
	}
end

for _, p in CollectionService:GetTagged(PropSetup.SpinTag) do
	attach(p)
end
CollectionService:GetInstanceAddedSignal(PropSetup.SpinTag):Connect(attach)
CollectionService:GetInstanceRemovedSignal(PropSetup.SpinTag):Connect(function(p)
	spinning[p :: BasePart] = nil
end)

RunService.RenderStepped:Connect(function(dt)
	local cam = workspace.CurrentCamera
	local camPos = cam and cam.CFrame.Position or Vector3.zero
	for part, s in spinning do
		if not part.Parent then
			spinning[part] = nil
			continue
		end
		if (part.Position - camPos).Magnitude > MAX_DISTANCE then
			continue
		end
		s.angle += s.def.speed * dt
		local model = part:FindFirstAncestorWhichIsA("Model")
		local base = if model and s.rel then model:GetPivot() * s.rel else s.base
		part.CFrame = base * CFrame.fromAxisAngle(s.def.axis, s.angle)
	end
end)
