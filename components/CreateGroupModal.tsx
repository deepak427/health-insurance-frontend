"use client";

import { useState, useEffect } from "react";
import { X, Users, Check, Search, ShieldCheck, Loader2 } from "lucide-react";
import { listUsers, createGroup, BUDDY_DISPLAY_NAME } from "@/lib/groupApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onGroupCreated: (groupId: string) => void;
}

export default function CreateGroupModal({ isOpen, onClose, currentUserId, onGroupCreated }: Props) {
  const [groupName, setGroupName] = useState("");
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [includeBuddy, setIncludeBuddy] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setGroupName("");
    setSelectedUsers([]);
    setIncludeBuddy(true);
    setError(null);
    setLoading(true);

    listUsers()
      .then((users) => {
        // Exclude current user from picker since they are automatically creator & member
        const others = users.filter((u) => u && u !== currentUserId && u !== "dolphin_buddy");
        setAvailableUsers(others);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  function toggleUser(u: string) {
    setSelectedUsers((prev) =>
      prev.includes(u) ? prev.filter((id) => id !== u) : [...prev, u]
    );
  }

  async function handleCreate() {
    const trimmed = groupName.trim();
    if (!trimmed) {
      setError("Please enter a group name");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const grp = await createGroup(trimmed, currentUserId, selectedUsers, includeBuddy);
      onGroupCreated(grp.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create group";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredUsers = availableUsers.filter((u) =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#008069] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base">New Group Chat</h2>
              <p className="text-xs text-white/80">Collaborate with agents & Dolphin Buddy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-[#111b21] uppercase tracking-wider mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Dubai Schengen Agents Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f0f2f5] rounded-xl text-sm border-none focus:outline-hidden focus:ring-2 focus:ring-[#008069]/40 text-[#111b21] placeholder-gray-400"
              maxLength={60}
              autoFocus
            />
          </div>

          {/* Dolphin Buddy Toggle */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-xs shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111b21]">{BUDDY_DISPLAY_NAME}</p>
                <p className="text-xs text-[#667781]">Answers queries, quotes & operations</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeBuddy}
                onChange={(e) => setIncludeBuddy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008069]"></div>
            </label>
          </div>

          {/* Add Members Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#111b21] uppercase tracking-wider">
                Select Members ({selectedUsers.length} selected)
              </label>
            </div>

            {/* Member search bar */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#f0f2f5] rounded-lg text-xs border-none focus:outline-hidden text-[#111b21]"
              />
            </div>

            {/* User List */}
            <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  {availableUsers.length === 0 ? "No other users found in system" : "No matching users"}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUsers.includes(u);
                  return (
                    <div
                      key={u}
                      onClick={() => toggleUser(u)}
                      className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f0fdf4]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs uppercase">
                          {u.slice(0, 2)}
                        </div>
                        <span className="text-xs font-medium text-[#111b21]">{u}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-[#008069] border-[#008069] text-white" : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting || !groupName.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-[#008069] hover:bg-[#006e5a] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Creating...
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
