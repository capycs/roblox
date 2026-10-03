--!strict
-- Animates every tagged creature near the camera.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Creatures = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures")
local Config = require(Creatures.CreatureConfig)
local Animator = require(Creatures.CreatureAnimator)
local CreatureSetup = require(Creatures.CreatureSetup)
local Quadruped = require(Creatures.Poses.Quadruped)
local Biped = require(Creatures.Poses.Biped)
local Fish = require(Creatures.Poses.Fish)
local Boss = require(Creatures.Poses.Boss)
-- style.body picks the pose set: four legs (default), two legs (arms, wings or hovering), or a fish
local BODIES: { [string]: any } = { quad = Quadruped, biped = Biped, fish = Fish, boss = Boss }

-- One poses module per species, built from its style in CreatureConfig.
local posesBySpecies: { [string]: any } = {}
local function posesFor(species: string, def: any): any
	local p = posesBySpecies[species]
	if not p then
		p = (BODIES[def.style.body or "quad"] or Quadruped).make(def.style)
		posesBySpecies[species] = p
	end
	return p
end

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
	local animator = Animator.new(inst, posesFor(species, def))
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
