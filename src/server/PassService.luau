--!strict
-- Game passes and featured offers (server).
--
-- Passes: on join (and right after a purchase) every pass in ShopCatalog.Passes with a real
-- gamePassId is checked and published as the player attribute "Pass_<id>" = true. Gameplay code
-- reads that attribute (DungeonService does for ExtraCarry and BossKey).
--
-- Offers: each offer runs for `hours` after the player FIRST joined (saved in a DataStore, so
-- rejoining doesn't reset it) and is published as "<Id>EndsAt" (Unix seconds, compare with
-- workspace:GetServerTimeNow()). One-time offers bought are published as "Owned_<Id>" = true.
-- Call PassService.grantOffer(player, offerId) from your ProcessReceipt after granting the
-- contents, so the shop and HUD hide it.
--
-- Without DataStore access (Studio with API access off) offers run from the session start.

local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Catalog = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Shop"):WaitForChild("ShopCatalog"))

local PassService = {}
PassService.StoreName = "EggnappersOffers_v1"

local store: DataStore? = nil
pcall(function()
	store = DataStoreService:GetDataStore(PassService.StoreName)
end)

type Record = { firstJoin: number, owned: { [string]: boolean } }
local records: { [Player]: Record } = {}

function PassService.owns(player: Player, passId: string): boolean
	return player:GetAttribute("Pass_" .. passId) == true
end

local function checkPasses(player: Player)
	for _, pass in Catalog.Passes do
		if pass.gamePassId ~= 0 then
			task.spawn(function()
				local ok, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, pass.gamePassId)
				if ok and owns then
					player:SetAttribute("Pass_" .. pass.id, true)
				end
			end)
		end
	end
end

local function publishOffers(player: Player, rec: Record)
	for _, o in Catalog.Offers do
		player:SetAttribute(o.id .. "EndsAt", rec.firstJoin + o.hours * 3600)
		if rec.owned[o.id] then
			player:SetAttribute("Owned_" .. o.id, true)
		end
	end
end

local function key(player: Player): string
	return "u_" .. player.UserId
end

local function load(player: Player)
	local rec: Record = { firstJoin = os.time(), owned = {} }
	local s = store
	if s then
		local ok, data = pcall(function()
			return (s :: DataStore):UpdateAsync(key(player), function(old: any)
				if type(old) == "table" and type(old.firstJoin) == "number" then
					return old
				end
				return { firstJoin = os.time(), owned = {} }
			end)
		end)
		if ok and type(data) == "table" then
			rec = { firstJoin = data.firstJoin, owned = data.owned or {} }
		elseif not ok then
			warn("[PassService] DataStore unavailable, offers run from session start: " .. tostring(data))
		end
	end
	records[player] = rec
	publishOffers(player, rec)
end

-- Call after granting a one-time offer's contents (ProcessReceipt).
function PassService.grantOffer(player: Player, offerId: string)
	local rec = records[player]
	if rec then
		rec.owned[offerId] = true
	end
	player:SetAttribute("Owned_" .. offerId, true)
	local s = store
	if s then
		task.spawn(function()
			pcall(function()
				(s :: DataStore):UpdateAsync(key(player), function(old: any)
					local d = if type(old) == "table" then old else { firstJoin = os.time(), owned = {} }
					d.owned = d.owned or {}
					d.owned[offerId] = true
					return d
				end)
			end)
		end)
	end
end

-- Offer lookup by developer product id (for ProcessReceipt): returns the offer entry or nil.
function PassService.offerForProduct(productId: number): any
	for _, o in Catalog.Offers do
		if o.productId == productId and productId ~= 0 then
			return o
		end
	end
	return nil
end

local started = false
function PassService.start()
	if started then return end
	started = true
	Players.PlayerAdded:Connect(function(p)
		checkPasses(p)
		load(p)
	end)
	for _, p in Players:GetPlayers() do
		task.spawn(checkPasses, p)
		task.spawn(load, p)
	end
	Players.PlayerRemoving:Connect(function(p)
		records[p] = nil
	end)
	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(p, passId, purchased)
		if not purchased then return end
		for _, pass in Catalog.Passes do
			if pass.gamePassId == passId then
				p:SetAttribute("Pass_" .. pass.id, true)
			end
		end
	end)
end

return PassService
