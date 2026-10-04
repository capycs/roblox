--!strict
-- Copies the imported creature models (ServerStorage/Creatures) to ReplicatedStorage/CreatureModels
-- so clients can render live 3D creatures inside the UI (Premium.creature: shop offers, hatch
-- reveal). Raw copies: the client prepares its own clone. Off with CreatureConfig.UIModels = false.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Creatures"):WaitForChild("CreatureConfig"))
if not Config.UIModels then
	return
end

local source = ServerStorage:FindFirstChild("Creatures")
if not source then
	return
end
local dest = Instance.new("Folder")
dest.Name = "CreatureModels"
for _, m in source:GetChildren() do
	if m:IsA("Model") and Config.Species[m.Name] then
		m:Clone().Parent = dest
	end
end
dest.Parent = ReplicatedStorage
