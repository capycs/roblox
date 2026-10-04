--!strict
-- Premium UI layer on top of Kit: the pieces that make the shop, offers and hatch moments feel
-- expensive. Research notes and usage: docs/PREMIUM_UI.md.
--
--   Premium.glass(props)              frosted translucent panel (pair with Premium.blur for real frost)
--   Premium.blur(true/false)          blurs the 3D world behind open modals (Lighting BlurEffect)
--   Premium.animatedStroke(obj, ...)  rotating gradient border (premium / best-value cards)
--   Premium.shine(obj, every)         diagonal light sweep across a card or button
--   Premium.ribbon(parent, text, c)   corner ribbon ("BEST VALUE", "LIMITED") with a slow pulse
--   Premium.sparkles(parent, n, c)    twinkling four-point glints scattered over a frame
--   Premium.countdown(label, endsAt)  real countdown to a server timestamp (never a fake timer)
--   Premium.spriteIcon(name, size)    spinning 3D-rendered premium icon (AssetIds.Premium spin sheet)
--   Premium.creature(species, size)   live animated 3D creature in a ViewportFrame, orbiting camera
--   Premium.hover(button)             grows on hover, squashes on press (UIScale)
--   Premium.celebrate(gui, text, ic)  purchase "thank you": confetti, spinning icon, glass toast
--
-- Everything animated runs off one shared RenderStepped loop and skips frames that aren't on
-- screen, so a full shop page stays cheap on phones.

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Kit = require(script.Parent.Kit)
local Theme = require(script.Parent.Theme)
local Shared = ReplicatedStorage:WaitForChild("Shared")
local AssetIds = require(Shared:WaitForChild("AssetIds"))
local Creatures = Shared:WaitForChild("Creatures")
local CreatureConfig = require(Creatures:WaitForChild("CreatureConfig"))
local CreatureSetup = require(Creatures:WaitForChild("CreatureSetup"))
local Animator = require(Creatures:WaitForChild("CreatureAnimator"))
local PoseSets = require(Creatures:WaitForChild("PoseSets"))
local Mutations = require(Creatures:WaitForChild("Mutations"))

local new = Kit.new
local Premium = {}

Premium.Glass = {
	Tint = Color3.fromRGB(40, 26, 70), -- deep indigo glass
	Alpha = 0.32, -- background transparency of the glass body
	Rim = Color3.fromRGB(255, 255, 255),
	Gold = { Color3.fromRGB(255, 236, 160), Color3.fromRGB(245, 181, 46), Color3.fromRGB(255, 120, 60), Color3.fromRGB(245, 181, 46), Color3.fromRGB(255, 236, 160) },
	Rainbow = { Color3.fromRGB(255, 94, 94), Color3.fromRGB(255, 200, 74), Color3.fromRGB(111, 220, 90), Color3.fromRGB(74, 184, 255), Color3.fromRGB(154, 106, 255), Color3.fromRGB(255, 94, 94) },
	Gem = { Color3.fromRGB(220, 200, 255), Color3.fromRGB(138, 90, 230), Color3.fromRGB(80, 200, 255), Color3.fromRGB(138, 90, 230), Color3.fromRGB(220, 200, 255) },
}

---------------------------------------------------------------- shared animation loop

type Job = { obj: GuiObject, step: (number, number) -> () }
local jobs: { Job } = {}

-- on screen = parented under a PlayerGui ScreenGui, every ancestor visible, and has a size
local function onScreen(g: GuiObject): boolean
	if g.AbsoluteSize.X < 1 then
		return false
	end
	local p: Instance? = g
	while p do
		if p:IsA("GuiObject") and not p.Visible then
			return false
		elseif p:IsA("ScreenGui") then
			return p.Enabled
		end
		p = p.Parent
	end
	return false
end

local function every(obj: GuiObject, step: (number, number) -> ())
	table.insert(jobs, { obj = obj, step = step })
end

local clock = 0
RunService.RenderStepped:Connect(function(dt)
	clock += dt
	for i = #jobs, 1, -1 do
		local j = jobs[i]
		if not j.obj.Parent then
			table.remove(jobs, i)
		elseif onScreen(j.obj) then
			j.step(dt, clock)
		end
	end
end)

---------------------------------------------------------------- glass

local function seqT(...: number): NumberSequence
	local a, kps = { ... }, {}
	for i = 1, #a, 2 do
		table.insert(kps, NumberSequenceKeypoint.new(a[i], a[i + 1]))
	end
	return NumberSequence.new(kps)
