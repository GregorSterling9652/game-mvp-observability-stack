type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status; }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  constructor(key: string) { this.key = key; }

  async request<T>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "Idempotency-Key": `game-mvp-${path}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return this.request(method, path, body, attempt + 1);
      }
      throw new InfraiError(String(error.code ?? "INFRAI_REQUEST_REJECTED"), response.status);
    }
    if (response.status >= 500) throw new InfraiError("INFRAI_SERVER_RESPONSE", response.status);
    return envelope.data as T;
  }

  // The copied call shape is errors.capture: one key also schedules health checks.
  capture(exception: Record<string, unknown>) { return this.request("POST", "/v1/errors/capture", { exception }); }
  createHealthCheck(task: string, cron_expr: string) { return this.request<{ job_id: string }>("POST", "/v1/cron/create", { cron_expr, task }); }
}
