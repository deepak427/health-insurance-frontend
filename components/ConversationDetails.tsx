"use client";

import { useState } from "react";
import { X, User, Calendar, FileText, Download, ChevronRight, ChevronDown, Shield, FileCheck } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { buildDownloadUrl, isAgentGeneratedArtifact } from "@/lib/api";

interface Props {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function ConversationDetails({ isOpenMobile, onCloseMobile }: Props) {
  const { messages, userId, sessionId, handleNewChat } = useChatContext();
  const [docsOpen, setDocsOpen] = useState(true);
  const [metadataOpen, setMetadataOpen] = useState(true);

  // Agent-generated PDFs only
  const agentDocs = Array.from(
    new Set(messages.flatMap((m) => m.artifacts || []).filter(isAgentGeneratedArtifact))
  );
  // User-uploaded attachments deduplicated by name
  const userDocs = Array.from(
    new Map(
      messages
        .filter((m) => m.role === "user" && m.userAttachment?.name)
        .map((m) => [
          m.userAttachment!.name,
          {
            name: m.userAttachment!.name,
            mimeType: m.userAttachment!.mimeType ?? "",
            data: m.userAttachment!.data,
          },
        ])
    ).values()
  );

  const totalDocs = agentDocs.length + userDocs.length;

  const content = (
    <div className="flex flex-col h-full w-full xl:w-[280px] bg-white border-l border-[#e5e7eb] select-none text-[#1f2937]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb] bg-[#fbfbfd]">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[#7b58dc]" />
          <h2 className="font-bold text-[#1f2937] text-xs uppercase tracking-wider">Session Details</h2>
        </div>
        <button onClick={onCloseMobile} className="text-[#6b7280] hover:text-[#1f2937] xl:hidden p-1">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Context metadata Accordion */}
        <div className="border-b border-[#e5e7eb]">
          <button
            onClick={() => setMetadataOpen(!metadataOpen)}
            className="flex items-center justify-between px-4 py-3 w-full text-left font-bold text-xs text-[#374151] hover:bg-[#f8fafc] transition-colors"
          >
            <span>Overview & Context</span>
            {metadataOpen ? <ChevronDown size={14} className="text-[#9ca3af]" /> : <ChevronRight size={14} className="text-[#9ca3af]" />}
          </button>

          {metadataOpen && (
            <div className="px-4 pb-3 flex flex-col gap-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <User size={14} className="text-[#6b7280] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1f2937]">Agent Operator</p>
                  <p className="text-[#6b7280] text-[11px]">Dolphin AI Operations</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar size={14} className="text-[#6b7280] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1f2937]">Active Thread ID</p>
                  <p className="text-[#6b7280] font-mono text-[10px] truncate max-w-[190px]" title={sessionId}>
                    {sessionId.slice(0, 18)}...
                  </p>
                </div>
              </div>

              <div className="mt-1 p-2.5 rounded-md bg-[#f8fafc] border border-[#e5e7eb] text-[11px] text-[#4b5563] leading-relaxed">
                All communications and PDF policy guides in this workspace are secure and encrypted.
              </div>
            </div>
          )}
        </div>

        {/* Policy Documents Accordion */}
        <div className="flex flex-col border-b border-[#e5e7eb]">
          <button 
            onClick={() => setDocsOpen(!docsOpen)}
            className="flex items-center justify-between px-4 py-3 hover:bg-[#f8fafc] transition-colors w-full text-left font-bold text-xs text-[#374151]"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#7b58dc]" />
              <span>Policy Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-[#f1f5f9] text-[#4b5563]">
                {totalDocs}
              </span>
              {docsOpen ? <ChevronDown size={14} className="text-[#9ca3af]" /> : <ChevronRight size={14} className="text-[#9ca3af]" />}
            </div>
          </button>
          
          {docsOpen && (
            <div className="px-4 pb-3 flex flex-col gap-2">
              {totalDocs === 0 ? (
                <p className="text-xs text-[#9ca3af] text-center py-4">No documents attached yet.</p>
              ) : (
                <>
                  {agentDocs.map((filename, i) => (
                    <div key={`agent-${i}`} className="flex items-center gap-2 bg-[#f8fafc] p-2 rounded-md border border-[#e5e7eb] hover:border-[#7b58dc] transition-all">
                      <div className="w-7 h-7 bg-[#ece7fe] text-[#5925dc] rounded flex items-center justify-center shrink-0">
                        <FileCheck size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1f2937] truncate" title={filename}>{filename}</p>
                        <p className="text-[10px] text-[#6b7280]">Generated Policy Guide</p>
                      </div>
                      <a
                        href={buildDownloadUrl(userId, sessionId, filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-[#5925dc] hover:bg-white rounded transition-colors shrink-0"
                        title="Download Document"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  ))}

                  {userDocs.map((doc, i) => {
                    const isImage = doc.mimeType.startsWith("image/");
                    if (isImage && doc.data) {
                      return (
                        <div key={`user-${i}`} className="flex flex-col bg-white rounded-md border border-[#e5e7eb] overflow-hidden">
                          <img
                            src={`data:${doc.mimeType};base64,${doc.data}`}
                            alt={doc.name}
                            className="w-full object-cover"
                            style={{ maxHeight: 90 }}
                          />
                          <div className="flex items-center gap-2 px-2 py-1 bg-[#f8fafc]">
                            <FileText size={10} className="text-[#6b7280] shrink-0" />
                            <p className="text-[10px] font-semibold text-[#1f2937] truncate">{doc.name}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <a
                        key={`user-${i}`}
                        href={buildDownloadUrl(userId, sessionId, doc.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#f8fafc] p-2 rounded-md border border-[#e5e7eb] hover:bg-[#f1f5f9] transition-colors"
                      >
                        <div className="w-7 h-7 bg-amber-100 text-amber-700 rounded flex items-center justify-center shrink-0">
                          <FileText size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1f2937] truncate">{doc.name}</p>
                          <p className="text-[10px] text-[#6b7280]">User Upload</p>
                        </div>
                        <Download size={13} className="text-[#9ca3af] shrink-0" />
                      </a>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#e5e7eb] bg-[#fbfbfd] flex items-center justify-between">
        <button
          onClick={() => { handleNewChat(); onCloseMobile?.(); }}
          className="text-xs font-medium text-[#5925dc] hover:underline"
        >
          Reset Session
        </button>
        <span className="text-[10px] text-[#9ca3af]">Dolphin v2.4</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden xl:flex flex-col shrink-0 h-full">
        {content}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-40 flex xl:hidden justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[85%] max-w-[280px] bg-white animate-in slide-in-from-right duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