end
local function seqC(colors: { Color3 }): ColorSequence
	local kps = {}
	for i, c in colors do
		table.insert(kps, ColorSequenceKeypoint.new((i - 1) / math.max(1, #colors - 1), c))
	end
	return ColorSequence.new(kps)
end

--[=[
	Frosted glass panel. props: size, pos, anchor, order, name, radius (UDim), tint (Color3),
	alpha (0..1 body transparency), rim (false to drop the light rim), shadow (false to drop it).
	Returns holder, body (put content in body).
]=]
function Premium.glass(props: { [string]: any }?): (Frame, Frame)
	local p = props or {}
	local radius = p.radius or UDim.new(0, 22)
	local tint: Color3 = p.tint or Premium.Glass.Tint
	local holder = new("Frame", { Name = p.name or "Glass", BackgroundTransparency = 1, Size = p.size or UDim2.fromOffset(400, 300), Position = p.pos or UDim2.new(), AnchorPoint = p.anchor or Vector2.zero, LayoutOrder = p.order or 0 })
	if p.shadow ~= false then
		new("Frame", { Name = "Shadow", BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 0.72, Size = UDim2.new(1, 8, 1, 8), Position = UDim2.fromOffset(-4, 8), Parent = holder }, { new("UICorner", { CornerRadius = radius }) })
	end
	local body = new("Frame", { Name = "Body", BackgroundColor3 = tint, BackgroundTransparency = p.alpha or Premium.Glass.Alpha, Size = UDim2.fromScale(1, 1), ClipsDescendants = true, Parent = holder }, {
		new("UICorner", { CornerRadius = radius }),
		-- lighter at the top, denser at the bottom, with a faint colour lift
		new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Theme.shade(tint, 0.35), Theme.shade(tint, -0.15)), Transparency = seqT(0, 0, 1, 0.12) }),
	})
	-- glossy top sheen: a white band that fades out halfway down
	new("Frame", { Name = "Sheen", BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0, Size = UDim2.new(1, 0, 0.5, 0), ZIndex = 0, Parent = body }, {
		new("UIGradient", { Rotation = 90, Transparency = seqT(0, 0.84, 0.6, 0.96, 1, 1) }),
	})
	if p.rim ~= false then
		-- light catching the top edge: bright rim fading to the tint at the bottom
		local rim = new("UIStroke", { Name = "Rim", Thickness = p.rimThickness or 2, Color = Premium.Glass.Rim, Transparency = 0.2, ApplyStrokeMode = Enum.ApplyStrokeMode.Border, Parent = body })
		new("UIGradient", { Rotation = 90, Transparency = seqT(0, 0.1, 0.5, 0.65, 1, 0.85), Parent = rim })
	end
	return holder, body
end

-- Frosted backdrop: blurs the 3D world while a premium modal is open. Reference-counted, so
-- nested modals don't fight over it.
local blurCount = 0
local blurFx: BlurEffect? = nil
function Premium.blur(on: boolean, size: number?)
	blurCount = math.max(0, blurCount + (if on then 1 else -1))
	if not blurFx then
		local b = Instance.new("BlurEffect")
		b.Name = "PremiumBlur"
		b.Size = 0
		b.Parent = Lighting
		blurFx = b
	end
	TweenService:Create(blurFx :: BlurEffect, TweenInfo.new(0.25), { Size = if blurCount > 0 then (size or 16) else 0 }):Play()
end

---------------------------------------------------------------- borders, shine, ribbons, sparkles

-- Rotating gradient border. colors: Premium.Glass.Gold / .Rainbow / .Gem or your own list.
function Premium.animatedStroke(obj: GuiObject, colors: { Color3 }?, thickness: number?, speed: number?): UIStroke
	local stroke = new("UIStroke", { Name = "PremiumStroke", Thickness = thickness or 3, Color = Color3.new(1, 1, 1), ApplyStrokeMode = Enum.ApplyStrokeMode.Border, Parent = obj })
	local grad = new("UIGradient", { Color = seqC(colors or Premium.Glass.Gold), Parent = stroke })
	local s = speed or 90
	every(obj, function(dt)
		grad.Rotation = (grad.Rotation + dt * s) % 360
	end)
	return stroke
end

