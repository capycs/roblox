# Premium UI and monetisation

What makes the shop, offers and big moments feel premium, what was built, and how to make it live.

## What the research says

- **Glass needs a blurred world behind it.** Glassmorphism is translucency, a light rim, a top sheen and a blurred background, layered so panels float. Roblox can't blur behind a UI frame, so the shop blurs the 3D world itself (a Lighting `BlurEffect`) while it's open. Every panel is a tinted translucent body with a gradient rim and a white sheen fading down. That's what makes "transparent" read as glass instead of washed out.
- **3D creatures sell creatures.** A `ViewportFrame` with a `WorldModel` renders the real rigged model in the UI, animated. Keep the number on screen low: transparent overdraw and texture memory hurt phones (over 70% of Roblox players). `CanvasGroup` costs a full texture per group, so it isn't used here.
- **Motion only where the money is.** Light sweeps make an item look premium and clickable. Use them, rotating borders, glints and spinning icons only on purchase surfaces (featured offers, the best-value tier, VIP, buy buttons). Everything else stays still, so the eye goes where you want it.
- **Price ladder and anchoring.** A clear ladder of packs, each a better rate, lets every player find a tier. One tier gets a visually emphasised "Best value" badge. Badges must inform, not mislead, so every "+X% more" here is computed from the price.
- **Starter pack.** A deeply discounted first-purchase bundle, visible from the first session (not gated behind a tutorial), often time-limited. First-time buyers are far more likely to buy again. Benchmarks suggest a 2-10% revenue lift.
- **Odds are mandatory.** Eggs, chests, and luck boosts or other probability modifiers sold for Robux (or for currency bought with Robux) are paid random items. Every possible outcome and its numerical odds must be shown before purchase (a clickable "Info" panel is fine), as percentages that add up to exactly 100%.
- **Touch targets.** At least 44×44 px. The UI is authored at 1280×720 and never scales below 0.55, so the smallest buttons stay tappable.

