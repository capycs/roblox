--!strict
-- Runs boss fights (server). The boss stands still where it spawns (the middle of its dungeon)
-- and only turns in place to face its target. Every attack: pick a pattern of red circles ->
-- circles appear on the floor and fill up over `warn` seconds -> the clip plays so its strike
-- lines up with the first circle landing -> anyone still inside a circle when it lands is hit.
--
--   local BossService = require(game.ServerScriptService.Server.BossService)
--   local boss = BossService.spawn("Pyrothrax", cframe, {
--       arena = { center = cframe.Position, radius = 50 },  -- where random circles may land
--       players = function() return { ... } end,             -- who it fights (default: everyone in range)
--       hpMul = 1.6,                                           -- e.g. scale HP with party size
--   })
--   BossService.damage(boss, 500, player)   -- from your combat code / creature abilities
--   BossService.Defeated.Event:Connect(function(boss, name, rewards, top, damageBy) ... end)
--   BossService.PlayerHit.Event:Connect(function(player, damage, boss) ... end)
--
-- BossService.circle(...) drops a single red circle anywhere (DungeonService uses it for the
-- collapsing cave while players run out with the eggs).
--
-- Bosses roll mutations on spawn (Mutations.roll with BossConfig mutationLuck): a Golden or
-- Rainbow boss has more HP and drops more coins, Giant is bigger, Void hits harder.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Creatures = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures")
local CreatureConfig = require(Creatures.CreatureConfig)
local CreatureSetup = require(Creatures.CreatureSetup)
local BossConfig = require(Creatures.BossConfig)
local Mutations = require(Creatures.Mutations)

local BossService = {}
BossService.Defeated = Instance.new("BindableEvent")
BossService.PlayerHit = Instance.new("BindableEvent")

local event = ReplicatedStorage:FindFirstChild("BossEvent") :: RemoteEvent?
if not event then
	local e = Instance.new("RemoteEvent")
	e.Name = "BossEvent"
	e.Parent = ReplicatedStorage
	event = e
end
local remote = event :: RemoteEvent

type Target = { player: Player, root: BasePart, hum: Humanoid }
type Options = {
	mutations: { string }?,
	arena: { center: Vector3, radius: number }?,
	players: (() -> { Player })?,
	hpMul: number?,
}
type State = {
	model: Model,
	def: BossConfig.Boss,
	style: any,
	muts: { string },
	cooldowns: { [string]: number },
	busy: boolean,
	dead: boolean,
	lastHurt: number,
	damageBy: { [Player]: number },
	ground: number,
	center: Vector3,
	radius: number,
	who: (() -> { Player })?,
}
local states: { [Model]: State } = {}
local rng = Random.new()

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

local function alive(pl: Player): Target?
	local ch = pl.Character
	local hum = ch and ch:FindFirstChildOfClass("Humanoid")
	local root = ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart?
	if hum and root and hum.Health > 0 then
		return { player = pl, root = root, hum = hum }
	end
	return nil
end

-- players this boss is fighting: its own list (a dungeon party) or anyone in range
local function targets(st: State): { Target }
	local out = {}
	for _, pl in (if st.who then st.who() else Players:GetPlayers()) do
		local t = alive(pl)
		if t and flat(t.root.Position - st.center).Magnitude <= st.radius + 6 then
			table.insert(out, t)
		end
	end
	return out
end

local function audience(st: State): { Player }
	return if st.who then st.who() else Players:GetPlayers()
end

local function send(to: { Player }, msg: { [string]: any })
	for _, pl in to do
		remote:FireClient(pl, msg)
	end
end

local function phaseMul(st: State, key: string): number
	if (st.model:GetAttribute("Phase") or 1) >= 2 then
		return if key == "speed" then st.def.phase2Speed else st.def.phase2Damage
	end
	return 1
end

local function field(st: State, atk: BossConfig.Attack, key: string, default: number): number
	if atk.phase2 and atk.phase2[key] and (st.model:GetAttribute("Phase") or 1) >= 2 then
		return atk.phase2[key]
	end
	return (atk :: any)[key] or default
end

