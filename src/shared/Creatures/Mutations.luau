--!strict
-- Creature mutations. A creature can roll one colour mutation (Shiny, Golden, Rainbow,
-- Void, Crystal) plus Giant and/or Supercharged. Colour mutations swap the Body texture
-- for a recoloured palette (assets/creatures/<Name>/mutations/<Mutation>.png ->
-- AssetIds.Mutations) and recolour the glow; every mutation adds an aura (Effects preset).
--
-- Server: local muts = Mutations.roll(rng); Mutations.applyServer(model, muts)
--         (sets the "Mutations" attribute and does the Giant scale-up)
-- Client: MutationVisuals.client reads the attribute and does textures, glow and auras.

export type Def = {
	chance: number, -- 1 in N when hatching
	color: boolean, -- recolours the body (only one colour mutation at a time)
	stats: { [string]: number }, -- multipliers: power, coins, hp, defense, ability
	aura: string, -- Effects preset attached to the body
	glow: Color3?, -- glow meshes recoloured to this (nil = keep species colour)
	rainbowGlow: boolean?, -- glow cycles through the rainbow
	scale: number?, -- Giant
	reflectance: number?, -- Crystal sheen
	label: string,
	labelColor: Color3,
}

local Mutations = {}

Mutations.Defs = {
	Shiny = { chance = 50, color = true, stats = { power = 1.15 }, aura = "MutShiny", label = "Shiny", labelColor = Color3.fromRGB(127, 240, 255) },
	Golden = { chance = 150, color = true, stats = { power = 1.25, coins = 1.5 }, aura = "MutGolden", glow = Color3.fromRGB(255, 210, 63), label = "Golden", labelColor = Color3.fromRGB(255, 210, 63) },
	Crystal = { chance = 300, color = true, stats = { power = 1.3, defense = 1.5 }, aura = "MutCrystal", glow = Color3.fromRGB(191, 244, 255), reflectance = 0.25, label = "Crystal", labelColor = Color3.fromRGB(191, 244, 255) },
	Void = { chance = 500, color = true, stats = { power = 1.6 }, aura = "MutVoid", glow = Color3.fromRGB(176, 77, 255), label = "Void", labelColor = Color3.fromRGB(176, 77, 255) },
	Rainbow = { chance = 800, color = true, stats = { power = 2, coins = 2, hp = 1.5 }, aura = "MutRainbow", rainbowGlow = true, label = "Rainbow", labelColor = Color3.fromRGB(255, 120, 200) },
	Giant = { chance = 100, color = false, stats = { hp = 1.3, power = 1.15 }, aura = "MutGiant", scale = 1.5, label = "Giant", labelColor = Color3.fromRGB(255, 170, 90) },
	Supercharged = { chance = 400, color = false, stats = { ability = 1.75 }, aura = "MutCharged", label = "Supercharged", labelColor = Color3.fromRGB(255, 240, 120) },
} :: { [string]: Def }

-- Rarest colour first, so a lucky roll keeps the best one.
local COLOR_ORDER = { "Rainbow", "Void", "Crystal", "Golden", "Shiny" }

-- Roll mutations for a hatch. luck multiplies every chance (2 = twice as likely).
function Mutations.roll(rng: Random, luck: number?): { string }
	local l = luck or 1
	local out = {}
	for _, name in COLOR_ORDER do
		if rng:NextNumber() < l / Mutations.Defs[name].chance then
			table.insert(out, name)
			break
		end
	end
	for _, name in { "Giant", "Supercharged" } do
		if rng:NextNumber() < l / Mutations.Defs[name].chance then
			table.insert(out, name)
		end
	end
	return out
end

-- Combined stat multiplier for a list of mutations (e.g. Mutations.stat(muts, "power")).
function Mutations.stat(muts: { string }, key: string): number
	local m = 1
	for _, name in muts do
		local d = Mutations.Defs[name]
		if d and d.stats[key] then
			m *= d.stats[key]
		end
	end
	return m
end

function Mutations.encode(muts: { string }): string
	return table.concat(muts, ",")
end
function Mutations.decode(s: string?): { string }
	local out = {}
	if s and s ~= "" then
		for name in string.gmatch(s, "[^,]+") do
			if Mutations.Defs[name] then
				table.insert(out, name)
			end
		end
	end
	return out
end

-- Server: store the mutations on the model and apply the physical ones (Giant scale).
function Mutations.applyServer(model: Model, muts: { string })
	model:SetAttribute("Mutations", Mutations.encode(muts))
	for _, name in muts do
		local d = Mutations.Defs[name]
		if d and d.scale and not model:GetAttribute("MutScaled") then
			model:ScaleTo(model:GetScale() * d.scale)
			model:SetAttribute("MutScaled", true)
		end
	end
end

return Mutations
