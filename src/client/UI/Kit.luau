--!strict
-- UI building blocks: panels, chunky press-down buttons, icons, currency pills,
-- progress bars, modals and toasts. Everything is plain Instances built in code.

local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Theme = require(script.Parent.Theme)
local AssetIds = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("AssetIds"))

local Kit = {}

type Props = { [string]: any }

function Kit.new(className: string, props: Props?, children: { Instance }?): any
	local inst = Instance.new(className)
	for k, v in props or {} do
		if k ~= "Parent" then
			(inst :: any)[k] = v
		end
	end
	for _, c in children or {} do
		c.Parent = inst
	end
	if props and props.Parent then
		inst.Parent = props.Parent
	end
	return inst
end
local new = Kit.new

function Kit.corner(r: UDim?): UICorner
	return new("UICorner", { CornerRadius = r or Theme.Radius })
end
function Kit.stroke(thickness: number?, color: Color3?): UIStroke
	return new("UIStroke", { Thickness = thickness or Theme.Stroke, Color = color or Theme.Ink, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end
function Kit.textStroke(thickness: number?): UIStroke
	return new("UIStroke", { Thickness = thickness or 3, Color = Theme.Ink, ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual, LineJoinMode = Enum.LineJoinMode.Round })
end
function Kit.pad(px: number?): UIPadding
	local p = UDim.new(0, px or Theme.Pad)
	return new("UIPadding", { PaddingTop = p, PaddingBottom = p, PaddingLeft = p, PaddingRight = p })
end
function Kit.list(dir: Enum.FillDirection?, gap: number?, align: Enum.HorizontalAlignment?, valign: Enum.VerticalAlignment?): UIListLayout
	return new("UIListLayout", {
		FillDirection = dir or Enum.FillDirection.Vertical, Padding = UDim.new(0, gap or 10), SortOrder = Enum.SortOrder.LayoutOrder,
		HorizontalAlignment = align or Enum.HorizontalAlignment.Center, VerticalAlignment = valign or Enum.VerticalAlignment.Center,
	})
end
function Kit.gradient(top: Color3, bottom: Color3): UIGradient
	return new("UIGradient", { Rotation = 90, Color = ColorSequence.new(top, bottom) })
end

function Kit.text(text: string, props: Props?): TextLabel
	local p = props or {}
	local t = new("TextLabel", {
		BackgroundTransparency = 1, Text = text, FontFace = p.font or Theme.Display, TextSize = p.size or 24,
		TextColor3 = p.color or Theme.Ink, TextXAlignment = p.align or Enum.TextXAlignment.Center,
		Size = p.box or UDim2.new(1, 0, 0, (p.size or 24) + 6), AutomaticSize = p.auto, LayoutOrder = p.order or 0,
		TextWrapped = p.wrap or false, RichText = true, Name = p.name or "Text",
	})
	if p.outline then
		Kit.textStroke(p.outline).Parent = t
	end
	return t
end

local ICON_FALLBACK = { Coin = "$", Gem = "◆", Close = "X", Plus = "+", Check = "✓", Lock = "L", Timer = "T" }
-- Icon image from AssetIds.Icons, with a coloured disc placeholder until it is uploaded.
function Kit.icon(name: string, size: number, props: Props?): GuiObject
	local id = AssetIds.get(AssetIds.Icons[name])
	local p = props or {}
	if id then
		return new("ImageLabel", { Name = name, Image = id, BackgroundTransparency = 1, Size = UDim2.fromOffset(size, size), ScaleType = Enum.ScaleType.Fit, LayoutOrder = p.order or 0, AnchorPoint = p.anchor or Vector2.zero, Position = p.pos or UDim2.new() })
	end
	local f = new("Frame", { Name = name, Size = UDim2.fromOffset(size, size), BackgroundColor3 = p.color or Theme.Gold, LayoutOrder = p.order or 0, AnchorPoint = p.anchor or Vector2.zero, Position = p.pos or UDim2.new() }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(3) })
	Kit.text(ICON_FALLBACK[name] or name:sub(1, 1), { size = math.floor(size * 0.5), color = Theme.White, outline = 2, box = UDim2.fromScale(1, 1) }).Parent = f
	return f
end

-- Cream panel with outline and a soft drop shadow.
function Kit.panel(props: Props?): Frame
	local p = props or {}
	local holder = new("Frame", { Name = p.name or "Panel", BackgroundTransparency = 1, Size = p.size or UDim2.fromOffset(400, 300), Position = p.pos or UDim2.new(), AnchorPoint = p.anchor or Vector2.zero, LayoutOrder = p.order or 0 })
	new("Frame", { Name = "Shadow", BackgroundColor3 = Theme.Shadow, BackgroundTransparency = 0.65, Size = UDim2.fromScale(1, 1), Position = UDim2.fromOffset(0, 8), Parent = holder }, { Kit.corner(p.radius) })
	local body = new("Frame", { Name = "Body", BackgroundColor3 = p.color or Theme.Cream, Size = UDim2.fromScale(1, 1), Parent = holder }, { Kit.corner(p.radius), Kit.stroke(p.stroke) })
	if p.gradient ~= false then
		Kit.gradient(Theme.shade(p.color or Theme.Cream, 0.15), Theme.shade(p.color or Theme.Cream, -0.06)).Parent = body
	end
	return holder
end

function Kit.tween(obj: Instance, t: number, goal: Props, style: Enum.EasingStyle?, dir: Enum.EasingDirection?): Tween
	local tw = TweenService:Create(obj, TweenInfo.new(t, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out), goal)
	tw:Play()
	return tw
end

-- Chunky button: a darker base with the face sitting 6px above it; pressing sinks the face.
function Kit.button(props: Props): TextButton
	local color: Color3 = props.color or Theme.Green
	local size: UDim2 = props.size or UDim2.fromOffset(200, 64)
	local depth = props.depth or 6
	local btn = new("TextButton", { Name = props.name or "Button", Text = "", AutoButtonColor = false, BackgroundTransparency = 1, Size = size, Position = props.pos or UDim2.new(), AnchorPoint = props.anchor or Vector2.zero, LayoutOrder = props.order or 0 })
	new("Frame", { Name = "Base", BackgroundColor3 = Theme.shade(color, -0.35), Size = UDim2.new(1, 0, 1, -depth), Position = UDim2.fromOffset(0, depth), Parent = btn }, { Kit.corner(props.radius or UDim.new(0, 16)), Kit.stroke(3) })
	local face = new("Frame", { Name = "Face", BackgroundColor3 = color, Size = UDim2.new(1, 0, 1, -depth), Parent = btn }, {
		Kit.corner(props.radius or UDim.new(0, 16)), Kit.stroke(3), Kit.gradient(Theme.shade(color, 0.25), Theme.shade(color, -0.08)),
	})
	-- gloss strip
	new("Frame", { Name = "Gloss", BackgroundColor3 = Theme.White, BackgroundTransparency = 0.72, Size = UDim2.new(1, -16, 0.32, 0), Position = UDim2.fromOffset(8, 5), Parent = face }, { Kit.corner(UDim.new(0, 10)) })
	local row = new("Frame", { Name = "Row", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 1), Parent = face }, { Kit.list(Enum.FillDirection.Horizontal, 8) })
	if props.icon then
		Kit.icon(props.icon, props.iconSize or math.floor(size.Y.Offset * 0.62), { order = 1 }).Parent = row
	end
	if props.text then
		local label = Kit.text(props.text, { size = props.textSize or 26, color = Theme.White, outline = 3, order = 2, box = UDim2.new(0, 0, 1, 0), auto = Enum.AutomaticSize.X })
		label.Name = "Label"
		label.Parent = row
	end
	if props.shine then
		-- slow sheen across purchase buttons: noticeable, never flashy
		local sheen = new("Frame", { Name = "Sheen", BackgroundColor3 = Theme.White, BackgroundTransparency = 0.6, Size = UDim2.new(0, 26, 1.4, 0), Position = UDim2.new(-0.3, 0, -0.2, 0), Rotation = 20, Parent = face })
		face.ClipsDescendants = true
		task.spawn(function()
			task.wait(0.5 + math.random()) -- callers parent the button right after creating it
			while btn.Parent do
				sheen.Position = UDim2.new(-0.3, 0, -0.2, 0)
				Kit.tween(sheen, 0.9, { Position = UDim2.new(1.2, 0, -0.2, 0) }, Enum.EasingStyle.Sine)
				task.wait(3.2)
			end
		end)
	end
	local function press(down: boolean)
		Kit.tween(face, 0.07, { Position = UDim2.fromOffset(0, if down then depth - 1 else 0) })
	end
	btn.MouseButton1Down:Connect(function() press(true) end)
	btn.MouseButton1Up:Connect(function() press(false) end)
	btn.MouseLeave:Connect(function() press(false) end)
	if props.onClick then
		btn.Activated:Connect(props.onClick)
	end
	return btn
