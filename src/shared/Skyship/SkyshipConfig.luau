--!strict
-- Tunable numbers for the Haven <-> Wilds skyship.
-- The Wilds were replaced by boss runs (DungeonService), so the skyship is off. Set Enabled = true
-- to bring the ferry back; the Skyship model can still sit in Haven as decoration either way.

return {
	Enabled = false,

	BoardingSeconds = 60, -- time docked at Haven with the ramp open
	FlightSeconds = 8, -- departure flight before passengers arrive in the Wilds
	ReturnSeconds = 6, -- ship flying back in to the dock
	MaxPassengers = 12,

	-- Where things live in the place.
	ShipTemplatePath = { "ServerStorage", "Props", "Skyship" }, -- imported Skyship model
	DockMarker = "SkyshipDock", -- a Part in Workspace: the ship's pivot is placed here
	WildsDropMarker = "WildsDrop", -- a Part in Workspace where passengers land (local mode)

	-- Real place teleport. Leave 0 to use local mode (the Wilds built far away in the
	-- same place). Teleports never work in Studio playtests, so Studio always uses local mode.
	WildsPlaceId = 0,

	-- Departure path relative to the dock (studs): climb, then fly forward out of view.
	DepartOffset = Vector3.new(0, 60, -320),
}
