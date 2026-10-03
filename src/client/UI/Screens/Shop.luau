--!strict
-- Shop modal: Eggs (coins), Gems (Robux packs) and Passes (game passes).

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)
local Catalog = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Shop"):WaitForChild("ShopCatalog"))

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local m = Kit.modal(gui, { name = "Shop", title = "Shop", icon = "Shop", accent = Theme.Orange, size = UDim2.fromOffset(940, 600) })
	local pages: { [string]: Frame } = {}
	local tabs, select = Kit.tabs({ "Eggs", "Gems", "Passes" }, function(name)
		for n, p in pages do p.Visible = n == name end
	end, Theme.Orange)
	tabs.Parent = m.body

	local function page(name: string): Frame
		local f = new("ScrollingFrame", { Name = name, BackgroundTransparency = 1, Size = UDim2.new(1, 0, 1, -70), Position = UDim2.fromOffset(0, 70), ScrollBarThickness = 8, ScrollBarImageColor3 = Theme.Ink, CanvasSize = UDim2.new(), AutomaticCanvasSize = Enum.AutomaticSize.Y, BorderSizePixel = 0, Parent = m.body }, {
			new("UIGridLayout", { CellSize = UDim2.fromOffset(280, 220), CellPadding = UDim2.fromOffset(16, 16), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
			new("UIPadding", { PaddingTop = UDim.new(0, 10), PaddingBottom = UDim.new(0, 16) }),
		})
		pages[name] = f
		return f
	end

	local function card(parent: Instance, order: number, color: Color3, iconName: string, title: string, sub: string, premium: boolean?): Frame
		local c = Kit.panel({ name = title, size = UDim2.fromOffset(280, 220), order = order, color = Theme.CreamDeep })
		c.Parent = parent
		local body = c:FindFirstChild("Body") :: Frame
		new("Frame", { Name = "Band", BackgroundColor3 = color, Size = UDim2.new(1, 0, 0, 104), Parent = body }, { Kit.corner(), Kit.gradient(Theme.shade(color, 0.35), Theme.shade(color, -0.05)) })
		if premium then
			-- restrained shine: one soft halo behind the icon
			new("ImageLabel", { Name = "Halo", BackgroundTransparency = 1, Image = "", Size = UDim2.fromOffset(0, 0), Parent = body })
			new("Frame", { Name = "Glow", BackgroundColor3 = Theme.White, BackgroundTransparency = 0.6, Size = UDim2.fromOffset(110, 110), Position = UDim2.new(0.5, 0, 0, 54), AnchorPoint = Vector2.new(0.5, 0.5), Parent = body }, { Kit.corner(UDim.new(1, 0)) })
		end
		Kit.icon(iconName, 112, { pos = UDim2.new(0.5, 0, 0, 52), anchor = Vector2.new(0.5, 0.5) }).Parent = body
		local t = Kit.text(title, { size = 24, box = UDim2.new(1, -16, 0, 28) })
		t.Position = UDim2.fromOffset(8, 108)
		t.Parent = body
		local s = Kit.text(sub, { size = 15, font = Theme.Body, color = Theme.shade(Theme.Ink, 0.35), box = UDim2.new(1, -20, 0, 18), wrap = true })
		s.Position = UDim2.fromOffset(10, 136)
		s.Parent = body
		return body
	end

	-- Eggs
	local eggs = page("Eggs")
	for i, egg in Catalog.Eggs do
		local body = card(eggs, i, Theme.Rarity[egg.rarity], egg.id, egg.name, if egg.bossRunOnly then "Found only in boss runs" else `Hatches in {math.floor(egg.hatchSeconds / 60)} min`, egg.rarity == "Legendary" or egg.rarity == "Mythic")
		if egg.bossRunOnly then
			local lock = Kit.button({ color = Theme.shade(Theme.Ink, 0.4), size = UDim2.new(1, -24, 0, 50), icon = "Lock", text = "Boss Run", textSize = 20, depth = 4 })
			lock.Position = UDim2.new(0, 12, 1, -58)
			lock.Parent = body
		else
			local buy = Kit.button({ color = Theme.Green, size = UDim2.new(1, -24, 0, 50), icon = "Coin", text = Kit.abbreviate(egg.price), textSize = 22, depth = 4, onClick = function()
				if State.get("coins") < egg.price then
					ctx.toast("Not enough coins", "Coin", Theme.Red)
				elseif State.actions.buyEgg(egg.id) then
					ctx.toast(`{egg.name} bought!`, egg.id, Theme.Green)
				else
					-- demo mode: spend locally so the flow can be tried in Studio
					State.set("coins", State.get("coins") - egg.price)
					ctx.toast(`{egg.name} bought!`, egg.id, Theme.Green)
				end
			end })
			buy.Position = UDim2.new(0, 12, 1, -58)
			buy.Parent = body
		end
	end

	-- Gems
	local gems = page("Gems")
	for i, pack in Catalog.GemPacks do
		local body = card(gems, i, Theme.Gem, pack.icon, `{pack.gems} Gems`, pack.name, true)
		if pack.tag then
			local tag = new("Frame", { BackgroundColor3 = Theme.Red, Size = UDim2.fromOffset(0, 30), AutomaticSize = Enum.AutomaticSize.X, Position = UDim2.fromOffset(-8, -10), Rotation = -6, Parent = body }, { Kit.corner(UDim.new(0, 10)), Kit.stroke(3), new("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10) }) })
			Kit.text(pack.tag, { size = 17, color = Theme.White, outline = 2, box = UDim2.new(0, 0, 1, 0), auto = Enum.AutomaticSize.X }).Parent = tag
		end
		local buy = Kit.button({ color = Theme.Gem, size = UDim2.new(1, -24, 0, 50), text = `R$ {pack.robux}`, textSize = 22, depth = 4, shine = true, onClick = function()
			if pack.productId ~= 0 then
				MarketplaceService:PromptProductPurchase(Players.LocalPlayer, pack.productId)
			else
				ctx.toast("Gem packs aren't set up yet", "Gem")
			end
		end })
		buy.Position = UDim2.new(0, 12, 1, -58)
		buy.Parent = body
	end

	-- Passes
	local passes = page("Passes")
	for i, pass in Catalog.Passes do
		local body = card(passes, i, Theme.Gold, pass.icon, pass.name, pass.blurb, true)
		local owned = table.find(State.get("owned"), pass.id) ~= nil
		local buy = Kit.button({ color = if owned then Theme.shade(Theme.Green, -0.1) else Theme.Gold, size = UDim2.new(1, -24, 0, 50), icon = if owned then "Check" else nil, text = if owned then "Owned" else `R$ {pass.robux}`, textSize = 22, depth = 4, shine = not owned, onClick = function()
			if owned then return end
			if pass.gamePassId ~= 0 then
				MarketplaceService:PromptGamePassPurchase(Players.LocalPlayer, pass.gamePassId)
			else
				ctx.toast("Passes aren't set up yet", pass.icon)
			end
		end })
		buy.Position = UDim2.new(0, 12, 1, -58)
		buy.Parent = body
	end

	select("Eggs")
	return {
		open = function(tab: string?)
			select(tab or "Eggs")
			m.open()
		end,
		close = m.close,
	}
end
