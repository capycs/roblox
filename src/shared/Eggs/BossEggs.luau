--!strict
-- Boss eggs hatch toward the boss they came from:
--   * element: creatures of the boss's element are `elementBoost` times more likely
--     (a Pyrothrax egg leans Fire, a Thalassor egg leans Water)
--   * mutations: every mutation the boss had is `bossMutationBoost` times more likely on top of
--     the egg's general `mutationLuck` (a Golden Pyrothrax drops eggs that hatch Golden far more often)
--
-- DungeonService saves what's needed when an egg is carried out:
--   info.egg = BossEggs.data("EggPyrothrax", { "Golden" })   -- store this with the player's egg
-- Later, when it hatches (incubator, hatch button...):
--   local species, mutations = BossEggs.hatch(eggData, Random.new())
-- For a "chances" panel in the UI:
--   BossEggs.odds(eggData)  -> { { species = "Solarion", chance = 0.064 }, ... } (sorted, sums to 1)
--   BossEggs.mutationOdds(eggData) -> { Golden = 0.16, Shiny = 0.5, ... } (chance per mutation)

local Creatures = script.Parent.Parent:WaitForChild("Creatures")
local CreatureInfo = require(Creatures:WaitForChild("CreatureInfo"))
local Mutations = require(Creatures:WaitForChild("Mutations"))

export type EggDef = {
	boss: string,
	element: string,
	rarity: { [string]: number }, -- weight of each rarity tier (split evenly over its species)
	elementBoost: number,
	mutationLuck: number, -- multiplies every mutation chance (boss eggs mutate more than shop eggs)
	bossMutationBoost: number, -- extra multiplier for the mutations the boss had
}
export type EggData = { egg: string, element: string, mutations: { string } }

local BossEggs = {}

BossEggs.Eggs = {
	EggPyrothrax = {
		boss = "Pyrothrax",
		element = "Fire",
		rarity = { Common = 0, Uncommon = 10, Rare = 38, Epic = 30, Legendary = 18, Mythic = 4 },
		elementBoost = 4,
		mutationLuck = 3,
		bossMutationBoost = 8,
	},
	EggThalassor = {
		boss = "Thalassor",
		element = "Water",
		rarity = { Common = 0, Uncommon = 10, Rare = 38, Epic = 30, Legendary = 18, Mythic = 4 },
		elementBoost = 4,
		mutationLuck = 3,
		bossMutationBoost = 8,
	},
} :: { [string]: EggDef }

-- What to save with an egg the player carried out of a boss run.
function BossEggs.data(eggName: string, bossMutations: { string }?): EggData
	local def = BossEggs.Eggs[eggName]
	assert(def, "Unknown boss egg " .. eggName)
	return { egg = eggName, element = def.element, mutations = table.clone(bossMutations or {}) }
end

-- Chance of each species, highest first.
function BossEggs.odds(data: EggData): { { species: string, chance: number } }
	local def = BossEggs.Eggs[data.egg]
	local count: { [string]: number } = {}
	for _, info in CreatureInfo.Species do
		count[info.rarity] = (count[info.rarity] or 0) + 1
	end
	local out, total = {}, 0
	for name, info in CreatureInfo.Species do
		local w = (def.rarity[info.rarity] or 0) / math.max(1, count[info.rarity])
		if info.element == data.element then
			w *= def.elementBoost
		end
		if w > 0 then
			table.insert(out, { species = name, chance = w })
			total += w
		end
	end
	for _, e in out do
		e.chance /= total
	end
	table.sort(out, function(a, b)
		return a.chance > b.chance
	end)
	return out
end

local function boosts(data: EggData): { [string]: number }
	local def = BossEggs.Eggs[data.egg]
	local b = {}
	for _, m in data.mutations do
		b[m] = def.bossMutationBoost
	end
	return b
end

-- Chance of each mutation on its own (colour mutations exclude each other, rarest first).
function BossEggs.mutationOdds(data: EggData): { [string]: number }
	local def = BossEggs.Eggs[data.egg]
	return Mutations.chances(def.mutationLuck, boosts(data))
end

function BossEggs.hatch(data: EggData, rng: Random): (string, { string })
	local def = BossEggs.Eggs[data.egg]
	local roll, species = rng:NextNumber(), nil
	local list = BossEggs.odds(data)
	for _, e in list do
		roll -= e.chance
		if roll <= 0 then
			species = e.species
			break
		end
	end
	return species or list[#list].species, Mutations.roll(rng, def.mutationLuck, boosts(data))
end

return BossEggs