Sources:
- [Roblox: starter pack design](https://create.roblox.com/docs/production/game-design/starter-pack-design)
- [Roblox: paid random items policy](https://create.roblox.com/docs/production/monetization/paid-random-items)
- [Roblox: UI and UX design](https://create.roblox.com/docs/production/game-design/ui-ux-design)
- [GameAnalytics: make your game UI shine and increase conversions](https://www.gameanalytics.com/blog/how-to-make-your-game-ui-shine-and-increase-conversions)
- [Adrian Crook: psychological pricing tactics for freemium games](https://adriancrook.com/5-psychological-pricing-tactics-for-freemium-games/)
- [DevForum: what is CanvasGroup (memory cost)](https://devforum.roblox.com/t/1797885)

## What was built

### `src/client/UI/Premium.luau` (the premium layer on top of Kit)

| Function | What it does |
|---|---|
| `glass(props)` | Frosted panel: tinted translucent body, gradient rim, top sheen, soft shadow |
| `blur(on)` | Blurs the 3D world behind open premium windows (reference-counted) |
| `modal(parent, props)` | Glass window with a spinning icon, gradient title, close button and blur |
| `animatedStroke(obj, colors)` | Rotating gradient border. Presets: `Premium.Glass.Gold`, `.Gem`, `.Rainbow` |
| `shine(obj, period)` | Diagonal light sweep every few seconds |
| `ribbon(parent, text, color)` | Corner ribbon ("BEST VALUE", "ONE TIME") with a slow pulse |
| `badge(parent, text, color)` | Pill badge ("+47% MORE", "OWNED") |
| `sparkles(parent, n)` | Twinkling four-point glints that hop around the frame |
| `countdown(label, endsAt)` | Live countdown to a **server** timestamp. Never pass it a made-up end time |
| `spriteIcon(name, size)` | Spinning 3D icon from `AssetIds.Premium` (4×4 spin sheet). Falls back to the still, then a placeholder |
| `creature(species, size, opts)` | Live animated 3D creature in a ViewportFrame. The camera orbits, it plays Idle (and Roar on show), and glow follows mutations. Falls back to the portrait |
| `hover(button)` | Grows on hover, squashes on press |
| `buyButton(props)` | Chunky buy button with sheen and hover |
| `celebrate(gui, text, icon)` | Purchase thank-you: confetti, spinning icon, glass toast |

All animation runs off one shared RenderStepped loop. Anything not on screen is skipped (a closed shop costs nothing).

### Screens

- **Shop** (`Screens/Shop.luau`):
  - **Featured:** the Starter Pack with a live Golden Sparkit, its contents, real time left and an honest worth line ("The gems alone cost R$ 245 separately"). The Boss Hunter Bundle with a live Thalassor and an odds button. A VIP strip.
  - **Gems:** four tiers on a ladder (each taller, with a bigger icon). "+18% / +31% / +47% MORE" is computed. The best rate gets BEST VALUE, a gold rim and a shine; the popular one gets POPULAR.
  - **Passes:** eight glass cards with spinning icons. Lucky Hatch and Mutation Hunter have odds buttons (with vs without the pass).
  - **Eggs:** coin eggs, each with an odds button.
  - Featured and Passes rebuild on every open, so timers and ownership are always current.
- **Offer popup** (`Screens/OfferPopup.luau`):
  - The Starter Pack card, shown 25 seconds after joining, once per session.
  - Only appears while the offer is live and not owned. "Maybe later" always closes it.
  - The live 3D Golden Sparkit sits on a glowing pedestal, with a real countdown.
- **Odds** (`Screens/Odds.luau`):
  - Every creature and mutation with its chance; creature percentages always add up to exactly 100.00%.
  - Covers shop eggs, boss eggs (with the boss's mutations), Lucky Hatch (with vs without), and Mutation Hunter (with vs without).
- **Hatch reveal:** the hatched creature pops out as the live 3D model, roaring, over the rarity disc with rays and sparkles.
- **HUD:**
  - An **Offer** button with the spinning gift icon, gold rim, sparkles and the live timer chip. It disappears when the offer ends or is bought.
  - **VIP** gets the spinning crown.
- **Purchase celebration:** `PromptProductPurchaseFinished` and `PromptGamePassPurchaseFinished` play `Premium.celebrate`.

### Data and server

- `ShopCatalog`:
  - Four gem packs.
  - Eight passes: VIP, Lucky Hatch, 2x Coins, Fast Hatch, Egg Carrier, Boss Key, Mutation Hunter, Triple Hatch.
  - Two offers (Starter Pack 99 R$, Boss Hunter Bundle 399 R$). Each lists exactly what's inside.
- `Shared/Eggs/ShopEggs.luau`:
  - Odds for every coin egg, plus Lucky Hatch (Epic and above ×1.5, mutations ×1.5).
  - `ShopEggs.percentages` rounds so the total is always exactly 100% (largest remainder).
- `BossEggs.hatch(data, rng, extraLuck)`: Mutation Hunter passes `2`.
- `src/server/PassService.luau` (started by `Monetization.server.luau`):
  - Sets `Pass_<id>` attributes from `UserOwnsGamePassAsync`, and again right after a purchase.
  - Publishes `<Offer>EndsAt`. The window starts at the player's **first join** (saved in a DataStore, so rejoining doesn't reset it).
  - Publishes `Owned_<Offer>`.
- Passes already doing something:
  - **Egg Carrier:** +1 egg carry in boss runs.
  - **Boss Key:** +1 bonus egg in the nest when anyone in the party owns it.
- Other passes are attributes for your systems to read:
  - `Pass_Luck`: pass it to `ShopEggs.hatch`.
  - `Pass_MutationHunter`: pass 2 to `BossEggs.hatch`.
  - `Pass_DoubleCoins`, `Pass_FastHatch`, `Pass_TripleHatch`, `Pass_VIP`.
- `CreatureModels.server.luau`: copies `ServerStorage/Creatures` to `ReplicatedStorage/CreatureModels`, so the client can show live 3D creatures. Turn it off with `CreatureConfig.UIModels = false`.

### Icons (`tools/art/props/premium.js`)

14 glossy 3D icons with gold trim, gem accents and sparkle glints, made to read at 64 px:
- Passes: PassVIP, PassLucky, PassDoubleCoins, PassFastHatch, PassExtraCarry, PassBossKey, PassMutation, PassTripleHatch.
- Gems: GemsPouch, GemsPile, GemsChest, GemsVault.
- Offers: OfferStarter, OfferBoss.

Each icon has a transparent still (`assets/v2/icons/<Name>.png`) and a transparent 1024×1024 spin sheet (`<Name>_spin.png`, 4×4 frames, one full turn).

## Make it live

1. **Upload icons:** Asset Manager > Bulk Import `assets/v2/icons/*.png` (stills and `_spin` sheets). Paste the IDs into `AssetIds.Premium` (re-running `npm run asset-ids` keeps them).
2. **Create products:** on the Creator Dashboard, create the developer products (gem packs, Starter Pack, Boss Hunter Bundle) and game passes. Put their IDs in `ShopCatalog` (`productId`, `gamePassId`). Until then, buttons show a "not set up yet" toast.
3. **Grant purchases** in your `ProcessReceipt` (Roblox allows only one per game). Example:

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Catalog = require(game.ReplicatedStorage.Shared.Shop.ShopCatalog)
local PassService = require(game.ServerScriptService.Server.PassService)

MarketplaceService.ProcessReceipt = function(receipt)
	local player = game.Players:GetPlayerByUserId(receipt.PlayerId)
	if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end
	for _, pack in Catalog.GemPacks do
		if pack.productId == receipt.ProductId then
			-- YourData.addGems(player, pack.gems)  (save before returning PurchaseGranted)
			return Enum.ProductPurchaseDecision.PurchaseGranted
		end
	end
	local offer = PassService.offerForProduct(receipt.ProductId)
	if offer then
		-- for each offer.contents: gems / coins / creature (species + mutations) / egg (BossEggs.data(egg, {}))
		if offer.oneTime then PassService.grantOffer(player, offer.id) end
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	return Enum.ProductPurchaseDecision.NotProcessedYet
end
```

4. **Enable DataStores:** turn on Studio access to API services (Game Settings > Security) so offer timers persist. Without it they run from session start, and the Output says so.
5. **Check on a phone emulator:** buttons are tappable, the shop scrolls, and 3D creatures animate in the Featured page and hatch reveal.

## Rules kept

- **No fake urgency:** timers only show a real server end time. With no time set, no timer is shown.
- **Honest labels:** value labels are computed from prices. Offers list exactly what's inside.
- **Odds before purchase** for every random item and every pass that changes odds; percentages sum to exactly 100%.
- **Easy to dismiss:** the popup shows once per session, and "Maybe later" always works.
