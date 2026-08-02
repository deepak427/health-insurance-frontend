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
