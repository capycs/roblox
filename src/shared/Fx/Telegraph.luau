--!strict
-- Red warning circles for boss attacks (client side). A circle appears on the floor where the
-- hit will land: dim red fill with a bright red rim, and an inner fill that grows from the
-- centre and touches the rim at the exact moment the hit lands, then flashes white. Step out
-- before it fills. Drawn with a SurfaceGui so the edge stays crisp on any screen size.
--
-- Telegraph.circle(position, radius, duration)

local CollectionService = game:GetService("CollectionService")
local Debris = game:GetService("Debris")
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local Telegraph = {}
Telegraph.Color = Color3.fromRGB(255, 40, 40)
Telegraph.Fill = Color3.fromRGB(255, 110, 50)
Telegraph.Flash = Color3.fromRGB(255, 240, 220)
Telegraph.IgnoreTags = { "Boss", "Creature" } -- the floor raycast passes through these

local function folder(): Folder
	local f = workspace:FindFirstChild("Telegraphs")
	if not f then
		f = Instance.new("Folder")
		f.Name = "Telegraphs"
		f.Parent = workspace
	end
	return f :: Folder
end

-- the floor under `pos` (ignores bosses, creatures, characters and other telegraphs)
local function floorAt(pos: Vector3): Vector3
	local ignore: { Instance } = { folder() }
	for _, tag in Telegraph.IgnoreTags do
		for _, m in CollectionService:GetTagged(tag) do
			table.insert(ignore, m)
		end
	end
	for _, pl in Players:GetPlayers() do
		if pl.Character then
			table.insert(ignore, pl.Character)
		end
	end
	local params = RaycastParams.new()
	params.FilterDescendantsInstances = ignore
	params.FilterType = Enum.RaycastFilterType.Exclude
	local hit = workspace:Raycast(pos + Vector3.new(0, 6, 0), Vector3.new(0, -30, 0), params)
	return if hit then hit.Position else pos
end

local function round(f: GuiObject)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0.5, 0)
	c.Parent = f
end

function Telegraph.circle(position: Vector3, radius: number, duration: number)
	local ground = floorAt(position)
	local d = radius * 2
	local part = Instance.new("Part")
	part.Name = "Circle"
	part.Anchored, part.CanCollide, part.CanQuery, part.CanTouch, part.CastShadow = true, false, false, false, false
	part.Transparency = 1
	part.Size = Vector3.new(d, 0.05, d)
	part.CFrame = CFrame.new(ground + Vector3.new(0, 0.4, 0)) -- above floor tiles and magma veins
	part.Parent = folder()

	local px = 512 -- canvas size in pixels whatever the radius, so the rim reads the same
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Top
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = px / d
	gui.LightInfluence = 0
	gui.Brightness = 1.6
	gui.ZOffset = 1
	gui.Parent = part

	local area = Instance.new("Frame")
	area.Size = UDim2.fromScale(1, 1)
	area.BackgroundColor3 = Telegraph.Color
	area.BackgroundTransparency = 0.62
	area.BorderSizePixel = 0
	area.Parent = gui
	round(area)
	local rim = Instance.new("UIStroke")
	rim.Color = Telegraph.Color
	rim.Thickness = 14
	rim.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
	rim.Parent = area

	local fill = Instance.new("Frame")
	fill.AnchorPoint = Vector2.new(0.5, 0.5)
	fill.Position = UDim2.fromScale(0.5, 0.5)
	fill.Size = UDim2.fromScale(0.04, 0.04)
	fill.BackgroundColor3 = Telegraph.Fill
	fill.BackgroundTransparency = 0.3
	fill.BorderSizePixel = 0
	fill.Parent = area
	round(fill)

	-- pop in, then the fill grows to the rim over the warning time
	area.Size = UDim2.fromScale(0.6, 0.6)
	area.AnchorPoint = Vector2.new(0.5, 0.5)
	area.Position = UDim2.fromScale(0.5, 0.5)
	TweenService:Create(area, TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Size = UDim2.fromScale(1, 1) }):Play()
	TweenService:Create(fill, TweenInfo.new(duration, Enum.EasingStyle.Linear), { Size = UDim2.fromScale(1, 1) }):Play()
	-- last quarter second: the rim pulses so the timing is unmistakable
	task.delay(math.max(0, duration - 0.3), function()
		TweenService:Create(rim, TweenInfo.new(0.3), { Thickness = 26, Color = Telegraph.Fill }):Play()
	end)
	task.delay(duration, function()
		fill.BackgroundColor3 = Telegraph.Flash
		fill.BackgroundTransparency = 0
		TweenService:Create(fill, TweenInfo.new(0.3), { BackgroundTransparency = 1 }):Play()
		TweenService:Create(area, TweenInfo.new(0.3), { BackgroundTransparency = 1 }):Play()
		TweenService:Create(rim, TweenInfo.new(0.3), { Transparency = 1 }):Play()
		Debris:AddItem(part, 0.35)
	end)
end

-- older call shape; everything is a circle now
function Telegraph.show(_shape: string, cf: CFrame, size: { [string]: number }, duration: number)
	Telegraph.circle(cf.Position, size.radius or 10, duration)
end

return Telegraph