-- Diagonal light sweep. The object must clip its descendants (glass bodies already do).
function Premium.shine(obj: GuiObject, period: number?, strength: number?)
	obj.ClipsDescendants = true
	local band = new("Frame", { Name = "Shine", BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0, Size = UDim2.new(0.35, 0, 2, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(-0.4, 0.5), Rotation = 22, ZIndex = 20, Parent = obj }, {
		new("UIGradient", { Transparency = seqT(0, 1, 0.5, 1 - (strength or 0.35), 1, 1) }),
	})
	local per = period or 3.5
	local t = math.random() * per
	every(obj, function(dt)
		t = (t + dt) % per
		local u = math.clamp(t / 0.8, 0, 1) -- sweep takes 0.8s, then rests
		band.Position = UDim2.fromScale(-0.4 + 1.8 * u, 0.5)
	end)
end

-- Corner ribbon with a slow breathing pulse. corner: "TopRight" (default) or "TopLeft".
function Premium.ribbon(parent: GuiObject, text: string, color: Color3?, corner: string?): Frame
	local c = color or Theme.Red
	local left = corner == "TopLeft"
	local r = new("Frame", { Name = "Ribbon", BackgroundColor3 = c, Size = UDim2.fromOffset(0, 32), AutomaticSize = Enum.AutomaticSize.X, AnchorPoint = Vector2.new(if left then 0 else 1, 0.5), Position = UDim2.new(if left then 0 else 1, if left then -10 else 10, 0, 6), Rotation = if left then -8 else 8, ZIndex = 30, Parent = parent }, {
		Kit.corner(UDim.new(0, 10)), Kit.stroke(3), Kit.gradient(Theme.shade(c, 0.3), Theme.shade(c, -0.15)),
		new("UIPadding", { PaddingLeft = UDim.new(0, 12), PaddingRight = UDim.new(0, 12) }),
	})
	local t = Kit.text(text, { size = 18, color = Theme.White, outline = 2.5, box = UDim2.new(0, 0, 1, 0), auto = Enum.AutomaticSize.X })
	t.ZIndex = 31
	t.Parent = r
	local scale = new("UIScale", { Parent = r })
	every(r, function(_, now)
		scale.Scale = 1 + 0.06 * math.sin(now * 3.2)
	end)
	return r
end

-- Small pill badge (e.g. "+25% MORE", "OWNED").
function Premium.badge(parent: Instance, text: string, color: Color3?, props: { [string]: any }?): Frame
	local p = props or {}
	local b = new("Frame", { Name = "Badge", BackgroundColor3 = color or Theme.Green, Size = UDim2.fromOffset(0, p.height or 26), AutomaticSize = Enum.AutomaticSize.X, Position = p.pos or UDim2.new(), AnchorPoint = p.anchor or Vector2.zero, LayoutOrder = p.order or 0, ZIndex = p.z or 25, Parent = parent }, {
		Kit.corner(UDim.new(1, 0)), Kit.stroke(2.5), new("UIPadding", { PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10) }),
	})
	local t = Kit.text(text, { size = p.textSize or 16, color = Theme.White, outline = 2, box = UDim2.new(0, 0, 1, 0), auto = Enum.AutomaticSize.X, font = Theme.Display })
	t.ZIndex = (p.z or 25) + 1
	t.Parent = b
	return b
end

-- Twinkling four-point glints over a frame.
function Premium.sparkles(parent: GuiObject, count: number?, color: Color3?)
	local holder = new("Frame", { Name = "Sparkles", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 18, Parent = parent })
	local list = {}
	for i = 1, count or 6 do
		local s = new("Frame", { BackgroundTransparency = 1, Size = UDim2.fromOffset(18, 18), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(math.random(), math.random()), ZIndex = 18, Parent = holder })
		for _, rot in { 0, 90 } do
			new("Frame", { BackgroundColor3 = color or Color3.fromRGB(255, 246, 200), BorderSizePixel = 0, Size = UDim2.new(0.18, 0, 1, 0), AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Rotation = rot, ZIndex = 18, Parent = s }, { Kit.corner(UDim.new(1, 0)) })
		end
		local sc = new("UIScale", { Scale = 0, Parent = s })
		table.insert(list, { f = s, sc = sc, phase = math.random() * 3, speed = 0.7 + math.random() * 0.6, size = 0.6 + math.random() * 0.8 })
	end
	every(holder, function(_, now)
		for _, e in list do
			local u = (now * e.speed + e.phase) % 3
			local k = if u < 1 then math.sin(u * math.pi) else 0
			if u >= 1 and u < 1.05 then
				e.f.Position = UDim2.fromScale(0.08 + math.random() * 0.84, 0.08 + math.random() * 0.84)
			end
			e.sc.Scale = k * e.size
			e.f.Rotation = now * 40
		end
	end)
