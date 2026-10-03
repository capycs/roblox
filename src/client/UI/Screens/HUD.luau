--!strict
-- Haven HUD: currencies (top-left), menu buttons (left), offers (right), companion card
-- (bottom-left). Hidden during boss runs (Dungeon.client shows the run HUD instead).

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local root = new("Frame", { Name = "HUD", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = gui })

	-- currencies
	local top = new("Frame", { Name = "Currencies", BackgroundTransparency = 1, Size = UDim2.fromOffset(460, 54), Position = UDim2.fromOffset(40, 22), Parent = root }, { Kit.list(Enum.FillDirection.Horizontal, 28, Enum.HorizontalAlignment.Left) })
	local coinPill, setCoins = Kit.pill({ name = "Coins", icon = "Coin", order = 1, width = 210, onPlus = function() ctx.open("Shop", "Eggs") end })
	coinPill.Parent = top
	local gemPill, setGems = Kit.pill({ name = "Gems", icon = "Gem", order = 2, width = 180, plusColor = Theme.Gem, shine = true, onPlus = function() ctx.open("Shop", "Gems") end })
	gemPill.Parent = top
	State.on("coins", setCoins)
	State.on("gems", setGems)

	-- left menu
	local left = new("Frame", { Name = "Menu", BackgroundTransparency = 1, Size = UDim2.fromOffset(90, 420), Position = UDim2.new(0, 22, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Parent = root }, { Kit.list(Enum.FillDirection.Vertical, 30) })
	Kit.iconButton({ name = "Shop", icon = "Shop", label = "Shop", order = 1, onClick = function() ctx.open("Shop", "Eggs") end }).Parent = left
	Kit.iconButton({ name = "Index", icon = "Index", label = "Index", order = 2, onClick = function() ctx.open("Index") end }).Parent = left
	local readyCount = 0
	for _, s in State.get("incubators") do
		if s.ends and s.ends <= os.time() then readyCount += 1 end
	end
	Kit.iconButton({ name = "Incubators", icon = "Incubator", label = "Hatch", order = 3, badge = if readyCount > 0 then readyCount else nil, onClick = function() ctx.open("Incubators") end }).Parent = left
	Kit.iconButton({ name = "Quests", icon = "Quests", label = "Quests", order = 4, onClick = function() ctx.toast("Quests are coming soon", "Quests") end }).Parent = left

	-- right offers (purchase-leading: gentle sheen)
	local right = new("Frame", { Name = "Offers", BackgroundTransparency = 1, Size = UDim2.fromOffset(90, 330), Position = UDim2.new(1, -22, 0.5, 0), AnchorPoint = Vector2.new(1, 0.5), Parent = root }, { Kit.list(Enum.FillDirection.Vertical, 30) })
	Kit.iconButton({ name = "Gift", icon = "Gift", label = "Daily", order = 1, color = Theme.shade(Theme.Red, 0.55), badge = 1, onClick = function() ctx.toast("Daily reward: +100 coins", "Coin", Theme.Green) State.set("coins", State.get("coins") + 100) end }).Parent = right
	Kit.iconButton({ name = "VIP", icon = "VIP", label = "VIP", order = 2, color = Theme.shade(Theme.Gold, 0.55), shine = true, onClick = function() ctx.open("Shop", "Passes") end }).Parent = right
	Kit.iconButton({ name = "Settings", icon = "Settings", label = "Settings", order = 3, onClick = function() ctx.toast("Settings coming soon", "Settings") end }).Parent = right

	-- companion card
	local card = Kit.panel({ name = "Companion", size = UDim2.fromOffset(290, 96), pos = UDim2.new(0, 22, 1, -22), anchor = Vector2.new(0, 1) })
	card.Parent = root
	local body = card:FindFirstChild("Body") :: Frame
	local elementIcon = Kit.icon("ElementFire", 70, { pos = UDim2.fromOffset(10, 13) })
	elementIcon.Parent = body
	local name = Kit.text("", { size = 26, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -100, 0, 30) })
	name.Position = UDim2.fromOffset(92, 10)
	name.Parent = body
	local hpBar, setHp = Kit.bar({ size = UDim2.new(1, -110, 0, 22), color = Theme.Green })
	hpBar.Position = UDim2.fromOffset(92, 52)
	hpBar.Parent = body
	State.on("companion", function(c)
		if not c then return end
		name.Text = `{c.species} <font size="18" color="#8a6f5a">Lv {c.level}</font>`
		elementIcon:Destroy()
		elementIcon = Kit.icon("Element" .. c.element, 70, { pos = UDim2.fromOffset(10, 13) })
		elementIcon.Parent = body
		setHp(c.hp or 1, "Companion")
	end)

	local player = game:GetService("Players").LocalPlayer
	local function inRun()
		root.Visible = player:GetAttribute("DungeonRun") == nil
	end
	player:GetAttributeChangedSignal("DungeonRun"):Connect(inRun)
	inRun()
	return root
end
