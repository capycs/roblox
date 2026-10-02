--!strict
-- Lighting + ambience per area. Put invisible Parts named after a preset (e.g. "Frost")
-- inside Workspace/Zones; when the camera is inside one, the client blends to that
-- preset. Outside every zone it uses Default. All numbers here are safe to tweak.

local C = Color3.fromRGB

return {
	ZonesFolder = "Zones",
	Default = "Haven",
	BlendSeconds = 2.5,

	-- Wind for swaying props, wind particles and Roblox's own GlobalWind (studs/sec).
	Wind = { direction = Vector3.new(1, 0, 0.35), speed = 18 },

	-- Cartoon outlines (Outlines.client). Roblox only draws ~31 Highlights at once, so the
	-- nearest tagged models get one (creatures and players first).
	Outlines = {
		Color = Color3.fromRGB(26, 16, 34),
		Thickness = 0, -- OutlineTransparency (0 = solid)
		MaxHighlights = 28,
		MaxDistance = 220, -- studs from the camera
		Tags = { "Creature", "Outline" }, -- Creature: CreatureSetup, Outline: PropSetup
		Players = true, -- outline player characters too
		PriorityBoost = { Creature = 0.5, Player = 0.4 }, -- distance multiplier (lower = picked first)
	},

	-- Anime wind swirls (WindSwirls.client). Tag island Parts/Models with IslandTag so the
	-- swirls appear over them; per-zone frequency/colour is the `swirls` field below.
	WindSwirls = {
		IslandTag = "SkyIsland",
		MaxActive = 5, -- simultaneous gusts (each is 1-3 Trails)
		MaxDistance = 260, -- only islands this close to the camera
		HeightAbove = NumberRange.new(3, 16), -- studs above the island's top
		CameraRadius = NumberRange.new(25, 80), -- fallback when no island is near
	},

	Presets = {
		Haven = {
			sky = "Day",
			lighting = { ClockTime = 14.5, Brightness = 3, ExposureCompensation = 0.1, Ambient = C(120, 110, 130), OutdoorAmbient = C(150, 150, 170), ColorShift_Top = C(255, 240, 220), ShadowSoftness = 0.3 },
			atmosphere = { Density = 0.28, Offset = 0.2, Color = C(199, 225, 255), Decay = C(120, 150, 200), Glare = 0.3, Haze = 1.2 },
			grade = { Brightness = 0.02, Contrast = 0.12, Saturation = 0.18, TintColor = C(255, 250, 244) },
			bloom = { Intensity = 0.6, Size = 28, Threshold = 1.4 },
			sunRays = { Intensity = 0.08, Spread = 0.7 },
			ambient = { "Wind", "WindLeaves", "Motes", "CloudLayer" },
			swirls = { every = NumberRange.new(0.8, 2.2), color = C(255, 255, 255), strength = 1 },
		},
		Verdant = {
			sky = "Day",
			lighting = { ClockTime = 15.5, Brightness = 2.8, ExposureCompensation = 0, Ambient = C(110, 125, 105), OutdoorAmbient = C(140, 160, 135), ColorShift_Top = C(255, 245, 210), ShadowSoftness = 0.35 },
			atmosphere = { Density = 0.33, Offset = 0.1, Color = C(200, 230, 200), Decay = C(110, 150, 110), Glare = 0.2, Haze = 1.6 },
			grade = { Brightness = 0.01, Contrast = 0.1, Saturation = 0.25, TintColor = C(250, 255, 240) },
			bloom = { Intensity = 0.7, Size = 30, Threshold = 1.3 },
			sunRays = { Intensity = 0.12, Spread = 0.8 },
			ambient = { "Wind", "WindLeaves", "Pollen", "BiomeFireflies" },
			swirls = { every = NumberRange.new(1.2, 3), color = C(240, 255, 235), strength = 0.9 },
		},
		Ember = {
			sky = "Dusk",
			lighting = { ClockTime = 17.2, Brightness = 2.4, ExposureCompensation = 0, Ambient = C(140, 90, 80), OutdoorAmbient = C(160, 100, 80), ColorShift_Top = C(255, 170, 120), ShadowSoftness = 0.2 },
			atmosphere = { Density = 0.4, Offset = 0.05, Color = C(255, 160, 120), Decay = C(120, 50, 40), Glare = 0.5, Haze = 2.2 },
			grade = { Brightness = 0, Contrast = 0.18, Saturation = 0.15, TintColor = C(255, 232, 220) },
			bloom = { Intensity = 0.9, Size = 32, Threshold = 1.1 },
			sunRays = { Intensity = 0.1, Spread = 0.6 },
			ambient = { "BiomeEmbers", "Wind" },
			swirls = { every = NumberRange.new(2.5, 5), color = C(255, 214, 170), strength = 1.1 },
		},
		Frost = {
			sky = "Day",
			lighting = { ClockTime = 13, Brightness = 3.2, ExposureCompensation = 0.15, Ambient = C(130, 145, 170), OutdoorAmbient = C(170, 185, 210), ColorShift_Top = C(220, 235, 255), ShadowSoftness = 0.4 },
			atmosphere = { Density = 0.45, Offset = 0.25, Color = C(215, 230, 250), Decay = C(150, 170, 210), Glare = 0.4, Haze = 2.4 },
			grade = { Brightness = 0.03, Contrast = 0.08, Saturation = 0, TintColor = C(240, 248, 255) },
			bloom = { Intensity = 0.7, Size = 30, Threshold = 1.3 },
			sunRays = { Intensity = 0.06, Spread = 0.5 },
			ambient = { "BiomeSnow", "Wind", "FogSheet" },
			swirls = { every = NumberRange.new(0.7, 1.8), color = C(225, 242, 255), strength = 1.2 },
		},
		Storm = {
			sky = "Dusk",
			lighting = { ClockTime = 16, Brightness = 1.8, ExposureCompensation = -0.1, Ambient = C(90, 100, 130), OutdoorAmbient = C(100, 115, 150), ColorShift_Top = C(190, 210, 255), ShadowSoftness = 0.5 },
			atmosphere = { Density = 0.5, Offset = 0.1, Color = C(150, 165, 200), Decay = C(70, 80, 120), Glare = 0.1, Haze = 2.6 },
			grade = { Brightness = -0.02, Contrast = 0.2, Saturation = -0.05, TintColor = C(225, 235, 255) },
			bloom = { Intensity = 1, Size = 34, Threshold = 1.1 },
			sunRays = { Intensity = 0.02, Spread = 0.3 },
			ambient = { "Rain", "BiomeSparks", "Wind" },
			swirls = { every = NumberRange.new(0.4, 1.1), color = C(215, 230, 255), strength = 1.5 },
		},
		Tide = {
			sky = "Day",
			lighting = { ClockTime = 11, Brightness = 3, ExposureCompensation = 0.05, Ambient = C(100, 130, 150), OutdoorAmbient = C(130, 170, 190), ColorShift_Top = C(230, 250, 255), ShadowSoftness = 0.3 },
			atmosphere = { Density = 0.32, Offset = 0.15, Color = C(190, 235, 245), Decay = C(90, 160, 190), Glare = 0.3, Haze = 1.5 },
			grade = { Brightness = 0.02, Contrast = 0.1, Saturation = 0.2, TintColor = C(240, 255, 255) },
			bloom = { Intensity = 0.7, Size = 28, Threshold = 1.3 },
			sunRays = { Intensity = 0.1, Spread = 0.7 },
			ambient = { "BiomeBubbles", "Wind", "Motes" },
			swirls = { every = NumberRange.new(1.2, 2.8), color = C(225, 255, 255), strength = 1 },
		},
		Shadow = {
			sky = "Dusk",
			lighting = { ClockTime = 18.6, Brightness = 1.6, ExposureCompensation = 0, Ambient = C(90, 70, 120), OutdoorAmbient = C(100, 80, 140), ColorShift_Top = C(200, 160, 255), ShadowSoftness = 0.4 },
			atmosphere = { Density = 0.5, Offset = 0.05, Color = C(140, 110, 190), Decay = C(60, 40, 100), Glare = 0.2, Haze = 2.4 },
			grade = { Brightness = -0.02, Contrast = 0.2, Saturation = 0.1, TintColor = C(235, 225, 255) },
			bloom = { Intensity = 1.1, Size = 36, Threshold = 1 },
			sunRays = { Intensity = 0.04, Spread = 0.4 },
			ambient = { "BiomeWisps", "Motes", "FogSheet" },
			swirls = { every = NumberRange.new(2, 4.5), color = C(214, 170, 255), strength = 0.8 },
		},
	},
}
