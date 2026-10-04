--!strict
-- Animates every tagged creature near the camera.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Creatures = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures")
local Config = require(Creatures.CreatureConfig)
local Animator = require(Creatures.CreatureAnimator)
local CreatureSetup = require(Creatures.CreatureSetup)
local PoseSets = require(Creatures.PoseSets)

local active: { [Model]: { animator: Animator.Animator, conn: RBXScriptConnection } } = {}

local function attach(inst: Instance)
	if not inst:IsA("Model") or active[inst] then
		return
	end
	local species = inst:GetAttribute("Species")
	local def = species and Config.Species[species]
	if not def then
		return
	end
	local animator = Animator.new(inst, PoseSets.get(species))
	local conn = inst:GetAttributeChangedSignal("ActionSeq"):Connect(function()
		local action = inst:GetAttribute("Action")
		if typeof(action) == "string" then
			animator:play(action)
		end
	end)
	active[inst] = { animator = animator, conn = conn }
end

local function detach(inst: Instance)
	local entry = active[inst :: Model]
	if entry then
		entry.conn:Disconnect()
		active[inst :: Model] = nil
	end
end

for _, inst in CollectionService:GetTagged(CreatureSetup.Tag) do
	attach(inst)
end
CollectionService:GetInstanceAddedSignal(CreatureSetup.Tag):Connect(attach)
CollectionService:GetInstanceRemovedSignal(CreatureSetup.Tag):Connect(detach)

RunService.RenderStepped:Connect(function(dt)
	local cam = workspace.CurrentCamera
	local camPos = cam and cam.CFrame.Position or Vector3.zero
	for model, entry in active do
		if (model:GetPivot().Position - camPos).Magnitude < Config.AnimateDistance then
			entry.animator:step(dt)
		end
	end
end)
