"use client";

import { useState } from "react";
import {
  FileText, IndianRupee, BarChart3, MessageCircle, Database, LogOut,
  FolderGit2, ChevronDown, ChevronRight, Sparkles,
  Shield, Settings, HelpCircle, PanelLeftClose, PanelLeft
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
  const { logout, username } = useChatContext();
  const [collapsed, setCollapsed] = useState(false);

  // Accordion section states (GitLab tree menu style)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ai: true,
    code: true,
    manage: false,
    plan: false,
    settings: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const content = (
    <div
      className={`flex flex-col h-full bg-[#fbfbfd] text-[#1f2937] border-r border-[#e5e7eb] select-none transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-4"} py-3.5 border-b border-[#e5e7eb] bg-white`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* GitLab / Dolphin Enterprise Emblem */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7b58dc] to-[#e24329] flex items-center justify-center text-white shrink-0 shadow-xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12.984 8.783c-1.332-1.936-3.792-3.14-6.425-3.14-1.295 0-2.527.31-3.626.866.52-2.316 2.584-4.062 5.067-4.062 2.85 0 5.161 2.31 5.161 5.16 0 .438-.057.863-.163 1.267a5.122 5.122 0 0 1-.014-.091zm9.324 7.64c-.958-3.325-3.418-5.748-6.685-6.683-.81-.233-1.666-.363-2.545-.38l-1.077-.021c.542.484 1.002 1.05 1.353 1.68l.215.385c.896 1.62 1.34 3.535 1.272 5.518l-.01.32c1.78-.184 3.393-1.052 4.544-2.355l1.636-1.848.067-1.127a5.534 5.534 0 0 0 .108-.501.996.996 0 0 1-.878.508c-.28 0-.546-.118-.737-.324l-2.072-2.222c-.383-.412-.358-1.055.054-1.439.412-.383 1.055-.357 1.439.055l1.838 1.973c.123.131.295.205.474.205h.001z"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-[#1f2937] leading-tight truncate">
                Dolphin <span className="text-[#7b58dc]">Portal</span>
              </span>
              <span className="text-[10px] text-[#6b7280] font-normal leading-tight truncate">
                Enterprise AI Hub
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tree (GitLab style) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5 text-[13px]">
        {/* Project Section Title */}
        {!collapsed && (
          <div className="px-2.5 py-1 text-[11px] font-bold text-[#4b5563] uppercase tracking-wider">
            Project
          </div>
        )}

        {/* AI Group */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection("ai")}
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-2.5 py-1.5 rounded-md text-[#374151] hover:bg-[#f1f5f9] transition-colors w-full font-medium`}
            title="AI & Assistant"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles size={16} className="text-[#7b58dc] shrink-0" />
              {!collapsed && <span className="truncate">AI Assistant</span>}
            </div>
            {!collapsed && (
              expandedSections.ai ? <ChevronDown size={14} className="text-[#9ca3af]" /> : <ChevronRight size={14} className="text-[#9ca3af]" />
            )}
          </button>

          {(expandedSections.ai || collapsed) && (
            <div className={`flex flex-col gap-0.5 ${!collapsed ? "pl-6 mt-0.5" : ""}`}>
              <Link
                href="/"
                onClick={() => { onCloseMobile?.(); onClosePolicies?.(); }}
                className={`flex items-center ${collapsed ? "justify-center px-1.5" : "justify-between px-2.5"} py-1.5 rounded-md transition-all ${
                  !policiesOpen
                    ? "bg-[#ece7fe] text-[#5925dc] font-semibold"
                    : "text-[#4b5563] hover:bg-[#f1f5f9] hover:text-[#1f2937]"
                }`}
                title="Buddy Live AI"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageCircle size={15} className={!policiesOpen ? "text-[#5925dc]" : "text-[#6b7280]"} />
                  {!collapsed && <span className="truncate">Buddy Chat</span>}
                </div>
                {!collapsed && (
                  <span className="text-[9px] font-bold bg-[#00a86b] text-white px-1.5 py-0.2 rounded shadow-xs">
                    LIVE
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>

        {/* Code / Policies Section */}
        <div className="flex flex-col mt-1">
          <button
            onClick={() => toggleSection("code")}
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-2.5 py-1.5 rounded-md text-[#374151] hover:bg-[#f1f5f9] transition-colors w-full font-medium`}
            title="Code & Policies"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FolderGit2 size={16} className="text-[#6b7280] shrink-0" />
              {!collapsed && <span className="truncate">Policies & Plans</span>}
            </div>
            {!collapsed && (
              expandedSections.code ? <ChevronDown size={14} className="text-[#9ca3af]" /> : <ChevronRight size={14} className="text-[#9ca3af]" />
            )}
          </button>

          {(expandedSections.code || collapsed) && (
            <div className={`flex flex-col gap-0.5 ${!collapsed ? "pl-6 mt-0.5" : ""}`}>
              <button
                onClick={() => { onCloseMobile?.(); onOpenPolicies?.(); }}
                className={`flex items-center ${collapsed ? "justify-center px-1.5" : "justify-between px-2.5"} py-1.5 rounded-md transition-all text-left w-full ${
                  policiesOpen
                    ? "bg-[#ece7fe] text-[#5925dc] font-semibold"
                    : "text-[#4b5563] hover:bg-[#f1f5f9] hover:text-[#1f2937]"
                }`}
                title="My Policies"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className={policiesOpen ? "text-[#5925dc]" : "text-[#6b7280]"} />
                  {!collapsed && <span className="truncate">My Policies</span>}
                </div>
              </button>

              <Link
                href="/data"
                onClick={() => onCloseMobile?.()}
                className={`flex items-center ${collapsed ? "justify-center px-1.5" : "gap-2 px-2.5"} py-1.5 rounded-md text-[#4b5563] hover:bg-[#f1f5f9] hover:text-[#1f2937] transition-all`}
                title="Knowledge Base & Catalogs"
              >
                <Database size={15} className="text-[#6b7280]" />
                {!collapsed && <span className="truncate">Knowledge Base</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Manage Section */}
        <div className="flex flex-col mt-1">
          <button
            onClick={() => toggleSection("manage")}
            className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-2.5 py-1.5 rounded-md text-[#374151] hover:bg-[#f1f5f9] transition-colors w-full font-medium`}
            title="Manage"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Shield size={16} className="text-[#6b7280] shrink-0" />
              {!collapsed && <span className="truncate">Claims & Billing</span>}
            </div>
            {!collapsed && (
              expandedSections.manage ? <ChevronDown size={14} className="text-[#9ca3af]" /> : <ChevronRight size={14} className="text-[#9ca3af]" />
            )}
          </button>

          {(expandedSections.manage || collapsed) && !collapsed && (
            <div className="flex flex-col gap-0.5 pl-6 mt-0.5">
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#6b7280] hover:bg-[#f1f5f9] cursor-pointer">
                <IndianRupee size={15} />
                <span>Claims</span>
              </span>
              <span className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#6b7280] hover:bg-[#f1f5f9] cursor-pointer">
                <BarChart3 size={15} />
                <span>Reports</span>
              </span>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="flex flex-col mt-1">
          <Link
            href="/data"
            onClick={() => onCloseMobile?.()}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2.5 py-1.5 rounded-md text-[#374151] hover:bg-[#f1f5f9] transition-colors font-medium`}
            title="Settings"
          >
            <Settings size={16} className="text-[#6b7280] shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-2 border-t border-[#e5e7eb] bg-white flex flex-col gap-1">
        {/* Help & Support */}
        <button
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2.5 py-1.5 rounded-md text-[#6b7280] hover:bg-[#f1f5f9] hover:text-[#1f2937] text-xs transition-colors w-full text-left`}
          title="Help"
        >
          <HelpCircle size={16} className="shrink-0" />
          {!collapsed && <span>Help & Docs</span>}
        </button>

        {/* Sign out */}
        <button
          onClick={logout}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2.5 py-1.5 rounded-md text-[#dc2626] hover:bg-red-50 text-xs transition-colors w-full text-left`}
          title="Sign Out"
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold">Sign Out</span>
              {username && <span className="text-[10px] text-gray-500 truncate">@{username}</span>}
            </div>
          )}
        </button>

        {/* Collapse Sidebar Button (Exact GitLab Bottom Control) */}
        <div className="pt-1 border-t border-[#f1f5f9] hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2.5 py-1.5 rounded-md text-[#6b7280] hover:bg-[#f1f5f9] hover:text-[#1f2937] text-xs transition-colors w-full`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile Off-canvas Drawer */}
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
