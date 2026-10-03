--!strict
-- Studio test: spawns the boss at Workspace/BossArena (an anchored Part) when the model has
-- been imported into ServerStorage/Creatures. Respawns 20 seconds after it is defeated.
-- Damage it from the command bar to see phase 2 and the death:
--   require(game.ServerScriptService.Server.BossService).damage(workspace.Pyrothrax, 5000)
-- Turn off with BossConfig.DemoEnabled = false.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local BossConfig = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures"):WaitForChild("BossConfig"))
local BossService = require(script.Parent:WaitForChild("BossService"))

if not BossConfig.DemoEnabled then
	return
end
local arena = workspace:FindFirstChild("BossArena")
if not arena or not arena:IsA("BasePart") then
	return -- no arena marker in this place: nothing to do
end

local function spawnBoss()
	BossService.spawn("Pyrothrax", CFrame.new(arena.Position + Vector3.new(0, arena.Size.Y / 2, 0)) * arena.CFrame.Rotation)
end
BossService.Defeated.Event:Connect(function()
	task.delay(20, spawnBoss)
end)
spawnBoss()
