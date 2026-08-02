"use client";
import { FilePlus, FileText, IndianRupee, BarChart3, MessageCircle, HeadphonesIcon, Database, LogOut } from "lucide-react";
import Link from "next/link";
import { useChatContext } from "@/context/ChatContext";

interface Props {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isOpenMobile, onCloseMobile }: Props) {
  const { logout, username } = useChatContext();

  const content = (
    <div className="flex flex-col h-full w-[220px] bg-[#0a192f] text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5">
        {/* Proper dolphin SVG — white, swimming shape */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.984 8.783c-1.332-1.936-3.792-3.14-6.425-3.14-1.295 0-2.527.31-3.626.866.52-2.316 2.584-4.062 5.067-4.062 2.85 0 5.161 2.31 5.161 5.16 0 .438-.057.863-.163 1.267a5.122 5.122 0 0 1-.014-.091zm9.324 7.64c-.958-3.325-3.418-5.748-6.685-6.683-.81-.233-1.666-.363-2.545-.38l-1.077-.021c.542.484 1.002 1.05 1.353 1.68l.215.385c.896 1.62 1.34 3.535 1.272 5.518l-.01.32c1.78-.184 3.393-1.052 4.544-2.355l1.636-1.848.067-1.127a5.534 5.534 0 0 0 .108-.501.996.996 0 0 1-.878.508c-.28 0-.546-.118-.737-.324l-2.072-2.222c-.383-.412-.358-1.055.054-1.439.412-.383 1.055-.357 1.439.055l1.838 1.973c.123.131.295.205.474.205h.001zm-5.75-8.52c-.615-.466-1.286-.867-1.998-1.196-1.293-.598-2.678-.897-4.113-.897-.992 0-1.97.16-2.91.468C3.896 7.425 1.155 9.775.228 12.87l-.147.494 2.112-2.348c.15-.167.315-.327.491-.478l.42-.355c.784-.663 1.678-1.168 2.657-1.498.412-.138.835-.23 1.264-.275l.435-.046c1.67-.176 3.336.262 4.673 1.233.15.108.297.22.441.336l.244.195c1.455 1.164 2.378 2.85 2.628 4.757.065.498.077 1.002.036 1.5l-.019.227c-.234 2.809-1.956 5.176-4.524 6.184l-2.028.794 3.385.163c2.72.13 5.37-1.195 6.953-3.488l2.257-3.265.172-.45c.162-.42.274-.858.337-1.309.055-.398-.016-.807-.205-1.158l-.946-1.745c-.464-.856-1.11-1.577-1.91-2.136z"/>
        </svg>
        <h1 className="text-[15px] font-bold tracking-tight text-white">
          Dolphin <span className="text-[#00a86b]">Portal</span>
        </h1>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 mt-4 flex flex-col gap-1.5">
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
          <FilePlus size={18} />
          <span>Create Policy</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
          <FileText size={18} />
          <span>My Policies</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
          <IndianRupee size={18} />
          <span>Claims</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
          <BarChart3 size={18} />
          <span>Reports</span>
        </Link>
        <Link href="/data" onClick={() => onCloseMobile?.()} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#132742] hover:text-white transition-colors">
          <Database size={18} />
          <span>Knowledge Base</span>
        </Link>
        <Link href="/" className="flex items-center justify-between px-4 py-3 mt-2 rounded-lg bg-[#132742] text-white relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#00a86b] before:rounded-r-md cursor-pointer">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <MessageCircle size={18} />
            <span>Buddy</span>
          </div>
          <span className="text-[9px] font-bold bg-[#00a86b] px-1.5 py-0.5 rounded text-white">LIVE</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 flex flex-col gap-1 border-t border-[#132742]">
        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-red-900/30 hover:text-red-400 transition-colors w-full text-left"
          title="Sign out"
        >
          <LogOut size={18} />
          <div className="flex flex-col items-start">
            <span>Sign Out</span>
            {username && <span className="text-[10px] text-[#94a3b8]/60">@{username}</span>}
          </div>
        </button>

        <div className="flex items-start gap-3 px-4 py-3 cursor-pointer group">
          <HeadphonesIcon size={20} className="text-[#94a3b8] group-hover:text-white transition-colors" />
          <div className="flex flex-col">
            <span className="text-xs text-[#94a3b8] group-hover:text-white transition-colors">Need Help?</span>
            <span className="text-xs font-semibold">Contact Support</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0 h-full border-r border-[#132742]">
        {content}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
