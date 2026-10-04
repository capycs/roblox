--!strict
-- Hatch odds for the coin eggs in the shop, plus the helper every odds display uses so the
-- shown percentages always add up to exactly 100% (Roblox paid random items policy).
--
--   ShopEggs.odds("EggRare")              -> { { species, chance, rarity, element } ... } highest first
--   ShopEggs.odds("EggRare", true)        -> the same with the Lucky Hatch pass
--   ShopEggs.mutationOdds(lucky)          -> { Golden = 0.0067, ... }
--   ShopEggs.hatch("EggRare", rng, lucky) -> species, mutations
--   ShopEggs.percentages({ 0.5, 0.3, 0.2 }, 2) -> { "50.00%", "30.00%", "20.00%" } (sums to 100)

local Creatures = script.Parent.Parent:WaitForChild("Creatures")
local CreatureInfo = require(Creatures:WaitForChild("CreatureInfo"))
local Mutations = require(Creatures:WaitForChild("Mutations"))

local ShopEggs = {}

-- Weight of each rarity tier per egg, split evenly over the species in that tier.
ShopEggs.Rarity = {
	EggCommon = { Common = 70, Uncommon = 25, Rare = 5 },
	EggUncommon = { Common = 35, Uncommon = 45, Rare = 17, Epic = 3 },
	EggRare = { Uncommon = 30, Rare = 50, Epic = 17, Legendary = 3 },
	EggEpic = { Rare = 35, Epic = 50, Legendary = 14, Mythic = 1 },
	EggLegendary = { Epic = 40, Legendary = 55, Mythic = 5 },
	EggMythic = { Legendary = 70, Mythic = 30 },
} :: { [string]: { [string]: number } }

-- Lucky Hatch pass: these tiers weigh 1.5x more, and mutation chances are 1.5x.
ShopEggs.LuckyTiers = { Epic = 1.5, Legendary = 1.5, Mythic = 1.5 }
ShopEggs.LuckyMutationLuck = 1.5

function ShopEggs.odds(eggId: string, lucky: boolean?): { { species: string, chance: number, rarity: string, element: string } }
	local tiers = ShopEggs.Rarity[eggId]
	assert(tiers, "Unknown shop egg " .. eggId)
	local count: { [string]: number } = {}
	for _, info in CreatureInfo.Species do
		count[info.rarity] = (count[info.rarity] or 0) + 1
	end
	local out, total = {}, 0
	for name, info in CreatureInfo.Species do
		local w = (tiers[info.rarity] or 0) / math.max(1, count[info.rarity])
		if lucky then
			w *= ShopEggs.LuckyTiers[info.rarity] or 1
		end
		if w > 0 then
			table.insert(out, { species = name, chance = w, rarity = info.rarity, element = info.element })
			total += w
		end
	end
	for _, e in out do
		e.chance /= total
	end
	table.sort(out, function(a, b)
		if a.chance ~= b.chance then
			return a.chance > b.chance
		end
		return a.species < b.species
	end)
	return out
end

function ShopEggs.mutationOdds(lucky: boolean?): { [string]: number }
	return Mutations.chances(if lucky then ShopEggs.LuckyMutationLuck else 1)
end

function ShopEggs.hatch(eggId: string, rng: Random, lucky: boolean?): (string, { string })
	local list = ShopEggs.odds(eggId, lucky)
	local roll = rng:NextNumber()
	for _, e in list do
		roll -= e.chance
		if roll <= 0 then
			return e.species, Mutations.roll(rng, if lucky then ShopEggs.LuckyMutationLuck else 1)
		end
	end
	return list[#list].species, Mutations.roll(rng, if lucky then ShopEggs.LuckyMutationLuck else 1)
end

-- Percent strings that add up to exactly 100 (largest-remainder rounding).
function ShopEggs.percentages(chances: { number }, decimals: number?): { string }
	local d = decimals or 2
	local unit = 10 ^ d
	local total = 100 * unit
	local floors, rem, sum = {}, {}, 0
	for i, c in chances do
		local exact = c * total
		floors[i] = math.floor(exact)
		rem[i] = exact - floors[i]
		sum += floors[i]
	end
	local order = {}
	for i in chances do
		table.insert(order, i)
	end
	table.sort(order, function(a, b)
		return rem[a] > rem[b]
	end)
	for k = 1, math.max(0, math.floor(total - sum + 0.5)) do
		local i = order[((k - 1) % #order) + 1]
		floors[i] += 1
	end
	local out = {}
	for i, f in floors do
		out[i] = string.format("%." .. d .. "f%%", f / unit)
	end
	return out
end

return ShopEggs
