--!strict
-- Expedition HUD: run timer, carried eggs, direction + distance to the nearest
-- extraction point, extraction progress, companion health and the knocked-down overlay.

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local root = new("Frame", { Name = "Expedition", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Visible = false, Parent = gui })

	-- timer
	local timer = new("Frame", { Name = "Timer", BackgroundColor3 = Theme.Ink, BackgroundTransparency = 0.2, Size = UDim2.fromOffset(200, 60), Position = UDim2.new(0.5, 0, 0, 20), AnchorPoint = Vector2.new(0.5, 0), Parent = root }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(3, Theme.shade(Theme.Ink, 0.2)) })
	Kit.icon("Timer", 70, { pos = UDim2.new(0, -18, 0.5, 0), anchor = Vector2.new(0, 0.5) }).Parent = timer
	local time = Kit.text("8:00", { size = 34, color = Theme.White, outline = 3, box = UDim2.new(1, -60, 1, 0) })
	time.Position = UDim2.fromOffset(52, 0)
	time.Parent = timer

	-- carried eggs
	local bag = new("Frame", { Name = "Carried", BackgroundColor3 = Theme.Ink, BackgroundTransparency = 0.35, Size = UDim2.fromOffset(0, 70), AutomaticSize = Enum.AutomaticSize.X, Position = UDim2.fromOffset(24, 22), Parent = root }, {
		Kit.corner(UDim.new(0, 20)), Kit.stroke(3, Theme.shade(Theme.Ink, 0.2)), Kit.list(Enum.FillDirection.Horizontal, 6, Enum.HorizontalAlignment.Left), new("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 14) }),
	})
	local function renderBag()
		for _, c in bag:GetChildren() do
			if c:IsA("GuiObject") then c:Destroy() end
		end
		Kit.icon("Backpack", 56, { order = 0 }).Parent = bag
		local carried = State.get("carried")
		for i = 1, State.get("maxCarry") do
			local r = carried[i]
			if r then
				Kit.icon("Egg" .. r, 54, { order = i }).Parent = bag
			else
				new("Frame", { BackgroundColor3 = Theme.White, BackgroundTransparency = 0.85, Size = UDim2.fromOffset(42, 52), LayoutOrder = i, Parent = bag }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(2, Theme.White) })
			end
		end
	end
	State.on("carried", renderBag)

	-- extraction pointer
	local pointer = new("Frame", { Name = "Extract", BackgroundColor3 = Theme.Ink, BackgroundTransparency = 0.35, Size = UDim2.fromOffset(170, 120), Position = UDim2.new(1, -24, 0, 22), AnchorPoint = Vector2.new(1, 0), Parent = root }, { Kit.corner(UDim.new(0, 20)), Kit.stroke(3, Theme.shade(Theme.Ink, 0.2)) })
	Kit.icon("Extract", 64, { pos = UDim2.fromOffset(10, 8) }).Parent = pointer
	local arrow = Kit.icon("ArrowRight", 56, { pos = UDim2.new(1, -66, 0, 12) })
	arrow.Parent = pointer
	local dist = Kit.text("", { size = 24, color = Theme.White, outline = 2.5, box = UDim2.new(1, 0, 0, 28) })
	dist.Position = UDim2.fromOffset(0, 80)
	dist.Parent = pointer

	-- extraction progress (shown while standing in the beacon)
	local extractBar, setExtract = Kit.bar({ size = UDim2.fromOffset(460, 34), color = Color3.fromRGB(95, 240, 255), textSize = 18 })
	extractBar.AnchorPoint = Vector2.new(0.5, 1)
	extractBar.Position = UDim2.new(0.5, 0, 1, -120)
	extractBar.Visible = false
	extractBar.Parent = root

	-- companion health
	local hp, setHp = Kit.bar({ size = UDim2.fromOffset(300, 28), color = Theme.Green })
	hp.Position = UDim2.new(0, 24, 1, -46)
	hp.Parent = root
	State.on("companion", function(c)
		if c then setHp(c.hp or 1, c.species) end
	end)

	-- knocked down
	local down = new("Frame", { Name = "KnockedDown", BackgroundColor3 = Color3.fromRGB(120, 20, 30), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Visible = false, ZIndex = 30, Parent = root })
	Kit.icon("Knockdown", 160, { pos = UDim2.fromScale(0.5, 0.36), anchor = Vector2.new(0.5, 0.5) }).Parent = down
	local downText = Kit.text("Knocked down!", { size = 46, color = Theme.White, outline = 4, box = UDim2.new(1, 0, 0, 52) })
	downText.Position = UDim2.fromScale(0, 0.48)
	downText.ZIndex = 31
	downText.Parent = down
	local downSub = Kit.text("You dropped your eggs. Grab them back!", { size = 24, color = Theme.White, outline = 2.5, box = UDim2.new(1, 0, 0, 30), font = Theme.Body })
	downSub.Position = UDim2.fromScale(0, 0.56)
	downSub.ZIndex = 31
	downSub.Parent = down
	State.on("knockedDown", function(v)
		down.Visible = v == true
		if v then
			down.BackgroundTransparency = 0.3
			Kit.tween(down, 0.6, { BackgroundTransparency = 0.65 })
		end
	end)

	State.on("mode", function(mode)
		root.Visible = mode == "Expedition"
	end)

	local last = -1
	task.spawn(function()
		while true do
			task.wait(0.2)
			if not root.Visible then continue end
			local left = math.max(0, State.get("runEndsAt") - os.time())
			if left ~= last then
				last = left
				time.Text = string.format("%d:%02d", left // 60, left % 60)
				time.TextColor3 = if left <= 60 then Color3.fromRGB(255, 120, 110) else Theme.White
				if left <= 60 and left > 0 then
					Kit.pop(timer, true)
				end
			end
			local ex = State.get("extract")
			dist.Text = `{math.floor(ex.distance)} studs`
			local cam = workspace.CurrentCamera
			if cam and ex.direction.Magnitude > 0 then
				local look = cam.CFrame.LookVector
				local a = math.atan2(ex.direction.X, ex.direction.Z) - math.atan2(look.X, look.Z)
				arrow.Rotation = -math.deg(a) - 90
			end
			extractBar.Visible = ex.progress > 0
			if ex.progress > 0 then
				setExtract(ex.progress, if ex.progress >= 1 then "Extracted!" else "Extracting...")
			end
		end
	end)
	return root
end
