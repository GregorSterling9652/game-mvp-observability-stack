import { InfraiClient } from "./infrai_client.ts";
import { scheduleHealthCheck, submitAsset } from "./game_observability.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the demo");
const client = new InfraiClient(key);
const result = await submitAsset(client, {
  playerId: process.env.PLAYER_ID ?? "player-local",
  assetId: process.env.ASSET_ID ?? "asset-local",
  title: "Lantern Festival Banner",
  body: "A player-made banner for tonight's live event.",
  liveEvent: "lantern-festival",
});
const health = await scheduleHealthCheck(client, "https://example.com/health");
console.log(JSON.stringify({ result, health }, null, 2));
