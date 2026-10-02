--!strict
-- Server -> clients effect replication. The server says what and where; every client
-- spawns the particles locally (cheap, and keeps effects off the server).
--
-- Server:  FxService.play("FireHit", position, { color = ... })
--          FxService.playFor(player, "Pickup", position)
-- Client:  FxService.listen() once at startup (done by Fx.client.luau).

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local FxService = {}

local function remote(): RemoteEvent
	if RunService:IsServer() then
		local r = ReplicatedStorage:FindFirstChild("FxEvent")
		if not r then
			r = Instance.new("RemoteEvent")
			r.Name = "FxEvent"
			r.Parent = ReplicatedStorage
		end
		return r :: RemoteEvent
	end
	return ReplicatedStorage:WaitForChild("FxEvent") :: RemoteEvent
end

function FxService.play(name: string, target: Vector3 | CFrame | BasePart, opts: { [string]: any }?)
	remote():FireAllClients(name, target, opts)
end

function FxService.playFor(player: Player, name: string, target: Vector3 | CFrame | BasePart, opts: { [string]: any }?)
	remote():FireClient(player, name, target, opts)
end

function FxService.listen()
	local Effects = require(script.Parent.Effects)
	remote().OnClientEvent:Connect(function(name: string, target: any, opts: any)
		if Effects.Presets[name] then
			Effects.burst(name, target, opts)
		end
	end)
end

return FxService
