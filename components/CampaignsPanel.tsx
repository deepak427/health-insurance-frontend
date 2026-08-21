"use client";

import { useState, useEffect } from "react";
import {
  X, Megaphone, Plus, RefreshCw, Send, Trash2, Calendar, Clock,
  Users, CheckCircle2, AlertCircle, Play, Filter, Sparkles, TrendingUp
} from "lucide-react";
import {
  fetchCampaigns, createCampaign, runCampaignImmediately,
  deleteCampaign, Campaign
} from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CampaignsPanel({ isOpen, onClose }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState<number>(0);
  const [sendOption, setSendOption] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Please fill in campaign title and message.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      let scheduleIso: string | undefined = undefined;
      if (sendOption === "later" && scheduledAt) {
        scheduleIso = new Date(scheduledAt).toISOString();
      }

      await createCampaign({
        title: title.trim(),
        message: message.trim(),
        filter_type: filterType,
        filter_value: filterValue,
        scheduled_at: scheduleIso,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setFilterType("all");
      setFilterValue(0);
      setSendOption("now");
      setScheduledAt("");
      setShowCreateModal(false);
      await loadData();
    } catch {
      setError("Failed to create campaign. Please try again.");
    }
    setSubmitting(false);
  }

  async function handleRunNow(id: string) {
    try {
      await runCampaignImmediately(id);
      await loadData();
    } catch (e) {
      console.error("Failed to run campaign:", e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Failed to delete campaign:", e);
    }
  }

  if (!isOpen) return null;

  const totalCampaigns = campaigns.length;
  const completedCount = campaigns.filter((c) => c.status === "completed").length;
  const scheduledCount = campaigns.filter((c) => c.status === "scheduled").length;
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivered_count || 0), 0);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#f4f5f8] text-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 bg-white border-b border-[#e5e7eb] shrink-0 shadow-2xs gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#eff6ff] border border-[#dbeafe] flex items-center justify-center text-[#2563eb] shadow-2xs shrink-0">
            <Megaphone size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-[#111827] tracking-tight truncate">Campaigns & Broadcasts</h2>
              <span className="text-[10px] sm:text-[11px] font-bold bg-[#eff6ff] text-[#1e40af] px-2 py-0.5 rounded-full border border-[#bfdbfe] shrink-0">
                {totalCampaigns}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#6b7280] font-normal mt-0.5 hidden xs:block truncate">
              Schedule push messages and commission promos to insurance agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-all shadow-2xs cursor-pointer"
          >
            <Plus size={14} />
            <span>New Campaign</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-[#e5e7eb] bg-white hover:bg-gray-50 text-[#374151] transition-all shadow-2xs disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#2563eb]" : ""} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6b7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="px-3.5 sm:px-6 py-3 bg-white border-b border-[#e5e7eb] shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Total Campaigns</p>
            <p className="text-lg font-black text-[#0f172a]">{totalCampaigns}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            <Megaphone size={16} />
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Scheduled (Active)</p>
            <p className="text-lg font-black text-[#f59e0b]">{scheduledCount}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            <Clock size={16} />
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Completed</p>
            <p className="text-lg font-black text-[#00a86b]">{completedCount}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Messages Delivered</p>
            <p className="text-lg font-black text-[#6366f1]">{totalDelivered}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            <Users size={16} />
          </div>
        </div>
      </div>

      {/* Campaigns Feed / List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {loading && campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#2563eb] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-[#6b7280]">Loading broadcast campaigns…</p>
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white rounded-3xl p-8 border border-[#e5e7eb] shadow-sm max-w-md mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone size={28} />
            </div>
            <p className="text-sm font-bold text-[#111827]">No campaigns created yet</p>
            <p className="text-xs text-[#6b7280]">Create your first broadcast message to reach all insurance agents at scheduled times.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-xs font-bold px-4 py-2 rounded-xl bg-[#2563eb] text-white hover:bg-blue-700 transition-all shadow-xs"
            >
              + Create Campaign
            </button>
          </div>
        )}

        {campaigns.map((camp) => {
          const isScheduled = camp.status === "scheduled";
          const isCompleted = camp.status === "completed";

          return (
            <div
              key={camp.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e7eb] shadow-2xs hover:shadow-sm transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#111827]">{camp.title}</h3>
                    {isScheduled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Clock size={11} /> Scheduled
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Delivered ({camp.delivered_count} agents)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4b5563] mt-1.5 whitespace-pre-wrap bg-[#f9fafb] p-2.5 rounded-xl border border-[#f1f5f9]">
                    {camp.message}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isScheduled && (
                    <button
                      onClick={() => handleRunNow(camp.id)}
                      className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1 px-2.5"
                      title="Run Now"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Send Now</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(camp.id)}
                    className="p-1.5 rounded-xl text-[#9ca3af] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete campaign"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Campaign Meta Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] text-[11px] text-[#6b7280] flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-[#475569]">
                    <Filter size={12} />
                    Target: {camp.filter_type === "all" ? "All Agents" : `${camp.filter_type} (${camp.filter_value})`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    Audience: {camp.target_count} agents
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {isScheduled ? `Scheduled for: ${new Date(camp.scheduled_at).toLocaleString()}` : `Sent: ${camp.sent_at ? new Date(camp.sent_at).toLocaleString() : "Just now"}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create Campaign Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#e5e7eb]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e5e7eb]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">Create Broadcast Campaign</h3>
                  <p className="text-[11px] text-[#6b7280]">Push AI message to agents at scheduled time</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block mb-1.5">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dubai Monsoon 50% Commission Surge"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-xl outline-none focus:border-[#2563eb] text-[#111827] font-medium"
                  required
                />
              </div>

              {/* Broadcast Message */}
              <div>
                <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block mb-1.5">
                  Message (sent by AI in Agent Chat) *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hey! We have an exclusive 50% commission multiplier on all international policies today. Need help quoting a client?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-xl outline-none focus:border-[#2563eb] text-[#111827] font-medium resize-none"
                  required
                />
              </div>

              {/* Target Filter */}
              <div>
                <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block mb-1.5">
                  Target Audience Filter
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-xl outline-none focus:border-[#2563eb] text-[#111827] font-medium"
                >
                  <option value="all">All Insurance Agents</option>
                  <option value="min_booking_amount">Agents with Bookings &gt; ₹ Amount</option>
                  <option value="min_policy_count">Agents with &gt;= N Policies Booked</option>
                  <option value="zero_bookings">New Agents (0 Bookings yet)</option>
                </select>

                {(filterType === "min_booking_amount" || filterType === "min_policy_count") && (
                  <div className="mt-2">
                    <input
                      type="number"
                      placeholder={filterType === "min_booking_amount" ? "Enter min amount (e.g. 5000)" : "Enter min policies (e.g. 2)"}
                      value={filterValue || ""}
                      onChange={(e) => setFilterValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-xl outline-none focus:border-[#2563eb] text-[#111827]"
                    />
                  </div>
                )}
              </div>

              {/* Timing */}
              <div>
                <label className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block mb-1.5">
                  Schedule Execution
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendOption("now")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      sendOption === "now"
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-[#f9fafb] text-[#4b5563] border-[#e5e7eb]"
                    }`}
                  >
                    Send Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendOption("later")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      sendOption === "later"
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-[#f9fafb] text-[#4b5563] border-[#e5e7eb]"
                    }`}
                  >
                    Schedule Time
                  </button>
                </div>

                {sendOption === "later" && (
                  <div className="mt-2.5">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[#f9fafb] border border-[#e5e7eb] rounded-xl outline-none focus:border-[#2563eb] text-[#111827]"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#4b5563] hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{sendOption === "now" ? "Launch Broadcast" : "Schedule Campaign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
