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

	-- Demo: spawns every imported creature in a row near the spawn point in Studio playtests.
	DemoEnabled = true,
	DemoTemplateFolder = { "ServerStorage", "Creatures" }, -- every species model found here gets spawned

	-- Only animate creatures within this distance of the camera.
	AnimateDistance = 220,

	-- One entry per creature. `style` mirrors the species file in tools/art/species
	-- (same keys as Poses/Quadruped.luau). `glow` maps mesh names to Neon colours.
	-- If an imported model faces the wrong way, set yawOffset (degrees around Y).
	Species = {
		Emberfang = {
			element = "Fire",
			style = {},
			glow = {
				Eyes = Color3.fromRGB(255, 210, 63),
				Flame = Color3.fromRGB(255, 94, 20),
				FlameCore = Color3.fromRGB(255, 224, 122),
			},
			light = { bone = "TailFlame", color = Color3.fromRGB(255, 122, 42), brightness = 2.2, range = 14 },
			yawOffset = 0,
		},
		Voltgriff = {
			element = "Storm",
			style = { tip = "TailTip", wings = true, tail = 1.2 },
			glow = {
				Eyes = Color3.fromRGB(134, 247, 255),
				Glow = Color3.fromRGB(63, 220, 255),
				GlowCore = Color3.fromRGB(251, 255, 158),
			},
			light = { bone = "TailTip", color = Color3.fromRGB(95, 216, 255), brightness = 2, range = 14 },
			yawOffset = 0,
		},
		Frostusk = {
			element = "Ice",
			style = {
				tip = "TailTip", attack = "charge",
				dur = { Idle = 3.0, Walk = 1.25, Run = 0.75, Attack = 1.25, Roar = 2.4 },
				walk = { 0.36, 0.55, 0.34, 0.45 }, run = { 0.7, 0.8, 0.65, 0.7 },
				bob = 1.3, roll = 0.05, sway = 1.4, tail = 0.5, headLow = -0.12,
			},
			glow = {
				Eyes = Color3.fromRGB(127, 230, 255),
				Glow = Color3.fromRGB(111, 220, 255),
				GlowCore = Color3.fromRGB(223, 250, 255),
			},
			light = { bone = "Spine", color = Color3.fromRGB(142, 230, 255), brightness = 1.6, range = 16 },
			yawOffset = 0,
		},
		Nyxwing = {
			element = "Shadow",
			style = { tip = "TailTip", wings = true, neck = 1.0, tail = 1.3, sway = 1.2 },
			glow = {
				Eyes = Color3.fromRGB(209, 139, 255),
				Glow = Color3.fromRGB(165, 77, 255),
				GlowCore = Color3.fromRGB(243, 205, 255),
			},
			light = { bone = "TailTip", color = Color3.fromRGB(176, 107, 255), brightness = 2, range = 14 },
			yawOffset = 0,
		},
		Tidefin = {
			element = "Water",
			style = {
				tip = "TailTip", dur = { Walk = 0.85, Run = 0.55 },
				walk = { 0.5, 0.6, 0.45, 0.5 }, run = { 0.8, 0.8, 0.8, 0.8 }, gallop = { 0, 0.06, 0.5, 0.56 },
				sway = 2.2, tail = 1.6, bob = 0.8,
			},
			glow = {
				Eyes = Color3.fromRGB(95, 244, 255),
				Glow = Color3.fromRGB(56, 226, 255),
				GlowCore = Color3.fromRGB(220, 255, 255),
			},
			light = { bone = "TailTip", color = Color3.fromRGB(70, 217, 255), brightness = 1.8, range = 12 },
			yawOffset = 0,
		},
		Mossback = {
			element = "Nature",
			style = {
				tip = "TailTip", attack = "charge",
				dur = { Idle = 2.6, Walk = 0.8, Run = 0.5, Attack = 1.15 },
				walk = { 0.38, 0.5, 0.36, 0.45 }, run = { 0.7, 0.75, 0.7, 0.7 },
				bob = 0.9, roll = 0.035, tail = 0.4, headLow = -0.08,
			},
			glow = {
				Eyes = Color3.fromRGB(194, 255, 99),
				Glow = Color3.fromRGB(168, 255, 79),
				GlowCore = Color3.fromRGB(255, 247, 160),
			},
			light = { bone = "Spine", color = Color3.fromRGB(178, 255, 99), brightness = 1.5, range = 12 },
			yawOffset = 0,
		},
		Blazehorn = {
			element = "Fire",
			style = {
				tip = "TailTip", attack = "charge",
				dur = { Idle = 2.6, Walk = 1.0, Run = 0.6, Attack = 1.1, Roar = 2.2 },
				bob = 1.1, roll = 0.03, tail = 0.6, headLow = -0.1,
			},
			glow = {
				Eyes = Color3.fromRGB(255, 210, 63),
				Glow = Color3.fromRGB(255, 106, 26),
				GlowCore = Color3.fromRGB(255, 211, 107),
			},
			light = { bone = "Head", color = Color3.fromRGB(255, 122, 42), brightness = 1.8, range = 12 },
			yawOffset = 0,
		},
		Sparkit = {
			element = "Storm",
			style = { tip = "TailTip", dur = { Idle = 1.8, Walk = 0.6, Run = 0.38, Attack = 0.8, Roar = 1.8 }, bob = 1.3, tail = 1.5, sway = 1.2 },
			glow = {
				Eyes = Color3.fromRGB(143, 246, 255),
				Glow = Color3.fromRGB(63, 220, 255),
				GlowCore = Color3.fromRGB(251, 255, 158),
			},
			light = { bone = "TailTip", color = Color3.fromRGB(95, 216, 255), brightness = 1.6, range = 10 },
			yawOffset = 0,
		},
		Frostfawn = {
			element = "Ice",
			style = {
				tip = "TailTip", dur = { Idle = 2.8, Walk = 0.9, Run = 0.52, Attack = 1.0, Roar = 2.2 },
				walk = { 0.5, 0.8, 0.45, 0.6 }, run = { 0.95, 1.1, 0.9, 0.9 }, bob = 1.1, tail = 0.5, neck = 0.4,
			},
			glow = {
				Eyes = Color3.fromRGB(159, 240, 255),
				Glow = Color3.fromRGB(95, 208, 244),
				GlowCore = Color3.fromRGB(168, 236, 255),
			},
			light = { bone = "Head", color = Color3.fromRGB(143, 232, 255), brightness = 1.5, range = 12 },
			yawOffset = 0,
		},
		Umbrapaw = {
			element = "Shadow",
			style = { tip = "TailTip", dur = { Idle = 2.6, Walk = 0.95, Run = 0.55, Attack = 0.95, Roar = 2.2 }, walk = { 0.5, 0.75, 0.45, 0.55 }, bob = 0.8, sway = 1.3, tail = 1.4, headLow = -0.06 },
			glow = {
				Eyes = Color3.fromRGB(217, 139, 255),
				Glow = Color3.fromRGB(165, 77, 255),
				GlowCore = Color3.fromRGB(243, 205, 255),
			},
			light = { bone = "TailTip", color = Color3.fromRGB(176, 107, 255), brightness = 1.8, range = 12 },
			yawOffset = 0,
		},
		Shellsnap = {
			element = "Water",
			style = {
				tip = "TailTip", attack = "charge", dur = { Idle = 3.0, Walk = 1.2, Run = 0.75, Attack = 1.2, Roar = 2.4 },
				walk = { 0.4, 0.5, 0.4, 0.45 }, run = { 0.65, 0.7, 0.6, 0.65 }, bob = 0.7, roll = 0.06, sway = 0.6, tail = 0.6,
			},
			glow = {
				Eyes = Color3.fromRGB(111, 244, 255),
				Glow = Color3.fromRGB(56, 226, 255),
			},
			light = { bone = "Spine", color = Color3.fromRGB(56, 226, 255), brightness = 1.5, range = 12 },
			yawOffset = 0,
		},
		Bramblepup = {
			element = "Nature",
			style = { tip = "TailTip", dur = { Idle = 2.0, Walk = 0.7, Run = 0.45, Attack = 0.9, Roar = 2.0 }, bob = 1.4, tail = 1.6, sway = 1.1 },
			glow = {
				Eyes = Color3.fromRGB(200, 255, 106),
				Glow = Color3.fromRGB(168, 255, 79),
				GlowCore = Color3.fromRGB(255, 247, 160),
			},
			light = { bone = "Head", color = Color3.fromRGB(178, 255, 99), brightness = 1.3, range = 10 },
			yawOffset = 0,
		},
	},
}
