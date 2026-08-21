"use client";

import { useState } from "react";
import {
  LayoutDashboard, Shield, FileText, Share2, Search, Database, LogOut,
  PanelLeftClose, PanelLeft, Plus, IndianRupee, MessageSquare, Sparkles, Megaphone
} from "lucide-react";
import Link from "next/link";
import { useChatContext } from "@/context/ChatContext";

import { usePathname } from "next/navigation";

interface Props {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenPolicies?: () => void;
  onClosePolicies?: () => void;
  policiesOpen?: boolean;
  onOpenCampaigns?: () => void;
  onCloseCampaigns?: () => void;
  campaignsOpen?: boolean;
}

export default function Sidebar({
  isOpenMobile,
  onCloseMobile,
  onOpenPolicies,
  onClosePolicies,
  policiesOpen,
  onOpenCampaigns,
  onCloseCampaigns,
  campaignsOpen,
}: Props) {
  const { logout, username, handleNewChat } = useChatContext();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // User initials for avatar
  const initials = (username || "DP")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isDashboardActive = pathname === "/dashboard";
  const isChatActive = pathname === "/" && !policiesOpen;

  const content = (
    <div
      className={`flex flex-col h-full bg-white text-[#111827] border-r border-[#e5e7eb] select-none transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-2 px-2" : "justify-between px-5"} pt-5 pb-3`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity cursor-pointer text-left"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Modern Dolphin Portal Ring Emblem */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="15" stroke="url(#dolphin_grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="75 25" />
              <circle cx="18" cy="18" r="4" fill="#ff5722" />
              <defs>
                <linearGradient id="dolphin_grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff5722" />
                  <stop offset="0.5" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#00a86b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[18px] font-black tracking-tight text-[#111827]">Dolphin</span>
              <span className="text-[18px] font-bold tracking-tight text-[#ff5722]">Buddy</span>
            </div>
          )}
        </button>

        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors hidden md:block cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Primary Black Action Pill Button */}
      <div className="px-4 py-2">
        <Link
          href="/"
          onClick={() => { handleNewChat(); onCloseMobile?.(); onClosePolicies?.(); }}
          className={`flex items-center justify-center gap-2 w-full bg-black text-white hover:bg-neutral-800 transition-all font-bold shadow-sm ${
            collapsed ? "py-2.5 rounded-xl px-0" : "py-3 px-4 rounded-full text-sm"
          }`}
          title="New Conversation / Quote"
        >
          <Plus size={16} />
          {!collapsed && <span className="truncate">New Conversation</span>}
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1.5 text-sm">
        {/* Dashboard Link (Dedicated Analytics View) */}
        <Link
          href="/dashboard"
          onClick={() => { onCloseMobile?.(); onClosePolicies?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3.5 px-3.5"} py-3 rounded-2xl transition-all ${
            isDashboardActive
              ? "bg-[#f3f4f6] text-[#111827] font-black"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-semibold"
          }`}
          title="Analytics Dashboard"
        >
          <LayoutDashboard size={19} className={isDashboardActive ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {/* AI Assistant (Live Chat Workspace) */}
        <Link
          href="/"
          onClick={() => { onCloseMobile?.(); onClosePolicies?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3.5 px-3.5"} py-3 rounded-2xl transition-all ${
            isChatActive
              ? "bg-[#f3f4f6] text-[#111827] font-black"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-semibold"
          }`}
          title="AI Assistant Chat"
        >
          <MessageSquare size={19} className={isChatActive ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Buddy Assistant</span>}
        </Link>

        {/* Policies & Plans */}
        <button
          onClick={() => { onCloseMobile?.(); onOpenPolicies?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3.5 px-3.5"} py-3 rounded-2xl transition-all text-left w-full cursor-pointer ${
            policiesOpen
              ? "bg-[#f3f4f6] text-[#111827] font-black"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-semibold"
          }`}
          title="Policies & Bookings"
        >
          <Shield size={19} className={policiesOpen ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Policies & Plans</span>}
        </button>

        {/* Campaigns & Broadcasts */}
        <button
          onClick={() => { onCloseMobile?.(); onOpenCampaigns?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3.5 px-3.5"} py-3 rounded-2xl transition-all text-left w-full cursor-pointer ${
            campaignsOpen
              ? "bg-[#f3f4f6] text-[#111827] font-black"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-semibold"
          }`}
          title="Broadcast Campaigns"
        >
          <Megaphone size={19} className={campaignsOpen ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Campaigns</span>}
        </button>

        {/* Knowledge Base */}
        <Link
          href="/data"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3.5 px-3.5"} py-3 rounded-2xl transition-all ${
            pathname === "/data"
              ? "bg-[#f3f4f6] text-[#111827] font-black"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-semibold"
          }`}
          title="Knowledge Base & Settings"
        >
          <Database size={19} className={pathname === "/data" ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Knowledge Base</span>}
        </Link>
      </nav>

      {/* Footer User Profile Card */}
      <div className="p-3 border-t border-[#e5e7eb] bg-white">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} p-2 rounded-xl hover:bg-[#f9fafb] transition-colors`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#111827] truncate leading-tight">
                  {username || "Partner Admin"}
                </span>
                <span className="text-[10px] text-[#9ca3af] truncate leading-tight">
                  Travel Insurance Admin
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              className="text-[#9ca3af] hover:text-red-600 p-1 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mt-2 w-full p-2 flex items-center justify-center text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-xl transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onCloseMobile} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[260px] bg-[#fbfbfd] animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
