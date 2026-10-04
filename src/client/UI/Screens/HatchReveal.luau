--!strict
-- Big hatch moment: dim, spinning light rays, the egg shakes and cracks, a flash, then
-- the creature pops out as a live 3D model (Premium.creature, roaring, camera orbiting) over a
-- rarity disc, with sparkles, a rarity ribbon, element badge and NEW/mutation tags.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local AssetIds = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("AssetIds"))
local Premium = require(script.Parent.Parent.Premium)

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local root = new("Frame", { Name = "HatchReveal", BackgroundColor3 = Theme.Dim, BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Visible = false, ZIndex = 40, Parent = gui })
	local rays = new("ImageLabel", { Name = "Rays", BackgroundTransparency = 1, Image = AssetIds.get(AssetIds.Fx.Rays) or "", Size = UDim2.fromOffset(900, 900), Position = UDim2.fromScale(0.5, 0.45), AnchorPoint = Vector2.new(0.5, 0.5), ImageTransparency = 1, ZIndex = 41, Parent = root })
	local flash = new("Frame", { Name = "Flash", BackgroundColor3 = Theme.White, BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 49, Parent = root })
	local stage = new("Frame", { Name = "Stage", BackgroundTransparency = 1, Size = UDim2.fromOffset(520, 520), Position = UDim2.fromScale(0.5, 0.45), AnchorPoint = Vector2.new(0.5, 0.5), ZIndex = 42, Parent = root })
	local ribbon = new("Frame", { Name = "Ribbon", BackgroundColor3 = Theme.Gold, Size = UDim2.fromOffset(560, 74), Position = UDim2.new(0.5, 0, 0.78, 0), AnchorPoint = Vector2.new(0.5, 0.5), Visible = false, ZIndex = 45, Parent = root }, { Kit.corner(UDim.new(0, 18)), Kit.stroke(4) })
	local rarityText = Kit.text("", { size = 22, color = Theme.White, outline = 2.5, box = UDim2.new(1, 0, 0, 24), font = Theme.Body })
	rarityText.Position = UDim2.fromOffset(0, 6)
	rarityText.ZIndex = 46
	rarityText.Parent = ribbon
	local nameText = Kit.text("", { size = 40, color = Theme.White, outline = 3.5, box = UDim2.new(1, 0, 0, 42) })
	nameText.Position = UDim2.fromOffset(0, 28)
	nameText.ZIndex = 46
	nameText.Parent = ribbon
	local continue = Kit.button({ color = Theme.Green, size = UDim2.fromOffset(240, 64), text = "Awesome!", textSize = 28 })
	continue.AnchorPoint = Vector2.new(0.5, 0)
	continue.Position = UDim2.new(0.5, 0, 0.86, 0)
	continue.Visible = false
	continue.ZIndex = 45
	continue.Parent = root

	local spin: RBXScriptConnection? = nil
	local busy = false

	local function play(info: { species: string, rarity: string, element: string, gold: boolean?, isNew: boolean?, mutations: { string }? })
		if busy then return end
		busy = true
		for _, c in stage:GetChildren() do c:Destroy() end
		root.Visible = true
		ribbon.Visible = false
		continue.Visible = false
		local color = Theme.Rarity[info.rarity] or Theme.Gold
		rays.ImageColor3 = color
		Kit.tween(root, 0.3, { BackgroundTransparency = 0.25 })
		-- egg shakes harder and harder
		local egg = Kit.icon("Egg" .. info.rarity, 240, { pos = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5) })
		egg.ZIndex = 43
		egg.Parent = stage
		local t0 = os.clock()
		spin = RunService.RenderStepped:Connect(function(dt)
			local t = os.clock() - t0
			rays.Rotation += dt * 25
			if egg.Parent then
				egg.Rotation = math.sin(t * (10 + t * 10)) * math.min(18, t * 9)
			end
		end)
		Kit.tween(rays, 1.6, { ImageTransparency = 0.25 })
		task.wait(1.7)
		-- crack + flash
		flash.BackgroundTransparency = 0
		Kit.tween(flash, 0.6, { BackgroundTransparency = 1 })
		egg:Destroy()
		local holder = new("Frame", { BackgroundColor3 = color, Size = UDim2.fromOffset(380, 380), Position = UDim2.fromScale(0.5, 0.5), AnchorPoint = Vector2.new(0.5, 0.5), ClipsDescendants = true, ZIndex = 43, Parent = stage }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(6), Kit.gradient(Theme.shade(color, 0.4), Theme.shade(color, -0.15)) })
		-- live 3D creature popping out of the disc (falls back to the portrait/element icon)
		local live = Premium.creature(info.species, UDim2.fromOffset(500, 500), { mutations = info.mutations or (if info.gold then { "Golden" } else nil), action = "Roar", spin = 0.45, z = 45 })
		local portrait = AssetIds.get(AssetIds.Portraits[info.species])
		if live:IsA("ViewportFrame") then
			live.AnchorPoint = Vector2.new(0.5, 0.5)
			live.Position = UDim2.fromScale(0.5, 0.45)
			live.Parent = stage
			Kit.pop(live, true)
			Premium.sparkles(stage, if info.rarity == "Legendary" or info.rarity == "Mythic" then 14 else 7, Theme.shade(color, 0.6))
		elseif portrait then
			new("ImageLabel", { BackgroundTransparency = 1, Image = portrait, Size = UDim2.fromScale(1.25, 1.25), Position = UDim2.fromScale(0.5, 0.55), AnchorPoint = Vector2.new(0.5, 0.5), ScaleType = Enum.ScaleType.Crop, ZIndex = 44, Parent = holder })
		else
			Kit.icon("Element" .. info.element, 220, { pos = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5) }).Parent = holder
		end
		Kit.pop(holder, true)
		local badge = Kit.icon("Element" .. info.element, 96, { pos = UDim2.new(0.5, 150, 0.5, -170) })
		badge.ZIndex = 46
		badge.Parent = stage
		if info.isNew ~= false then
			local tag = new("Frame", { BackgroundColor3 = Theme.Red, Size = UDim2.fromOffset(110, 44), Position = UDim2.new(0.5, -230, 0.5, -170), Rotation = -12, ZIndex = 46, Parent = stage }, { Kit.corner(UDim.new(0, 12)), Kit.stroke(4) })
			local tt = Kit.text("NEW!", { size = 28, color = Theme.White, outline = 3, box = UDim2.fromScale(1, 1) })
			tt.ZIndex = 47
			tt.Parent = tag
		end
		if info.gold then
			local g = Kit.icon("VIP", 110, { pos = UDim2.new(0.5, -55, 0.5, -250) })
			g.ZIndex = 46
			g.Parent = stage
		end
		ribbon.BackgroundColor3 = color
		local tags = {}
		for _, mut in info.mutations or (if info.gold then { "Golden" } else {}) do
			table.insert(tags, string.upper(mut))
		end
		rarityText.Text = string.upper(info.rarity) .. (if #tags > 0 then "  ·  " .. table.concat(tags, " · ") else "")
		nameText.Text = info.species
		ribbon.Visible = true
		Kit.pop(ribbon, true)
		task.wait(0.5)
		continue.Visible = true
		Kit.pop(continue, true)
	end

	continue.Activated:Connect(function()
		if spin then spin:Disconnect() spin = nil end
		Kit.tween(root, 0.25, { BackgroundTransparency = 1 })
		Kit.tween(rays, 0.25, { ImageTransparency = 1 })
		ribbon.Visible = false
		continue.Visible = false
		for _, c in stage:GetChildren() do c:Destroy() end
		task.delay(0.26, function()
			root.Visible = false
			busy = false
		end)
	end)

	return { play = function(info) task.spawn(play, info) end }
end
