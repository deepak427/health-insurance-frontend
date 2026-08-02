// Generates and persists userId + sessionId in localStorage
export function getOrCreateSession(): { userId: string; sessionId: string } {
  if (typeof window === "undefined") {
    return { userId: "user", sessionId: "session" };
  }
  let userId = localStorage.getItem("hip_userId");
  let sessionId = localStorage.getItem("hip_sessionId");

  if (!userId) {
    userId = `user_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("hip_userId", userId);
  }
  if (!sessionId) {
    sessionId = `session_${Math.random().toString(36).slice(2, 18)}`;
    localStorage.setItem("hip_sessionId", sessionId);
  }
  return { userId, sessionId };
}

export function newSession(): { userId: string; sessionId: string } {
  const userId = localStorage.getItem("hip_userId") || `user_${Math.random().toString(36).slice(2, 10)}`;
  const sessionId = `session_${Math.random().toString(36).slice(2, 18)}`;
  localStorage.setItem("hip_userId", userId);
  localStorage.setItem("hip_sessionId", sessionId);
  return { userId, sessionId };
}
