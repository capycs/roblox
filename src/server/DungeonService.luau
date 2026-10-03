--!strict
-- Boss runs (server). Each run gets its own copy of the lair, built out of sight at
-- DungeonConfig.InstanceOrigin, so several parties can run at once.
--
--   fight   players arrive at the gate; the boss stands in the middle throwing red circles;
--           the eggs sit locked in the nest behind it.
--   escape  boss dead: the eggs unlock (hold the prompt to grab, up to maxCarry each, every egg
--           slows you down), the exit portal opens and rocks start falling on red circles.
--           Get hit while carrying and you drop your eggs. Walk into the portal to get out.
--   done    timer ran out or everyone left/died; the copy is destroyed.
--
--   DungeonService.start("Pyrothrax", { player1, player2 }, returnCFrame)
--   DungeonService.EggExtracted.Event:Connect(function(player, eggName, info) ... end)  -- give the egg here
--   DungeonService.RunEnded.Event:Connect(function(runName, result, players, bossRewards) ... end)
--
-- The lobby side (queue pads + countdown) is DungeonPortal.server.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local DungeonConfig = require(Shared.Dungeon.DungeonConfig)
local BossConfig = require(Shared.Creatures.BossConfig)
local AtmosphereConfig = require(Shared.Atmosphere.AtmosphereConfig)
local PropSetup = require(Shared.Props.PropSetup)
local FxService = require(Shared.Fx.FxService)
local Mutations = require(Shared.Creatures.Mutations)
local BossService = require(script.Parent.BossService)

local DungeonService = {}
DungeonService.EggExtracted = Instance.new("BindableEvent") -- (player, eggName, { run, boss, bossMutations })
DungeonService.RunEnded = Instance.new("BindableEvent") -- (runName, "cleared" | "failed" | "timeout", players, bossRewards?)

local remote = ReplicatedStorage:FindFirstChild("DungeonEvent") :: RemoteEvent?
if not remote then
	local e = Instance.new("RemoteEvent")
	e.Name = "DungeonEvent"
	e.Parent = ReplicatedStorage
	remote = e
end
local event = remote :: RemoteEvent

type Egg = { model: Model, primary: BasePart, prompt: ProximityPrompt, carrier: Player?, home: Vector3, gone: boolean, welds: { Instance } }
type Run = {
	id: number,
	name: string,
	def: DungeonConfig.Run,
	players: { Player },
	started: { Player },
	folder: Folder,
	zonePart: BasePart?,
	lair: CFrame, -- floor top centre, facing the gate
	floorY: number,
	bossPos: Vector3,
	spawnPos: Vector3,
	exitPos: Vector3,
	returnTo: CFrame,
	boss: Model?,
	bossMuts: { string },
	rewards: { [string]: number }?,
	eggs: { Egg },
	carry: { [Player]: { Egg } },
	saved: number,
	state: string,
	endsAt: number,
	nextRock: number,
	conns: { [Player]: { RBXScriptConnection } },
	exitSign: BillboardGui?,
}

local runs: { Run } = {}
local runOf: { [Player]: Run } = {}
local slots: { [number]: boolean } = {}
local cooldown: { [Player]: number } = {}
local nextId = 0
local rng = Random.new()

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

local function find(path: { string }, name: string): Instance?
	local f: Instance? = game
	for _, n in path do
		f = f and (f :: Instance):FindFirstChild(n)
	end
	return f and (f :: Instance):FindFirstChild(name)
end

local function rootOf(pl: Player): (BasePart?, Humanoid?)
	local ch = pl.Character
	local hum = ch and ch:FindFirstChildOfClass("Humanoid")
	local root = ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart?
	if hum and root and hum.Health > 0 then
		return root, hum
	end
	return nil, nil
end

local function banner(to: { Player }, title: string, sub: string)
	for _, pl in to do
		event:FireClient(pl, { k = "banner", title = title, sub = sub })
	end
end

