--!strict
-- One poses module per species, built from its style in CreatureConfig and cached. style.body
-- picks the pose set: four legs (default), two legs (arms, wings or hovering), a fish, or a boss.
-- Used by CreatureAnimation.client (world creatures) and Premium.creature (3D previews in UI).

local Config = require(script.Parent.CreatureConfig)
local Poses = script.Parent:WaitForChild("Poses")
local BODIES: { [string]: any } = {
	quad = require(Poses:WaitForChild("Quadruped")),
	biped = require(Poses:WaitForChild("Biped")),
	fish = require(Poses:WaitForChild("Fish")),
	boss = require(Poses:WaitForChild("Boss")),
}

local cache: { [string]: any } = {}

local PoseSets = {}

function PoseSets.get(species: string): any
	local p = cache[species]
	if not p then
		local def = Config.Species[species]
		assert(def, "Unknown species " .. species)
		p = (BODIES[def.style.body or "quad"] or BODIES.quad).make(def.style)
		cache[species] = p
	end
	return p
end

return PoseSets
