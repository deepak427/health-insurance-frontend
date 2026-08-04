// All requests go through Next.js rewrite proxy → avoids CORS
const BASE_URL = "/api/backend";
const APP_NAME = "my_agent";

export { BASE_URL, APP_NAME };

export async function createSession(userId: string, sessionId: string) {
  const res = await fetch(
    `${BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
  );
  // 409 = session already exists, which is fine — just reuse it
  if (!res.ok && res.status !== 409) throw new Error("Failed to create session");
  return res.status === 409 ? { reused: true } : res.json();
}

export function buildDownloadUrl(userId: string, sessionId: string, filename: string) {
  return `${BASE_URL}/download/${APP_NAME}/${userId}/${sessionId}/${filename}`;
}

// Direct EC2 URL for cases where proxy streaming might buffer (fallback)
export const DIRECT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://43.204.143.233:8000";

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
  artifacts?: string[]; // filenames
}

// ── Session list & history ────────────────────────────────────────────────────
export interface SessionSummary {
  id: string;
  lastUpdateTime: number;
  preview: string; // first user message text
}

export interface ADKEvent {
  id: string;
  author: string;
  content?: { role: string; parts: { text?: string }[] };
  actions?: { artifactDelta?: Record<string, number> };
  timestamp: number;
}

export interface ADKSession {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: ADKEvent[];
  lastUpdateTime: number;
}

export async function listSessions(userId: string): Promise<ADKSession[]> {
  const res = await fetch(`${BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions`);
  if (!res.ok) return [];
  const data = await res.json();
  // ADK returns either an array directly or { sessions: [...] }
  return Array.isArray(data) ? data : (data.sessions ?? []);
}

export async function getSession(userId: string, sessionId: string): Promise<ADKSession | null> {
  const res = await fetch(`${BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  await fetch(`${BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`, { method: "DELETE" });
}

/** Extract readable messages from ADK session events */
export function eventsToMessages(events: ADKEvent[]): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  // Collect pending artifacts from tool-result events to attach to the NEXT agent message
  const pendingArtifacts: string[] = [];

  for (const ev of events) {
    const artifactDelta = ev.actions?.artifactDelta;
    if (artifactDelta && Object.keys(artifactDelta).length > 0) {
      pendingArtifacts.push(...Object.keys(artifactDelta));
    }

    const parts = ev.content?.parts;
    const text = parts?.find((p: Record<string, unknown>) => typeof p.text === "string")?.text as string | undefined;

    if (ev.content?.role === "user" && text) {
      // Skip tool/function response events — they aren't real user messages
      const isFunctionResponse = parts?.some((p: Record<string, unknown>) => "functionResponse" in p);
      if (!isFunctionResponse) {
        msgs.push({ role: "user", text });
      }
    } else if (ev.content?.role === "model" && text) {
      // Flush any pending artifacts onto this agent message
      const artifacts = pendingArtifacts.length > 0 ? [...pendingArtifacts] : undefined;
      pendingArtifacts.length = 0; // clear

      const last = msgs[msgs.length - 1];
      if (last?.role === "agent") {
        last.text += text;
        if (artifacts) last.artifacts = [...(last.artifacts ?? []), ...artifacts];
      } else {
        msgs.push({ role: "agent", text, artifacts });
      }
    }
  }

  // If there are still pending artifacts after all events (edge case),
  // attach to the last agent message
  if (pendingArtifacts.length > 0) {
    const lastAgent = [...msgs].reverse().find((m) => m.role === "agent");
    if (lastAgent) {
      lastAgent.artifacts = [...(lastAgent.artifacts ?? []), ...pendingArtifacts];
    }
  }

  return msgs;
}

/** Get first user message as a preview title */
export function sessionPreview(events: ADKEvent[]): string {
  for (const ev of events) {
    if (ev.content?.role === "user") {
      // Skip tool/function response events
      const isFunctionResponse = ev.content.parts?.some((p: Record<string, unknown>) => p.functionResponse);
      if (isFunctionResponse) continue;
      const text = ev.content.parts?.find((p) => p.text)?.text;
      if (text) return text.slice(0, 60) + (text.length > 60 ? "…" : "");
    }
  }
  return "New conversation";
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Dynamic data API ──────────────────────────────────────────────────────────
export type DataKey = "faqs" | "claims" | "premium_config" | "response_prompt";

export async function fetchData(key: DataKey): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}/data/${key}`);
  if (!res.ok) throw new Error(`Failed to load ${key}`);
  return res.json();
}

export async function saveData(key: DataKey, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BASE_URL}/data/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save ${key}`);
}
// ─────────────────────────────────────────────────────────────────────────────

// ── hip-backend policy data ───────────────────────────────────────────────────
export interface Policy {
  _id: string;
  name: string;
  companyId: string | { _id: string; name: string };
  company?: { _id: string; name: string };
  policyCategory?: { _id: string; name: string };
  subPolicies?: { _id: string; name: string }[];
}

export interface Company {
  _id: string;
  name: string;
  logo?: string;
}

export function resolveCompanyName(policy: Policy, companies: Record<string, string>): string {
  // company field is the most reliable — API populates it directly
  if (policy.company?.name) return policy.company.name;
  if (typeof policy.companyId === "object" && policy.companyId?.name) return policy.companyId.name;
  const id = typeof policy.companyId === "string" ? policy.companyId : policy.companyId?._id;
  return companies[id] ?? "";
}

export async function fetchPolicies(): Promise<Policy[]> {
  const res = await fetch(`${BASE_URL}/policies`);
  if (!res.ok) throw new Error("Failed to load policies");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.policies ?? data.data ?? []);
}

export async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch(`${BASE_URL}/companies`);
  if (!res.ok) throw new Error("Failed to load companies");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.companies ?? data.data ?? []);
}
// ─────────────────────────────────────────────────────────────────────────────

export async function* streamMessage(
  userId: string,
  sessionId: string,
  text: string,
  inlineData?: { mimeType: string; data: string }
): AsyncGenerator<{ text?: string; artifacts?: string[] }> {
  const parts: object[] = [{ text }];
  if (inlineData) parts.push({ inlineData });

  const res = await fetch(`${BASE_URL}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: APP_NAME,
      userId,
      sessionId,
      newMessage: { role: "user", parts },
      streaming: true,
    }),
  });

  if (!res.ok || !res.body) throw new Error("SSE request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const event = JSON.parse(raw);

        // Collect artifacts from ANY event that carries artifactDelta
        const artifactDelta = event?.actions?.artifactDelta;
        const artifacts = artifactDelta && Object.keys(artifactDelta).length > 0
          ? Object.keys(artifactDelta)
          : undefined;

        // Only pull text from model-role content parts
        const content = event?.content;
        const isModelContent = content?.role === "model";
        const textPart = isModelContent
          ? content.parts?.find((p: { text?: string }) => p.text)?.text
          : undefined;

        if (textPart || artifacts) yield { text: textPart, artifacts };
      } catch {
        // skip malformed chunks
      }
    }
  }
}
