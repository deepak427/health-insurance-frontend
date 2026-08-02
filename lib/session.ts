// Session + username management for Dolphin Buddy

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hip_username");
}

export function setUsername(name: string): void {
  localStorage.setItem("hip_username", name);
  // also set as userId so ADK uses it
  localStorage.setItem("hip_userId", name);
}

export function getOrCreateSession(): { userId: string; sessionId: string } {
  if (typeof window === "undefined") {
    return { userId: "user", sessionId: "session" };
  }
  const userId = localStorage.getItem("hip_userId") || "user";
  let sessionId = localStorage.getItem("hip_sessionId");
  if (!sessionId) {
    sessionId = `session_${Math.random().toString(36).slice(2, 18)}`;
    localStorage.setItem("hip_sessionId", sessionId);
  }
  return { userId, sessionId };
}

export function newSession(userId: string): { userId: string; sessionId: string } {
  const sessionId = `session_${Math.random().toString(36).slice(2, 18)}`;
  localStorage.setItem("hip_sessionId", sessionId);
  return { userId, sessionId };
}

export function setActiveSession(sessionId: string): void {
  localStorage.setItem("hip_sessionId", sessionId);
}
