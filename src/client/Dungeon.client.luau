--!strict
-- Boss-run HUD: the objective under the boss HP bar ("Defeat the boss" -> "Grab the eggs and
-- get out" with the escape timer), how many eggs you're carrying, and big banners when the
-- run starts, the lair starts collapsing, or you escape. Driven by DungeonService through the
-- player's Dungeon* / Carry* attributes and the "DungeonEvent" remote.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local event = ReplicatedStorage:WaitForChild("DungeonEvent") :: RemoteEvent
local FONT = Font.new("rbxasset://fonts/families/FredokaOne.json")

local gui = Instance.new("ScreenGui")
gui.Name = "DungeonHud"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.DisplayOrder = 5
gui.Parent = player:WaitForChild("PlayerGui")

local function text(parent: Instance, size: UDim2, pos: UDim2, color: Color3): TextLabel
	local t = Instance.new("TextLabel")
	t.BackgroundTransparency = 1
	t.Size, t.Position = size, pos
	t.AnchorPoint = Vector2.new(0.5, 0)
	t.FontFace = FONT
	t.TextScaled = true
	t.TextColor3 = color
	t.TextStrokeTransparency = 0.15
	t.Parent = parent
	return t
end

-- objective line under the boss bar (the boss bar sits at y = 52..82)
local objective = text(gui, UDim2.new(0.8, 0, 0, 26), UDim2.new(0.5, 0, 0, 92), Color3.fromRGB(255, 236, 210))
Instance.new("UISizeConstraint", objective).MaxSize = Vector2.new(640, 26)

-- carried eggs chip, bottom centre above the mobile thumb area
local chip = Instance.new("Frame")
chip.AnchorPoint = Vector2.new(0.5, 1)
chip.Position = UDim2.new(0.5, 0, 1, -110)
chip.Size = UDim2.fromOffset(190, 44)
chip.BackgroundColor3 = Color3.fromRGB(40, 20, 18)
chip.BackgroundTransparency = 0.15
chip.Visible = false
chip.Parent = gui
Instance.new("UICorner", chip).CornerRadius = UDim.new(0.5, 0)
local chipStroke = Instance.new("UIStroke", chip)
chipStroke.Color = Color3.fromRGB(255, 120, 50)
chipStroke.Thickness = 3
local chipText = text(chip, UDim2.new(1, -24, 1, -12), UDim2.new(0.5, 0, 0, 6), Color3.fromRGB(255, 220, 150))

-- big centre banner
local bannerTitle = text(gui, UDim2.new(0.9, 0, 0, 64), UDim2.new(0.5, 0, 0.28, 0), Color3.fromRGB(255, 200, 90))
local bannerSub = text(gui, UDim2.new(0.8, 0, 0, 30), UDim2.new(0.5, 0, 0.28, 70), Color3.fromRGB(255, 240, 225))
Instance.new("UISizeConstraint", bannerTitle).MaxSize = Vector2.new(900, 64)
Instance.new("UISizeConstraint", bannerSub).MaxSize = Vector2.new(760, 30)
bannerTitle.TextTransparency, bannerTitle.TextStrokeTransparency = 1, 1
bannerSub.TextTransparency, bannerSub.TextStrokeTransparency = 1, 1
local bannerToken = 0

local function showBanner(title: string, sub: string)
	bannerToken += 1
	local token = bannerToken
	bannerTitle.Text, bannerSub.Text = title, sub
	for _, t in { bannerTitle, bannerSub } do
		t.TextTransparency, t.TextStrokeTransparency = 0, 0.15
	end
	bannerTitle.Position = UDim2.new(0.5, 0, 0.28, -20)
	TweenService:Create(bannerTitle, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Position = UDim2.new(0.5, 0, 0.28, 0) }):Play()
	task.delay(3.2, function()
		if token ~= bannerToken then
			return
		end
		for _, t in { bannerTitle, bannerSub } do
			TweenService:Create(t, TweenInfo.new(0.6), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		end
	end)
end

event.OnClientEvent:Connect(function(msg: any)
	if msg.k == "banner" then
		showBanner(msg.title, msg.sub)
	end
end)

RunService.Heartbeat:Connect(function()
	local runName = player:GetAttribute("DungeonRun") :: string?
	if not runName then
		objective.Text = ""
		chip.Visible = false
		return
	end
	local state = player:GetAttribute("DungeonState") :: string?
	local carry = (player:GetAttribute("CarryEggs") :: number?) or 0
	local max = (player:GetAttribute("CarryMax") :: number?) or 0
	local left = (player:GetAttribute("DungeonEggsLeft") :: number?) or 0
	if state == "fight" then
		objective.Text = "Dodge the red circles - defeat the boss to free its eggs"
		objective.TextColor3 = Color3.fromRGB(255, 236, 210)
	elseif state == "cleared" then
		objective.Text = "The boss is down! The eggs are unlocking..."
		objective.TextColor3 = Color3.fromRGB(255, 220, 120)
	elseif state == "escape" then
		local t = math.max(0, ((player:GetAttribute("DungeonEndsAt") :: number?) or 0) - workspace:GetServerTimeNow())
		objective.Text = string.format("Grab the eggs and get out!  %d:%02d", math.floor(t / 60), math.floor(t % 60))
		objective.TextColor3 = if t < 10 and math.floor(t * 2) % 2 == 0 then Color3.fromRGB(255, 90, 60) else Color3.fromRGB(255, 220, 120)
	end
	chip.Visible = state == "escape" or carry > 0
	chipText.Text = string.format("Carrying %d/%d  ·  %d left", carry, max, math.max(0, left - carry))
end)
