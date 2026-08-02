import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";

export const metadata: Metadata = {
  title: "Dolphin Buddy — AI Insurance Support Assistant",
  description: "Instant AI insurance support, policy document PDF analysis, and downloadable guides.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden" suppressHydrationWarning>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