local function hitCircle(to: { Player }, who: { Player }, c: Vector3, r: number, damage: number, knock: number?, boss: Model?)
	for _, pl in who do
		local t = alive(pl)
		if t then
			local d = t.root.Position - c
			if flat(d).Magnitude <= r + 1 and math.abs(d.Y) < 14 then
				t.hum:TakeDamage(damage)
				BossService.PlayerHit:Fire(pl, damage, boss)
				if knock and knock > 0 then
					local dir = flat(d)
					dir = if dir.Magnitude > 0.01 then dir.Unit else Vector3.new(0, 0, 1)
					t.root.AssemblyLinearVelocity = dir * knock + Vector3.new(0, knock * 0.5, 0)
				end
			end
		end
	end
end

--[=[
	One red circle: shows to `to`, lands after `delay` seconds, damages players in `who`.
	opts: effect (Effects preset at landing), meteor (a burning rock falls onto it),
	shake, knockback, boss (passed to PlayerHit), cancelled (() -> boolean)
]=]
function BossService.circle(to: { Player }, who: { Player }, pos: Vector3, radius: number, delay: number, damage: number, opts: { [string]: any }?)
	local o = opts or {}
	send(to, { k = "tele", pos = pos, radius = radius, dur = delay })
	if o.meteor then
		send(to, { k = "meteor", pos = pos, land = delay })
	end
	task.delay(delay, function()
		if o.cancelled and o.cancelled() then
			return
		end
		hitCircle(to, who, pos, radius, damage, o.knockback, o.boss)
		if o.effect then
			send(to, { k = "fx", name = o.effect, target = pos })
		end
		if o.shake and o.shake > 0 then
			send(to, { k = "shake", pos = pos, amount = o.shake })
		end
	end)
end

-- a random spot on the arena floor, away from the boss's body
local function randomSpot(st: State): Vector3
	local a, d = rng:NextNumber() * math.pi * 2, math.sqrt(rng:NextNumber(0.06, 1)) * (st.radius - 5)
	return Vector3.new(st.center.X + math.cos(a) * d, st.ground, st.center.Z + math.sin(a) * d)
end

local function onFloor(st: State, p: Vector3): Vector3
	return Vector3.new(p.X, st.ground, p.Z)
end

-- the circles for one attack: { pos, landsAfter (seconds after the first) }
local function circlesFor(st: State, atk: BossConfig.Attack, list: { Target }, target: Target?): { { pos: Vector3, after: number } }
	local pv = st.model:GetPivot()
	local pos, look = pv.Position, flat(pv.LookVector).Unit
	local scale = st.model:GetScale() / st.def.scale -- Giant bosses reach further
	local stagger = field(st, atk, "stagger", 0)
	local out = {}
	if atk.pattern == "front" then
		table.insert(out, { pos = onFloor(st, pos + look * (atk.offset or 10) * scale), after = 0 })
	elseif atk.pattern == "self" then
		table.insert(out, { pos = onFloor(st, pos), after = 0 })
	elseif atk.pattern == "targets" then
		for _, t in list do
			table.insert(out, { pos = onFloor(st, t.root.Position), after = 0 })
		end
		for _ = 1, field(st, atk, "extra", 0) do
			table.insert(out, { pos = randomSpot(st), after = 0 })
		end
		-- shuffle so the stagger doesn't always hit players first
		for i = #out, 2, -1 do
			local j = rng:NextInteger(1, i)
			out[i], out[j] = out[j], out[i]
		end
		for i, c in out do
			c.after = (i - 1) * stagger
		end
	elseif atk.pattern == "line" then
		local lines, spread = field(st, atk, "lines", 1), math.rad(field(st, atk, "spread", 25))
		local base = if target then flat(target.root.Position - pos) else look
		base = if base.Magnitude > 0.1 then base.Unit else look
		for l = 1, lines do
			local ang = (l - (lines + 1) / 2) * spread
			local dir = CFrame.Angles(0, ang, 0):VectorToWorldSpace(base)
			for i = 1, field(st, atk, "count", 6) do
				local d = (atk.start or 10) * scale + (i - 1) * (atk.spacing or 6)
				if d <= st.radius + 2 then
					table.insert(out, { pos = onFloor(st, pos + dir * d), after = (i - 1) * stagger })
				end
			end
		end
	elseif atk.pattern == "random" then
		for i = 1, field(st, atk, "count", 6) do
			table.insert(out, { pos = randomSpot(st), after = (i - 1) * stagger })
		end
	end
	return out
