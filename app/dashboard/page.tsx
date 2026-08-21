"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Shield, FileText, Share2, Database, Coins, Calendar,
  ChevronDown, RefreshCw, Plus, Building, ShieldCheck, ArrowRight,
  ExternalLink, Download, Users, ArrowUpRight, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import PoliciesPanel from "@/components/PoliciesPanel";
import UsernameModal from "@/components/UsernameModal";
import { useChatContext } from "@/context/ChatContext";
import { fetchDashboardStats, DashboardStats, buildBookingDownloadUrl } from "@/lib/api";

export default function DashboardPage() {
  const { username, userId, walletBalance, setUsername } = useChatContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [selectedPartner, setSelectedPartner] = useState("All Insurers");
  const [selectedDestination, setSelectedDestination] = useState("All Destinations");

  useEffect(() => {
    loadStats();
  }, [userId]);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats(userId);
      setStats(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load live statistics from backend.");
    } finally {
      setLoading(false);
    }
  }

  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#f4f5f8] overflow-hidden font-sans text-[#111827]">
      {/* Column 1: Sidebar Navigation */}
      <Sidebar
        isOpenMobile={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onOpenPolicies={() => setPoliciesOpen(true)}
        onClosePolicies={() => setPoliciesOpen(false)}
        policiesOpen={policiesOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-y-auto bg-[#f4f5f8]">
        
        {/* ── Top Dashboard Header ── */}
        <div className="px-5 md:px-8 pt-6 pb-4 bg-[#f4f5f8] shrink-0 border-b border-[#e5e7eb]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight">
                  Dashboard
                </h1>
                <span className="text-[10px] font-bold bg-[#00a86b] text-white px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mt-0.5 font-normal">
                Overview of policies, quotes, carrier distribution, and AI activity across your network.
              </p>
            </div>

            {/* Top Filters & Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Partner Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] rounded-xl px-3 py-1.5 text-xs font-medium text-[#374151] shadow-2xs">
                <span>{selectedPartner}</span>
                <ChevronDown size={14} className="text-[#9ca3af]" />
              </div>

              {/* Destination Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] rounded-xl px-3 py-1.5 text-xs font-medium text-[#374151] shadow-2xs">
                <span>{selectedDestination}</span>
                <ChevronDown size={14} className="text-[#9ca3af]" />
              </div>

              {/* Date Range */}
              <div className="hidden sm:flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-xl px-3 py-1.5 text-xs text-[#6b7280] shadow-2xs">
                <Calendar size={13} className="text-[#9ca3af]" />
                <span className="font-mono text-[11px] text-[#374151]">dd-mm-yyyy</span>
                <span className="text-[#9ca3af]">to</span>
                <span className="font-mono text-[11px] text-[#374151]">dd-mm-yyyy</span>
              </div>

              {/* Reload Button */}
              <button
                onClick={loadStats}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827] shadow-2xs transition-colors"
                title="Refresh live metrics"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>

              {/* Primary Action Button: New Quote / Chat */}
              <Link
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-semibold shadow-sm transition-all"
              >
                <Plus size={14} />
                <span>New Policy Quote</span>
              </Link>
            </div>
          </div>

          {/* ── 4 Top Metric Cards (Exact visual styling) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
            
            {/* Card 1: Policy Ratio (Warm Cream Card #faebd7) */}
            <div className="bg-[#faebd7] rounded-2xl p-4 flex flex-col justify-between h-[142px] border border-[#f3ddbe] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">Policy Ratio</span>
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                  <FileText size={13} />
                </div>
              </div>
              <div className="flex flex-col items-center my-auto">
                <div className="flex items-center gap-2 text-3xl font-black text-[#111827]">
                  <span>{stats?.summary.policy_ratio.split(":")[0]?.trim() || "8"}</span>
                  <span className="text-amber-500 font-normal">:</span>
                  <span>{stats?.summary.policy_ratio.split(":")[1]?.trim() || "9"}</span>
                </div>
                <span className="text-[10px] text-[#78542c] font-medium mt-0.5">quotes : active policies</span>
              </div>
            </div>

            {/* Card 2: POLICIES (White Card with Purple Progress Ring) */}
            <div className="bg-white rounded-2xl p-4 flex flex-col justify-between h-[142px] border-2 border-[#6366f1]/20 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6b7280] tracking-wider uppercase">Policies</span>
                <div className="w-7 h-7 rounded-full bg-[#f3f4f6] text-[#6366f1] flex items-center justify-center">
                  <Shield size={14} />
                </div>
              </div>
              <div className="flex items-center justify-between my-auto gap-2">
                {/* Progress donut indicator */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg width="48" height="48" viewBox="0 0 36 36" className="-rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="3.5" strokeDasharray="73 27" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[10px] font-black text-[#111827]">83%</span>
                </div>

                {/* Stat pills */}
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  <div className="bg-[#f9fafb] px-2 py-1 rounded-lg text-center">
                    <span className="text-xs font-black text-[#111827] block">{stats?.summary.total_bookings ?? 12}</span>
                    <span className="text-[8px] text-[#9ca3af]">total</span>
                  </div>
                  <div className="bg-[#f9fafb] px-2 py-1 rounded-lg text-center">
                    <span className="text-xs font-black text-[#111827] block">{stats?.summary.active_policies ?? 10}</span>
                    <span className="text-[8px] text-[#9ca3af]">active</span>
                  </div>
                  <div className="bg-black text-white px-2 py-1 rounded-lg text-center">
                    <span className="text-xs font-black text-white block">{stats?.summary.pending_policies ?? 2}</span>
                    <span className="text-[8px] text-gray-300">pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: NETWORK (White Card with Orange Accent) */}
            <div className="bg-white rounded-2xl p-4 flex flex-col justify-between h-[142px] border border-[#e5e7eb] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6b7280] tracking-wider uppercase">Network</span>
                <div className="w-7 h-7 rounded-full bg-[#fdeee9] text-[#ff5722] flex items-center justify-center">
                  <Building size={14} />
                </div>
              </div>
              <div className="flex items-center justify-between my-auto gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#9ca3af]">Insurers</span>
                  <span className="text-xl font-black text-[#111827]">{stats?.summary.partner_count ?? 6}</span>
                </div>
                <div className="bg-black text-white px-3 py-2 rounded-xl flex flex-col items-center">
                  <span className="text-[9px] text-gray-300">AI Agents</span>
                  <span className="text-sm font-black text-white">1</span>
                </div>
              </div>
            </div>

            {/* Card 4: CLAIMS & VERIFICATION (Soft Peach Card #fdeee9) */}
            <div className="bg-[#fdeee9] rounded-2xl p-4 flex flex-col justify-between h-[142px] border border-[#fbd3c7] shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">Claims & Verification</span>
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
                  <ShieldCheck size={13} />
                </div>
              </div>
              <div className="flex items-center justify-between my-auto gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-[#111827]">94%</span>
                  <span className="text-[9px] text-[#855141]">accuracy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-white px-2.5 py-1.5 rounded-xl text-center">
                    <span className="text-xs font-black text-[#111827] block">{stats?.claims_verification.instant_approved ?? 11}</span>
                    <span className="text-[8px] text-[#ff5722] font-semibold">approved</span>
                  </div>
                  <div className="bg-black text-white px-2.5 py-1.5 rounded-xl text-center">
                    <span className="text-xs font-black text-white block">{stats?.claims_verification.under_review ?? 2}</span>
                    <span className="text-[8px] text-gray-300">pending</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Visual Analytics Section: Donut Breakdown + Carrier Flow Bar Chart ── */}
        <div className="px-5 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Chart Card: Destination / Category Breakdown (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">Destination Coverage</h3>
                  <p className="text-xs text-[#6b7280]">Breakdown of issued traveler policies by geography</p>
                </div>
                <span className="text-[10px] font-bold bg-[#f3f4f6] text-[#4b5563] px-2.5 py-1 rounded-full">
                  All Regions
                </span>
              </div>

              {/* Donut Chart + Legend */}
              <div className="flex items-center gap-6 py-3">
                {/* SVG Donut */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                  <svg width="112" height="112" viewBox="0 0 36 36" className="-rotate-90">
                    <circle cx="18" cy="18" r="13" fill="none" stroke="#ff5722" strokeWidth="4.5" strokeDasharray="35 65" />
                    <circle cx="18" cy="18" r="13" fill="none" stroke="#00a86b" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-35" />
                    <circle cx="18" cy="18" r="13" fill="none" stroke="#6366f1" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="-60" />
                    <circle cx="18" cy="18" r="13" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="12 88" strokeDashoffset="-80" />
                    <circle cx="18" cy="18" r="13" fill="none" stroke="#0284c7" strokeWidth="4.5" strokeDasharray="8 92" strokeDashoffset="-92" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg font-black text-[#111827]">{stats?.summary.total_bookings ?? 59}</span>
                    <span className="text-[9px] text-[#9ca3af] font-medium uppercase">Total</span>
                  </div>
                </div>

                {/* Legend breakdown list */}
                <div className="flex flex-col gap-2 flex-1 text-xs">
                  {stats?.destination_distribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[#374151] font-medium truncate">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111827]">{item.count}</span>
                        <span className="text-[#9ca3af] text-[10px]">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-[#f1f5f9] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wide">Quick Actions</span>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus size={15} />
                <span>Upload Document / Create Quote</span>
              </Link>
            </div>
          </div>

          {/* Right Chart Card: Carrier Distribution Flow Bars (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#e5e7eb] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">Insurer Volume & Carrier Distribution</h3>
                  <p className="text-xs text-[#6b7280]">Share of policies issued per insurance underwriting partner</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#fdeee9] text-[#ff5722] flex items-center justify-center text-xs font-bold">
                  10
                </div>
              </div>

              {/* Carrier list with modern pill flow bars */}
              <div className="flex flex-col gap-3 py-1">
                {stats?.insurer_distribution.map((ins, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                    <span className="font-semibold text-[#111827] w-36 truncate">{ins.name}</span>
                    
                    {/* Visual Bar Indicator */}
                    <div className="flex-1 h-3 bg-[#f3f4f6] rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(10, ins.percentage)}%`,
                          backgroundColor: ins.count > 0 ? "#ff5722" : "#d1d5db",
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-2 min-w-[54px] justify-end">
                      <span className="font-bold text-[#111827]">{ins.count}</span>
                      <span
                        className={`w-3.5 h-6 rounded-md ${
                          ins.count > 0 ? "bg-[#ff5722]" : "bg-[#e5e7eb]"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#6b7280]">
              <span>Real-time underwriting sync</span>
              <button
                onClick={() => setPoliciesOpen(true)}
                className="text-[#ff5722] font-semibold hover:underline flex items-center gap-1"
              >
                View all issued certificates <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* ── Bottom Section: Recent Policy Operations Table ── */}
        <div className="px-5 md:px-8 pb-8">
          <div className="bg-white rounded-3xl p-6 border border-[#e5e7eb] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#111827]">Recent Policy Operations</h3>
                <p className="text-xs text-[#6b7280]">Live log of bookings, quotes, and issued policy certificates</p>
              </div>
              <button
                onClick={() => setPoliciesOpen(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#e5e7eb] text-[#374151] hover:bg-gray-50 transition-colors"
              >
                Open Policies Panel
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                    <th className="py-2.5 px-3 font-semibold">Reference</th>
                    <th className="py-2.5 px-3 font-semibold">Policy Name</th>
                    <th className="py-2.5 px-3 font-semibold">Insurer</th>
                    <th className="py-2.5 px-3 font-semibold">Destination</th>
                    <th className="py-2.5 px-3 font-semibold">Sum Insured</th>
                    <th className="py-2.5 px-3 font-semibold">Premium</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {stats?.recent_activities.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#ff5722]">
                        {item.ref_number}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#111827]">
                        {item.policy_name}
                      </td>
                      <td className="py-3 px-3 text-[#4b5563]">
                        {item.insurer}
                      </td>
                      <td className="py-3 px-3 text-[#4b5563]">
                        {item.destination}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#111827]">
                        {item.sum_insured}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#00a86b]">
                        {item.premium}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "confirmed" || item.status === "active"
                              ? "bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]"
                              : item.status === "cancelled"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Policies overlay */}
      <PoliciesPanel isOpen={policiesOpen} onClose={() => setPoliciesOpen(false)} />
    </div>
  );
}
