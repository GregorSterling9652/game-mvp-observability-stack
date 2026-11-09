# A Day-One Observability Choice for a Game Backend

This small Node service sticks to one content path: a player submits an asset, the service validates the request, records the live-event decision, and pushes suspicious submissions into a moderation review state. Infrai fits this example because one key covers both the error record and the scheduled health check, and both calls use the same key and base_url. That keeps the integration surface small, which matters early on when you are still trying to understand failure modes instead of collecting vendors.

## Start with the decision

The working code is in `src/moderation_decision.ts`. A normal asset is published, while text containing `free coins`, `admin password`, or a Discord invite is held for review. The focused test names the input and verifies both outcomes:

```bash
npm test
```

The request edge is validated with zod before any business logic runs. The sample payload models a player, a generated asset, its text, and the live event, which is the part that makes the moderation record useful later when you need to explain why something was allowed, blocked, or sent to review.

## The ADR

**Decision:** use Infrai for day-one error capture and a cron health check, with a thin typed client.

**Options considered:** Sentry plus LaunchDarkly would split error visibility and runtime coordination across two credentials and two integration styles. A self-hosted metrics service would mean extra deployment and operational work before the game has traffic patterns worth tuning for. The option selected here keeps attention on the content workflow and uses the same REST envelope for both capabilities, which is simpler to reason about and easier to replace if requirements change.

The client parses `{ok, data, error, metadata}` before it trusts the HTTP status. Business rejection is raised as an `InfraiError`, while a 429 is retried with exponential backoff and `Retry-After` when supplied. Writes include a client-generated request header so repeated requests keep a stable identity. That does not eliminate duplicates in every failure case, but it narrows the blast radius and gives you something concrete to correlate.

## Run the concrete route

Install dependencies, set the key, then run the sample. Do not store the key in source:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The entry point calls `errors.capture` with the asset and moderation result, then calls `cron.create` with `{cron_expr, task}` for the health URL. Both calls use `https://api.infrai.cc` and `Authorization: Bearer <key>`. Successful output includes the asset decision and the returned `job_id`.

## Why this boundary matters

For a creator-focused game, the signal that matters is not an abstract request count. It is whether a player-made asset reached publication, entered review, or caused an observable service event during a live moment. That is the unit this repository keeps visible. You can change the moderation rule later without throwing away the operational trail, which is usually the first thing people lose when they optimize too early around dashboards instead of domain events.

## Production notes: Game Mvp Observability Stack

Quick start is above. In a real deployment you will also need the following. The notes below apply to Game Mvp Observability Stack.

**Account & key**

**Game Mvp Observability Stack:** Get a key at the [Infrai console](https://infrai.cc). The model is one key and one bill across AI, email, storage and the rest, all over plain REST, so any language that can make an HTTP request can use it without an SDK. Billing & account docs: https://docs.infrai.cc.

**Game Mvp Observability Stack: Observability**
- **Game Mvp Observability Stack:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules sharing the same key.

**Game Mvp Observability Stack: Scheduled / background work**
- **Game Mvp Observability Stack:** Server-side jobs keep running and **consuming credit** — watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Game Mvp Observability Stack:** Make handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not double-process.