end

-- one attack, start to finish (runs in its own thread)
local function runAttack(st: State, name: string, atk: BossConfig.Attack, target: Target?)
	st.busy = true
	st.cooldowns[name] = os.clock() + atk.cooldown * phaseMul(st, "speed")
	local list = targets(st)
	local to, who = audience(st), {}
	for _, t in list do
		table.insert(who, t.player)
	end
	local clipDur = st.style.dur[atk.clip] or 1.5
	local hitT = atk.hit * clipDur
	local first = math.max(atk.warn, hitT) -- first circle lands here; the clip strike lines up with it
	local clipStart = first - hitT
	local dmg = atk.damage * phaseMul(st, "damage") * Mutations.stat(st.muts, "power")
	local circles = circlesFor(st, atk, list, target)
	local last = 0
	for _, c in circles do
		BossService.circle(to, who, c.pos, atk.radius * st.model:GetScale() / st.def.scale, first + c.after, dmg, {
			effect = atk.effect, meteor = atk.meteor, shake = atk.shake, knockback = atk.knockback, boss = st.model,
			cancelled = function() return st.dead end,
		})
		last = math.max(last, c.after)
	end
	task.delay(clipStart, function()
		if st.dead then return end
		CreatureSetup.playAction(st.model, atk.clip)
	end)
	if atk.breath then
		task.delay(first, function()
			if st.dead then return end
			send(to, { k = "breath", model = st.model, effect = atk.breath, dur = last + 0.5 })
		end)
	end
	task.wait(math.max(first + last + 0.2, clipStart + clipDur - 0.2))
	st.busy = false
end

