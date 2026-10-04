--!strict
-- Odds panel: every possible creature and mutation with its real chance, shown before purchase
-- (Roblox paid random items policy: all outcomes, numerical odds, sum to 100%). Opened from the
-- "i" buttons on eggs, offers with eggs, and passes that change odds.
--
--   ctx.open("Odds", { kind = "shop", egg = "EggRare" })
--   ctx.open("Odds", { kind = "boss", egg = "EggPyrothrax", mutations = { "Golden" } })
--   ctx.open("Odds", { kind = "pass", pass = "Luck" })            -- shop eggs, with vs without
--   ctx.open("Odds", { kind = "pass", pass = "MutationHunter" })  -- boss egg mutations, with vs without

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local Premium = require(script.Parent.Parent.Premium)
local Shared = ReplicatedStorage:WaitForChild("Shared")
local ShopEggs = require(Shared:WaitForChild("Eggs"):WaitForChild("ShopEggs"))
local BossEggs = require(Shared:WaitForChild("Eggs"):WaitForChild("BossEggs"))
local Catalog = require(Shared:WaitForChild("Shop"):WaitForChild("ShopCatalog"))

local function short(id: string): string
	return (id:gsub("^Egg", ""))
end

local function chancesOf(list: { any }): { number }
	local t = {}
	for i, e in list do
		t[i] = e.chance
	end
	return t
end

