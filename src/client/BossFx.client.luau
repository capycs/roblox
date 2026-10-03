--!strict
-- Client half of boss fights: ground telegraphs, attack effects, the fire breath stream from the
-- jaw, falling meteors, camera shake, the volcano aura (stronger in phase 2) and a boss HP bar
-- at the top of the screen while you're near a boss. Driven by BossService over "BossEvent"
-- and the Boss/HP/MaxHP/Phase/DisplayName attributes on the model.

local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Effects = require(Shared.Fx.Effects)
local Telegraph = require(Shared.Fx.Telegraph)
local BossConfig = require(Shared.Creatures.BossConfig)
local event = ReplicatedStorage:WaitForChild("BossEvent") :: RemoteEvent

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

-- ---------- camera shake (decaying, distance-scaled) ----------
local shakeAmount = 0
RunService:BindToRenderStep("BossShake", Enum.RenderPriority.Camera.Value + 1, function(dt)
	if shakeAmount > 0.01 then
		local t = os.clock() * 40
		local a = shakeAmount * 0.35
		camera.CFrame = camera.CFrame * CFrame.Angles(math.noise(t, 1) * a * 0.05, math.noise(t, 2) * a * 0.05, 0) + Vector3.new(math.noise(t, 3), math.noise(t, 4), 0) * a
		shakeAmount = math.max(0, shakeAmount - dt * 2.5)
	end
end)
local function shake(pos: Vector3, amount: number)
	local ch = player.Character
	local root = ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart?
	local d = if root then (root.Position - pos).Magnitude else 0
	shakeAmount = math.max(shakeAmount, amount * math.clamp(1 - d / 90, 0, 1))
end

-- ---------- meteors ----------
local function meteor(pos: Vector3, land: number)
	local fall = math.min(0.9, land)
	task.delay(math.max(0, land - fall), function()
		local start = pos + Vector3.new(math.random(-12, 12), 60, math.random(-12, 12))
		local rock = Instance.new("Part")
		rock.Shape = Enum.PartType.Ball
		rock.Size = Vector3.new(3, 3, 3)
		rock.Material = Enum.Material.Neon
		rock.Color = Color3.fromRGB(255, 120, 40)
		rock.Anchored, rock.CanCollide, rock.CanQuery, rock.CanTouch = true, false, false, false
		rock.Position = start
		rock.Parent = workspace
		local trail = Effects.attach("BossMeteorTrail", rock)
		TweenService:Create(rock, TweenInfo.new(fall, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = pos }):Play()
		task.delay(fall, function()
			trail:Stop()
			rock:Destroy()
			Effects.burst("BossMeteorImpact", pos)
		end)
	end)
end

event.OnClientEvent:Connect(function(msg: any)
	local k = msg.k
	if k == "tele" then
		Telegraph.show(msg.shape, msg.cf, msg.size, msg.dur)
	elseif k == "fx" then
		Effects.burst(msg.name, msg.target)
	elseif k == "shake" then
		shake(msg.pos, msg.amount)
	elseif k == "breath" then
		local model = msg.model :: Model?
		local jaw = model and model:FindFirstChild("Jaw", true)
		if jaw and jaw:IsA("Attachment") then
			Effects.attach(msg.effect, jaw, { duration = msg.dur })
		end
	elseif k == "meteor" then
		meteor(msg.pos, msg.land)
	elseif k == "enrage" then
		local model = msg.model :: Model?
		if model then
			Effects.burst("BossEnrage", model:GetPivot().Position)
		end
	elseif k == "death" then
		local model = msg.model :: Model?
		if model then
			task.delay(1.6, function()
				Effects.burst("BossDeath", model:GetPivot().Position)
				shake(model:GetPivot().Position, 1)
			end)
		end
	end
end)

-- ---------- volcano aura on each boss (rate x1.8 in phase 2) ----------
local auras: { [Model]: Effects.Handle } = {}
local function setAura(model: Model)
	if auras[model] then
		auras[model]:Stop()
	end
	local def = BossConfig.Bosses[model:GetAttribute("Boss") :: string]
	if not def then
		return
	end
	local host = model:FindFirstChild("MagmaOrbit", true) or model.PrimaryPart
	if host and (host:IsA("Attachment") or host:IsA("BasePart")) then
		auras[model] = Effects.attach(def.aura, host :: any, { scale = if (model:GetAttribute("Phase") or 1) >= 2 then 1.8 else 1 })
	end
