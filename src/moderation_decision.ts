import { z } from "zod";

export const assetRequest = z.object({
  playerId: z.string().min(1),
  assetId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  liveEvent: z.string().min(1),
});
export type AssetRequest = z.infer<typeof assetRequest>;

export type ModerationDecision = { queue: "review" | "publish"; reason: string };

export function decideModeration(input: AssetRequest): ModerationDecision {
  const suspicious = /free coins|admin password|discord\.gg/i.test(`${input.title} ${input.body}`);
  return suspicious
    ? { queue: "review", reason: "content needs a moderator before publication" }
    : { queue: "publish", reason: `publish for live event ${input.liveEvent}` };
}