end

-- Round icon button (HUD side buttons) with an optional label underneath and badge.
function Kit.iconButton(props: Props): TextButton
	local s = props.size or 76
	local btn = Kit.button({ name = props.name, color = props.color or Theme.Cream, size = UDim2.fromOffset(s, s + 6), icon = props.icon, iconSize = math.floor(s * 0.72), radius = UDim.new(0, 20), onClick = props.onClick, order = props.order, shine = props.shine })
	if props.label then
		Kit.text(props.label, { size = 16, color = Theme.White, outline = 2.5, box = UDim2.new(1, 20, 0, 18) }).Parent = btn
		local l = btn:FindFirstChild("Text") :: TextLabel
		l.Position = UDim2.new(0, -10, 1, -4)
	end
	if props.badge then
		local b = new("Frame", { Name = "Badge", BackgroundColor3 = Theme.Red, Size = UDim2.fromOffset(26, 26), Position = UDim2.new(1, -18, 0, -8), Parent = btn }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(3) })
		Kit.text(tostring(props.badge), { size = 15, color = Theme.White, box = UDim2.fromScale(1, 1), font = Theme.Body }).Parent = b
	end
	return btn
end

-- Currency pill: icon, amount, and a + button (opens the shop).
function Kit.pill(props: Props): (Frame, (number) -> ())
	local f = new("Frame", { Name = props.name or "Pill", BackgroundColor3 = Theme.Ink, BackgroundTransparency = 0.25, Size = UDim2.fromOffset(props.width or 200, 50), LayoutOrder = props.order or 0 }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(3, Theme.shade(Theme.Ink, 0.15)) })
	Kit.icon(props.icon, 60, { pos = UDim2.new(0, -14, 0.5, 0), anchor = Vector2.new(0, 0.5) }).Parent = f
	local amount = Kit.text("0", { size = 26, color = Theme.White, outline = 2.5, align = Enum.TextXAlignment.Left, box = UDim2.new(1, -96, 1, 0) })
	amount.Position = UDim2.fromOffset(52, 0)
	amount.Parent = f
	if props.onPlus then
		local plus = Kit.button({ color = props.plusColor or Theme.Green, size = UDim2.fromOffset(40, 44), icon = "Plus", iconSize = 30, radius = UDim.new(1, 0), depth = 4, onClick = props.onPlus, shine = props.shine })
		plus.AnchorPoint = Vector2.new(1, 0.5)
		plus.Position = UDim2.new(1, -4, 0.5, 0)
		plus.Parent = f
	end
	local shown = 0
	local function set(v: number)
		-- roll the number up/down for feel
		local from = shown
		shown = v
		task.spawn(function()
			for i = 1, 12 do
				amount.Text = Kit.abbreviate(math.floor(from + (v - from) * (i / 12)))
				task.wait(0.016)
			end
			amount.Text = Kit.abbreviate(v)
		end)
	end
	return f, set