local function pickAttack(st: State, nearestDist: number): (string?, BossConfig.Attack?)
	local phase = st.model:GetAttribute("Phase") or 1
	local now, total = os.clock(), 0
	local pool = {}
	for name, atk in st.def.attacks do
		if atk.phase <= phase and (st.cooldowns[name] or 0) <= now and nearestDist <= (atk.maxRange or math.huge) then
			table.insert(pool, { name, atk })
			total += atk.weight
		end
	end
	if total == 0 then
		return nil, nil
	end
	local roll = rng:NextNumber() * total
	for _, e in pool do
		roll -= e[2].weight
		if roll <= 0 then
			return e[1], e[2]
		end
	end
	return pool[#pool][1], pool[#pool][2]
end

-- stands still; turns to face the target, then attacks
local function brain(st: State)
	local nextAttack = os.clock()
	local pending: { name: string, atk: BossConfig.Attack, target: Target }? = nil
	while not st.dead and st.model.Parent do
		local dt = RunService.Heartbeat:Wait()
		if st.busy then
			nextAttack = math.max(nextAttack, os.clock() + 0.3)
			continue
		end
		local list = targets(st)
		if #list == 0 then
			pending = nil
			continue
		end
		if not pending and os.clock() >= nextAttack then
			local pos = st.model:GetPivot().Position
			local near, nd = list[1], math.huge
			for _, t in list do
				local d = flat(t.root.Position - pos).Magnitude
				if d < nd then
					near, nd = t, d
				end
			end
			local name, atk = pickAttack(st, nd)
			if name and atk then
				-- close-range attacks go for the nearest player, the rest pick anyone
				local target = if atk.maxRange then near else list[rng:NextInteger(1, #list)]
				pending = { name = name, atk = atk, target = target }
			end
		end
		if pending then
			local p = pending
			local pv = st.model:GetPivot()
			local to = flat(p.target.root.Position - pv.Position)
			local look = flat(pv.LookVector)
			local want = if to.Magnitude > 0.1 then to.Unit else look
			local ang = math.atan2(look:Cross(want).Y, look:Dot(want))
			local turn = math.clamp(ang, -st.def.turnSpeed * dt, st.def.turnSpeed * dt)
			st.model:PivotTo(pv * CFrame.Angles(0, turn, 0))
			-- "self" and "targets" don't need aiming; the others wait until it faces the target
			if math.abs(ang) < 0.3 or p.atk.pattern == "self" or p.atk.pattern == "targets" then
				pending = nil
				task.spawn(runAttack, st, p.name, p.atk, p.target)
				local idle = st.def.idleBetween
				nextAttack = os.clock() + rng:NextNumber(idle.Min, idle.Max) * phaseMul(st, "speed")
			end
		end
	end
end

function BossService.spawn(name: string, at: CFrame, opts: Options?): Model?
	local def = BossConfig.Bosses[name]
	assert(def, "Unknown boss " .. name)
	local folder: Instance? = game
	for _, n in BossConfig.TemplateFolder do
		folder = folder and (folder :: Instance):FindFirstChild(n)
	end
	local template = folder and (folder :: Instance):FindFirstChild(def.species)
	if not template or not template:IsA("Model") then
		warn("[BossService] Import the " .. def.species .. " model into " .. table.concat(BossConfig.TemplateFolder, "/"))
		return nil
	end
	local o: Options = opts or {}
	local model = template:Clone()
	model.Name = def.species
	CreatureSetup.prepare(model, def.species)
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = true
		end
	end
	model:ScaleTo(def.scale)
	model:PivotTo(at)
	model.Parent = workspace

	local muts = o.mutations or Mutations.roll(rng, def.mutationLuck)
	Mutations.applyServer(model, muts)
	local hp = math.floor(def.hp * Mutations.stat(muts, "hp") * (o.hpMul or 1))
	local label = def.displayName
	if #muts > 0 then
		label = Mutations.Defs[muts[1]].label .. " " .. label
	end
	model:SetAttribute("Boss", name)
	model:SetAttribute("DisplayName", label)
	model:SetAttribute("MaxHP", hp)
	model:SetAttribute("HP", hp)
	model:SetAttribute("Phase", 1)
	CollectionService:AddTag(model, BossConfig.Tag)

	local arena = o.arena or { center = at.Position, radius = def.aggroRange }
	local st: State = {
		model = model, def = def, style = CreatureConfig.Species[def.species].style, muts = muts,
		cooldowns = {}, busy = false, dead = false, lastHurt = 0, damageBy = {}, ground = at.Position.Y,
		center = arena.center, radius = arena.radius, who = o.players,
	}
	states[model] = st
	CreatureSetup.playAction(model, "Roar")
	task.delay(def.introTime, function()
		task.spawn(brain, st)
	end)
	return model
end

function BossService.damage(model: Model, amount: number, from: Player?)
	local st = states[model]
	if not st or st.dead then
		return
	end
	local hp = math.max(0, (model:GetAttribute("HP") :: number) - amount)
	model:SetAttribute("HP", hp)
	if from then
		st.damageBy[from] = (st.damageBy[from] or 0) + amount
	end
	local max = model:GetAttribute("MaxHP") :: number
	if hp <= 0 then
		st.dead = true
		CreatureSetup.playAction(model, "Death")
		send(audience(st), { k = "death", model = model })
		local top, best = nil, 0
		for pl, d in st.damageBy do
			if d > best then
				top, best = pl, d
			end
		end
		local rewards = table.clone(st.def.rewards)
		rewards.coins = math.floor(rewards.coins * Mutations.stat(st.muts, "coins"))
		BossService.Defeated:Fire(model, st.def.species, rewards, top, st.damageBy)
		if not st.who then
			-- not part of a dungeon run: clear the body away after the death pose
			task.delay(8, function()
				BossService.despawn(model)
			end)
		end
		return
	end
	if (model:GetAttribute("Phase") or 1) < 2 and hp <= max * st.def.phase2At then
		-- phase 2: interrupts whatever it was doing to enrage
		model:SetAttribute("Phase", 2)
		st.busy = true
		CreatureSetup.playAction(model, "Enrage")
		send(audience(st), { k = "enrage", model = model })
		send(audience(st), { k = "shake", pos = model:GetPivot().Position, amount = 1.2 })
		task.delay(st.style.dur.Enrage or 3, function()
			st.busy = false
		end)
	elseif not st.busy and os.clock() - st.lastHurt > 2 then
		st.lastHurt = os.clock()
		CreatureSetup.playAction(model, "Hurt")
	end
end

-- remove a boss (dead or not), e.g. when a dungeon run ends
function BossService.despawn(model: Model)
	local st = states[model]
	if st then
		st.dead = true
		states[model] = nil
	end
	model:Destroy()
end

function BossService.get(model: Model): State?
	return states[model]
end

return BossService
