import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-epilogue",
  display: "swap",
});

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
    <html lang="en" className={epilogue.variable}>
      <body className="antialiased bg-[#f4f7f9] min-h-screen text-[#1f2937] font-[family-name:var(--font-epilogue)]">
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
