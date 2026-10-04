--!strict
-- Builds the whole UI: HUD, premium shop, offer popup, odds panel, Index, incubators and hatch reveal. (Boss runs have their own
-- HUD in Dungeon.client.) Scales the layout (authored at 1280x720) to any screen, phones included.

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UI = script.Parent:WaitForChild("UI")
local Theme = require(UI:WaitForChild("Theme"))
local Kit = require(UI:WaitForChild("Kit"))
local State = require(UI:WaitForChild("State"))
local Premium = require(UI:WaitForChild("Premium"))
local Catalog = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Shop"):WaitForChild("ShopCatalog"))
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
-- overlays open on top of whatever is showing (the odds panel over the shop)
local OVERLAYS = { Odds = true }
function ctx.open(name: string, arg: any)
	if not OVERLAYS[name] then
		for n, s in screens do
			if n ~= name and s.close then s.close() end
		end
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
screens.Odds = require(Screens:WaitForChild("Odds"))(gui, ctx)
screens.Offer = require(Screens:WaitForChild("OfferPopup"))(gui, ctx)

-- purchase "thank you" moment (the actual grant happens server-side in ProcessReceipt)
local function findBy(field: string, id: number): (string?, string?)
	for _, list in { Catalog.GemPacks, Catalog.Offers, Catalog.Passes } do
		for _, e in list do
			if (e :: any)[field] == id and id ~= 0 then
				return e.name, e.icon
			end
		end
	end
	return nil, nil
end
MarketplaceService.PromptProductPurchaseFinished:Connect(function(_userId, productId, purchased)
	if purchased then
		local name, icon = findBy("productId", productId)
		Premium.celebrate(gui, `Thank you! {name or "Purchase complete"}`, icon)
	end
end)
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(_plr, passId, purchased)
	if purchased then
		local name, icon = findBy("gamePassId", passId)
		Premium.celebrate(gui, `{name or "Pass"} unlocked!`, icon)
	end
end)

-- Let other client scripts drive the UI: shared.UI.toast(...), shared.UI.hatch(...), shared.UI.State
shared.UI = { open = ctx.open, toast = ctx.toast, hatch = ctx.hatch, State = State }
