--!strict
-- "Skyship leaves in 0:42 · 7/12 aboard" pill while in Haven, plus a soft white fade
-- when this player departs (the server fires SkyshipFade).

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.Parent.Kit)
local Theme = require(script.Parent.Parent.Theme)
local State = require(script.Parent.Parent.State)

return function(gui: ScreenGui, ctx: any)
	local new = Kit.new
	local pill = new("Frame", { Name = "Skyship", BackgroundColor3 = Theme.Ink, BackgroundTransparency = 0.2, Size = UDim2.fromOffset(0, 52), AutomaticSize = Enum.AutomaticSize.X, Position = UDim2.new(0.5, 0, 0, 22), AnchorPoint = Vector2.new(0.5, 0), Visible = false, Parent = gui }, {
		Kit.corner(UDim.new(1, 0)), Kit.stroke(3, Theme.shade(Theme.Ink, 0.2)), Kit.list(Enum.FillDirection.Horizontal, 8), new("UIPadding", { PaddingLeft = UDim.new(0, 6), PaddingRight = UDim.new(0, 22) }),
	})
	Kit.icon("Skyship", 60, { order = 1 }).Parent = pill
	local label = Kit.text("", { size = 22, color = Theme.White, outline = 2.5, order = 2, box = UDim2.new(0, 0, 1, 0), auto = Enum.AutomaticSize.X })
	label.Parent = pill

	local fade = new("Frame", { Name = "SkyshipFade", BackgroundColor3 = Color3.fromRGB(255, 252, 245), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 60, Parent = gui })
	local fadeEvent = ReplicatedStorage:WaitForChild("SkyshipFade", 10) :: RemoteEvent?
	if fadeEvent then
		fadeEvent.OnClientEvent:Connect(function(seconds: number)
			task.wait(seconds * 0.55)
			Kit.tween(fade, seconds * 0.4, { BackgroundTransparency = 0 })
			task.wait(seconds * 0.45 + 0.6)
			State.set("mode", "Expedition")
			State.set("runEndsAt", os.time() + 8 * 60)
			Kit.tween(fade, 1.2, { BackgroundTransparency = 1 })
		end)
	end

	task.spawn(function()
		while true do
			task.wait(0.5)
			local ship = workspace:FindFirstChild("Skyship")
			local show = ship ~= nil and State.get("mode") == "Haven"
			pill.Visible = show
			if show then
				local state = ship:GetAttribute("State")
				if state == "Boarding" then
					local s = ship:GetAttribute("DepartIn") or 0
					label.Text = string.format("Skyship leaves in %d:%02d  ·  %d/12 aboard", s // 60, s % 60, ship:GetAttribute("Aboard") or 0)
				elseif state == "Departing" then
					label.Text = "Skyship departing!"
				else
					label.Text = "Skyship arriving..."
				end
			end
		end
	end)
	return pill
end
