--!strict
-- Prepares an imported creature model (server side): glow materials, flame light,
-- tag + species attribute so clients animate it, and an action trigger.

local CollectionService = game:GetService("CollectionService")
local Config = require(script.Parent.CreatureConfig)

local CreatureSetup = {}

CreatureSetup.Tag = "Creature"

function CreatureSetup.prepare(model: Model, species: string): Model
	local def = Config.Species[species]
	assert(def, "Unknown species " .. species)

	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.CanCollide = false
			d.CanTouch = false
			d.CanQuery = false
			local glow = def.glow[d.Name]
			if glow and d:IsA("MeshPart") then
				d.Material = Enum.Material.Neon
				d.Color = glow
				d.TextureID = ""
				d.CastShadow = false
			end
		end
	end
	if not model.PrimaryPart then
		model.PrimaryPart = model:FindFirstChild("Body", true) :: BasePart? or model:FindFirstChildWhichIsA("BasePart", true)
	end

	local fl = def.flameLight
	if fl and not model:FindFirstChild("FlameLight", true) then
		local bone = model:FindFirstChild(fl.bone, true)
		if bone then
			local light = Instance.new("PointLight")
			light.Name = "FlameLight"
			light.Color = fl.color
			light.Brightness = fl.brightness
			light.Range = fl.range
			light.Shadows = false
			light.Parent = bone
		end
	end

	model:SetAttribute("Species", species)
	model:SetAttribute("ActionSeq", 0)
	CollectionService:AddTag(model, CreatureSetup.Tag)
	return model
end

-- Server: make every client play a one-shot clip ("Attack", "Roar") on this creature.
function CreatureSetup.playAction(model: Model, action: string)
	model:SetAttribute("Action", action)
	model:SetAttribute("ActionSeq", (model:GetAttribute("ActionSeq") or 0) + 1)
end

return CreatureSetup
