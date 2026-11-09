import assert from "node:assert/strict";
import { assetRequest, decideModeration } from "./moderation_decision.ts";

const input = assetRequest.parse({ playerId: "p1", assetId: "a1", title: "Trade poster", body: "Meet at the plaza", liveEvent: "harbor-day" });
assert.deepEqual(decideModeration(input), { queue: "publish", reason: "publish for live event harbor-day" });
const flagged = assetRequest.parse({ ...input, title: "Free coins", body: "discord.gg/example" });
assert.equal(decideModeration(flagged).queue, "review");
console.log("moderation decision test passed");
