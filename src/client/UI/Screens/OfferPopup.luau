--!strict
-- Featured offer popup (the Starter Pack by default): a big glass card with the live 3D creature
-- you get, exactly what's inside, the real time left (server attribute <Id>EndsAt) and one buy
-- button. Shown once per session, a little after joining, only if the offer is still running
-- and (for one-time offers) not owned. "Maybe later" always closes it; it never reopens itself.
--
--   ctx.open("Offer", "StarterPack")

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local Premium = require(script.Parent.Parent.Premium)
local Catalog = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Shop"):WaitForChild("ShopCatalog"))

local player = Players.LocalPlayer
local AUTO_SHOW_AFTER = 25 -- seconds after joining
local AUTO_SHOW_ID = "StarterPack"

local function find(id: string): any
	for _, o in Catalog.Offers do
		if o.id == id then return o end
	end
	return nil
end

local function available(o: any): boolean
	local endsAt = player:GetAttribute(o.id .. "EndsAt") :: number?
	if endsAt and endsAt <= workspace:GetServerTimeNow() then return false end
	if o.oneTime and player:GetAttribute("Owned_" .. o.id) == true then return false end
	return true
end

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local m = Premium.modal(gui, { name = "Offer", title = "", size = UDim2.fromOffset(760, 500), border = Premium.Glass.Gold, z = 55, accent = Theme.Gold })
	local stage = new("Frame", { Name = "Stage", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = m.body })

	local function build(o: any)
		for _, c in stage:GetChildren() do c:Destroy() end
		m.title.Text = o.name
		Premium.sparkles(stage, 10)
		-- glowing pedestal under the creature
		local glow = new("Frame", { BackgroundColor3 = Theme.Gold, BackgroundTransparency = 0.6, Size = UDim2.fromOffset(260, 60), Position = UDim2.fromOffset(150, 330), AnchorPoint = Vector2.new(0.5, 0.5), Parent = stage }, { Kit.corner(UDim.new(1, 0)), new("UIGradient", { Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1), NumberSequenceKeypoint.new(0.5, 0.2), NumberSequenceKeypoint.new(1, 1) }) }) })
		glow.ZIndex = 2
		local vp = Premium.creature(o.showcase.species, UDim2.fromOffset(330, 330), { mutations = o.showcase.mutations, spin = 0.7, action = "Roar", z = 4 })
		vp.Position = UDim2.fromOffset(-15, 10)
		vp.Parent = stage
		if o.showcase.mutations and #o.showcase.mutations > 0 then
			Premium.badge(stage, string.upper(table.concat(o.showcase.mutations, " ")) .. " " .. string.upper(o.showcase.species), Theme.Gold, { pos = UDim2.fromOffset(150, 370), anchor = Vector2.new(0.5, 0), textSize = 18, height = 30 })
		end
		-- what's inside
		local col = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(380, 0), AutomaticSize = Enum.AutomaticSize.Y, Position = UDim2.fromOffset(330, 6), Parent = stage }, { Kit.list(Enum.FillDirection.Vertical, 8, Enum.HorizontalAlignment.Left, Enum.VerticalAlignment.Top) })
		local head = Kit.text("You get all of this:", { size = 20, color = Theme.shade(Theme.White, -0.1), align = Enum.TextXAlignment.Left, box = UDim2.new(1, 0, 0, 24), font = Theme.Body, order = 0 })
		head.Parent = col
		for i, c in o.contents do
			local r = new("Frame", { BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.86, Size = UDim2.new(1, 0, 0, 52), LayoutOrder = i, Parent = col }, { Kit.corner(UDim.new(0, 14)) })
			local icon = if c.kind == "gems" then "Gem" elseif c.kind == "coins" then "Coin" elseif c.kind == "egg" then "EggMythic" else "Index"
			Kit.icon(icon, 44, { pos = UDim2.new(0, 8, 0.5, 0), anchor = Vector2.new(0, 0.5) }).Parent = r
			local t = Kit.text(c.label, { size = 24, color = Theme.White, outline = 2.5, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -64, 1, 0) })
			t.Position = UDim2.fromOffset(60, 0)
			t.Parent = r
		end
		local endsAt = player:GetAttribute(o.id .. "EndsAt") :: number?
		if endsAt then
			local chip = new("Frame", { BackgroundColor3 = Theme.Red, Size = UDim2.fromOffset(220, 36), Position = UDim2.fromOffset(330, 286), Parent = stage }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(2.5) })
			Kit.icon("Timer", 30, { pos = UDim2.new(0, 6, 0.5, 0), anchor = Vector2.new(0, 0.5) }).Parent = chip
			local tl = Kit.text("", { size = 20, color = Theme.White, outline = 2, box = UDim2.new(1, -44, 1, 0) })
			tl.Position = UDim2.fromOffset(40, 0)
			tl.Parent = chip
			Premium.countdown(tl, endsAt, m.close)
		end
		local buy = Premium.buyButton({ color = Theme.Green, size = UDim2.fromOffset(380, 64), text = `Get it for R$ {o.robux}`, textSize = 28, onClick = function()
			if o.productId ~= 0 then
				MarketplaceService:PromptProductPurchase(player, o.productId)
			else
				ctx.toast(`{o.name} isn't set up yet`, "Gift")
			end
		end })
		buy.Position = UDim2.fromOffset(330, 334)
		buy.Parent = stage
		local later = new("TextButton", { BackgroundTransparency = 1, Text = "Maybe later", FontFace = Theme.Body, TextSize = 18, TextColor3 = Theme.shade(Theme.White, -0.2), Size = UDim2.fromOffset(380, 30), Position = UDim2.fromOffset(330, 404), Parent = stage })
		later.Activated:Connect(m.close)
	end

	local api = {}
	function api.open(id: string?)
		local o = find(id or AUTO_SHOW_ID)
		if not o or not available(o) then
			return
		end
		build(o)
		m.open()
	end
	api.close = m.close
	api.available = function(id: string): boolean
		local o = find(id)
		return o ~= nil and available(o)
	end

	-- once per session, a little after joining
	task.delay(AUTO_SHOW_AFTER, function()
		api.open(AUTO_SHOW_ID)
	end)
	return api
end
