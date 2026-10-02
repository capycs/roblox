--!strict
-- Prepares imported prop models (skyship, trees, rocks, shops, eggs...):
-- glow meshes become Neon, glass becomes Glass, small clutter stops blocking players,
-- and moving parts get tagged so clients spin them.
--
-- Mesh names come from tools/art (each GLB node keeps its name on import).

local CollectionService = game:GetService("CollectionService")

local PropSetup = {}

PropSetup.GlowMeshes = { Glow = true, GlowCore = true, Lamp = true, Flame = true, FlameCore = true, Rune = true, Potion = true, Eyes = true }
PropSetup.GlassMeshes = { Glass = true }

-- Moving parts by mesh name: spin axis in the part's own space and speed (rad/s).
PropSetup.Spinners = {
	PropL = { axis = Vector3.zAxis, speed = 14 },
	PropR = { axis = Vector3.zAxis, speed = -14 },
	PropBack = { axis = Vector3.zAxis, speed = 9 },
	Blades = { axis = Vector3.zAxis, speed = 0.8 },
	Ring = { axis = Vector3.yAxis, speed = 1.2 },
}
PropSetup.SpinTag = "PropSpinner"

-- Props players should walk through (grass, flowers...). Everything else collides.
PropSetup.NoCollide = {
	GrassTuft = true, GrassTuftSnow = true, FlowerPatch = true, Fern = true, Reeds = true, Lilypad = true,
	MushroomCluster = true, GlowShroom = true, Bush = true, BushBerry = true, BushFlower = true,
}

function PropSetup.prepare(model: Model, propName: string?): Model
	local name = propName or model.Name
	local walkThrough = PropSetup.NoCollide[name] == true
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = true
			if walkThrough then
				d.CanCollide = false
				d.CanQuery = false
			end
			if PropSetup.GlowMeshes[d.Name] then
				d.Material = Enum.Material.Neon
				d.CastShadow = false
				d.CanCollide = false
			elseif PropSetup.GlassMeshes[d.Name] then
				d.Material = Enum.Material.Glass
				d.Transparency = 0.55
				d.CastShadow = false
			end
			if PropSetup.Spinners[d.Name] then
				CollectionService:AddTag(d, PropSetup.SpinTag)
			end
		end
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
