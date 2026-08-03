"use client";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-[#f4f7f9] overflow-hidden">
      <div className="flex-1 w-full h-full bg-white overflow-hidden">
        <ChatWindow />
      </div>
    </main>
  );
}
