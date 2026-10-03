--!strict
-- Tiny observable store for the UI. Gameplay code calls State.set("coins", 500) etc.;
-- screens subscribe with State.on("coins", fn). Starts with demo values so every screen
-- has something to show in a Studio playtest before the real systems are wired in.

local State = {}

local values: { [string]: any } = {
	coins = 12450,
	gems = 85,
	companion = { species = "Emberfang", element = "Fire", level = 7, hp = 0.8 },
	index = { -- species -> { found, gold }; element comes from CreatureInfo, missing species = not found
		Bramblepup = { found = true, gold = false },
		Shellsnap = { found = true, gold = false },
		Shroomtoad = { found = true, gold = false },
		Pumpkit = { found = false },
		Glimmoth = { found = false },
		Geodillo = { found = false },
		Lumenjaw = { found = false },
		Boltaroo = { found = true, gold = false },
		Lunowl = { found = false },
		Koiren = { found = false },
		Astralith = { found = false },
		Sparkit = { found = true, gold = false },
		Mossback = { found = false },
		Tidefin = { found = true, gold = false },
		Blazehorn = { found = true, gold = false },
		Frostfawn = { found = false },
		Emberfang = { found = true, gold = false },
		Frostusk = { found = true, gold = true },
		Umbrapaw = { found = false },
		Voltgriff = { found = true, gold = false },
		Nyxwing = { found = false },
		Solarion = { found = true, gold = false },
		Glaciarch = { found = false },
		Sylvanthorn = { found = false },
		Aetherion = { found = false },
	},
	incubators = { -- slot list
		{ egg = "EggRare", rarity = "Rare", total = 600, ends = os.time() + 420 },
		{ egg = "EggCommon", rarity = "Common", total = 60, ends = os.time() - 1 },
		{ empty = true },
		{ locked = true, unlockGems = 150 },
	},
	owned = {}, -- pass ids owned
}

local listeners: { [string]: { (any) -> () } } = {}

function State.get(key: string): any
	return values[key]
end

function State.set(key: string, value: any)
	values[key] = value
	for _, fn in listeners[key] or {} do
		task.spawn(fn, value)
	end
end

-- Subscribe; fn runs now with the current value and on every change.
function State.on(key: string, fn: (any) -> ())
	listeners[key] = listeners[key] or {}
	table.insert(listeners[key], fn)
	task.spawn(fn, values[key])
end

-- Actions the UI asks for; gameplay code replaces these with real requests.
State.actions = {
	buyEgg = function(eggId: string): boolean
		return false
	end,
	instantHatch = function(slot: number): boolean
		return false
	end,
	hatch = function(slot: number) end,
	placeEgg = function(slot: number) end,
	unlockSlot = function(slot: number) end,
}

return State
