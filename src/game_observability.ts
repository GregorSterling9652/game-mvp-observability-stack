import { InfraiClient } from "./infrai_client.ts";
import { assetRequest, decideModeration } from "./moderation_decision.ts";

export async function submitAsset(client: InfraiClient, raw: unknown) {
  const input = assetRequest.parse(raw);
  const decision = decideModeration(input);
  await client.capture({
    message: "player asset moderation decision",
    level: "info",
    context: { asset: input, decision },
  });
  return { assetId: input.assetId, decision };
}

export async function scheduleHealthCheck(client: InfraiClient, taskUrl: string) {
  return client.createHealthCheck(taskUrl, "*/5 * * * *");
}
