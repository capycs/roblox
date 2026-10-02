--!strict
-- Tunable numbers for creature visuals and animation.

return {
	-- Locomotion: horizontal speed (studs/sec) thresholds and the speed each clip was authored at.
	WalkThreshold = 0.6,
	RunThreshold = 11,
	WalkReferenceSpeed = 7,
	RunReferenceSpeed = 18,
	PlaybackMin = 0.6,
	PlaybackMax = 1.7,

	-- Blending
	LocomotionBlendRate = 8, -- higher = snappier idle/walk/run crossfades
	ActionFadeIn = 0.08,
	ActionFadeOut = 0.18,
	TurnLeanMax = 4, -- clamp on yaw rate (rad/s) used for lean

	-- Demo: spawns a wandering Emberfang near the spawn point in Studio playtests.
	DemoEnabled = true,
	DemoTemplatePath = { "ServerStorage", "Creatures", "Emberfang" },

	-- Only animate creatures within this distance of the camera.
	AnimateDistance = 220,

	Species = {
		Emberfang = {
			poses = "Emberfang",
			-- Mesh name -> look. Neon meshes glow; texture-mapped Body keeps its palette texture.
			glow = {
				Eyes = Color3.fromRGB(255, 210, 63),
				Flame = Color3.fromRGB(255, 94, 20),
				FlameCore = Color3.fromRGB(255, 224, 122),
			},
			flameLight = { bone = "TailFlame", color = Color3.fromRGB(255, 122, 42), brightness = 2.2, range = 14 },
			-- If the imported model faces the wrong way, rotate it here (degrees around Y).
			yawOffset = 0,
		},
	},
}