local function eggsLeft(run: Run): number
	local n = 0
	for _, e in run.eggs do
		if not e.gone then
			n += 1
		end
	end
	return n
end

local function sync(run: Run)
	local left = eggsLeft(run)
	for _, pl in run.players do
		local list = run.carry[pl]
		pl:SetAttribute("DungeonRun", run.def.displayName)
		pl:SetAttribute("DungeonState", run.state)
		pl:SetAttribute("DungeonEndsAt", run.endsAt)
		pl:SetAttribute("CarryEggs", if list then #list else 0)
		pl:SetAttribute("CarryMax", run.def.maxCarry)
		pl:SetAttribute("DungeonEggsLeft", left)
	end
end

local function clearAttrs(pl: Player)
	for _, k in { "DungeonRun", "DungeonState", "DungeonEndsAt", "CarryEggs", "CarryMax", "DungeonEggsLeft" } do
		pl:SetAttribute(k, nil)
	end
end

local function setSpeed(pl: Player, carrying: number, carrySpeed: number)
	local _, hum = rootOf(pl)
	if not hum then
		return
	end
	local base = hum:GetAttribute("BaseWalkSpeed") :: number?
	if not base then
		base = hum.WalkSpeed
		hum:SetAttribute("BaseWalkSpeed", base)
	end
	hum.WalkSpeed = (base :: number) * carrySpeed ^ carrying
end

-- a layout point: a marker in the lair with that name wins, else the config offset
local function point(run: Run, lair: Instance, name: string, offset: Vector3): Vector3
	local m = lair:FindFirstChild(name, true)
	if m and m:IsA("BasePart") then
		return m.Position
	elseif m and m:IsA("Attachment") then
		return m.WorldPosition
	end
	return run.lair:PointToWorldSpace(offset)
end

---------------------------------------------------------------- eggs

local function placeEgg(run: Run, egg: Egg, at: Vector3)
	for _, w in egg.welds do
		w:Destroy()
	end
	table.clear(egg.welds)
	for _, d in egg.model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = true
			d.Massless = false
		end
	end
	egg.model:PivotTo(CFrame.new(at) * run.lair.Rotation)
	CollectionService:AddTag(egg.model, PropSetup.AnimTag) -- wobble again where it landed
end

local function drop(run: Run, pl: Player, toNest: boolean?)
	local list = run.carry[pl]
	if not list or #list == 0 then
		return
	end
	local root = rootOf(pl)
	local at = if root then root.Position else (pl.Character and pl.Character:GetPivot().Position) or run.bossPos
	for i, egg in list do
		egg.carrier = nil
		local spot = egg.home
		if not toNest then
			-- scatter round where they fell, kept inside the arena
			local a = (i / #list) * math.pi * 2 + rng:NextNumber() * 0.6
			spot = at + Vector3.new(math.cos(a), 0, math.sin(a)) * rng:NextNumber(2, 4)
			local off = flat(spot - run.bossPos)
			local maxR = run.def.layout.arenaRadius - 3
			if off.Magnitude > maxR then
				spot = run.bossPos + off.Unit * maxR
			end
			spot = Vector3.new(spot.X, run.floorY, spot.Z)
		end
		placeEgg(run, egg, spot)
		task.delay(0.8, function()
			if run.state == "escape" and not egg.carrier and not egg.gone then
				egg.prompt.Enabled = true
			end
		end)
	end
	run.carry[pl] = {}
	setSpeed(pl, 0, run.def.carrySpeed)
	FxService.play("KnockedDown", at)
	sync(run)
end

local function pickUp(run: Run, egg: Egg, pl: Player)
	if run.state ~= "escape" or egg.carrier or egg.gone or runOf[pl] ~= run then
		return
	end
	local root = rootOf(pl)
	local list = run.carry[pl] or {}
	if not root or #list >= run.def.maxCarry then
		return
	end
	egg.carrier = pl
	egg.prompt.Enabled = false
	table.insert(list, egg)
	run.carry[pl] = list
	CollectionService:RemoveTag(egg.model, PropSetup.AnimTag)
	-- stack the eggs above the player's head
	local _, size = egg.model:GetBoundingBox()
	egg.model:PivotTo(root.CFrame * CFrame.new(0, 2.4 + (#list - 1) * size.Y * 0.9, 0))
	for _, d in egg.model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = false
			d.Massless = true
			d.CanCollide, d.CanQuery, d.CanTouch = false, false, false
			if d ~= egg.primary then
				local w = Instance.new("WeldConstraint")
				w.Part0, w.Part1 = egg.primary, d
				w.Parent = egg.primary
				table.insert(egg.welds, w)
			end
		end
	end
	local w = Instance.new("WeldConstraint")
	w.Part0, w.Part1 = root, egg.primary
	w.Parent = egg.primary
	table.insert(egg.welds, w)
	setSpeed(pl, #list, run.def.carrySpeed)
	FxService.play("Pickup", root.Position)
	sync(run)
end

local function spawnEggs(run: Run, lair: Instance)
	local template = find(DungeonConfig.EggFolder, run.def.egg)
	if not template or not template:IsA("Model") then
		warn("[DungeonService] Import the " .. run.def.egg .. " egg into " .. table.concat(DungeonConfig.EggFolder, "/"))
		return
	end
	for i = 1, run.def.eggCount do
		local offset = run.def.layout.eggs[(i - 1) % #run.def.layout.eggs + 1]
		local home = point(run, lair, "EggSpot" .. i, offset)
		local model = template:Clone()
		PropSetup.prepare(model, run.def.egg)
		model:ScaleTo(run.def.eggScale)
		local primary = model.PrimaryPart
		if not primary then
			for _, d in model:GetDescendants() do
				if d:IsA("BasePart") and (not primary or d.Size.Magnitude > (primary :: BasePart).Size.Magnitude) then
					primary = d
				end
			end
		end
		if not primary then
			model:Destroy()
			continue
		end
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Grab egg"
		prompt.ObjectText = run.def.displayName
		prompt.HoldDuration = 0.35
		prompt.MaxActivationDistance = 9
		prompt.RequiresLineOfSight = false
		prompt.Enabled = false -- locked until the boss is dead
		prompt.Parent = primary
		-- position before parenting: the client wobble anchors to wherever it first sees the egg
		model:PivotTo(CFrame.new(home) * run.lair.Rotation)
		model.Parent = run.folder
		local egg: Egg = { model = model, primary = primary :: BasePart, prompt = prompt, home = home, gone = false, welds = {} }
		prompt.Triggered:Connect(function(pl)
			pickUp(run, egg, pl)
		end)
		table.insert(run.eggs, egg)
	end
end

---------------------------------------------------------------- leaving / ending

local endRun: (Run, string) -> ()

local function teleportOut(run: Run, pl: Player)
	local ch = pl.Character
	if ch then
		local off = Vector3.new(rng:NextNumber(-4, 4), 3, rng:NextNumber(-4, 4))
		ch:PivotTo(run.returnTo + off)
	end
end

-- how: "escaped" | "timeout" | "died" | "left"
local function leave(run: Run, pl: Player, how: string)
	if runOf[pl] ~= run then
		return
	end
	drop(run, pl, how == "timeout")
	runOf[pl] = nil
	local i = table.find(run.players, pl)
	if i then
		table.remove(run.players, i)
	end
	for _, c in run.conns[pl] or {} do
		c:Disconnect()
	end
	run.conns[pl] = nil
	clearAttrs(pl)
	cooldown[pl] = os.clock() + DungeonConfig.Queue.RequeueCooldown
	if how == "escaped" or how == "timeout" then
		setSpeed(pl, 0, run.def.carrySpeed)
		teleportOut(run, pl)
	end
	if #run.players == 0 and run.state ~= "done" then
		endRun(run, if run.saved > 0 then "cleared" elseif run.state == "fight" then "failed" else "timeout")
	end
end

endRun = function(run: Run, result: string)
	if run.state == "done" then
		return
	end
	run.state = "done"
	for _, pl in table.clone(run.players) do
		leave(run, pl, "timeout")
	end
	if run.boss and run.boss.Parent then
		BossService.despawn(run.boss)
	end
	if run.zonePart then
		run.zonePart:Destroy()
	end
	run.folder:Destroy()
	slots[run.id] = nil
	local i = table.find(runs, run)
	if i then
		table.remove(runs, i)
	end
	DungeonService.RunEnded:Fire(run.name, result, run.started, run.rewards)
end

local function extract(run: Run, pl: Player)
	local list = run.carry[pl] or {}
	local n = #list
	for _, egg in list do
		egg.gone = true
		egg.carrier = nil
		egg.model:Destroy()
		run.saved += 1
		DungeonService.EggExtracted:Fire(pl, run.def.egg, { run = run.name, boss = run.def.boss, bossMutations = run.bossMuts })
	end
	run.carry[pl] = {}
	FxService.play("ExtractPortal", run.exitPos)
	banner({ pl }, "ESCAPED!", if n == 0 then "You got out empty-handed." elseif n == 1 then "1 egg saved." else n .. " eggs saved.")
	leave(run, pl, "escaped")
	if #run.players > 0 then
		sync(run)
	end
end

---------------------------------------------------------------- phases

local function startEscape(run: Run)
	if run.state ~= "fight" then
		return
	end
	run.state = "cleared"
	sync(run)
	task.delay(run.def.unlockDelay, function()
		if run.state ~= "cleared" then
			return
		end
		run.state = "escape"
		run.endsAt = workspace:GetServerTimeNow() + run.def.escapeTime
		run.nextRock = os.clock() + 2.5
		for _, egg in run.eggs do
			if not egg.gone then
				egg.prompt.Enabled = true
				FxService.play("HatchBurst", egg.primary.Position)
			end
		end
		if run.exitSign then
			run.exitSign.Enabled = true
		end
		banner(run.players, "THE LAIR IS COLLAPSING", "Grab the eggs and run out through the portal!")
		sync(run)
	end)
end

-- falling rocks while escaping: red circles under the players, carriers get more of them
local function collapseTick(run: Run)
	local c = run.def.collapse
	run.nextRock = os.clock() + c.every
	local pool = {}
	for _, pl in run.players do
		local root = rootOf(pl)
		if root then
			table.insert(pool, root)
			if run.carry[pl] and #run.carry[pl] > 0 then
				table.insert(pool, root)
			end
		end
	end
	if #pool == 0 then
		return
	end
	local root = pool[rng:NextInteger(1, #pool)]
	local a = rng:NextNumber() * math.pi * 2
	local pos = Vector3.new(root.Position.X, run.floorY, root.Position.Z) + Vector3.new(math.cos(a), 0, math.sin(a)) * rng:NextNumber(0, 3)
	BossService.circle(run.players, run.players, pos, c.radius, c.warn, c.damage, {
		effect = "BossMeteorImpact", meteor = true, shake = 0.3, knockback = 25,
		cancelled = function() return run.state ~= "escape" end,
	})
end

---------------------------------------------------------------- building a run

local function buildWalls(run: Run, radius: number)
	local walls = Instance.new("Folder")
	walls.Name = "Walls"
	walls.Parent = run.folder
	local n = 40
	for i = 1, n do
		local a = (i / n) * math.pi * 2
		local p = Instance.new("Part")
		p.Anchored, p.CanQuery, p.CanTouch, p.CastShadow = true, false, false, false
		p.Transparency = 1
		p.Size = Vector3.new(2 * math.pi * (radius + 2) / n * 1.1, 80, 4)
		local pos = run.lair:PointToWorldSpace(Vector3.new(math.sin(a) * (radius + 2), 38, -math.cos(a) * (radius + 2)))
		p.CFrame = CFrame.lookAt(pos, Vector3.new(run.bossPos.X, pos.Y, run.bossPos.Z))
		p.Parent = walls
	end
end

function DungeonService.inRun(pl: Player): boolean
	return runOf[pl] ~= nil
end

function DungeonService.canQueue(pl: Player): boolean
	return runOf[pl] == nil and (cooldown[pl] or 0) <= os.clock()
end

function DungeonService.start(name: string, party: { Player }, returnTo: CFrame): boolean
	local def = DungeonConfig.Runs[name]
	assert(def, "Unknown run " .. name)
	local template = find(DungeonConfig.LairFolder, def.lair)
	if not template or not template:IsA("Model") then
		warn("[DungeonService] Import the " .. def.lair .. " lair into " .. table.concat(DungeonConfig.LairFolder, "/"))
		return false
	end
	local group = {}
	for _, pl in party do
		if runOf[pl] == nil and rootOf(pl) and #group < def.maxPlayers then
			table.insert(group, pl)
		end
	end
	if #group == 0 then
		return false
	end
	local id = 1
	while slots[id] do
		id += 1
	end
	slots[id] = true
	nextId += 1

	local holder = workspace:FindFirstChild("Dungeons") or Instance.new("Folder")
	holder.Name = "Dungeons"
	holder.Parent = workspace
	local folder = Instance.new("Folder")
	folder.Name = name .. "_" .. nextId
	folder.Parent = holder

	local lair = template:Clone()
	PropSetup.prepare(lair, def.lair)
	lair:PivotTo(CFrame.new(DungeonConfig.InstanceOrigin + Vector3.new((id - 1) * DungeonConfig.InstanceSpacing, 0, 0)))
	local floor = lair:FindFirstChild("Floor", true)
	for _, d in lair:GetDescendants() do
		if d:IsA("BasePart") and d ~= floor then
			-- mesh hulls would fill the arena; the invisible wall ring does the blocking
			d.CanCollide, d.CanQuery, d.CanTouch = false, false, false
		end
	end
	lair.Parent = folder
	local lairCF = if floor and floor:IsA("BasePart")
		then CFrame.new(floor.Position + floor.CFrame.UpVector * floor.Size.Y / 2) * floor.CFrame.Rotation
		else lair:GetPivot()

	local run: Run = {
		id = id, name = name, def = def, players = group, started = table.clone(group), folder = folder,
		lair = lairCF, floorY = lairCF.Position.Y, bossPos = Vector3.zero, spawnPos = Vector3.zero, exitPos = Vector3.zero,
		returnTo = returnTo, bossMuts = {}, eggs = {}, carry = {}, saved = 0, state = "fight", endsAt = 0, nextRock = 0, conns = {},
	}
	run.bossPos = point(run, lair, "BossSpawn", def.layout.boss)
	run.spawnPos = point(run, lair, "PlayerSpawn", def.layout.spawn)
	run.exitPos = point(run, lair, "Exit", def.layout.exit)
	buildWalls(run, def.layout.arenaRadius)
	spawnEggs(run, lair)

	-- lighting inside: a zone box for Atmosphere.client
	if def.zone then
		local zones = workspace:FindFirstChild(AtmosphereConfig.ZonesFolder) or Instance.new("Folder")
		zones.Name = AtmosphereConfig.ZonesFolder
		zones.Parent = workspace
		local z = Instance.new("Part")
		z.Name = def.zone
		z.Anchored, z.CanCollide, z.CanQuery, z.CanTouch, z.CastShadow = true, false, false, false, false
		z.Transparency = 1
		z.Size = Vector3.new(def.layout.arenaRadius * 2 + 60, 140, def.layout.arenaRadius * 2 + 60)
		z.CFrame = lairCF + Vector3.new(0, 50, 0)
		z.Parent = zones
		run.zonePart = z
	end

	-- exit marker, shown once the eggs unlock
	local sign = Instance.new("Part")
	sign.Name = "ExitSign"
	sign.Anchored, sign.CanCollide, sign.CanQuery, sign.CanTouch = true, false, false, false
	sign.Transparency = 1
	sign.Size = Vector3.new(1, 1, 1)
	sign.Position = run.exitPos + Vector3.new(0, 15, 0)
	sign.Parent = folder
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(160, 56)
	gui.AlwaysOnTop = true
	gui.Enabled = false
	gui.Parent = sign
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Text = "EXIT"
	label.TextScaled = true
	label.FontFace = Font.new("rbxasset://fonts/families/FredokaOne.json")
	label.TextColor3 = Color3.fromRGB(255, 220, 120)
	label.TextStrokeTransparency = 0
	label.Parent = gui
	run.exitSign = gui

	-- the boss, facing the gate
	local hpMul = 1 + def.hpPerExtraPlayer * (#group - 1)
	run.boss = BossService.spawn(def.boss, CFrame.new(run.bossPos) * lairCF.Rotation, {
		arena = { center = run.bossPos, radius = def.layout.arenaRadius },
		players = function() return run.players end,
		hpMul = hpMul,
	})
	if not run.boss then
		folder:Destroy()
		if run.zonePart then
			run.zonePart:Destroy()
		end
		slots[id] = nil
		return false
	end
	run.bossMuts = Mutations.decode(run.boss:GetAttribute("Mutations") :: string?)

	-- bring the party in, spread out at the gate, facing the boss
	for i, pl in table.clone(group) do
		local _, hum = rootOf(pl)
		if not hum then
			table.remove(group, table.find(group, pl) :: number)
			continue
		end
		runOf[pl] = run
		local off = run.lair:VectorToWorldSpace(Vector3.new((i - (#group + 1) / 2) * 5, 3, 0))
		local at = run.spawnPos + off
		pcall(function()
			pl:RequestStreamAroundAsync(at, 3) -- StreamingEnabled places: load the lair before we arrive
		end)
		local ch = pl.Character :: Model
		ch:PivotTo(CFrame.lookAt(at, Vector3.new(run.bossPos.X, at.Y, run.bossPos.Z)))
		run.conns[pl] = {
			(hum :: Humanoid).Died:Connect(function()
				banner({ pl }, "KNOCKED OUT", "You fell in " .. def.displayName .. ".")
				leave(run, pl, "died")
			end),
		}
	end
	if #group == 0 then
		endRun(run, "failed")
		return false
	end
	table.insert(runs, run)
	sync(run)
	banner(group, string.upper(def.displayName), "Dodge the red circles. Defeat " .. BossConfig.Bosses[def.boss].displayName .. " to free its eggs.")
	return true
end

---------------------------------------------------------------- hooks

BossService.Defeated.Event:Connect(function(model: Model, _species: string, rewards)
	for _, run in runs do
		if run.boss == model then
			run.rewards = rewards
			startEscape(run)
		end
	end
end)

BossService.PlayerHit.Event:Connect(function(pl: Player)
	local run = runOf[pl]
	if run and run.def.dropOnHit and run.carry[pl] and #run.carry[pl] > 0 then
		drop(run, pl)
	end
end)

Players.PlayerRemoving:Connect(function(pl)
	local run = runOf[pl]
	if run then
		leave(run, pl, "left")
	end
	cooldown[pl] = nil
end)

RunService.Heartbeat:Connect(function()
	local now = workspace:GetServerTimeNow()
	for _, run in table.clone(runs) do
		if run.state ~= "escape" then
			continue
		end
		for _, pl in table.clone(run.players) do
			local root = rootOf(pl)
			if root then
				local d = root.Position - run.exitPos
				if flat(d).Magnitude <= run.def.layout.exitRadius and math.abs(d.Y) < 12 then
					extract(run, pl)
				end
			end
		end
		if run.state ~= "escape" then
			continue
		end
		if now >= run.endsAt then
			banner(run.players, "TOO SLOW", "The cave came down. The eggs you were holding are lost.")
			endRun(run, if run.saved > 0 then "cleared" else "timeout")
		elseif os.clock() >= run.nextRock then
			collapseTick(run)
		end
	end
end)

return DungeonService
