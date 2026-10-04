--!strict
-- What the shop sells. Egg prices are in coins; gem packs, offers and passes are Robux.
-- Fill in the product/game-pass IDs once they are created on the Creator Dashboard
-- (0 = not created yet; the button then shows a "coming soon" toast instead).
--
-- Grant the contents in your ProcessReceipt (developer products) using the ids here. Offers list
-- exactly what the buyer gets; the shop shows it item by item, and shows the odds for anything
-- random (eggs, luck passes) before purchase, as Roblox's paid random items policy requires.
-- Icons are the premium 3D icons (AssetIds.Premium, tools/art/props/premium.js).

return {
	Eggs = {
		{ id = "EggCommon", name = "Common Egg", rarity = "Common", price = 250, hatchSeconds = 60 },
		{ id = "EggUncommon", name = "Uncommon Egg", rarity = "Uncommon", price = 900, hatchSeconds = 180 },
		{ id = "EggRare", name = "Rare Egg", rarity = "Rare", price = 3000, hatchSeconds = 600 },
		{ id = "EggEpic", name = "Epic Egg", rarity = "Epic", price = 12000, hatchSeconds = 1800 },
		{ id = "EggLegendary", name = "Legendary Egg", rarity = "Legendary", price = 50000, hatchSeconds = 3600 },
		{ id = "EggMythic", name = "Mythic Egg", rarity = "Mythic", price = 0, hatchSeconds = 7200, bossRunOnly = true },
	},
	-- Value labels ("+47% more") are worked out from gems per Robux against the smallest pack,
	-- so they're always true. The best rate gets the BEST VALUE ribbon automatically.
	GemPacks = {
		{ id = "GemsPouch", name = "Pouch of Gems", gems = 100, robux = 49, productId = 0, icon = "GemsPouch" },
		{ id = "GemsPile", name = "Pile of Gems", gems = 550, robux = 229, productId = 0, icon = "GemsPile", popular = true },
		{ id = "GemsChest", name = "Chest of Gems", gems = 1200, robux = 449, productId = 0, icon = "GemsChest" },
		{ id = "GemsVault", name = "Gem Vault", gems = 3000, robux = 999, productId = 0, icon = "GemsVault" },
	},
	-- odds = true: the pass changes random outcomes, so its card links to the odds with and without it
	Passes = {
		{ id = "VIP", name = "VIP", blurb = "+1 incubator, golden name, VIP lounge", robux = 399, gamePassId = 0, icon = "PassVIP" },
		{ id = "Luck", name = "Lucky Hatch", blurb = "Epic+ creatures x1.5 and mutations x1.5 from shop eggs", robux = 249, gamePassId = 0, icon = "PassLucky", odds = true },
		{ id = "DoubleCoins", name = "2x Coins", blurb = "Double coins from everything", robux = 299, gamePassId = 0, icon = "PassDoubleCoins" },
		{ id = "FastHatch", name = "Fast Hatch", blurb = "All eggs hatch twice as fast", robux = 349, gamePassId = 0, icon = "PassFastHatch" },
		{ id = "ExtraCarry", name = "Egg Carrier", blurb = "Carry 1 more egg out of boss runs", robux = 199, gamePassId = 0, icon = "PassExtraCarry" },
		{ id = "BossKey", name = "Boss Key", blurb = "+1 bonus egg in every boss nest you raid", robux = 449, gamePassId = 0, icon = "PassBossKey" },
		{ id = "MutationHunter", name = "Mutation Hunter", blurb = "Boss eggs roll mutations at x2 luck", robux = 399, gamePassId = 0, icon = "PassMutation", odds = true },
		{ id = "TripleHatch", name = "Triple Hatch", blurb = "Open 3 eggs at once", robux = 499, gamePassId = 0, icon = "PassTripleHatch" },
	},
	-- Featured offers. `hours` is how long the offer lasts after a player first joins (the server
	-- tracks it: Offers.server sets the <Id>EndsAt attribute). oneTime offers can only be bought once.
	Offers = {
		{
			id = "StarterPack", name = "Starter Pack", icon = "OfferStarter", robux = 99, productId = 0, oneTime = true, hours = 48,
			showcase = { species = "Sparkit", mutations = { "Golden" } },
			contents = {
				{ kind = "creature", species = "Sparkit", mutations = { "Golden" }, label = "Golden Sparkit" },
				{ kind = "gems", amount = 500, label = "500 Gems" },
				{ kind = "coins", amount = 25000, label = "25,000 Coins" },
			},
		},
		{
			id = "BossBundle", name = "Boss Hunter Bundle", icon = "OfferBoss", robux = 399, productId = 0, hours = 72,
			showcase = { species = "Thalassor" },
			contents = {
				{ kind = "egg", egg = "EggPyrothrax", amount = 1, label = "Pyrothrax Egg", random = true },
				{ kind = "egg", egg = "EggThalassor", amount = 1, label = "Thalassor Egg", random = true },
				{ kind = "gems", amount = 600, label = "600 Gems" },
			},
		},
	},
	-- Gems to finish an egg now: per remaining minute, at least 5.
	InstantHatchGemsPerMinute = 2,
	InstantHatchMinGems = 5,
}