local MUT_ORDER = { "Shiny", "Golden", "Crystal", "Void", "Rainbow", "Giant", "Supercharged" }

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local m = Premium.modal(gui, { name = "Odds", title = "Odds", icon = "PassLucky", size = UDim2.fromOffset(900, 600), z = 60, accent = Theme.Gold })
	local eggTabs = new("Frame", { Name = "EggTabs", BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 44), Parent = m.body }, { Kit.list(Enum.FillDirection.Horizontal, 8, Enum.HorizontalAlignment.Left) })
	local list = new("ScrollingFrame", { Name = "List", BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(0.58, -8, 1, -52), Position = UDim2.fromOffset(0, 52), ScrollBarThickness = 6, ScrollBarImageColor3 = Theme.White, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, Parent = m.body }, { Kit.list(Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Left, Enum.VerticalAlignment.Top) })
	local side = new("Frame", { Name = "Mutations", BackgroundTransparency = 1, Size = UDim2.new(0.42, -8, 1, -52), Position = UDim2.new(0.58, 8, 0, 52), Parent = m.body })

	local function clear(f: Instance)
		for _, c in f:GetChildren() do
			if not c:IsA("UIListLayout") then c:Destroy() end
		end
	end

	local function row(parent: Instance, order: number, color: Color3, name: string, sub: string?, a: string, b: string?)
		local r = new("Frame", { Name = name, BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.9, Size = UDim2.new(1, -10, 0, 38), LayoutOrder = order, Parent = parent }, { Kit.corner(UDim.new(0, 10)) })
		new("Frame", { BackgroundColor3 = color, Size = UDim2.fromOffset(8, 26), Position = UDim2.new(0, 8, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = r }, { Kit.corner(UDim.new(1, 0)) })
		local n = Kit.text(name .. (if sub then `  <font size="15" color="#{color:ToHex()}">{sub}</font>` else ""), { size = 20, color = Theme.White, outline = 2, align = Enum.TextXAlignment.Left, box = UDim2.new(0.6, -24, 1, 0) })
		n.Position = UDim2.fromOffset(24, 0)
		n.Parent = r
		local ta = Kit.text(a, { size = 20, color = Theme.White, outline = 2, align = Enum.TextXAlignment.Right, box = UDim2.new(if b then 0.2 else 0.4, -8, 1, 0), font = Theme.Body })
		ta.Position = UDim2.new(0.6, 0, 0, 0)
		ta.Parent = r
		if b then
			local tb = Kit.text(b, { size = 20, color = Theme.Gold, outline = 2, align = Enum.TextXAlignment.Right, box = UDim2.new(0.2, -12, 1, 0), font = Theme.Body })
			tb.Position = UDim2.new(0.8, 0, 0, 0)
			tb.Parent = r
		end
	end
	local function header(parent: Instance, order: number, left: string, a: string, b: string?)
		local r = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, -10, 0, 26), LayoutOrder = order, Parent = parent })
		local t = Kit.text(left, { size = 16, color = Theme.shade(Theme.White, -0.25), align = Enum.TextXAlignment.Left, box = UDim2.new(0.6, -24, 1, 0), font = Theme.Body })
		t.Position = UDim2.fromOffset(24, 0)
		t.Parent = r
		local ta = Kit.text(a, { size = 16, color = Theme.shade(Theme.White, -0.25), align = Enum.TextXAlignment.Right, box = UDim2.new(if b then 0.2 else 0.4, -8, 1, 0), font = Theme.Body })
		ta.Position = UDim2.new(0.6, 0, 0, 0)
		ta.Parent = r
		if b then
			local tb = Kit.text(b, { size = 16, color = Theme.Gold, align = Enum.TextXAlignment.Right, box = UDim2.new(0.2, -12, 1, 0), font = Theme.Body })
			tb.Position = UDim2.new(0.8, 0, 0, 0)
			tb.Parent = r
		end
	end

	-- creatures: base odds, and optionally the boosted odds beside them
	local function showCreatures(base: { any }, boosted: { any }?, boostLabel: string?)
		clear(list)
		header(list, 0, "Creature", "Chance", boostLabel)
		local pb = ShopEggs.percentages(chancesOf(base))
		local bmap: { [string]: string } = {}
		if boosted then
			local pk = ShopEggs.percentages(chancesOf(boosted))
			for i, e in boosted do bmap[e.species] = pk[i] end
		end
		for i, e in base do
			local rarity = e.rarity or ""
			row(list, i, Theme.Rarity[rarity] or Theme.Element[e.element or ""] or Theme.White, e.species, rarity, pb[i], if boosted then (bmap[e.species] or "0.00%") else nil)
		end
	end
	local function showMutations(base: { [string]: number }, boosted: { [string]: number }?, boostLabel: string?, note: string?)
		clear(side)
		new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder, Parent = side })
		header(side, 0, "Mutation", "Chance", boostLabel)
		for i, name in MUT_ORDER do
			local c = base[name] or 0
			row(side, i, Theme.Gold, name, nil, string.format("%.2f%%", c * 100), if boosted then string.format("%.2f%%", (boosted[name] or 0) * 100) else nil)
		end
		local n = Kit.text(note or "Each mutation is rolled separately. Colour mutations (Shiny to Rainbow) can't stack: you get at most one.", { size = 15, color = Theme.shade(Theme.White, -0.2), wrap = true, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -10, 0, 60), font = Theme.Body, order = 20 })
		n.Parent = side
	end

	local function eggButtons(eggs: { string }, onPick: (string) -> ())
		clear(eggTabs)
		for i, id in eggs do
			local b = Kit.button({ text = short(id), color = Premium.Palette.Control, size = UDim2.fromOffset(120, 40), textSize = 18, depth = 3, order = i, onClick = function() onPick(id) end })
			b.Parent = eggTabs
		end
	end

	local api = {}
	function api.open(arg: any)
		local a = arg or { kind = "shop", egg = "EggCommon" }
		local shopEggIds = {}
		for _, e in Catalog.Eggs do
			if ShopEggs.Rarity[e.id] then table.insert(shopEggIds, e.id) end
		end
		if a.kind == "shop" then
			local function show(id: string)
				m.title.Text = `{short(id)} Egg odds`
				showCreatures(ShopEggs.odds(id), nil)
				showMutations(ShopEggs.mutationOdds(false))
			end
			eggButtons(shopEggIds, show)
			show(a.egg)
		elseif a.kind == "boss" then
			clear(eggTabs)
			local data = BossEggs.data(a.egg, a.mutations or {})
			m.title.Text = `{short(a.egg)} Egg odds`
			showCreatures(BossEggs.odds(data), nil)
			local note = if #(a.mutations or {}) > 0 then `This egg came from a {table.concat(a.mutations, " ")} boss: those mutations are x8 more likely.` else "Boss eggs roll mutations at x3 luck. Eggs from a mutated boss roll its mutations x8 more often."
			showMutations(BossEggs.mutationOdds(data), nil, nil, note)
		elseif a.kind == "pass" and a.pass == "Luck" then
			local function show(id: string)
				m.title.Text = `Lucky Hatch: {short(id)} Egg`
				showCreatures(ShopEggs.odds(id), ShopEggs.odds(id, true), "With pass")
				showMutations(ShopEggs.mutationOdds(false), ShopEggs.mutationOdds(true), "With pass")
			end
			eggButtons(shopEggIds, show)
			show(a.egg or "EggRare")
		elseif a.kind == "pass" and a.pass == "MutationHunter" then
			local function show(id: string)
				local data = BossEggs.data(id, {})
				m.title.Text = `Mutation Hunter: {short(id)} Egg`
				showCreatures(BossEggs.odds(data), nil)
				showMutations(BossEggs.mutationOdds(data), BossEggs.mutationOdds(data, 2), "With pass")
			end
			eggButtons({ "EggPyrothrax", "EggThalassor" }, show)
			show("EggPyrothrax")
		end
		m.open()
	end
	api.close = m.close
	return api
end
