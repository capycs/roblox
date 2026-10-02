--!strict
-- Index: every creature, found ones with portrait and element, unfound ones as
-- silhouettes. Gold toggle shows which have their Gold mutation.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)
local Shared = ReplicatedStorage:WaitForChild("Shared")
local AssetIds = require(Shared:WaitForChild("AssetIds"))
local CreatureInfo = require(Shared:WaitForChild("Creatures"):WaitForChild("CreatureInfo"))

local ORDER = CreatureInfo.Order -- by rarity, then name

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local m = Kit.modal(gui, { name = "Index", title = "Index", icon = "Index", accent = Theme.Blue, size = UDim2.fromOffset(940, 600) })
	local header = new("Frame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 52), Parent = m.body })
	local count = Kit.text("", { size = 24, align = Enum.TextXAlignment.Left, box = UDim2.new(0, 220, 1, 0) })
	count.Parent = header
	local bar, setBar = Kit.bar({ size = UDim2.new(1, -440, 0, 26), color = Theme.Blue })
	bar.Position = UDim2.new(0, 220, 0.5, -13)
	bar.Parent = header
	local showGold = false
	local grid = new("ScrollingFrame", { BackgroundTransparency = 1, Size = UDim2.new(1, 0, 1, -64), Position = UDim2.fromOffset(0, 64), ScrollBarThickness = 8, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(), BorderSizePixel = 0, Parent = m.body }, {
		new("UIGridLayout", { CellSize = UDim2.fromOffset(270, 210), CellPadding = UDim2.fromOffset(16, 16), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }),
		new("UIPadding", { PaddingTop = UDim.new(0, 6) }),
	})

	local function render()
		for _, c in grid:GetChildren() do
			if c:IsA("GuiObject") then c:Destroy() end
		end
		local index = State.get("index")
		local found = 0
		for i, species in ORDER do
			local info = CreatureInfo.Species[species]
			local e = index[species] or { found = false }
			local element = e.element or info.element
			if e.found then found += 1 end
			local isGold = showGold and e.gold
			local c = Kit.panel({ name = species, size = UDim2.fromOffset(270, 210), order = i, color = if isGold then Theme.shade(Theme.Gold, 0.5) else Theme.CreamDeep })
			c.Parent = grid
			local body = c:FindFirstChild("Body") :: Frame
			local frame = new("Frame", { BackgroundColor3 = Theme.Element[element], Size = UDim2.new(1, -16, 0, 140), Position = UDim2.fromOffset(8, 8), ClipsDescendants = true, Parent = body }, { Kit.corner(UDim.new(0, 14)), Kit.stroke(3) })
			local portrait = AssetIds.get(AssetIds.Portraits[species])
			if portrait then
				new("ImageLabel", { BackgroundTransparency = 1, Image = portrait, Size = UDim2.fromScale(1, 1.3), Position = UDim2.fromScale(0, -0.12), ScaleType = Enum.ScaleType.Crop, ImageColor3 = if e.found then Color3.new(1, 1, 1) else Color3.new(0, 0, 0), ImageTransparency = if e.found then 0 else 0.25, Parent = frame })
			end
			if not e.found then
				Kit.icon("Lock", 56, { pos = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5) }).Parent = frame
			end
			if isGold then
				Kit.icon("VIP", 44, { pos = UDim2.new(1, -50, 0, 6) }).Parent = frame
			end
			Kit.icon("Element" .. element, 46, { pos = UDim2.fromOffset(10, 150) }).Parent = body
			local t = Kit.text(if e.found then species else "???", { size = 24, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -80, 0, 30) })
			t.Position = UDim2.fromOffset(64, 158)
			t.Parent = body
		end
		count.Text = `{found} / {#ORDER} found`
		setBar(found / #ORDER, `{math.floor(found / #ORDER * 100)}%`)
	end
	local goldBtn: TextButton
	goldBtn = Kit.button({ color = Theme.CreamDeep, size = UDim2.fromOffset(190, 50), icon = "VIP", text = "Gold", textSize = 22, depth = 4, onClick = function()
		showGold = not showGold
		local face = goldBtn:FindFirstChild("Face") :: Frame
		face.BackgroundColor3 = if showGold then Theme.Gold else Theme.CreamDeep
		render()
	end })
	goldBtn.AnchorPoint = Vector2.new(1, 0)
	goldBtn.Position = UDim2.new(1, 0, 0, 0)
	goldBtn.Parent = header
	State.on("index", render)
	return { open = m.open, close = m.close }
end
