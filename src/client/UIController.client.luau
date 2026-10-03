--!strict
-- Builds the whole UI: HUD, shop, Index, incubators and hatch reveal. (Boss runs have their own
-- HUD in Dungeon.client.) Scales the layout (authored at 1280x720) to any screen, phones included.

local Players = game:GetService("Players")

local UI = script.Parent:WaitForChild("UI")
local Theme = require(UI:WaitForChild("Theme"))
local Kit = require(UI:WaitForChild("Kit"))
local State = require(UI:WaitForChild("State"))
local Screens = UI:WaitForChild("Screens")

local gui = Instance.new("ScreenGui")
gui.Name = "EggnappersUI"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")

-- Scale so the 1280x720 design fits; never below 0.55 so touch targets stay tappable.
local scale = Instance.new("UIScale")
scale.Parent = gui
local function rescale()
	local cam = workspace.CurrentCamera
	if not cam then return end
	local v = cam.ViewportSize
	scale.Scale = math.clamp(math.min(v.X / Theme.Design.X, v.Y / Theme.Design.Y), 0.55, 1.25)
end
rescale()
workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)

local screens: { [string]: any } = {}
local ctx = {}
function ctx.open(name: string, arg: any)
	for n, s in screens do
		if n ~= name and s.close then s.close() end
	end
	local s = screens[name]
	if s and s.open then s.open(arg) end
end
function ctx.toast(text: string, icon: string?, color: Color3?)
	Kit.toast(gui, text, icon, color)
end
function ctx.hatch(info: any)
	screens.HatchReveal.play(info)
end

require(Screens:WaitForChild("HUD"))(gui, ctx)
screens.Shop = require(Screens:WaitForChild("Shop"))(gui, ctx)
screens.Index = require(Screens:WaitForChild("IndexScreen"))(gui, ctx)
screens.Incubators = require(Screens:WaitForChild("Incubators"))(gui, ctx)
screens.HatchReveal = require(Screens:WaitForChild("HatchReveal"))(gui, ctx)

-- Let other client scripts drive the UI: shared.UI.toast(...), shared.UI.hatch(...), shared.UI.State
shared.UI = { open = ctx.open, toast = ctx.toast, hatch = ctx.hatch, State = State }
