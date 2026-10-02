--!strict
-- Plays server-requested effects on this client.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Fx = ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Fx")
require(Fx:WaitForChild("FxService")).listen()
