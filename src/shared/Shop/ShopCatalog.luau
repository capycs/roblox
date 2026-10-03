--!strict
-- What the shop sells. Egg prices are in coins; gem packs and passes are Robux products.
-- Fill in the product/game-pass IDs once they are created on the Creator Dashboard
-- (0 = not created yet; the button then shows a "coming soon" toast instead).

return {
	Eggs = {
		{ id = "EggCommon", name = "Common Egg", rarity = "Common", price = 250, hatchSeconds = 60 },
		{ id = "EggUncommon", name = "Uncommon Egg", rarity = "Uncommon", price = 900, hatchSeconds = 180 },
		{ id = "EggRare", name = "Rare Egg", rarity = "Rare", price = 3000, hatchSeconds = 600 },
		{ id = "EggEpic", name = "Epic Egg", rarity = "Epic", price = 12000, hatchSeconds = 1800 },
		{ id = "EggLegendary", name = "Legendary Egg", rarity = "Legendary", price = 50000, hatchSeconds = 3600 },
		{ id = "EggMythic", name = "Mythic Egg", rarity = "Mythic", price = 0, hatchSeconds = 7200, bossRunOnly = true },
	},
	GemPacks = {
		{ id = "GemsSmall", name = "Pouch of Gems", gems = 100, robux = 49, productId = 0, icon = "Gem" },
		{ id = "GemsMedium", name = "Pile of Gems", gems = 550, robux = 229, productId = 0, icon = "GemPile", tag = "+10%" },
		{ id = "GemsLarge", name = "Chest of Gems", gems = 1200, robux = 449, productId = 0, icon = "StarterPack", tag = "Best value" },
	},
	Passes = {
		{ id = "VIP", name = "VIP", blurb = "+1 incubator, golden name, VIP lounge", robux = 399, gamePassId = 0, icon = "VIP" },
		{ id = "DoubleCoins", name = "2x Coins", blurb = "Double coins from dens and expeditions", robux = 299, gamePassId = 0, icon = "DoubleCoins" },
		{ id = "Luck", name = "Lucky Hatch", blurb = "Better odds of rare creatures and Gold", robux = 249, gamePassId = 0, icon = "Luck" },
		{ id = "FastHatch", name = "Fast Hatch", blurb = "All eggs hatch twice as fast", robux = 349, gamePassId = 0, icon = "InstantHatch" },
	},
	-- Gems to finish an egg now: per remaining minute, at least 5.
	InstantHatchGemsPerMinute = 2,
	InstantHatchMinGems = 5,
}
