"use client";

import { useState } from "react";
import { X, User, Calendar, FileText, Download, ChevronRight, ChevronDown, Shield, FileCheck } from "lucide-react";
import { useChatContext } from "@/context/ChatContext";
import { buildDownloadUrl, isAgentGeneratedArtifact } from "@/lib/api";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function ConversationDetails({ isOpen, onClose, isOpenMobile, onCloseMobile }: Props) {
  const { messages, userId, sessionId, handleNewChat, openDocumentPreview } = useChatContext();
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
    <div className="flex flex-col h-full w-full w-[300px] xl:w-[320px] bg-white border-l border-[#e9edef] select-none text-[#111b21]">
      {/* WhatsApp Style Details Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e9edef] bg-[#f0f2f5]">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#008069]" />
          <h2 className="font-bold text-[#111b21] text-xs uppercase tracking-wider">Contact & Session Info</h2>
        </div>
        <button
          onClick={() => { onClose?.(); onCloseMobile?.(); }}
          className="text-[#54656f] hover:text-[#111b21] p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          title="Close details"
        >
          <X size={18} />
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
            className="flex items-center justify-between px-4 py-3 hover:bg-[#f9fafb] transition-colors w-full text-left font-bold text-xs text-[#374151]"
          >
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#ff5722]" />
              <span>Policy Documents</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fdeee9] text-[#ff5722]">
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
                  {agentDocs.map((filename, i) => {
                    const docUrl = buildDownloadUrl(userId, sessionId, filename);
                    return (
                      <div
                        key={`agent-${i}`}
                        onClick={() =>
                          openDocumentPreview({
                            url: docUrl,
                            title: filename,
                            filename,
                            mimeType: "application/pdf",
                          })
                        }
                        className="flex items-center gap-2 bg-[#f9fafb] p-2.5 rounded-xl border border-[#e5e7eb] hover:border-[#ff5722] hover:bg-white transition-all cursor-pointer group"
                        title={`Click to view ${filename}`}
                      >
                        <div className="w-8 h-8 bg-[#fdeee9] text-[#ff5722] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#fbd3c7] transition-colors">
                          <FileCheck size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate group-hover:text-[#ff5722] transition-colors" title={filename}>
                            {filename}
                          </p>
                          <p className="text-[10px] text-[#6b7280]">Generated Policy Guide</p>
                        </div>
                        <a
                          href={docUrl}
                          download={filename}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-[#ff5722] hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                          title="Download Document"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    );
                  })}

                  {userDocs.map((doc, i) => {
                    const isImage = doc.mimeType.startsWith("image/");
                    const downloadUrl = buildDownloadUrl(userId, sessionId, doc.name);
                    const previewUrl = isImage && doc.data ? `data:${doc.mimeType};base64,${doc.data}` : downloadUrl;

                    if (isImage) {
                      return (
                        <div
                          key={`user-${i}`}
                          onClick={() =>
                            openDocumentPreview({
                              url: previewUrl,
                              title: doc.name,
                              filename: doc.name,
                              isImage: true,
                              downloadUrl,
                            })
                          }
                          className="flex flex-col bg-white rounded-xl border border-[#e5e7eb] overflow-hidden hover:border-[#ff5722] transition-all cursor-pointer group"
                          title={`Click to view ${doc.name}`}
                        >
                          <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img
                              src={previewUrl}
                              alt={doc.name}
                              className="w-full object-cover group-hover:scale-103 transition-transform"
                              style={{ maxHeight: 90 }}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#f9fafb]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText size={11} className="text-[#6b7280] shrink-0" />
                              <p className="text-[10px] font-semibold text-[#111827] truncate">{doc.name}</p>
                            </div>
                            <a
                              href={downloadUrl}
                              download={doc.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#6b7280] hover:text-[#ff5722] p-1 rounded hover:bg-white transition-colors shrink-0"
                              title="Download Document"
                            >
                              <Download size={12} />
                            </a>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={`user-${i}`}
                        onClick={() =>
                          openDocumentPreview({
                            url: downloadUrl,
                            title: doc.name,
                            filename: doc.name,
                            mimeType: doc.mimeType,
                          })
                        }
                        className="flex items-center gap-2 bg-[#f9fafb] p-2.5 rounded-xl border border-[#e5e7eb] hover:bg-white hover:border-[#ff5722] transition-all cursor-pointer group"
                        title={`Click to view ${doc.name}`}
                      >
                        <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                          <FileText size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate group-hover:text-[#ff5722] transition-colors">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-[#6b7280]">User Upload</p>
                        </div>
                        <a
                          href={downloadUrl}
                          download={doc.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-[#ff5722] hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                          title="Download Document"
                        >
                          <Download size={13} />
                        </a>
                      </div>
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
      {isOpen && (
        <aside className="hidden lg:flex flex-col shrink-0 h-full animate-in slide-in-from-right duration-200">
          {content}
        </aside>
      )}

      {isOpenMobile && (
        <div className="fixed inset-0 z-40 flex lg:hidden justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => { onClose?.(); onCloseMobile?.(); }} />
          <aside className="relative flex flex-col h-full shadow-2xl z-10 w-[85%] max-w-[320px] bg-white animate-in slide-in-from-right duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
