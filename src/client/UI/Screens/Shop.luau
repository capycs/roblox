--!strict
-- Premium shop: Featured offers (live 3D creatures, real countdowns), Eggs (coins, with odds),
-- Gems (four tiers, value worked out from the price so every "+% more" is true) and Passes
-- (spinning 3D icons, odds for passes that change chances). Glass window over a blurred world.
-- Design notes: docs/PREMIUM_UI.md.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)
local Premium = require(script.Parent.Parent.Premium)
local Catalog = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Shop"):WaitForChild("ShopCatalog"))

local player = Players.LocalPlayer

-- gems per Robux of the cheapest pack: the baseline every other pack is compared with
local function baseRate(): number
	local best = math.huge
	local rate = 1
	for _, p in Catalog.GemPacks do
		if p.robux < best then
			best = p.robux
			rate = p.gems / p.robux
		end
	end
	return rate
end

local function ownsPass(id: string): boolean
	return player:GetAttribute("Pass_" .. id) == true or table.find(State.get("owned") or {}, id) ~= nil
end

-- Robux worth of a pile of gems at the cheapest pack's rate (for honest "worth" lines)
local function gemsWorth(gems: number): number
	return math.floor(gems / baseRate())
end

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local m = Premium.modal(gui, { name = "Shop", title = "Shop", icon = "GemsChest", size = UDim2.fromOffset(1000, 640), accent = Theme.Gold })
	local pages: { [string]: Frame } = {}
	local tabButtons: { [string]: TextButton } = {}
	local current = "Featured"

	local tabs = new("Frame", { Name = "Tabs", BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 48), Parent = m.body }, { Kit.list(Enum.FillDirection.Horizontal, 10, Enum.HorizontalAlignment.Left) })
	local function select(name: string)
		current = name
		for n, p in pages do
			p.Visible = n == name
		end
		for n, b in tabButtons do
			local face = b:FindFirstChild("Face") :: Frame
			face.BackgroundColor3 = if n == name then Premium.Palette.Accent else Premium.Palette.Control
		end
	end
	for i, n in { "Featured", "Gems", "Passes", "Eggs" } do
		local b = Kit.button({ name = n, text = n, color = Premium.Palette.Control, size = UDim2.fromOffset(150, 46), textSize = 22, depth = 4, order = i, onClick = function() select(n) end })
		b.Parent = tabs
		Premium.hover(b, 0.04)
		tabButtons[n] = b
	end

	local function page(name: string, scroll: boolean?): Frame
		local f = new(if scroll then "ScrollingFrame" else "Frame", { Name = name, BackgroundTransparency = 1, BorderSizePixel = 0, Size = UDim2.new(1, 0, 1, -60), Position = UDim2.fromOffset(0, 60), Visible = false, Parent = m.body })
		if scroll then
			(f :: any).ScrollBarThickness = 6;
			(f :: any).ScrollBarImageColor3 = Theme.White;
			(f :: any).CanvasSize = UDim2.new();
			(f :: any).AutomaticCanvasSize = Enum.AutomaticSize.Y
		end
		pages[name] = f
		return f
	end

	local function prompt(productId: number, gamePassId: number?, what: string, icon: string)
		if gamePassId and gamePassId ~= 0 then
			MarketplaceService:PromptGamePassPurchase(player, gamePassId)
		elseif productId ~= 0 then
			MarketplaceService:PromptProductPurchase(player, productId)
		else
			ctx.toast(`{what} isn't set up yet`, icon)
		end
	end

	local function infoButton(parent: Instance, pos: UDim2, onClick: () -> ())
		local b = Kit.button({ name = "Odds", color = Premium.Palette.Control, size = UDim2.fromOffset(40, 44), text = "i", textSize = 24, radius = UDim.new(1, 0), depth = 4, onClick = onClick })
		b.Position = pos
		b.ZIndex = 30
		b.Parent = parent
		Premium.hover(b, 0.1)
		return b
	end

	---------------------------------------------------------------- Featured
	local featured = page("Featured")
	local function contentsList(parent: Instance, offer: any, pos: UDim2, width: number)
		local col = new("Frame", { Name = "Contents", BackgroundTransparency = 1, Size = UDim2.fromOffset(width, 0), AutomaticSize = Enum.AutomaticSize.Y, Position = pos, Parent = parent }, { Kit.list(Enum.FillDirection.Vertical, 6, Enum.HorizontalAlignment.Left, Enum.VerticalAlignment.Top) })
		for i, c in offer.contents do
			local r = new("Frame", { BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.88, Size = UDim2.new(1, 0, 0, 40), LayoutOrder = i, Parent = col }, { Kit.corner(UDim.new(0, 12)) })
			local icon = if c.kind == "gems" then "Gem" elseif c.kind == "coins" then "Coin" elseif c.kind == "egg" then "EggMythic" else "Index"
			Kit.icon(icon, 34, { pos = UDim2.new(0, 6, 0.5, 0), anchor = Vector2.new(0, 0.5) }).Parent = r
			local t = Kit.text(c.label, { size = 20, color = Theme.White, outline = 2, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -54, 1, 0) })
			t.Position = UDim2.fromOffset(48, 0)
			t.Parent = r
		end
		return col
	end

	local function offerCard(offer: any, size: UDim2, pos: UDim2, big: boolean)
		local endsAt = player:GetAttribute(offer.id .. "EndsAt") :: number?
		local holder, body = Premium.glass({ name = offer.id, size = size, pos = pos, tint = Premium.Palette.Raised, alpha = 0 })
		holder.Parent = featured
		Premium.animatedStroke(body, if big then Premium.Glass.Gold else Premium.Glass.Steel, if big then 2.5 else 2, 50)
		Premium.shine(body, 4)
		Premium.sparkles(body, if big then 8 else 5)
		-- live creature
		local showcase = offer.showcase
		local vpSize = if big then 300 else 190
		local vp = Premium.creature(showcase.species, UDim2.fromOffset(vpSize, vpSize), { mutations = showcase.mutations, spin = 0.6, action = "Roar", z = 5 })
		vp.Position = if big then UDim2.fromOffset(-10, 40) else UDim2.fromOffset(-6, 34)
		vp.Parent = body
		Premium.spriteIcon(offer.icon, if big then 96 else 70, { pos = UDim2.fromOffset(14, 10), z = 6, fps = 12 }).Parent = body
		local title = Kit.text(offer.name, { size = if big then 40 else 28, color = Theme.White, outline = 3, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -vpSize, 0, if big then 46 else 32) })
		title.Position = UDim2.fromOffset(vpSize, if big then 24 else 16)
		title.Parent = body
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Theme.White, Theme.shade(Theme.Gold, 0.3)), Parent = title })
		local y = if big then 78 else 52
		contentsList(body, offer, UDim2.fromOffset(vpSize, y), (size.X.Offset - vpSize - 24))
		if offer.oneTime then
			Premium.ribbon(body, "ONE TIME", Premium.Palette.Accent)
		end
		-- honest value line: the gems alone, at the cheapest pack's price
		local gems = 0
		local random = false
		for _, c in offer.contents do
			if c.kind == "gems" then gems += c.amount end
			if c.random then random = true end
		end
		local bottom = size.Y.Offset - 66
		if gems > 0 then
			local worth = Kit.text(`The gems alone cost R$ {gemsWorth(gems)} separately`, { size = 15, color = Theme.shade(Theme.White, -0.15), align = Enum.TextXAlignment.Left, box = UDim2.new(1, -vpSize - 16, 0, 18), font = Theme.Body })
			worth.Position = UDim2.fromOffset(vpSize, bottom - 26)
			worth.Parent = body
		end
		if endsAt then
			local chip = new("Frame", { Name = "Timer", BackgroundColor3 = Theme.Red, Size = UDim2.fromOffset(130, 30), Position = UDim2.fromOffset(14, bottom + 12), ZIndex = 8, Parent = body }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(2.5) })
			local tl = Kit.text("", { size = 18, color = Theme.White, outline = 2, box = UDim2.fromScale(1, 1), font = Theme.Display })
			tl.ZIndex = 9
			tl.Parent = chip
			Premium.countdown(tl, endsAt, function()
				holder.Visible = false
			end)
		end
		if random then
			infoButton(body, UDim2.new(1, -54, 0, 12), function()
				for _, c in offer.contents do
					if c.kind == "egg" then
						ctx.open("Odds", { kind = "boss", egg = c.egg })
						return
					end
				end
			end)
		end
		local owned = offer.oneTime and player:GetAttribute("Owned_" .. offer.id) == true
		local buy = Premium.buyButton({ color = if owned then Theme.shade(Theme.Green, -0.2) else Theme.Green, size = UDim2.new(0, size.X.Offset - vpSize - 20, 0, 54), text = if owned then "Owned" else `R$ {offer.robux}`, textSize = 26, shine = not owned, onClick = function()
			if not owned then prompt(offer.productId, nil, offer.name, offer.icon) end
		end })
		buy.Position = UDim2.fromOffset(vpSize, bottom)
		buy.Parent = body
	end
	local function buildFeatured()
	for _, c in featured:GetChildren() do c:Destroy() end
	-- offers that have run out (server timestamp passed) or a one-time offer already bought are skipped
	local live = {}
	for _, o in Catalog.Offers do
		local endsAt = player:GetAttribute(o.id .. "EndsAt") :: number?
		local gone = endsAt ~= nil and endsAt <= workspace:GetServerTimeNow()
		if not gone then table.insert(live, o) end
	end
	if live[1] then offerCard(live[1], UDim2.fromOffset(580, 450), UDim2.fromOffset(0, 6), true) end
	if live[2] then offerCard(live[2], UDim2.fromOffset(350, 300), UDim2.fromOffset(600, 6), false) end
	-- VIP strip under the side offer
	do
		local vip = Catalog.Passes[1]
		local holder, body = Premium.glass({ name = "VIPStrip", size = UDim2.fromOffset(350, 136), pos = UDim2.fromOffset(600, 320), tint = Premium.Palette.Raised, alpha = 0 })
		holder.Parent = featured
		Premium.animatedStroke(body, Premium.Glass.Gold, 2.5, 50)
		Premium.spriteIcon(vip.icon, 110, { pos = UDim2.fromOffset(4, 12), z = 4 }).Parent = body
		local t = Kit.text(vip.name, { size = 30, color = Theme.Gold, outline = 3, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -130, 0, 34) })
		t.Position = UDim2.fromOffset(120, 10)
		t.Parent = body
		local s = Kit.text(vip.blurb, { size = 15, color = Theme.White, outline = 1.5, align = Enum.TextXAlignment.Left, wrap = true, box = UDim2.new(1, -130, 0, 36), font = Theme.Body })
		s.Position = UDim2.fromOffset(120, 44)
		s.Parent = body
		local owned = ownsPass(vip.id)
		local b = Premium.buyButton({ color = if owned then Theme.shade(Theme.Green, -0.2) else Theme.Gold, size = UDim2.fromOffset(210, 44), text = if owned then "Owned" else `R$ {vip.robux}`, textSize = 22, shine = not owned, onClick = function()
			if not owned then prompt(0, vip.gamePassId, vip.name, vip.icon) end
		end })
		b.Position = UDim2.fromOffset(120, 84)
		b.Parent = body
	end
	end

	---------------------------------------------------------------- Gems
	local gemsPage = page("Gems")
	do
		local rate = baseRate()
		local bestRate, bestId = 0, ""
		for _, p in Catalog.GemPacks do
			if p.gems / p.robux > bestRate then
				bestRate, bestId = p.gems / p.robux, p.id
			end
		end
		local n = #Catalog.GemPacks
		local w, gap = 222, 14
		for i, p in Catalog.GemPacks do
			local isBest = p.id == bestId
			local h = 360 + (i - 1) * 22 -- each tier a little taller: the ladder reads at a glance
			local holder, body = Premium.glass({ name = p.id, size = UDim2.fromOffset(w, h), pos = UDim2.fromOffset((i - 1) * (w + gap) + (932 - n * w - (n - 1) * gap) / 2, 450 - h), tint = if isBest then Premium.Palette.Control else Premium.Palette.Raised, alpha = 0 })
			holder.Parent = gemsPage
			if isBest then
				Premium.animatedStroke(body, Premium.Glass.Gold, 3.5, 90)
				Premium.shine(body, 3)
				Premium.ribbon(body, "BEST VALUE", Premium.Palette.Accent)
				Premium.sparkles(body, 7)
			elseif p.popular then
				Premium.ribbon(body, "POPULAR", Premium.Palette.Divider)
			end
			local iconSize = 120 + (i - 1) * 16
			Premium.spriteIcon(p.icon, iconSize, { pos = UDim2.new(0.5, 0, 0, 20 + iconSize / 2), anchor = Vector2.new(0.5, 0.5), z = 4, fps = 9 + i }).Parent = body
			local amount = Kit.text(Kit.abbreviate(p.gems), { size = 40, color = Theme.White, outline = 3.5, box = UDim2.new(1, 0, 0, 44) })
			amount.Position = UDim2.fromOffset(0, 40 + iconSize)
			amount.Parent = body
			new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Theme.White, Color3.fromRGB(205, 205, 212)), Parent = amount })
			local name = Kit.text(p.name, { size = 17, color = Theme.shade(Theme.White, -0.1), box = UDim2.new(1, 0, 0, 20), font = Theme.Body })
			name.Position = UDim2.fromOffset(0, 84 + iconSize)
			name.Parent = body
			local more = math.floor((p.gems / p.robux / rate - 1) * 100 + 0.5)
			if more > 0 then
				Premium.badge(body, `+{more}% MORE`, Theme.Green, { pos = UDim2.new(0.5, 0, 0, 110 + iconSize), anchor = Vector2.new(0.5, 0), textSize = 17 })
			end
			local buy = Premium.buyButton({ color = Theme.Gold, size = UDim2.new(1, -24, 0, 54), text = `R$ {p.robux}`, shine = isBest, onClick = function()
				prompt(p.productId, nil, p.name, p.icon)
			end })
			buy.Position = UDim2.new(0, 12, 1, -66)
			buy.Parent = body
		end
	end

	---------------------------------------------------------------- Passes
	local passPage = page("Passes", true)
	new("UIGridLayout", { CellSize = UDim2.fromOffset(220, 228), CellPadding = UDim2.fromOffset(14, 14), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder, Parent = passPage })
	new("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 12), Parent = passPage })
	local function buildPasses()
	for _, c in passPage:GetChildren() do
		if not c:IsA("UIGridLayout") and not c:IsA("UIPadding") then c:Destroy() end
	end
	for i, pass in Catalog.Passes do
		local owned = ownsPass(pass.id)
		local holder, body = Premium.glass({ name = pass.id, size = UDim2.fromOffset(220, 228), order = i, tint = Premium.Palette.Raised, alpha = 0 })
		holder.Parent = passPage
		if pass.id == "VIP" then
			Premium.animatedStroke(body, Premium.Glass.Gold, 3, 70)
		elseif pass.id == "MutationHunter" then
			Premium.animatedStroke(body, Premium.Glass.Rainbow, 3, 80)
		end
		Premium.spriteIcon(pass.icon, 104, { pos = UDim2.new(0.5, 0, 0, 58), anchor = Vector2.new(0.5, 0.5), z = 4 }).Parent = body
		local t = Kit.text(pass.name, { size = 24, color = Theme.White, outline = 2.5, box = UDim2.new(1, -12, 0, 28) })
		t.Position = UDim2.fromOffset(6, 110)
		t.Parent = body
		local s = Kit.text(pass.blurb, { size = 14, color = Theme.shade(Theme.White, -0.12), wrap = true, box = UDim2.new(1, -20, 0, 34), font = Theme.Body })
		s.Position = UDim2.fromOffset(10, 138)
		s.Parent = body
		if pass.odds then
			infoButton(body, UDim2.new(1, -50, 0, 8), function()
				ctx.open("Odds", { kind = "pass", pass = pass.id })
			end)
		end
		local buy = Premium.buyButton({ color = if owned then Theme.shade(Theme.Green, -0.2) else Theme.Gold, size = UDim2.new(1, -20, 0, 46), icon = if owned then "Check" else nil, text = if owned then "Owned" else `R$ {pass.robux}`, textSize = 22, shine = not owned, onClick = function()
			if not owned then prompt(0, pass.gamePassId, pass.name, pass.icon) end
		end })
		buy.Position = UDim2.new(0, 10, 1, -54)
		buy.Parent = body
		if owned then
			Premium.badge(body, "OWNED", Theme.Green, { pos = UDim2.fromOffset(8, 8) })
		end
	end
	end

	---------------------------------------------------------------- Eggs (coins)
	local eggPage = page("Eggs", true)
	new("UIGridLayout", { CellSize = UDim2.fromOffset(290, 214), CellPadding = UDim2.fromOffset(14, 14), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder, Parent = eggPage })
	new("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 12), Parent = eggPage })
	for i, egg in Catalog.Eggs do
		local color = Theme.Rarity[egg.rarity] or Theme.Gold
		local holder, body = Premium.glass({ name = egg.id, size = UDim2.fromOffset(290, 214), order = i, tint = Premium.Palette.Raised, alpha = 0 })
		holder.Parent = eggPage
		-- rarity shows as a thin bar along the top, not a tinted card
		new("Frame", { Name = "RarityBar", BackgroundColor3 = color, BorderSizePixel = 0, Size = UDim2.new(1, 0, 0, 5), ZIndex = 3, Parent = body })
		if egg.rarity == "Legendary" or egg.rarity == "Mythic" then
			Premium.animatedStroke(body, if egg.rarity == "Mythic" then Premium.Glass.Rainbow else Premium.Glass.Gold, 3, 70)
			Premium.sparkles(body, 5)
		end
		Kit.icon(egg.id, 108, { pos = UDim2.new(0, 14, 0, 14) }).Parent = body
		local t = Kit.text(egg.name, { size = 24, color = Theme.White, outline = 2.5, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -140, 0, 28) })
		t.Position = UDim2.fromOffset(130, 22)
		t.Parent = body
		local sub = Kit.text(if egg.bossRunOnly then "Found only in boss runs" else `Hatches in {math.floor(egg.hatchSeconds / 60)} min`, { size = 15, color = Theme.shade(Theme.White, -0.12), align = Enum.TextXAlignment.Left, wrap = true, box = UDim2.new(1, -140, 0, 40), font = Theme.Body })
		sub.Position = UDim2.fromOffset(130, 54)
		sub.Parent = body
		infoButton(body, UDim2.new(1, -52, 0, 98), function()
			ctx.open("Odds", { kind = "shop", egg = egg.id })
		end)
		if egg.bossRunOnly then
			local lock = Kit.button({ color = Theme.shade(Theme.Ink, 0.3), size = UDim2.new(1, -24, 0, 48), icon = "Lock", text = "Boss Run", textSize = 20, depth = 4 })
			lock.Position = UDim2.new(0, 12, 1, -58)
			lock.Parent = body
		else
			local buy = Premium.buyButton({ color = Theme.Green, size = UDim2.new(1, -24, 0, 48), icon = "Coin", text = Kit.abbreviate(egg.price), textSize = 22, shine = false, onClick = function()
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

	select("Featured")
	return {
		open = function(tab: string?)
			-- offers, timers and ownership come from the server, so rebuild those pages on every open
			buildFeatured()
			buildPasses()
			select(tab or current)
			m.open()
		end,
		close = m.close,
	}
end
