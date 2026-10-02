--!strict
-- Client side of creature mutations. The server sets the "Mutations" attribute
-- (Mutations.applyServer); this script makes it visible on every tagged creature:
--   colour mutations: swap the Body texture (AssetIds.Mutations[species][mutation]),
--                     recolour the glow meshes (Shiny hue-shifts, Rainbow cycles),
--                     Crystal adds a reflective sheen
--   every mutation:   attaches its aura (Effects preset) to the Body
-- Glow colours are stored in the part's "GlowBase" attribute so CreatureAnimator's
-- glow pulse keeps the mutated colour.

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Creatures = Shared:WaitForChild("Creatures")
local Config = require(Creatures.CreatureConfig)
local CreatureSetup = require(Creatures.CreatureSetup)
local Mutations = require(Creatures.Mutations)
local AssetIds = require(Shared.AssetIds)
local Effects = require(Shared.Fx.Effects)

type Entry = {
	auras: { Effects.Handle },
	rainbow: { { part: BasePart, direct: boolean } }, -- direct: no animator pulse, so set Color here
	original: { [BasePart]: { texture: string?, color: Color3, reflectance: number } },
}
local active: { [Model]: Entry } = {}
local conns: { [Model]: RBXScriptConnection } = {}

local function shiftHue(c: Color3, dh: number): Color3
	local h, s, v = c:ToHSV()
	return Color3.fromHSV((h + dh) % 1, s, v)
end

local function clear(model: Model)
	local e = active[model]
	if not e then
		return
	end
	for _, h in e.auras do
		h:Stop()
	end
	for part, o in e.original do
		if o.texture and part:IsA("MeshPart") then
			part.TextureID = o.texture
		end
		part.Color = o.color
		part.Reflectance = o.reflectance
		part:SetAttribute("GlowBase", nil)
	end
	active[model] = nil
end

local function apply(model: Model)
	clear(model)
	local species = model:GetAttribute("Species")
	local def = typeof(species) == "string" and Config.Species[species]
	if not def then
		return
	end
	local muts = Mutations.decode(model:GetAttribute("Mutations") :: string?)
	if #muts == 0 then
		return
	end
	local entry: Entry = { auras = {}, rainbow = {}, original = {} }
	active[model] = entry
	local body = model:FindFirstChild("Body", true) :: BasePart?

	local function remember(part: BasePart)
		if not entry.original[part] then
			entry.original[part] = {
				texture = if part:IsA("MeshPart") then part.TextureID else nil,
				color = part.Color,
				reflectance = part.Reflectance,
			}
		end
	end

	for _, name in muts do
		local m = Mutations.Defs[name]
		if m.color then
			-- body texture swap
			local ids = (AssetIds.Mutations :: any)[species]
			local id = ids and AssetIds.get(ids[name])
			if body and body:IsA("MeshPart") then
				remember(body)
				if id then
					body.TextureID = id
				end
				if m.reflectance then
					body.Reflectance = m.reflectance
				end
			end
			-- glow recolour (eyes keep their colour except on Shiny, like the textures)
			for _, d in model:GetDescendants() do
				local base = d:IsA("BasePart") and def.glow[d.Name]
				if base and (d.Name ~= "Eyes" or name == "Shiny") then
					local part = d :: BasePart
					remember(part)
					local c = if name == "Shiny" then shiftHue(base, 0.42) else m.glow or base
					part.Color = c
					part:SetAttribute("GlowBase", c)
					if m.rainbowGlow then
						table.insert(entry.rainbow, { part = part, direct = not (def.pulse and def.pulse[part.Name]) })
					end
				end
			end
		end
		if body and Effects.Presets[m.aura] then
			table.insert(entry.auras, Effects.attach(m.aura, body))
		end
	end
end

local function track(inst: Instance)
	if not inst:IsA("Model") or conns[inst] then
		return
	end
	conns[inst] = inst:GetAttributeChangedSignal("Mutations"):Connect(function()
		apply(inst)
	end)
	apply(inst)
end

local function untrack(inst: Instance)
	local model = inst :: Model
	if conns[model] then
		conns[model]:Disconnect()
		conns[model] = nil
	end
	clear(model)
end

for _, inst in CollectionService:GetTagged(CreatureSetup.Tag) do
	track(inst)
end
CollectionService:GetInstanceAddedSignal(CreatureSetup.Tag):Connect(track)
CollectionService:GetInstanceRemovedSignal(CreatureSetup.Tag):Connect(untrack)

-- Rainbow glow: cycle the hue; each part offset so the colours chase around the body.
RunService.Heartbeat:Connect(function()
	local t = os.clock()
	for _, e in active do
		for i, r in e.rainbow do
			local c = Color3.fromHSV((t * 0.25 + i * 0.17) % 1, 0.85, 1)
			r.part:SetAttribute("GlowBase", c)
			if r.direct then
				r.part.Color = c
			end
		end
	end
end)
