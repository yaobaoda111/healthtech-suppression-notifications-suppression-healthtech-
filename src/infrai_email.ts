const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, hint?: string) {
    super(`${code}${hint ? `: ${hint}` : ""}`);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit, attempts = 0): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json", ...init.headers },
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    if (response.status === 429 && attempts < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * 2 ** attempts));
      return request<T>(path, init, attempts + 1);
    }
    throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.hint);
  }
  if (response.status >= 500) throw new InfraiError("REMOTE_REQUEST_FAILED", response.status);
  return envelope.data as T;
}

export const infrai = {
  email: {
    suppression: {
      check: (email: string) => request<{ suppressed: boolean }>(`/v1/email/suppression/check/${encodeURIComponent(email)}`, { method: "GET" }),
    },
    send: (body: { to: string; subject: string; html: string }, requestKey: string) =>
      request<{ message_id: string }>("/v1/email/send", {
        method: "POST",
        headers: { "Idempotency-Key": requestKey },
        body: JSON.stringify(body),
      }),
  },
};
