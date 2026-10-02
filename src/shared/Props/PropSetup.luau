--!strict
-- Prepares imported prop models (skyship, trees, rocks, shops, eggs...):
-- glow meshes become Neon, glass becomes Glass, small plants stop blocking players,
-- and anything that moves gets tagged so clients animate it (PropAnimation.client).
--
-- Mesh names come from tools/art (each GLB node keeps its name on import).

local CollectionService = game:GetService("CollectionService")
local AnimData = require(script.Parent.PropAnimData)

local PropSetup = {}

PropSetup.AnimTag = "PropAnim"
PropSetup.OutlineTag = "Outline" -- Outlines.client draws the cartoon outline on these

local GLOW = { Glow = true, GlowCore = true, Lamp = true, Flame = true, FlameCore = true, Rune = true, Potion = true, Eyes = true, LanternLamp = true, HoverCore = true, HoverGem = true, HoverSignGlow = true, HoverGlow = true }
local GLASS = { Glass = true }

-- Props players walk through (grass, flowers...). Everything else collides.
PropSetup.NoCollide = {
	GrassTuft = true, GrassTuftSnow = true, FlowerPatch = true, Fern = true, Reeds = true, Lilypad = true,
	MushroomCluster = true, GlowShroom = true, Bush = true, BushBerry = true, BushFlower = true,
}

-- Too small/thin to look good with an outline (and they'd use up the Highlight budget).
PropSetup.NoOutline = { GrassTuft = true, GrassTuftSnow = true, FlowerPatch = true, Fern = true, Reeds = true, Lilypad = true, Butterfly = true }

local function isAnimated(d: Instance): boolean
	if d:IsA("Bone") then
		return d.Name:match("^Flag%d+$") ~= nil
	end
	if not d:IsA("BasePart") then
		return false
	end
	local n = d.Name
	return AnimData.Spin[n] ~= nil or AnimData.Sway[n] ~= nil or AnimData.Swing[n] ~= nil or AnimData.Float[n] ~= nil or AnimData.Flap[n] ~= nil
		or n:sub(1, 5) == "Hover" or AnimData.Flicker.names[n] ~= nil or AnimData.Pulse.names[n] ~= nil
end

function PropSetup.prepare(model: Model, propName: string?): Model
	local name = propName or (model:GetAttribute("Prop") :: string?) or model.Name
	model:SetAttribute("Prop", name)
	local walkThrough = PropSetup.NoCollide[name] == true
	local animated = false
	for _, d in model:GetDescendants() do
		if isAnimated(d) then
			animated = true
		end
		if d:IsA("BasePart") then
			d.Anchored = true
			if walkThrough then
				d.CanCollide = false
				d.CanQuery = false
			end
			if GLOW[d.Name] then
				d.Material = Enum.Material.Neon
				d.CastShadow = false
				d.CanCollide = false
			elseif GLASS[d.Name] then
				d.Material = Enum.Material.Glass
				d.Transparency = 0.55
				d.CastShadow = false
			end
			-- moving parts shouldn't shove players around
			if AnimData.Spin[d.Name] or AnimData.Sway[d.Name] or AnimData.Swing[d.Name] then
				d.CanCollide = false
			end
		end
	end
	if not PropSetup.NoOutline[name] then
		CollectionService:AddTag(model, PropSetup.OutlineTag)
	end
	if animated then
		-- The animator positions parts relative to the model pivot, so the pivot must not
		-- follow a moving part.
		local primary = model.PrimaryPart
		if primary and isAnimated(primary) then
			local pivot = model:GetPivot()
			model.PrimaryPart = nil
			model.WorldPivot = pivot
		end
		CollectionService:AddTag(model, PropSetup.AnimTag)
	end
	return model
end

-- Prepares every Model under a folder (e.g. ServerStorage/Props after import).
function PropSetup.prepareAll(folder: Instance)
	for _, m in folder:GetDescendants() do
		if m:IsA("Model") and m:FindFirstChildWhichIsA("BasePart") then
			PropSetup.prepare(m)
		end
	end
end

return PropSetup