end

-- Counts down to endsAt (workspace:GetServerTimeNow() seconds). Calls onDone once at zero.
-- Only point this at a real end time from the server; never invent urgency.
function Premium.countdown(label: TextLabel, endsAt: number, onDone: (() -> ())?)
	local done = false
	local last = -1
	every(label, function()
		local left = math.max(0, endsAt - workspace:GetServerTimeNow())
		local whole = math.floor(left)
		if whole ~= last then
			last = whole
			local h, m, s = whole // 3600, (whole // 60) % 60, whole % 60
			label.Text = if h >= 24 then string.format("%dd %02dh", h // 24, h % 24) elseif h > 0 then string.format("%d:%02d:%02d", h, m, s) else string.format("%02d:%02d", m, s)
		end
		if left <= 0 and not done then
			done = true
			if onDone then onDone() end
		end
	end)
end

---------------------------------------------------------------- spinning premium icons

-- AssetIds.Premium[name].spin is a 1024x1024 sheet: 4x4 frames of a full turn. Falls back to the
-- still render, then to a Kit placeholder.
function Premium.spriteIcon(name: string, size: number, props: { [string]: any }?): GuiObject
	local p = props or {}
	local entry = AssetIds.Premium and AssetIds.Premium[name]
	local spin = entry and AssetIds.get(entry.spin)
	local still = entry and AssetIds.get(entry.still)
	if not spin and not still then
		return Kit.icon(p.fallback or name, size, p)
	end
	local img = new("ImageLabel", { Name = name, BackgroundTransparency = 1, Image = spin or still, Size = UDim2.fromOffset(size, size), Position = p.pos or UDim2.new(), AnchorPoint = p.anchor or Vector2.zero, LayoutOrder = p.order or 0, ZIndex = p.z or 1, ScaleType = Enum.ScaleType.Fit })
	if spin then
		img.ImageRectSize = Vector2.new(256, 256)
		local fps = p.fps or 10
		local frame = math.random(0, 15)
		local acc = 0
		every(img, function(dt)
			acc += dt * fps
			if acc >= 1 then
				frame = (frame + math.floor(acc)) % 16
				acc %= 1
				img.ImageRectOffset = Vector2.new((frame % 4) * 256, (frame // 4) * 256)
			end
		end)
	end
	return img
end

---------------------------------------------------------------- live 3D creatures

local function template(species: string): Model?
	local folder = ReplicatedStorage:FindFirstChild("CreatureModels")
	local m = folder and folder:FindFirstChild(species)
	return if m and m:IsA("Model") then m else nil
end

--[=[
	Live animated creature in a ViewportFrame. The camera orbits (the model stays still, so the
	animator plays Idle). opts: mutations ({ string }) recolours glow like the world creature,
	spin (radians/sec, default 0.5), zoom (1 = fit), action ("Roar"/"Attack" plays once on show),
	pitch (camera height, default 0.25), bg (Color3, default transparent), z (ZIndex).
	Falls back to the portrait image, then the element icon, when the model isn't available.
]=]
function Premium.creature(species: string, size: UDim2, opts: { [string]: any }?): GuiObject
	local o = opts or {}
	local def = CreatureConfig.Species[species]
	local src = template(species)
	if not def or not src then
		local portrait = AssetIds.get(AssetIds.Portraits[species])
		if portrait then
			return new("ImageLabel", { Name = species, BackgroundTransparency = 1, Image = portrait, Size = size, ScaleType = Enum.ScaleType.Fit, ZIndex = o.z or 1 })
		end
		local f = new("Frame", { Name = species, BackgroundTransparency = 1, Size = size, ZIndex = o.z or 1 })
		Kit.icon("Element" .. ((def and def.element) or "Fire"), 120, { pos = UDim2.fromScale(0.5, 0.5), anchor = Vector2.new(0.5, 0.5) }).Parent = f
		return f
	end
	local vpf = new("ViewportFrame", { Name = species, BackgroundTransparency = if o.bg then 0 else 1, BackgroundColor3 = o.bg or Color3.new(), Size = size, ZIndex = o.z or 1,
		Ambient = Color3.fromRGB(150, 140, 170), LightColor = Color3.fromRGB(255, 244, 230), LightDirection = Vector3.new(-0.6, -1, -0.7) })
	local world = new("WorldModel", { Parent = vpf })
	local model = src:Clone()
	CreatureSetup.prepare(model, species)
	game:GetService("CollectionService"):RemoveTag(model, CreatureSetup.Tag) -- the world animator and outlines leave it alone
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = true
		end
	end
	local muts = o.mutations or {}
	for _, name in muts do
		local md = Mutations.Defs[name]
		if md and md.glow then
			for _, d in model:GetDescendants() do
				if d:IsA("BasePart") and def.glow[d.Name] then
					d.Color = md.glow
				end
			end
		end
	end
	model:PivotTo(CFrame.new())
	model.Parent = world
	local cf, ext = model:GetBoundingBox()
	local cam = new("Camera", { FieldOfView = 30, Parent = vpf })
	vpf.CurrentCamera = cam
	local radius = ext.Magnitude * 0.5
	local dist = radius / math.tan(math.rad(15)) * (o.zoom or 1) * 1.02
	local center = cf.Position
	local animator = Animator.new(model, PoseSets.get(species))
	if o.action then
		task.delay(0.3, function()
			animator:play(o.action)
		end)
	end
	local yaw = math.rad(o.startYaw or 35)
	local pitch = o.pitch or 0.25
	local spin = o.spin or 0.5
	local function place()
		local dir = Vector3.new(-math.sin(yaw), pitch, -math.cos(yaw)).Unit
		cam.CFrame = CFrame.lookAt(center + dir * dist, center)
	end
	place()
	every(vpf, function(dt)
		yaw += dt * spin
		place()
		animator:step(dt)
	end)
	return vpf
end

---------------------------------------------------------------- glass modal

--[=[
	Glass window over a blurred world. props: name, title, icon (premium icon name), size, accent
	(Color3 for the title glow), border (colour list for an animated rim, optional), z.
	Returns { root, body, open(), close(), onOpen, onClose }.
]=]
function Premium.modal(parent: Instance, props: { [string]: any })
	local z = props.z or 20
	local root = new("Frame", { Name = props.name or "PremiumModal", BackgroundColor3 = Color3.fromRGB(8, 4, 16), BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Visible = false, ZIndex = z, Parent = parent })
	local holder, win = Premium.glass({ name = "Window", size = props.size or UDim2.fromOffset(980, 620), pos = UDim2.fromScale(0.5, 0.53), anchor = Vector2.new(0.5, 0.5), alpha = 0.22 })
	holder.Parent = root
	if props.border then
		Premium.animatedStroke(win, props.border, 3, 60)
	end
	local accent: Color3 = props.accent or Theme.Gold
	local head = new("Frame", { Name = "Header", BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 74), Parent = win })
	if props.icon then
		Premium.spriteIcon(props.icon, 92, { pos = UDim2.fromOffset(18, -10), z = 3 }).Parent = head
	end
	local title = Kit.text(props.title or "", { size = 40, color = Theme.White, outline = 3.5, box = UDim2.new(1, -240, 1, 0), align = Enum.TextXAlignment.Left })
	title.Position = UDim2.fromOffset(if props.icon then 118 else 28, 4)
	title.Parent = head
	new("UIGradient", { Color = ColorSequence.new(Theme.White, Theme.shade(accent, 0.25)), Rotation = 90, Parent = title })
	new("Frame", { Name = "Rule", BackgroundColor3 = Theme.White, BackgroundTransparency = 0.75, BorderSizePixel = 0, Size = UDim2.new(1, -48, 0, 2), Position = UDim2.fromOffset(24, 74), Parent = win }, {
		new("UIGradient", { Transparency = seqT(0, 1, 0.2, 0, 0.8, 0, 1, 1) }),
	})
	local close = Kit.button({ name = "Close", color = Theme.Red, size = UDim2.fromOffset(54, 58), icon = "Close", iconSize = 36, radius = UDim.new(1, 0), depth = 5 })
	close.AnchorPoint = Vector2.new(1, 0)
	close.Position = UDim2.new(1, -16, 0, 10)
	close.Parent = win
	Premium.hover(close, 0.08)
	local body = new("Frame", { Name = "Content", BackgroundTransparency = 1, Size = UDim2.new(1, -48, 1, -100), Position = UDim2.fromOffset(24, 88), Parent = win })
	local m = { root = root, body = body, title = title, onOpen = nil :: (() -> ())?, onClose = nil :: (() -> ())? }
	function m.open()
		if root.Visible then return end
		root.Visible = true
		root.BackgroundTransparency = 1
		Kit.tween(root, 0.25, { BackgroundTransparency = 0.55 })
		Premium.blur(true)
		Kit.pop(holder, true)
		if m.onOpen then m.onOpen() end
	end
	function m.close()
		if not root.Visible then return end
		Kit.tween(root, 0.15, { BackgroundTransparency = 1 })
		Premium.blur(false)
		Kit.pop(holder, false, function() root.Visible = false end)
		if m.onClose then m.onClose() end
	end
	close.Activated:Connect(m.close)
	return m
end

-- Big price/buy button with a sheen and hover feel. Returns the button.
function Premium.buyButton(props: { [string]: any }): TextButton
	local b = Kit.button({ color = props.color or Theme.Green, size = props.size or UDim2.new(1, -24, 0, 54), text = props.text, icon = props.icon, textSize = props.textSize or 24, depth = 5, shine = props.shine ~= false, onClick = props.onClick })
	Premium.hover(b, 0.04)
	return b
end

---------------------------------------------------------------- interaction feel

-- Grows a little on hover, squashes on press.
function Premium.hover(btn: GuiButton, amount: number?)
	local s = btn:FindFirstChildOfClass("UIScale") or new("UIScale", { Parent = btn })
	local a = amount or 0.05
	btn.MouseEnter:Connect(function() Kit.tween(s, 0.15, { Scale = 1 + a }, Enum.EasingStyle.Back) end)
	btn.MouseLeave:Connect(function() Kit.tween(s, 0.15, { Scale = 1 }) end)
	btn.MouseButton1Down:Connect(function() Kit.tween(s, 0.08, { Scale = 1 - a }) end)
	btn.MouseButton1Up:Connect(function() Kit.tween(s, 0.2, { Scale = 1 + a * 0.5 }, Enum.EasingStyle.Back) end)
end

-- "Thank you" moment after a purchase: confetti burst, spinning icon, glass toast.
function Premium.celebrate(gui: ScreenGui, text: string, icon: string?)
	local root = new("Frame", { Name = "Celebrate", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), ZIndex = 80, Parent = gui })
	local colors = { Theme.Gold, Theme.Pink, Theme.Blue, Theme.Green, Theme.Gem, Theme.Orange }
	for i = 1, 70 do
		local c = new("Frame", { BackgroundColor3 = colors[(i % #colors) + 1], BorderSizePixel = 0, Size = UDim2.fromOffset(math.random(8, 14), math.random(12, 20)), Position = UDim2.new(0.5, 0, 0.42, 0), Rotation = math.random(0, 360), ZIndex = 81, Parent = root }, { Kit.corner(UDim.new(0, 3)) })
		local a = math.random() * math.pi * 2
		local r = 0.25 + math.random() * 0.35
		Kit.tween(c, 0.6, { Position = UDim2.new(0.5 + math.cos(a) * r * 0.6, 0, 0.42 + math.sin(a) * r * 0.5 - 0.1, 0), Rotation = c.Rotation + math.random(-200, 200) }, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
		task.delay(0.6, function()
			Kit.tween(c, 1.4, { Position = c.Position + UDim2.fromScale(0, 0.7), BackgroundTransparency = 1, Rotation = c.Rotation + 360 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		end)
	end
	local holder, body = Premium.glass({ size = UDim2.fromOffset(460, 120), pos = UDim2.fromScale(0.5, 0.42), anchor = Vector2.new(0.5, 0.5) })
	holder.ZIndex = 82
	holder.Parent = root
	Premium.animatedStroke(body, Premium.Glass.Gold, 3, 140)
	if icon then
		local ic = Premium.spriteIcon(icon, 104, { pos = UDim2.new(0, 12, 0.5, 0), anchor = Vector2.new(0, 0.5), z = 84, fps = 14 })
		ic.Parent = body
	end
	local t = Kit.text(text, { size = 30, color = Theme.White, outline = 3, box = UDim2.new(1, -140, 1, 0), wrap = true })
	t.Position = UDim2.fromOffset(126, 0)
	t.ZIndex = 84
	t.Parent = body
	Kit.pop(holder, true)
	task.delay(2.6, function()
		Kit.pop(holder, false, function()
			root:Destroy()
		end)
	end)
end

return Premium
