import type { Metadata } from "next";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";

export const metadata: Metadata = {
  title: "Dolphin Portal — One Partner. One Login. All Conversations.",
  description: "Enterprise Travel Insurance Support",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f4f7f9] min-h-screen text-[#1f2937]">
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
