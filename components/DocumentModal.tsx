"use client";

import { useEffect, useState } from "react";
import { X, Download, ExternalLink, FileText, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

export interface PreviewDocument {
  url: string;
  title: string;
  filename: string;
  mimeType?: string;
  isImage?: boolean;
  downloadUrl?: string;
}

interface Props {
  doc: PreviewDocument | null;
  onClose: () => void;
}

export default function DocumentModal({ doc, onClose }: Props) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setZoom(100);
    setRotation(0);
  }, [doc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (doc) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [doc, onClose]);

  if (!doc) return null;

  const isImg =
    doc.isImage ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(doc.filename) ||
    doc.mimeType?.startsWith("image/");

  const downloadHref = doc.downloadUrl || doc.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-1 sm:p-4 md:p-6 animate-in fade-in duration-150 select-none">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[96vh] sm:h-[92vh] max-h-[880px] flex flex-col overflow-hidden border border-[#e5e7eb] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white border-b border-[#e5e7eb] shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${isImg ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
              {isImg ? <ImageIcon size={17} /> : <FileText size={17} />}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-[#111827] truncate max-w-[140px] xs:max-w-[200px] sm:max-w-md md:max-w-lg" title={doc.title || doc.filename}>
                {doc.title || doc.filename}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#6b7280]">
                {isImg ? "Image Document" : "PDF Policy Document"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Image zoom controls */}
            {isImg && (
              <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5 mr-1 text-[#4b5563]">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-[11px] font-mono font-medium px-1.5">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(250, z + 25))}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Rotate"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            )}

            {/* Open in new tab */}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#4b5563] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-xl transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
              title="Open full page"
            >
              <ExternalLink size={15} />
              <span>Open Tab</span>
            </a>

            {/* Direct Download Button */}
            <a
              href={downloadHref}
              download={doc.filename}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title={`Download ${doc.filename}`}
            >
              <Download size={14} />
              <span className="hidden xs:inline">Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-xl transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 min-h-0 bg-[#f8fafc] relative overflow-hidden flex items-center justify-center">
          {isImg ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={doc.url}
                alt={doc.title || doc.filename}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease",
                  maxHeight: zoom === 100 ? "100%" : undefined,
                  maxWidth: zoom === 100 ? "100%" : undefined,
                }}
                className="object-contain rounded-lg shadow-md bg-white border border-gray-200"
              />
            </div>
          ) : (
            <iframe
              src={`${doc.url}#toolbar=1`}
              className="w-full h-full border-0 bg-white"
              title={doc.title || doc.filename}
            />
          )}
        </div>
      </div>
    </div>
  );
}
