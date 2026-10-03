--!strict
-- Ground telegraphs for boss attacks (client side). A flat warning shape appears with a dim fill
-- and a bright outline; an inner fill grows from the centre and reaches the edge exactly when
-- the hit lands, so players can read the timing at a glance (works on small phone screens too).
--
-- Telegraph.show("circle", cframe, { radius = 18 }, duration)
-- Telegraph.show("cone", cframe, { range = 30, angle = 50 }, duration)  -- cframe at the mouth, looking along the cone
-- Telegraph.show("ring", cframe, { radius = 20 }, duration)

local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local Telegraph = {}
Telegraph.Color = Color3.fromRGB(255, 70, 40)
Telegraph.Fill = Color3.fromRGB(255, 150, 60)

local function folder(): Folder
	local f = workspace:FindFirstChild("Telegraphs")
	if not f then
		f = Instance.new("Folder")
		f.Name = "Telegraphs"
		f.Parent = workspace
	end
	return f :: Folder
end

local function part(shape: Enum.PartType?): Part
	local p = Instance.new("Part")
	p.Anchored, p.CanCollide, p.CanQuery, p.CanTouch, p.CastShadow = true, false, false, false, false
	p.Material = Enum.Material.Neon
	p.Shape = shape or Enum.PartType.Block
	p.Parent = folder()
	return p
end

-- flat disc lying on the ground (a Cylinder's axis is X, so turn it on its side)
local function disc(cf: CFrame, r: number, color: Color3, transparency: number, y: number): Part
	local p = part(Enum.PartType.Cylinder)
	p.Size = Vector3.new(0.08, r * 2, r * 2)
	p.CFrame = cf * CFrame.new(0, y, 0) * CFrame.Angles(0, 0, math.pi / 2)
	p.Color, p.Transparency = color, transparency
	return p
end

local function ground(cf: CFrame): CFrame
	local origin = cf.Position + Vector3.new(0, 8, 0)
	local params = RaycastParams.new()
	params.FilterDescendantsInstances = { folder() }
	params.FilterType = Enum.RaycastFilterType.Exclude
	local hit = workspace:Raycast(origin, Vector3.new(0, -60, 0), params)
	local y = if hit then hit.Position.Y else cf.Position.Y
	local look = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z)
	if look.Magnitude < 1e-3 then
		look = Vector3.new(0, 0, -1)
	end
	return CFrame.lookAt(Vector3.new(cf.Position.X, y + 0.05, cf.Position.Z), Vector3.new(cf.Position.X, y + 0.05, cf.Position.Z) + look.Unit)
end

local function grow(p: Part, size: Vector3, duration: number)
	TweenService:Create(p, TweenInfo.new(duration, Enum.EasingStyle.Linear), { Size = size }):Play()
end

local function cleanup(parts: { Instance }, duration: number)
	task.delay(duration, function()
		for _, p in parts do
			if p:IsA("BasePart") then
				p.Color = Color3.new(1, 1, 1)
				TweenService:Create(p, TweenInfo.new(0.25), { Transparency = 1 }):Play()
			end
			Debris:AddItem(p, 0.3)
		end
	end)
end

function Telegraph.show(shape: string, cf: CFrame, size: { [string]: number }, duration: number)
	local g = ground(cf)
	local parts: { Instance } = {}
	if shape == "circle" or shape == "ring" then
		local r = size.radius or 10
		table.insert(parts, disc(g, r, Telegraph.Color, 0.72, 0))
		table.insert(parts, disc(g, r + 0.3, Telegraph.Color, 0.15, -0.02)) -- outline peeks out under the fill
		local fill = disc(g, 0.2, Telegraph.Fill, 0.45, 0.02)
		grow(fill, Vector3.new(0.08, r * 2, r * 2), duration)
		table.insert(parts, fill)
		if shape == "ring" then
			-- safe spot marker in the middle is the boss itself; add a pulsing edge ring
			local edge = disc(g, r * 0.25, Color3.fromRGB(40, 20, 20), 0.5, 0.03)
			table.insert(parts, edge)
		end
	elseif shape == "cone" then
		local range, angle = size.range or 20, math.rad(size.angle or 45)
		local n = math.max(3, math.floor(angle / math.rad(9)))
		for i = 0, n - 1 do
			local a = -angle / 2 + (i + 0.5) * angle / n
			local w = 2 * range * math.tan(angle / n / 2) + 0.15
			local wedge = part()
			wedge.Size = Vector3.new(w, 0.08, range)
			wedge.CFrame = g * CFrame.Angles(0, -a, 0) * CFrame.new(0, 0, -range / 2)
			wedge.Color, wedge.Transparency = Telegraph.Color, 0.7
			table.insert(parts, wedge)
			local fill = part()
			fill.Size = Vector3.new(w * 0.9, 0.1, 0.2)
			fill.CFrame = g * CFrame.Angles(0, -a, 0) * CFrame.new(0, 0.02, -0.1)
			fill.Color, fill.Transparency = Telegraph.Fill, 0.45
			-- the fill grows outward from the mouth
			TweenService:Create(fill, TweenInfo.new(duration, Enum.EasingStyle.Linear), { Size = Vector3.new(w * 0.9, 0.1, range), CFrame = g * CFrame.Angles(0, -a, 0) * CFrame.new(0, 0.02, -range / 2) }):Play()
			table.insert(parts, fill)
		end
	end
	cleanup(parts, duration)
end

return Telegraph
