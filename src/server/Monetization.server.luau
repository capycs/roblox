--!strict
-- Starts PassService: pass ownership attributes (Pass_<id>) and offer timers (<Id>EndsAt,
-- Owned_<Id>). Grant purchases in your own ProcessReceipt and call PassService.grantOffer there.
require(script.Parent:WaitForChild("PassService")).start()
