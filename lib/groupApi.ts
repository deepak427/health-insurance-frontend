import { BASE_URL, APP_NAME, isAgentGeneratedArtifact } from "./api";

export const BUDDY_USER_ID = "dolphin_buddy";
export const BUDDY_DISPLAY_NAME = "Dolphin Buddy";

export interface GroupMember {
  user_id: string;
  display_name: string;
  is_bot: number;
  added_at: string;
  added_by: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  msg_type: "text" | "bot_response" | "artifact";
  artifacts?: string[];
  mentions?: string[];
  created_at: string;
}

export interface GroupItem {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: GroupMember[];
  has_buddy: boolean;
  is_muted?: number | boolean;
  handover_mode?: "internal" | "external" | string;
  last_message_preview?: string;
  last_message_sender?: string;
  last_message_time?: string;
  unread_count?: number;
}

export interface GroupDetail extends GroupItem {
  last_message?: GroupMessage | null;
}

export function getGroupSessionIdentity(groupId: string) {
  return {
    userId: `group_${groupId}`,
    sessionId: `gsession_${groupId}`,
  };
}

export async function listUsers(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/users`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.error("Failed to list users:", err);
    return [];
  }
}

export async function createGroup(
  name: string,
  createdBy: string,
  members: string[],
  includeBuddy: boolean = true
): Promise<GroupDetail> {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      created_by: createdBy,
      members,
      include_buddy: includeBuddy,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create group");
  }
  return res.json();
}

export async function listGroups(userId: string): Promise<GroupItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/groups?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.groups || [];
  } catch (err) {
    console.error("Failed to list groups:", err);
    return [];
  }
}

export async function getGroup(groupId: string): Promise<GroupDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/groups/${groupId}`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to get group:", err);
    return null;
  }
}

export async function deleteGroup(groupId: string, userId?: string): Promise<boolean> {
  const url = userId
    ? `${BASE_URL}/groups/${groupId}?user_id=${encodeURIComponent(userId)}`
    : `${BASE_URL}/groups/${groupId}`;
  const res = await fetch(url, { method: "DELETE" });
  return res.ok;
}

export async function addMember(
  groupId: string,
  userId: string,
  addedBy: string,
  isBot: number = 0
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      added_by: addedBy,
      is_bot: isBot,
    }),
  });
  return res.ok;
}

export async function removeMember(groupId: string, userId: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/members/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function getGroupMessages(
  groupId: string,
  limit: number = 50,
  before?: string
): Promise<GroupMessage[]> {
  try {
    const url = before
      ? `${BASE_URL}/groups/${groupId}/messages?limit=${limit}&before=${encodeURIComponent(before)}`
      : `${BASE_URL}/groups/${groupId}/messages?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error("Failed to fetch group messages:", err);
    return [];
  }
}

export async function postGroupMessage(
  groupId: string,
  senderId: string,
  content: string,
  senderName?: string,
  msgType: "text" | "bot_response" | "artifact" = "text",
  artifacts?: string[],
  mentions?: string[]
): Promise<GroupMessage> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_id: senderId,
      sender_name: senderName,
      content,
      msg_type: msgType,
      artifacts,
      mentions,
    }),
  });
  if (!res.ok) throw new Error("Failed to post group message");
  return res.json();
}

export async function markGroupRead(groupId: string, userId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/groups/${groupId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
  } catch (err) {
    console.error("Failed to mark group read:", err);
  }
}

export async function getGroupUnreadSummary(userId: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${BASE_URL}/groups-unread/${encodeURIComponent(userId)}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.unread || {};
  } catch {
    return {};
  }
}

/**
 * Streams Dolphin Buddy response for a group question using the group's synthetic ADK session.
 */
export async function* streamBuddyGroupMessage(
  groupId: string,
  groupName: string,
  senderId: string,
  senderName: string,
  text: string,
  inlineData?: { mimeType: string; data: string }
): AsyncGenerator<{ text?: string; artifacts?: string[] }> {
  const { userId: groupUserId, sessionId: groupSessionId } = getGroupSessionIdentity(groupId);

  // Ensure group ADK session exists with sender_user_id in state
  try {
    await fetch(
      `${BASE_URL}/apps/${APP_NAME}/users/${groupUserId}/sessions/${groupSessionId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            user_id: groupUserId,
            session_id: groupSessionId,
            sender_user_id: senderId,
          },
        }),
      }
    );
  } catch (err) {
    console.warn("Session init warning:", err);
  }

  // Inject group context prefix
  const enhancedPrompt = `[Group: ${groupName} | ${senderName || senderId} asks]: ${text}`;
  const parts: object[] = [{ text: enhancedPrompt }];
  if (inlineData) parts.push({ inlineData });

  const res = await fetch(`${BASE_URL}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: APP_NAME,
      userId: groupUserId,
      sessionId: groupSessionId,
      newMessage: { role: "user", parts },
      streaming: true,
    }),
  });

  if (!res.ok || !res.body) throw new Error("SSE request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedText = "";

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
        const artifactDelta = event?.actions?.artifactDelta;
        const rawArtifacts =
          artifactDelta && Object.keys(artifactDelta).length > 0
            ? Object.keys(artifactDelta).filter(isAgentGeneratedArtifact)
            : [];
        const artifacts = rawArtifacts.length > 0 ? rawArtifacts : undefined;

        const content = event?.content;
        const isModelContent = content?.role === "model";
        const textPart = isModelContent
          ? content.parts?.find((p: { text?: string }) => p.text)?.text
          : undefined;

        if (textPart) {
          const trimmed = textPart.trim();
          // Deduplicate if ADK emits the same full text chunk in multiple turns
          if (trimmed.length > 20 && accumulatedText.includes(trimmed)) {
            continue;
          }
          accumulatedText += textPart;
          yield { text: textPart, artifacts };
        } else if (artifacts) {
          yield { artifacts };
        }
      } catch {}
    }
  }
}

// ── Handover API ─────────────────────────────────────────────────────────────
export interface HandoverRecord {
  id: string;
  group_id: string;
  group_name: string;
  requester_id: string;
  requester_name: string;
  assigned_to: string;
  mode: "internal" | "external";
  requirement: string;
  status: "pending" | "assigned" | "approved" | "rejected";
  dm_session_id?: string;
  resolution_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function setGroupMute(
  groupId: string,
  isMuted: boolean
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/mute`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_muted: isMuted }),
  });
  return res.ok;
}

export async function setGroupHandoverMode(
  groupId: string,
  mode: "internal" | "external"
): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/handover-mode`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handover_mode: mode }),
  });
  return res.ok;
}

export async function createHandover(params: {
  group_id: string;
  group_name: string;
  requester_id: string;
  requester_name: string;
  assigned_to: string;
  mode: "internal" | "external";
  requirement: string;
}): Promise<HandoverRecord> {
  const res = await fetch(`${BASE_URL}/handovers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to create handover");
  return res.json();
}

export async function listPendingHandovers(userId: string): Promise<HandoverRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/handovers/pending/${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.handovers || [];
  } catch {
    return [];
  }
}

export async function approveHandover(
  handoverId: string,
  approvedBy: string,
  resolutionData: Record<string, any>
): Promise<HandoverRecord> {
  const res = await fetch(`${BASE_URL}/handovers/${handoverId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      approved_by: approvedBy,
      resolution_data: resolutionData,
    }),
  });
  if (!res.ok) throw new Error("Failed to approve handover");
  return res.json();
}
