--!strict
-- Creates a MaterialVariant for each ground texture in assets/textures and makes it the
-- override for its terrain material (Grass, Rock, Snow...), so terrain uses our cartoon
-- textures. Skips any texture whose IDs are not filled in yet (src/shared/AssetIds.luau).

local MaterialService = game:GetService("MaterialService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local AssetIds = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("AssetIds"))

local applied, skipped = 0, {}
for name, t in AssetIds.Textures do
	local color = AssetIds.get(t.color)
	if not color then
		table.insert(skipped, name)
		continue
	end
	local material = (Enum.Material :: any)[t.terrain] :: Enum.Material
	local variant = MaterialService:FindFirstChild("Eggnappers" .. name) :: MaterialVariant?
	if not variant then
		local v = Instance.new("MaterialVariant")
		v.Name = "Eggnappers" .. name
		v.Parent = MaterialService
		variant = v
	end
	local mv = variant :: MaterialVariant
	mv.BaseMaterial = material
	mv.ColorMap = color
	mv.NormalMap = AssetIds.get(t.normal) or ""
	mv.RoughnessMap = AssetIds.get(t.roughness) or ""
	mv.StudsPerTile = t.studsPerTile
	MaterialService:SetBaseMaterialOverride(material, mv.Name)
	applied += 1
end
if #skipped > 0 then
	table.sort(skipped)
	warn(`[TerrainMaterials] {applied} applied; waiting on texture IDs for: {table.concat(skipped, ", ")}`)
end
