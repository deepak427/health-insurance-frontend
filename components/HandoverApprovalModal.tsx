"use client";

import { useState } from "react";
import { X, ShieldCheck, Check, Sparkles, Building, DollarSign, Calendar, MapPin, Loader2, AlertCircle } from "lucide-react";
import { approveHandover, HandoverRecord } from "@/lib/groupApi";

interface Props {
  handover: HandoverRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApproved: (updated: HandoverRecord) => void;
  currentUserId: string;
}

const INSURERS = [
  "Care Insurance Special Underwriting",
  "Digit Insurance Customized",
  "Tata AIG Global Custom Guard",
  "Star Health Premier Travel",
  "HDFC ERGO Travel Shield",
];

export default function HandoverApprovalModal({
  handover,
  isOpen,
  onClose,
  onApproved,
  currentUserId,
}: Props) {
  if (!isOpen || !handover) return null;

  const [insurer, setInsurer] = useState(INSURERS[0]);
  const [planName, setPlanName] = useState("Custom Structured Travel Shield");
  const [premium, setPremium] = useState("₹3,950");
  const [sumInsured, setSumInsured] = useState("$100,000");
  const [destination, setDestination] = useState("Europe / Schengen");
  const [travelDates, setTravelDates] = useState("15 May - 30 Jun 2026");
  const [riders, setRiders] = useState("Adventure Sports + Pre-existing Waiver + Zero Deductible");
  const [notes, setNotes] = useState("Special 20% group discount & fast-track claims approved.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!handover) return;
    setLoading(true);
    setError(null);
    try {
      const resolutionData = {
        insurer,
        plan_name: planName,
        premium,
        sum_insured: sumInsured,
        destination,
        travel_dates: travelDates,
        riders,
        notes,
      };

      const updated = await approveHandover(handover.id, currentUserId, resolutionData);
      onApproved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to approve handover");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1e293b] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ff5722] flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-bold text-sm">Structure & Approve Custom Quote</h2>
              <p className="text-[11px] text-gray-300">
                Group: <span className="font-semibold text-white">{handover.group_name}</span> · For @{handover.requester_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* User Request Requirement Callout */}
          <div className="p-3 bg-[#f8fafc] rounded-xl border border-gray-200">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Requester Query / Requirement:
            </p>
            <p className="text-xs text-[#111827] font-medium leading-relaxed italic">
              &quot;{handover.requirement}&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Insurer */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Underwriting Insurer
              </label>
              <select
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-semibold text-gray-900 focus:outline-hidden"
              >
                {INSURERS.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Name */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Custom Plan Name
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-semibold text-gray-900 focus:outline-hidden"
              />
            </div>

            {/* Approved Premium */}
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Approved Premium (₹)
              </label>
              <input
                type="text"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-black text-[#15803d] text-sm focus:outline-hidden"
              />
            </div>

            {/* Sum Insured */}
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Coverage / Sum Insured
              </label>
              <input
                type="text"
                value={sumInsured}
                onChange={(e) => setSumInsured(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-semibold text-gray-900 focus:outline-hidden"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-medium text-gray-900 focus:outline-hidden"
              />
            </div>

            {/* Dates */}
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Travel Validity
              </label>
              <input
                type="text"
                value={travelDates}
                onChange={(e) => setTravelDates(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-medium text-gray-900 focus:outline-hidden"
              />
            </div>

            {/* Special Riders */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Included Special Riders / Addons
              </label>
              <input
                type="text"
                value={riders}
                onChange={(e) => setRiders(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-medium text-gray-900 focus:outline-hidden"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Underwriter Approval Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#f0f2f5] rounded-xl border-none font-medium text-gray-900 focus:outline-hidden resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            Publishing will post live policy card directly to group &quot;{handover.group_name}&quot;.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-[#008069] hover:bg-[#006e5a] disabled:opacity-50 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Check size={14} /> Approve & Post to Group
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