end
local function track(inst: Instance)
	if not inst:IsA("Model") then
		return
	end
	setAura(inst)
	inst:GetAttributeChangedSignal("Phase"):Connect(function()
		setAura(inst)
	end)
end
for _, m in CollectionService:GetTagged(BossConfig.Tag) do
	track(m)
end
CollectionService:GetInstanceAddedSignal(BossConfig.Tag):Connect(track)
CollectionService:GetInstanceRemovedSignal(BossConfig.Tag):Connect(function(inst)
	local m = inst :: Model
	if auras[m] then
		auras[m]:Stop()
		auras[m] = nil
	end
end)

-- ---------- boss HP bar ----------
local gui = Instance.new("ScreenGui")
gui.Name = "BossBar"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Enabled = false
gui.Parent = player:WaitForChild("PlayerGui")
local frame = Instance.new("Frame")
frame.AnchorPoint = Vector2.new(0.5, 0)
frame.Position = UDim2.new(0.5, 0, 0, 52)
frame.Size = UDim2.new(0.6, 0, 0, 30)
frame.BackgroundColor3 = Color3.fromRGB(30, 18, 20)
frame.Parent = gui
Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 12)
local stroke = Instance.new("UIStroke", frame)
stroke.Thickness = 3
stroke.Color = Color3.fromRGB(20, 8, 8)
Instance.new("UISizeConstraint", frame).MaxSize = Vector2.new(720, 30)
local fill = Instance.new("Frame")
fill.BackgroundColor3 = Color3.fromRGB(255, 96, 40)
fill.Size = UDim2.fromScale(1, 1)
fill.Parent = frame
Instance.new("UICorner", fill).CornerRadius = UDim.new(0, 12)
local grad = Instance.new("UIGradient", fill)
grad.Color = ColorSequence.new(Color3.fromRGB(255, 200, 80), Color3.fromRGB(255, 60, 30))
local label = Instance.new("TextLabel")
label.BackgroundTransparency = 1
label.Size = UDim2.new(1, 0, 0, 28)
label.Position = UDim2.new(0, 0, 0, -30)
label.FontFace = Font.new("rbxasset://fonts/families/FredokaOne.json")
label.TextScaled = true
label.TextColor3 = Color3.new(1, 1, 1)
label.TextStrokeTransparency = 0.2
label.Parent = frame
local phaseLabel = Instance.new("TextLabel")
phaseLabel.BackgroundTransparency = 1
phaseLabel.Size = UDim2.fromScale(1, 1)
phaseLabel.FontFace = Font.new("rbxasset://fonts/families/FredokaOne.json")
phaseLabel.TextScaled = true
phaseLabel.TextColor3 = Color3.new(1, 1, 1)
phaseLabel.TextStrokeTransparency = 0.3
phaseLabel.Parent = frame

RunService.Heartbeat:Connect(function()
	local ch = player.Character
	local root = ch and ch:FindFirstChild("HumanoidRootPart") :: BasePart?
	local show: Model? = nil
	if root then
		for _, m in CollectionService:GetTagged(BossConfig.Tag) do
			local def = BossConfig.Bosses[(m :: Model):GetAttribute("Boss") :: string]
			if def and ((m :: Model):GetPivot().Position - root.Position).Magnitude <= def.aggroRange then
				show = m :: Model
				break
			end
		end
	end
	gui.Enabled = show ~= nil
	if show then
		local hp, max = show:GetAttribute("HP") or 0, show:GetAttribute("MaxHP") or 1
		fill.Size = fill.Size:Lerp(UDim2.fromScale(math.clamp(hp / max, 0, 1), 1), 0.2)
		label.Text = show:GetAttribute("DisplayName") or show.Name
		local enraged = (show:GetAttribute("Phase") or 1) >= 2
		phaseLabel.Text = if hp <= 0 then "DEFEATED" elseif enraged then "ENRAGED" else ""
		stroke.Color = if enraged then Color3.fromRGB(255, 60, 30) else Color3.fromRGB(20, 8, 8)
	end
end)
