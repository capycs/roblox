--!strict
-- Who every creature is: rarity, a short description, and its signature ability (with the
-- Effects preset that plays it). Gameplay numbers here are starting points to tune.
-- Visual/animation setup lives in CreatureConfig; this is the design data.

export type Ability = {
	name: string,
	description: string,
	effect: string, -- Effects preset (src/shared/Fx/Effects.luau)
	cooldown: number, -- seconds
	power: number, -- relative damage/heal strength (1 = baseline)
	radius: number?, -- studs, for area abilities
}
export type Info = {
	element: string,
	rarity: string, -- Common, Uncommon, Rare, Epic, Legendary, Mythic
	description: string,
	ability: Ability,
	passive: string?, -- legendaries and the mythic
}

local Info: { [string]: Info } = {
	-- Common
	Bramblepup = {
		element = "Nature", rarity = "Common",
		description = "A round, leafy puppy with a flower on its head. Follows you everywhere and sneezes pollen when happy.",
		ability = { name = "Thorn Burst", effect = "ThornBurst", cooldown = 6, power = 0.8, radius = 8,
			description = "Shakes its leaf collar and fires thorny seeds in a ring. Each seed nicks enemies and sprouts a flower that slows them for 2 seconds." },
	},
	Shellsnap = {
		element = "Water", rarity = "Common",
		description = "A stout reef turtle with coral growing on its shell. Slow, stubborn and very hard to knock over.",
		ability = { name = "Tidal Shell", effect = "TidalShell", cooldown = 8, power = 0.9, radius = 10,
			description = "Pulls into its shell and spins, sending out a ring-shaped wave that knocks enemies back and soaks them (-20% speed for 3 seconds)." },
	},
	Shroomtoad = {
		element = "Nature", rarity = "Common",
		description = "A squat, warty toad carrying a giant spotted mushroom on its back. Hops everywhere and naps in the rain.",
		ability = { name = "Puffball Bounce", effect = "PuffballBounce", cooldown = 7, power = 0.8, radius = 9,
			description = "Hops high and belly-flops. Its cap shakes loose puffballs that burst into sleepy spore clouds, making enemies drowsy (-30% attack speed for 3 seconds)." },
	},
	-- Uncommon
	Sparkit = {
		element = "Storm", rarity = "Uncommon",
		description = "A twitchy fox-squirrel with a lightning-bolt tail. Can't sit still for more than a second.",
		ability = { name = "Static Dash", effect = "StaticDash", cooldown = 6, power = 1.0,
			description = "Zig-zags forward at blinding speed. Sparks chain from it to up to 3 nearby enemies, each zap weaker than the last." },
	},
	Mossback = {
		element = "Nature", rarity = "Uncommon",
		description = "A sturdy boar wearing a garden of mossy stones and glowing spore flowers on its back.",
		ability = { name = "Spore Bloom", effect = "SporeBloom", cooldown = 12, power = 1.0, radius = 12,
			description = "Its back-flowers burst open and release glowing spores that heal you and nearby friendly creatures over 4 seconds." },
	},
	Pumpkit = {
		element = "Fire", rarity = "Uncommon",
		description = "A cat-shaped jack-o'-lantern with leaf ears and vine legs. A candle flame flickers inside its carved body.",
		ability = { name = "Lantern Pop", effect = "LanternPop", cooldown = 7, power = 1.0, radius = 8,
			description = "Its carved windows flare and it spits a glowing pumpkin seed that bursts into a ring of candle flames, burning enemies and lighting up the area for 5 seconds." },
	},
	Boltaroo = {
		element = "Storm", rarity = "Uncommon",
		description = "An upright kangaroo boxer with crackling blue gloves and a battery in its pouch. Bounces on its toes and never backs down from a fight.",
		ability = { name = "Haymaker", effect = "Haymaker", cooldown = 7, power = 1.1, radius = 6,
			description = "Winds up and throws a lightning-charged punch that knocks the target back and zaps anything standing behind it." },
	},
	-- Rare
	Tidefin = {
		element = "Water", rarity = "Rare",
		description = "A sleek otter-axolotl with glowing gill fronds. Loves rivers, hates being dry.",
		ability = { name = "Riptide Spiral", effect = "RiptideSpiral", cooldown = 9, power = 1.1, radius = 10,
			description = "Spins up a whirlpool around itself that drags nearby enemies inward, then bursts in a splash." },
	},
	Blazehorn = {
		element = "Fire", rarity = "Rare",
		description = "A woolly lava ram with molten-tipped horns. Its fleece is always slightly smoking.",
		ability = { name = "Magma Charge", effect = "MagmaCharge", cooldown = 9, power = 1.25,
			description = "Charges in a straight line leaving burning hoofprints, and ends with a small eruption that launches enemies upward." },
	},
	Frostfawn = {
		element = "Ice", rarity = "Rare",
		description = "A graceful snow deer with crystal antlers that chime in the wind.",
		ability = { name = "Aurora Veil", effect = "AuroraVeil", cooldown = 15, power = 1.0, radius = 10,
			description = "Raises a shimmering aurora that blocks the next hit for you and allies inside it, and slows enemies who walk in." },
	},
	Glimmoth = {
		element = "Storm", rarity = "Rare",
		description = "A fluffy moth-fox with feathery antennae and four soft wings. Its glowing eye-spots crackle with static.",
		ability = { name = "Dazzle Dust", effect = "DazzleDust", cooldown = 10, power = 1.1, radius = 11,
			description = "Beats its wings and showers crackling eye-spot dust. Enemies caught in it are dazzled (40% of their attacks miss for 3 seconds) and take small shocks." },
	},
	Lunowl = {
		element = "Shadow", rarity = "Rare",
		description = "A round midnight owl with huge amber eyes and a glowing crescent on its forehead. Only truly wakes up after dark.",
		ability = { name = "Moon Screech", effect = "MoonScreech", cooldown = 10, power = 1.1, radius = 12,
			description = "Lets out an eerie screech in rings of moonlight. Enemies hit are confused for 2 seconds and wander the wrong way." },
	},
	-- Epic
	Emberfang = {
		element = "Fire", rarity = "Epic",
		description = "A young fire wolf. The flame on its tail burns brighter the more excited it gets.",
		ability = { name = "Flame Pounce", effect = "FlamePounce", cooldown = 8, power = 1.4, radius = 8,
			description = "Leaps onto a target and lands in a ring of fire that burns nearby enemies for 3 seconds." },
	},
	Frostusk = {
		element = "Ice", rarity = "Epic",
		description = "A shaggy frost beast with tusks and a back full of ice crystals. Gentle until provoked.",
		ability = { name = "Glacier Stomp", effect = "GlacierStomp", cooldown = 10, power = 1.4, radius = 12,
			description = "Rears up and stomps. Ice spikes burst outward in a ring and slow every enemy they hit by 40% for 4 seconds." },
	},
	Umbrapaw = {
		element = "Shadow", rarity = "Epic",
		description = "A shadow panther with a crescent moon on its brow. Moves without a sound.",
		ability = { name = "Shade Step", effect = "ShadeStep", cooldown = 7, power = 1.5,
			description = "Melts into a puddle of shadow and reappears behind its target, striking first for bonus damage." },
	},
	Geodillo = {
		element = "Shadow", rarity = "Epic",
		description = "A stocky armadillo whose shell has cracked open into amethyst geodes. Digs tunnels and hoards shiny rocks.",
		ability = { name = "Geode Roll", effect = "GeodeRoll", cooldown = 9, power = 1.5, radius = 7,
			description = "Curls into an armoured ball and rolls forward, bowling enemies over. When it stops, its geodes burst and fire amethyst shards in every direction." },
	},
	Koiren = {
		element = "Water", rarity = "Epic",
		description = "A koi that swims through the air as if it were water, trailing ribbon fins. It guards a glowing pearl under its chin.",
		ability = { name = "Pearl Surge", effect = "PearlSurge", cooldown = 11, power = 1.4, radius = 12,
			description = "Its pearl flares and bursts into a ring of water that knocks enemies away and heals nearby friendly creatures a little." },
	},
	-- Legendary
	Voltgriff = {
		element = "Storm", rarity = "Legendary",
		description = "A storm griffin whose feathers crackle with static. Thunder follows wherever it flies.",
		ability = { name = "Thunder Dive", effect = "ThunderDive", cooldown = 12, power = 1.8, radius = 10,
			description = "Soars upward, then dives and calls down a lightning strike that stuns everything in a 10-stud circle for 1.5 seconds." },
		passive = "Static Charge: every third hit zaps a second enemy.",
	},
	Nyxwing = {
		element = "Shadow", rarity = "Legendary",
		description = "A young shadow drake wrapped in violet flame. Said to be born from the darkest night of the year.",
		ability = { name = "Umbral Veil", effect = "UmbralVeil", cooldown = 14, power = 2.0,
			description = "Wraps itself in shadow and turns nearly invisible for 3 seconds. Its next bite deals double damage." },
		passive = "Night Hunter: 20% stronger in the Shadow zone and at dusk.",
	},
	Solarion = {
		element = "Fire", rarity = "Legendary",
		description = "An armoured sun-lion. Its halo turns slowly behind its mane and three fire orbs circle it like small suns.",
		ability = { name = "Solar Flare", effect = "SolarFlare", cooldown = 14, power = 2.1, radius = 14,
			description = "Its halo blazes white-hot and fires a beam of sunlight in a line; the three orbiting fire orbs fly out and explode where it hits." },
		passive = "Radiance: nearby friendly creatures deal 10% more damage.",
	},
	Glaciarch = {
		element = "Ice", rarity = "Legendary",
		description = "An armoured frost wyvern with a floating crystal crown and a ring of ice shards orbiting its body.",
		ability = { name = "Absolute Zero", effect = "AbsoluteZero", cooldown = 16, power = 2.0, radius = 16,
			description = "Beats its wings to summon a blizzard dome. Enemies inside freeze solid for 2 seconds while its orbiting shards rain down on them." },
		passive = "Frozen Armour: takes 25% less damage while standing still.",
	},
	Sylvanthorn = {
		element = "Nature", rarity = "Legendary",
		description = "The ancient forest stag. A living tree grows from its head, spirit wisps circle its branches and a rune ring floats around it.",
		ability = { name = "Ancient Grove", effect = "AncientGrove", cooldown = 16, power = 1.8, radius = 16,
			description = "Stamps the ground and a ring of glowing saplings bursts up, rooting enemies in place and healing allies for 5 seconds." },
		passive = "Overgrowth: you and your creatures slowly regenerate health in grassy areas.",
	},
	Lumenjaw = {
		element = "Water", rarity = "Legendary",
		description = "A deep-sea angler-dragon. A glowing lure spins over its fanged underbite, its flanks glow with light spots and three jellyfish orbit it.",
		ability = { name = "Abyssal Lure", effect = "AbyssalLure", cooldown = 15, power = 2.1, radius = 16,
			description = "Its lure flares blinding cyan and pulls every enemy in range toward its jaws, then it lunges with a crushing bite that bursts into a wave of deep-sea water." },
		passive = "Deep Glow: lights up the area around you, and hidden eggs and chests nearby show on your screen.",
	},
	-- Mythic
	Aetherion = {
		element = "Prism", rarity = "Mythic",
		description = "The Prism Sovereign, a celestial lion-dragon of every element. Three halos spin behind it, six element orbs orbit its body and rune discs turn beneath its paws.",
		ability = { name = "Prism Judgement", effect = "PrismJudgement", cooldown = 25, power = 3.5, radius = 22,
			description = "Rises with every halo spinning, fires a beam of each element from its six orbs, then detonates a prismatic nova that hits with all elements at once. Your whole party gets +50% power for 10 seconds." },
		passive = "Sovereign: counts as every element; immune to knockdown.",
	},
	Astralith = {
		element = "Cosmic", rarity = "Mythic",
		description = "The Star Colossus. A floating titan of obsidian and gold with a galaxy turning in its chest, six rune monoliths circling behind it and three tiny planets orbiting its waist.",
		ability = { name = "Starfall", effect = "Starfall", cooldown = 25, power = 3.5, radius = 24,
			description = "Raises both fists to the sky and calls down a shower of falling stars, then slams the ground with a shockwave that stuns every enemy in range for 2 seconds." },
		passive = "Gravity Well: enemies near it move 25% slower, and coins and eggs nearby are pulled toward you.",
	},
}

-- Display order for the Index (by rarity, then name).
local RARITY_ORDER = { Common = 1, Uncommon = 2, Rare = 3, Epic = 4, Legendary = 5, Mythic = 6 }
local order = {}
for name in Info do
	table.insert(order, name)
end
table.sort(order, function(a, b)
	local ra, rb = RARITY_ORDER[Info[a].rarity], RARITY_ORDER[Info[b].rarity]
	if ra ~= rb then
		return ra < rb
	end
	return a < b
end)

return {
	Species = Info,
	Order = order,
	RarityOrder = RARITY_ORDER,
}
