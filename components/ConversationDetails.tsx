"use client";
import { useState } from "react";
import { X, User, Calendar, FileText, Download, ChevronRight, ChevronDown } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { buildDownloadUrl, isAgentGeneratedArtifact } from "@/lib/api";
interface Props {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function ConversationDetails({ isOpenMobile, onCloseMobile }: Props) {
  const { messages, userId, sessionId } = useChatContext();
  const [docsOpen, setDocsOpen] = useState(true);

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
    <div className="flex flex-col h-full w-full xl:w-[280px] bg-white border-l border-[#e5e7eb]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
        <h2 className="font-bold text-[#1f2937] text-sm">Conversation Details</h2>
        <button onClick={onCloseMobile} className="text-[#6b7280] hover:text-[#1f2937] xl:hidden">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* About Box */}
        <div className="p-5 border-b border-[#e5e7eb]">
          <h3 className="text-xs font-bold text-[#1f2937] mb-2">About This Conversation</h3>
          <p className="text-xs font-light text-[#6b7280] leading-relaxed">
            All communication in this conversation is related to Travel Insurance only.
          </p>
        </div>

        {/* Accordion / List Items */}
        <div className="flex flex-col">
          <div className="flex items-start gap-3 px-5 py-4 border-b border-[#e5e7eb]">
            <User size={16} className="text-[#6b7280] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#1f2937]">Conversation Owner</p>
              <p className="text-xs font-light text-[#6b7280] mt-0.5">Dolphin Operations Team</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 px-5 py-4 border-b border-[#e5e7eb]">
            <Calendar size={16} className="text-[#6b7280] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#1f2937]">Created On</p>
              <p className="text-xs font-light text-[#6b7280] mt-0.5">21 Jun 2025, 09:15 AM</p>
            </div>
          </div>

          <div className="flex flex-col border-b border-[#e5e7eb]">
            <button 
              onClick={() => setDocsOpen(!docsOpen)}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#f8fafc] transition-colors w-full text-left"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-[#6b7280]" />
                <span className="text-xs font-bold text-[#1f2937]">Policy Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#6b7280]">{totalDocs}</span>
                {docsOpen ? (
                  <ChevronDown size={14} className="text-[#9ca3af]" />
                ) : (
                  <ChevronRight size={14} className="text-[#9ca3af]" />
                )}
              </div>
            </button>
            
            {docsOpen && (agentDocs.length > 0 || userDocs.length > 0) && (
              <div className="px-5 pb-4 flex flex-col gap-3">
                {agentDocs.map((filename, i) => (
                  <div key={`agent-${i}`} className="flex items-center gap-3 bg-[#f8fafc] p-2 rounded-lg border border-[#e5e7eb]">
                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600 shrink-0">
                       <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1f2937] truncate" title={filename}>{filename}</p>
                      <p className="text-[10px] font-light text-[#6b7280]">PDF Document</p>
                    </div>
                    <a
                      href={buildDownloadUrl(userId, sessionId, filename)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center text-[#6b7280] hover:bg-gray-100 rounded shrink-0"
                      title="Open"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))}
                {userDocs.map((doc, i) => {
                  const isImage = doc.mimeType.startsWith("image/");
                  if (isImage && doc.data) {
                    // Render inline thumbnail — no backend needed
                    return (
                      <div key={`user-${i}`} className="flex flex-col bg-[#fffbeb] rounded-lg border border-[#fde68a] overflow-hidden">
                        <img
                          src={`data:${doc.mimeType};base64,${doc.data}`}
                          alt={doc.name}
                          className="w-full object-cover"
                          style={{ maxHeight: 100 }}
                        />
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <FileText size={10} className="text-[#d97706] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[#1f2937] truncate">{doc.name}</p>
                            <p className="text-[9px] text-[#6b7280]">Uploaded by you</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // PDF — link to backend
                  return (
                    <a
                      key={`user-${i}`}
                      href={buildDownloadUrl(userId, sessionId, doc.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#fffbeb] p-2 rounded-lg border border-[#fde68a] hover:bg-[#fef9c3] transition-colors"
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center text-amber-600 shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1f2937] truncate">{doc.name}</p>
                        <p className="text-[10px] font-light text-[#6b7280]">Uploaded by you</p>
                      </div>
                      <Download size={14} className="text-[#9ca3af] shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
            
            {docsOpen && totalDocs === 0 && (
              <div className="px-5 pb-4">
                <p className="text-xs font-light text-[#9ca3af] text-center">No documents in this chat yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Danger Action */}
      <div className="p-5 border-t border-[#e5e7eb]">
        <button className="text-xs font-bold text-red-600 hover:underline">
          End Conversation
        </button>
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
          <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[85%] max-w-[320px] bg-white animate-in slide-in-from-right duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
