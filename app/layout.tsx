import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HIP — Health Insurance Assistant",
  description: "AI-powered health insurance support agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden" suppressHydrationWarning>{children}</body>
    </html>
  );
}
