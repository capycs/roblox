--!strict
-- Runs boss fights (server). The boss is an anchored creature model moved with PivotTo;
-- the client animator picks Walk/Run from that motion and plays attack clips when we call
-- CreatureSetup.playAction. Every attack: face the target -> telegraph on the ground (fills
-- until the hit) -> clip plays -> damage at the strike frame -> recovery breather.
--
--   local BossService = require(game.ServerScriptService.Server.BossService)
--   local boss = BossService.spawn("Pyrothrax", workspace.BossArena.CFrame)
--   BossService.damage(boss, 500, player)   -- from your combat code / creature abilities
--   BossService.Defeated.Event:Connect(function(boss, name, rewards, topDamage) ... end)
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

local event = ReplicatedStorage:FindFirstChild("BossEvent") :: RemoteEvent?
if not event then
	local e = Instance.new("RemoteEvent")
	e.Name = "BossEvent"
	e.Parent = ReplicatedStorage
	event = e
end
local remote = event :: RemoteEvent

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
}
local states: { [Model]: State } = {}
local rng = Random.new()

local function flat(v: Vector3): Vector3
	return Vector3.new(v.X, 0, v.Z)
end

local function players(): { { player: Player, root: BasePart, hum: Humanoid } }
	local out = {}
	for _, pl in Players:GetPlayers() do
		local ch = pl.Character
		local hum = ch and ch:FindFirstChildOfClass("Humanoid")
		local root = ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart?
		if hum and root and hum.Health > 0 then
			table.insert(out, { player = pl, root = root, hum = hum })
		end
	end
	return out
end

local function nearest(st: State): ({ player: Player, root: BasePart, hum: Humanoid }?, number)
	local pos = st.model:GetPivot().Position
	local best, bd = nil, math.huge
	for _, p in players() do
		local d = flat(p.root.Position - pos).Magnitude
		if d < bd and d <= st.def.aggroRange then
			best, bd = p, d
		end
	end
	return best, bd
end

local function phaseMul(st: State, key: string): number
	local ph = st.model:GetAttribute("Phase") or 1
	if ph >= 2 then
		return if key == "speed" then st.def.phase2Speed else st.def.phase2Damage
	end
	return 1
end

local function hitPlayers(st: State, test: (Vector3) -> boolean, damage: number, knockFrom: Vector3?, knock: number?)
	for _, p in players() do
		if test(p.root.Position) then
			p.hum:TakeDamage(damage)
			if knockFrom and knock and knock > 0 then
				local dir = flat(p.root.Position - knockFrom)
				dir = if dir.Magnitude > 0.01 then dir.Unit else Vector3.new(0, 0, 1)
				p.root.AssemblyLinearVelocity = dir * knock + Vector3.new(0, knock * 0.5, 0)
			end
		end
	end
end

local function faceTarget(st: State, target: Vector3)
	local pv = st.model:GetPivot()
	local look = flat(target - pv.Position)
	if look.Magnitude > 0.1 then
		st.model:PivotTo(CFrame.lookAt(pv.Position, pv.Position + look.Unit))
	end
end

local function shake(pos: Vector3, amount: number?)
	if amount and amount > 0 then
		remote:FireAllClients({ k = "shake", pos = pos, amount = amount })
	end
end

