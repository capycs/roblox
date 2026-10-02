--!strict
-- Incubators: each slot shows its egg and a countdown. Ready eggs hatch; running ones
-- can be finished with gems (Instant Hatch); empty slots take an egg; locked slots unlock.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)
local Catalog = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Shop"):WaitForChild("ShopCatalog"))

local function clock(s: number): string
	s = math.max(0, math.floor(s))
	if s >= 3600 then
		return string.format("%d:%02d:%02d", s // 3600, (s % 3600) // 60, s % 60)
	end
	return string.format("%d:%02d", s // 60, s % 60)
end

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local m = Kit.modal(gui, { name = "Incubators", title = "Incubators", icon = "Incubator", accent = Theme.Green, size = UDim2.fromOffset(980, 520) })
	local row = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = m.body }, { Kit.list(Enum.FillDirection.Horizontal, 18) })
	local updaters: { () -> () } = {}

	local function render()
		for _, c in row:GetChildren() do
			if c:IsA("GuiObject") then c:Destroy() end
		end
		table.clear(updaters)
		for i, slot in State.get("incubators") do
			local p = Kit.panel({ name = "Slot" .. i, size = UDim2.fromOffset(220, 400), order = i, color = Theme.CreamDeep })
			p.Parent = row
			local body = p:FindFirstChild("Body") :: Frame
			local dome = new("Frame", { BackgroundColor3 = Color3.fromRGB(190, 236, 255), BackgroundTransparency = 0.3, Size = UDim2.fromOffset(170, 170), Position = UDim2.new(0.5, 0, 0, 20), AnchorPoint = Vector2.new(0.5, 0), Parent = body }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(4) })
			if slot.locked then
				Kit.icon("Lock", 90, { pos = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5) }).Parent = dome
				local t = Kit.text("Locked", { size = 24, box = UDim2.new(1, 0, 0, 30) })
				t.Position = UDim2.fromOffset(0, 210)
				t.Parent = body
				local b = Kit.button({ color = Theme.Gem, size = UDim2.new(1, -24, 0, 56), icon = "Gem", text = tostring(slot.unlockGems), textSize = 24, shine = true, onClick = function() State.actions.unlockSlot(i) ctx.toast("Unlocking slots needs the server hooked up", "Lock") end })
				b.Position = UDim2.new(0, 12, 1, -70)
				b.Parent = body
			elseif slot.empty then
				Kit.icon("Plus", 84, { pos = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5) }).Parent = dome
				local t = Kit.text("Empty", { size = 24, box = UDim2.new(1, 0, 0, 30) })
				t.Position = UDim2.fromOffset(0, 210)
				t.Parent = body
				local b = Kit.button({ color = Theme.Blue, size = UDim2.new(1, -24, 0, 56), text = "Place egg", textSize = 22, onClick = function() State.actions.placeEgg(i) ctx.open("Shop", "Eggs") end })
				b.Position = UDim2.new(0, 12, 1, -70)
				b.Parent = body
			else
				local egg = Kit.icon(slot.egg, 120, { pos = UDim2.fromScale(0.5, 0.52), anchor = Vector2.new(0.5, 0.5) })
				egg.Parent = dome
				local t = Kit.text(`{slot.rarity} Egg`, { size = 22, color = Theme.shade(Theme.Rarity[slot.rarity], -0.35), box = UDim2.new(1, 0, 0, 28) })
				t.Position = UDim2.fromOffset(0, 200)
				t.Parent = body
				local bar, setBar = Kit.bar({ size = UDim2.new(1, -24, 0, 28), color = Theme.Rarity[slot.rarity] })
				bar.Position = UDim2.fromOffset(12, 236)
				bar.Parent = body
				local action = Kit.button({ color = Theme.Gold, size = UDim2.new(1, -24, 0, 56), text = "", textSize = 22, shine = true })
				action.Position = UDim2.new(0, 12, 1, -70)
				action.Parent = body
				local label = (action:FindFirstChild("Face") :: any).Row.Label :: TextLabel
				local wobble = 0
				local function update()
					local left = slot.ends - os.time()
					if left <= 0 then
						setBar(1, "Ready!")
						label.Text = "Hatch!"
						local face = action:FindFirstChild("Face") :: Frame
						face.BackgroundColor3 = Theme.Green
						wobble += 1
						egg.Rotation = math.sin(wobble * 0.9) * 8
					else
						setBar(1 - left / slot.total, clock(left))
						local gems = math.max(Catalog.InstantHatchMinGems, math.ceil(left / 60) * Catalog.InstantHatchGemsPerMinute)
						label.Text = `Instant  {gems}`
					end
				end
				action.Activated:Connect(function()
					if slot.ends - os.time() <= 0 then
						State.actions.hatch(i)
						m.close()
						ctx.hatch({ species = "Frostusk", rarity = slot.rarity, element = "Ice", gold = false })
					elseif not State.actions.instantHatch(i) then
						slot.ends = os.time() -- demo: finish locally
						update()
					end
				end)
				update()
				table.insert(updaters, update)
			end
		end
	end
	State.on("incubators", render)
	task.spawn(function()
		while true do
			task.wait(1)
			if m.root.Visible then
				for _, u in updaters do u() end
			end
		end
	end)
	return { open = m.open, close = m.close }
end