end

function Kit.abbreviate(n: number): string
	if n >= 1e9 then return string.format("%.1fB", n / 1e9) end
	if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
	if n >= 1e4 then return string.format("%.1fK", n / 1e3) end
	local s = tostring(math.floor(n))
	return s:reverse():gsub("(%d%d%d)", "%1,"):reverse():gsub("^,", "")
end

-- Progress bar; returns the frame and a setter (0..1, optional label text).
function Kit.bar(props: Props): (Frame, (number, string?) -> ())
	local f = new("Frame", { Name = props.name or "Bar", BackgroundColor3 = Theme.shade(Theme.Ink, 0.1), Size = props.size or UDim2.new(1, 0, 0, 26), LayoutOrder = props.order or 0 }, { Kit.corner(UDim.new(1, 0)), Kit.stroke(3) })
	local fill = new("Frame", { Name = "Fill", BackgroundColor3 = props.color or Theme.Green, Size = UDim2.fromScale(0, 1), Parent = f }, { Kit.corner(UDim.new(1, 0)), Kit.gradient(Theme.shade(props.color or Theme.Green, 0.25), Theme.shade(props.color or Theme.Green, -0.1)) })
	new("Frame", { Name = "Gloss", BackgroundColor3 = Theme.White, BackgroundTransparency = 0.7, Size = UDim2.new(1, -8, 0.35, 0), Position = UDim2.fromOffset(4, 3), Parent = fill }, { Kit.corner(UDim.new(1, 0)) })
	local label = Kit.text("", { size = props.textSize or 16, color = Theme.White, outline = 2, box = UDim2.fromScale(1, 1), font = Theme.Body })
	label.ZIndex = 3
	label.Parent = f
	return f, function(v: number, text: string?)
		Kit.tween(fill, 0.25, { Size = UDim2.fromScale(math.clamp(v, 0, 1), 1) })
		label.Text = text or ""
	end