-- one attack, start to finish (runs in its own thread)
local function runAttack(st: State, name: string, atk: BossConfig.Attack, target: Vector3)
	st.busy = true
	st.cooldowns[name] = os.clock() + atk.cooldown * phaseMul(st, "speed")
	faceTarget(st, target)
	local pv = st.model:GetPivot()
	local pos, look = pv.Position, flat(pv.LookVector).Unit
	local clipDur = st.style.dur[atk.clip] or 1.5
	local hitT = atk.hit * clipDur
	local dmg = atk.damage * phaseMul(st, "damage") * Mutations.stat(st.muts, "power")
	local scale = st.model:GetScale()

	CreatureSetup.playAction(st.model, atk.clip)
	if atk.shape == "circle" then
		local c = pos + look * (atk.offset or 0) * scale / BossConfig.Bosses[st.def.species].scale
		remote:FireAllClients({ k = "tele", shape = "circle", cf = CFrame.new(c), size = { radius = atk.radius }, dur = hitT })
		task.wait(hitT)
		if st.dead then return end
		local r = atk.radius or 10
		hitPlayers(st, function(p) return flat(p - c).Magnitude <= r end, dmg, c, atk.knockback)
		remote:FireAllClients({ k = "fx", name = atk.effect, target = c })
		shake(c, atk.shake)
	elseif atk.shape == "ring" then
		remote:FireAllClients({ k = "tele", shape = "ring", cf = CFrame.new(pos), size = { radius = atk.radius }, dur = hitT })
		task.wait(hitT)
		if st.dead then return end
		local r = atk.radius or 10
		hitPlayers(st, function(p) return flat(p - pos).Magnitude <= r end, dmg, pos, atk.knockback)
		remote:FireAllClients({ k = "fx", name = atk.effect, target = pos })
		shake(pos, atk.shake)
	elseif atk.shape == "cone" then
		local mouth = pos + look * 5 * scale / 1.6
		local range, half = atk.range or 20, math.rad((atk.angle or 45) / 2)
		local inCone = function(p: Vector3)
			local d = flat(p - mouth)
			if d.Magnitude > range then return false end
			if d.Magnitude < 2 then return true end
			return math.acos(math.clamp(d.Unit:Dot(look), -1, 1)) <= half
		end
		remote:FireAllClients({ k = "tele", shape = "cone", cf = CFrame.lookAt(mouth, mouth + look), size = { range = range, angle = atk.angle }, dur = hitT })
		task.wait(hitT)
		if st.dead then return end
		if atk.hitEnd then
			local len = (atk.hitEnd - atk.hit) * clipDur
			remote:FireAllClients({ k = "breath", model = st.model, effect = atk.effect, dur = len })
			local t0 = os.clock()
			while os.clock() - t0 < len and not st.dead do
				hitPlayers(st, inCone, dmg)
				task.wait(atk.tick or 0.25)
			end
		else
			hitPlayers(st, inCone, dmg, pos, atk.knockback)
			remote:FireAllClients({ k = "fx", name = atk.effect, target = mouth })
			shake(mouth, atk.shake)
		end
	elseif atk.shape == "rain" then
		-- meteors land near every player in range (plus a few random spots), staggered over the window
		local spots = {}
		for _, p in players() do
			if flat(p.root.Position - pos).Magnitude <= st.def.aggroRange then
				table.insert(spots, flat(p.root.Position) + Vector3.new(0, st.ground, 0))
			end
		end
		while #spots < (atk.count or 6) do
			local a, d = rng:NextNumber() * math.pi * 2, rng:NextNumber(10, 34)
			table.insert(spots, Vector3.new(pos.X + math.cos(a) * d, st.ground, pos.Z + math.sin(a) * d))
		end
		local window = ((atk.hitEnd or atk.hit) - atk.hit) * clipDur
		local r = atk.radius or 8
		for i, c in spots do
			local delayT = hitT + (i - 1) / math.max(1, #spots - 1) * window
			remote:FireAllClients({ k = "tele", shape = "circle", cf = CFrame.new(c), size = { radius = r }, dur = delayT })
			remote:FireAllClients({ k = "meteor", pos = c, land = delayT })
			task.delay(delayT, function()
				if st.dead then return end
				hitPlayers(st, function(p) return flat(p - c).Magnitude <= r end, dmg, c, 30)
				shake(c, atk.shake)
			end)
		end
		task.wait(hitT + window)
	end
	task.wait(math.max(0, clipDur - hitT - 0.2))
	st.busy = false
end

local function pickAttack(st: State, dist: number): (string?, BossConfig.Attack?)
	local phase = st.model:GetAttribute("Phase") or 1
	local now, total = os.clock(), 0
	local pool = {}
	for name, atk in st.def.attacks do
		if atk.phase <= phase and (st.cooldowns[name] or 0) <= now
			and dist >= (atk.minRange or 0) and dist <= (atk.maxRange or math.huge) then
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

local function brain(st: State)
	local nextAttack = os.clock() + 2
	while not st.dead and st.model.Parent do
		local dt = RunService.Heartbeat:Wait()
		if not st.busy then
			local target, dist = nearest(st)
			if target then
				local pv = st.model:GetPivot()
				local to = flat(target.root.Position - pv.Position)
				-- turn toward the target, then walk in until something is in range
				local look = flat(pv.LookVector)
				local want = if to.Magnitude > 0.1 then to.Unit else look
				local ang = math.atan2(look:Cross(want).Y, look:Dot(want))
				local turn = math.clamp(ang, -st.def.turnSpeed * dt, st.def.turnSpeed * dt)
				local cf = pv * CFrame.Angles(0, turn, 0)
				if dist > 14 then
					cf = cf + flat(cf.LookVector).Unit * st.def.moveSpeed * dt
				end
				st.model:PivotTo(cf)
				if os.clock() >= nextAttack and math.abs(ang) < 0.6 then
					local name, atk = pickAttack(st, dist)
					if name and atk then
						task.spawn(runAttack, st, name, atk, target.root.Position)
						local idle = st.def.idleBetween
						nextAttack = os.clock() + 0.2 + rng:NextNumber(idle.Min, idle.Max) * phaseMul(st, "speed")
					end
				end
			end
		else
			nextAttack = math.max(nextAttack, os.clock() + 0.3)
		end
	end
end

function BossService.spawn(name: string, at: CFrame, opts: { mutations: { string }? }?): Model?
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

	local muts = (opts and opts.mutations) or Mutations.roll(rng, def.mutationLuck)
	Mutations.applyServer(model, muts)
	local hp = math.floor(def.hp * Mutations.stat(muts, "hp"))
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

	local st: State = {
		model = model, def = def, style = CreatureConfig.Species[def.species].style, muts = muts,
		cooldowns = {}, busy = false, dead = false, lastHurt = 0, damageBy = {}, ground = at.Position.Y,
	}
	states[model] = st
	CreatureSetup.playAction(model, "Roar")
	task.delay(2.5, function()
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
		remote:FireAllClients({ k = "death", model = model })
		local top, best = nil, 0
		for pl, d in st.damageBy do
			if d > best then
				top, best = pl, d
			end
		end
		local rewards = table.clone(st.def.rewards)
		rewards.coins = math.floor(rewards.coins * Mutations.stat(st.muts, "coins"))
		BossService.Defeated:Fire(model, st.def.species, rewards, top, st.damageBy)
		task.delay(8, function()
			states[model] = nil
			model:Destroy()
		end)
		return
	end
	if (model:GetAttribute("Phase") or 1) < 2 and hp <= max * st.def.phase2At then
		-- phase 2: interrupts whatever it was doing to enrage
		model:SetAttribute("Phase", 2)
		st.busy = true
		CreatureSetup.playAction(model, "Enrage")
		remote:FireAllClients({ k = "enrage", model = model })
		shake(model:GetPivot().Position, 1.2)
		task.delay(st.style.dur.Enrage or 3, function()
			st.busy = false
		end)
	elseif not st.busy and os.clock() - st.lastHurt > 2 then
		st.lastHurt = os.clock()
		CreatureSetup.playAction(model, "Hurt")
	end
end

function BossService.get(model: Model): State?
	return states[model]
end

return BossService
