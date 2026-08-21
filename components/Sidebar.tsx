"use client";

import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, Share2, Search, Database, LogOut,
  Plus, PanelLeftClose, PanelLeft, ShieldCheck, HeartPulse, Settings, FilePlus
} from "lucide-react";
import Link from "next/link";
import { useChatContext } from "@/context/ChatContext";

interface Props {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenPolicies?: () => void;
  onClosePolicies?: () => void;
  policiesOpen?: boolean;
}

export default function Sidebar({ isOpenMobile, onCloseMobile, onOpenPolicies, onClosePolicies, policiesOpen }: Props) {
  const { logout, username, handleNewChat } = useChatContext();
  const [collapsed, setCollapsed] = useState(false);

  const content = (
    <div
      className={`flex flex-col h-full bg-white text-[#111827] border-r border-[#e5e7eb] select-none transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} pt-6 pb-4`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* XLSync Ring Emblem */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="15" stroke="url(#xlsync_grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="75 25" />
              <circle cx="18" cy="18" r="4" fill="#2563eb" />
              <defs>
                <linearGradient id="xlsync_grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff5722" />
                  <stop offset="0.5" stopColor="#6366f1" />
                  <stop offset="1" stopColor="#00a86b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && (
            <div className="flex items-center gap-0.5">
              <span className="text-[20px] font-black tracking-tight text-[#111827]">XL</span>
              <span className="text-[20px] font-medium tracking-tight text-[#6366f1]">Sync</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-md text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors hidden md:block"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Primary Black Action Pill Button */}
      <div className="px-4 py-2">
        <button
          onClick={() => { handleNewChat(); onCloseMobile?.(); onClosePolicies?.(); }}
          className={`flex items-center justify-center gap-2 w-full bg-black text-white hover:bg-neutral-800 transition-all font-semibold shadow-sm ${
            collapsed ? "py-2.5 rounded-xl px-0" : "py-2.5 px-4 rounded-full text-xs"
          }`}
          title="New Conversation / Upload"
        >
          <FilePlus size={15} />
          {!collapsed && <span className="truncate">New Conversation</span>}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1 text-[13px]">
        {/* Dashboard Link (Hub) */}
        <Link
          href="/"
          onClick={() => { onCloseMobile?.(); onClosePolicies?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3 px-3.5"} py-2.5 rounded-xl transition-all ${
            !policiesOpen
              ? "bg-[#f3f4f6] text-[#111827] font-bold"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-medium"
          }`}
          title="Dashboard"
        >
          <LayoutDashboard size={18} className={!policiesOpen ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {/* Policies (Patients) */}
        <button
          onClick={() => { onCloseMobile?.(); onOpenPolicies?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3 px-3.5"} py-2.5 rounded-xl transition-all text-left w-full ${
            policiesOpen
              ? "bg-[#f3f4f6] text-[#111827] font-bold"
              : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-medium"
          }`}
          title="My Policies"
        >
          <Users size={18} className={policiesOpen ? "text-[#ff5722]" : "text-[#6b7280]"} />
          {!collapsed && <span className="truncate">Policies & Plans</span>}
        </button>

        {/* Reports */}
        <Link
          href="/data"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3 px-3.5"} py-2.5 rounded-xl text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-medium transition-all`}
          title="Knowledge Base & Catalogs"
        >
          <FileText size={18} className="text-[#6b7280]" />
          {!collapsed && <span className="truncate">Knowledge Base</span>}
        </Link>

        {/* Sharing / Catalogs */}
        <Link
          href="/data"
          onClick={() => onCloseMobile?.()}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3 px-3.5"} py-2.5 rounded-xl text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-medium transition-all`}
          title="Catalogs & Addons"
        >
          <Share2 size={18} className="text-[#6b7280]" />
          {!collapsed && <span className="truncate">Addons & VAS</span>}
        </Link>

        {/* Search */}
        <button
          onClick={() => { onCloseMobile?.(); }}
          className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-3 px-3.5"} py-2.5 rounded-xl text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827] font-medium transition-all w-full text-left`}
          title="Search"
        >
          <Search size={18} className="text-[#6b7280]" />
          {!collapsed && <span className="truncate">Search</span>}
        </button>
      </nav>

      {/* Footer User Profile Card */}
      <div className="p-3 border-t border-[#e5e7eb] bg-white">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} p-2 rounded-xl hover:bg-[#f9fafb] transition-colors`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Dark Circle XS Avatar */}
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
              XS
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#111827] truncate leading-tight">
                  {username || "XLSync Super Admin"}
                </span>
                <span className="text-[10px] text-[#9ca3af] truncate leading-tight">
                  Super Admin
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