end

-- Pop-in / pop-out with a UIScale.
function Kit.pop(gui: GuiObject, show: boolean, cb: (() -> ())?)
	local s = gui:FindFirstChildOfClass("UIScale") or new("UIScale", { Parent = gui })
	if show then
		gui.Visible = true
		s.Scale = 0.85
		Kit.tween(s, 0.22, { Scale = 1 }, Enum.EasingStyle.Back)
	else
		local tw = Kit.tween(s, 0.12, { Scale = 0.85 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		tw.Completed:Once(function()
			gui.Visible = false
			if cb then cb() end
		end)
	end
end

-- Modal window: dim backdrop, panel with a coloured header ribbon and a close button.
-- Returns { root, body, open(), close() }.
function Kit.modal(parent: Instance, props: Props)
	local root = new("Frame", { Name = props.name or "Modal", BackgroundColor3 = Theme.Dim, BackgroundTransparency = 0.45, Size = UDim2.fromScale(1, 1), Visible = false, ZIndex = 20, Parent = parent })
	local win = Kit.panel({ name = "Window", size = props.size or UDim2.fromOffset(860, 560), pos = UDim2.fromScale(0.5, 0.53), anchor = Vector2.new(0.5, 0.5) })
	win.Parent = root
	local accent: Color3 = props.accent or Theme.Orange
	local ribbon = new("Frame", { Name = "Ribbon", BackgroundColor3 = accent, Size = UDim2.new(0.6, 0, 0, 64), Position = UDim2.new(0.5, 0, 0, -26), AnchorPoint = Vector2.new(0.5, 0), Parent = win }, {
		Kit.corner(UDim.new(0, 16)), Kit.stroke(4), Kit.gradient(Theme.shade(accent, 0.25), Theme.shade(accent, -0.12)),
	})
	local title = Kit.text(props.title or "", { size = 36, color = Theme.White, outline = 3.5, box = UDim2.fromScale(1, 1) })
	title.Parent = ribbon
	if props.icon then
		Kit.icon(props.icon, 84, { pos = UDim2.new(0, -42, 0.5, 0), anchor = Vector2.new(0, 0.5) }).Parent = ribbon
	end
	local close = Kit.button({ name = "Close", color = Theme.Red, size = UDim2.fromOffset(58, 62), icon = "Close", iconSize = 40, radius = UDim.new(1, 0), depth = 5 })
	close.Position = UDim2.new(1, -30, 0, -22)
	close.Parent = win
	local body = new("Frame", { Name = "Content", BackgroundTransparency = 1, Size = UDim2.new(1, -40, 1, -70), Position = UDim2.fromOffset(20, 52), Parent = win })
	local m = { root = root, body = body, onOpen = nil :: (() -> ())? }
	function m.open()
		root.Visible = true
		root.BackgroundTransparency = 1
		Kit.tween(root, 0.2, { BackgroundTransparency = 0.45 })
		Kit.pop(win, true)
		if m.onOpen then m.onOpen() end
	end
	function m.close()
		Kit.tween(root, 0.15, { BackgroundTransparency = 1 })
		Kit.pop(win, false, function() root.Visible = false end)
	end
	close.Activated:Connect(m.close)
	return m
end

-- Tab strip; returns the frame and select(name).
function Kit.tabs(names: { string }, onSelect: (string) -> (), accent: Color3?): (Frame, (string) -> ())
	local f = new("Frame", { Name = "Tabs", BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, 56) }, { Kit.list(Enum.FillDirection.Horizontal, 10) })
	local btns: { [string]: TextButton } = {}
	local function select(name: string)
		for n, b in btns do
			local face = b:FindFirstChild("Face") :: Frame
			face.BackgroundColor3 = if n == name then (accent or Theme.Orange) else Theme.CreamDeep
			local label = face:FindFirstChild("Row") and (face :: any).Row:FindFirstChild("Label") :: TextLabel?
			if label then
				label.TextColor3 = if n == name then Theme.White else Theme.Ink
				local st = label:FindFirstChildOfClass("UIStroke")
				if st then st.Enabled = n == name end
			end
		end
		onSelect(name)
	end
	for i, n in names do
		local b = Kit.button({ name = n, text = n, color = Theme.CreamDeep, size = UDim2.fromOffset(170, 52), textSize = 22, order = i, depth = 4, onClick = function() select(n) end })
		b.Parent = f
		btns[n] = b
	end
	return f, select
end

-- Toast message at the top of the screen.
function Kit.toast(parent: Instance, text: string, icon: string?, color: Color3?)
	local f = new("Frame", { Name = "Toast", BackgroundColor3 = color or Theme.Ink, BackgroundTransparency = 0.1, Size = UDim2.fromOffset(0, 54), AutomaticSize = Enum.AutomaticSize.X, Position = UDim2.new(0.5, 0, 0, -70), AnchorPoint = Vector2.new(0.5, 0), ZIndex = 50, Parent = parent }, {
		Kit.corner(UDim.new(1, 0)), Kit.stroke(3), Kit.list(Enum.FillDirection.Horizontal, 8), new("UIPadding", { PaddingLeft = UDim.new(0, 14), PaddingRight = UDim.new(0, 20) }),
	})
	if icon then
		Kit.icon(icon, 44, { order = 1 }).Parent = f
	end
	Kit.text(text, { size = 22, color = Theme.White, outline = 2, order = 2, box = UDim2.new(0, 0, 1, 0), auto = Enum.AutomaticSize.X }).Parent = f
	Kit.tween(f, 0.3, { Position = UDim2.new(0.5, 0, 0, 96) }, Enum.EasingStyle.Back)
	task.delay(2.4, function()
		Kit.tween(f, 0.25, { Position = UDim2.new(0.5, 0, 0, -70) }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		task.delay(0.3, function() f:Destroy() end)
	end)
end

return Kit
