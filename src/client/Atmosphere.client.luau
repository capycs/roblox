--!strict
-- Zone-based lighting and ambience. Finds which Zones part the camera is inside, blends
-- Lighting/Atmosphere/grade/bloom/sun rays to that preset, swaps the skybox and keeps
-- the preset's ambient particles (wind streaks, leaves, motes, snow, rain...) around
-- the camera. Also sets Workspace.GlobalWind from the wind config.

local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Atmosphere"):WaitForChild("AtmosphereConfig"))
local Effects = require(Shared:WaitForChild("Fx"):WaitForChild("Effects"))
local AssetIds = require(Shared:WaitForChild("AssetIds"))

local windDir = Config.Wind.direction.Unit
workspace.GlobalWind = windDir * Config.Wind.speed

local function ensure(className: string, name: string, parent: Instance): Instance
	local x = parent:FindFirstChild(name)
	if not x then
		x = Instance.new(className)
		x.Name = name
		x.Parent = parent
	end
	return x :: Instance
end
local atmosphere = ensure("Atmosphere", "EggnappersAtmosphere", Lighting) :: Atmosphere
local grade = ensure("ColorCorrectionEffect", "EggnappersGrade", Lighting) :: ColorCorrectionEffect
local bloom = ensure("BloomEffect", "EggnappersBloom", Lighting) :: BloomEffect
local sunRays = ensure("SunRaysEffect", "EggnappersSunRays", Lighting) :: SunRaysEffect

local skies: { [string]: Sky } = {}
local function skyFor(name: string): Sky?
	if skies[name] then
		return skies[name]
	end
	local ids = AssetIds.Sky[name]
	if not ids or not AssetIds.get(ids.Ft) then
		return nil
	end
	local s = Instance.new("Sky")
	s.Name = "EggnappersSky" .. name
	s.SkyboxBk, s.SkyboxDn, s.SkyboxFt = ids.Bk, ids.Dn, ids.Ft
	s.SkyboxLf, s.SkyboxRt, s.SkyboxUp = ids.Lf, ids.Rt, ids.Up
	s.CelestialBodiesShown = false -- the sun is painted into the skybox
	s.StarCount = 0
	skies[name] = s
	return s
end

-- Ambient hosts: a box that follows the camera, oriented down-wind.
local fxFolder = ensure("Folder", "AtmosphereFx", workspace)
local HOSTS = {
	Wind = { size = Vector3.new(140, 50, 20), offset = Vector3.new(0, 10, 0), upwind = 70 },
	WindLeaves = { size = Vector3.new(100, 30, 10), offset = Vector3.new(0, 4, 0), upwind = 50 },
	Pollen = { size = Vector3.new(80, 20, 10), offset = Vector3.new(0, 2, 0), upwind = 40 },
	Motes = { size = Vector3.new(60, 20, 60), offset = Vector3.new(0, 4, 0), upwind = 0 },
	Rain = { size = Vector3.new(140, 2, 140), offset = Vector3.new(0, 45, 0), upwind = 0, vertical = true },
	CloudLayer = { size = Vector3.new(700, 30, 40), offset = Vector3.new(0, -70, 0), upwind = 350 },
	FogSheet = { size = Vector3.new(120, 4, 120), offset = Vector3.new(0, -2, 0), upwind = 0 },
}
type Active = { handle: Effects.Handle, host: BasePart?, def: any }
local active: { [string]: Active } = {}

local function startAmbient(name: string)
	if active[name] or not Effects.Presets[name] then
		return
	end
	local def = HOSTS[name]
	local preset = Effects.Presets[name]
	local size = def and def.size or (preset.emitters[1].shapeSize :: Vector3?) or Vector3.new(100, 4, 100)
	local host = Instance.new("Part")
	host.Name = name
	host.Anchored, host.CanCollide, host.CanQuery, host.CanTouch, host.CastShadow = true, false, false, false, false
	host.Transparency = 1
	host.Size = size
	host.Parent = fxFolder
	active[name] = { handle = Effects.attach(name, host), host = host, def = def or { offset = Vector3.new(0, 6, 0), upwind = 0 } }
end
local function stopAmbient(name: string)
	local a = active[name]
	if a then
		a.handle:Stop()
		if a.host then
			game:GetService("Debris"):AddItem(a.host, 8)
		end
		active[name] = nil
	end
end

local current: string? = nil
local function apply(name: string, instant: boolean)
	local p = Config.Presets[name]
	if not p then
		return
	end
	current = name
	local info = TweenInfo.new(if instant then 0 else Config.BlendSeconds, Enum.EasingStyle.Sine)
	TweenService:Create(Lighting, info, p.lighting):Play()
	TweenService:Create(atmosphere, info, p.atmosphere):Play()
	TweenService:Create(grade, info, p.grade):Play()
	TweenService:Create(bloom, info, p.bloom):Play()
	TweenService:Create(sunRays, info, p.sunRays):Play()
	local sky = skyFor(p.sky)
	if sky then
		for _, s in skies do
			s.Parent = if s == sky then Lighting else nil
		end
	end
	local want = {}
	for _, n in p.ambient do
		want[n] = true
		startAmbient(n)
	end
	for n in active do
		if not want[n] then
			stopAmbient(n)
		end
	end
end

local function zoneAt(pos: Vector3): string
	local folder = workspace:FindFirstChild(Config.ZonesFolder)
	local best, bestVol = Config.Default, math.huge
	if folder then
		for _, z in folder:GetChildren() do
			if z:IsA("BasePart") and Config.Presets[z.Name] then
				local lp = z.CFrame:PointToObjectSpace(pos)
				local h = z.Size / 2
				if math.abs(lp.X) <= h.X and math.abs(lp.Y) <= h.Y and math.abs(lp.Z) <= h.Z then
					local vol = z.Size.X * z.Size.Y * z.Size.Z
					if vol < bestVol then
						best, bestVol = z.Name, vol
					end
				end
			end
		end
	end
	return best
end

apply(Config.Default, true)
local checkTimer = 0
RunService.RenderStepped:Connect(function(dt)
	local cam = workspace.CurrentCamera
	if not cam then
		return
	end
	local pos = cam.CFrame.Position
	checkTimer += dt
	if checkTimer > 0.5 then
		checkTimer = 0
		local z = zoneAt(pos)
		if z ~= current then
			apply(z, false)
		end
	end
	for _, a in active do
		local host = a.host
		if host then
			local base = pos + a.def.offset - windDir * (a.def.upwind or 0)
			host.CFrame = if a.def.vertical then CFrame.new(base) else CFrame.lookAt(base, base + windDir)
		end
	end
end)
