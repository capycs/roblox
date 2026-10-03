--!strict
-- Visual tokens for the whole UI: colours, fonts, corner radius, spacing.

local C = Color3.fromRGB

local Theme = {
	Ink = C(34, 20, 46), -- outlines and dark text
	Cream = C(255, 246, 230), -- panel body
	CreamDeep = C(240, 222, 196), -- panel inset / card
	White = C(255, 255, 255),
	Shadow = C(20, 8, 30),
	Dim = C(18, 10, 26), -- modal backdrop

	Gold = C(245, 181, 46),
	Gem = C(138, 90, 230),
	Green = C(86, 196, 63),
	Red = C(232, 71, 58),
	Blue = C(63, 180, 255),
	Orange = C(255, 122, 46),
	Pink = C(255, 111, 208),

	Rarity = {
		Common = C(201, 192, 176), Uncommon = C(111, 207, 74), Rare = C(79, 143, 230),
		Epic = C(166, 90, 230), Legendary = C(245, 181, 46), Mythic = C(255, 79, 154),
	},
	RarityOrder = { "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic" },
	Element = {
		Fire = C(255, 122, 46), Storm = C(63, 180, 255), Ice = C(127, 216, 245),
		Shadow = C(154, 90, 230), Water = C(42, 160, 216), Nature = C(98, 192, 67),
		Prism = C(255, 90, 168), Cosmic = C(92, 84, 200),
	},

	Display = Font.new("rbxasset://fonts/families/FredokaOne.json"),
	Body = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Bold),

	Radius = UDim.new(0, 18),
	Stroke = 4,
	Pad = 14,
	Design = Vector2.new(1280, 720), -- layout is authored at this size and scaled
}

function Theme.shade(c: Color3, k: number): Color3
	if k >= 0 then
		return c:Lerp(Color3.new(1, 1, 1), k)
	end
	return c:Lerp(Color3.new(0, 0, 0), -k)
end

return Theme
