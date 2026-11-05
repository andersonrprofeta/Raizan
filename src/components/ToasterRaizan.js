"use client";

import { Toaster } from "react-hot-toast";

// Único Toaster do sistema: outro em uma página faz cada aviso aparecer duas vezes
const VIDRO_DO_AVISO =
  "!bg-white/90 dark:!bg-[#1c1c1e]/90 !text-zinc-900 dark:!text-zinc-100 backdrop-blur-xl " +
  "border border-black/[0.06] dark:border-white/[0.08] font-sans antialiased !text-sm font-medium tracking-tight " +
  "!shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_40px_-16px_rgba(0,0,0,0.3)] " +
  "dark:!shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_50px_-20px_rgba(0,0,0,0.9)]";

export default function ToasterRaizan() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={{ top: 20 }}
      toastOptions={{
        className: VIDRO_DO_AVISO,
        style: { borderRadius: 22, padding: "11px 16px", maxWidth: 420 },
        success: { duration: 3000, iconTheme: { primary: "#10b981", secondary: "#fff" } },
        error: { duration: 5000, iconTheme: { primary: "#f43f5e", secondary: "#fff" } },
        loading: { iconTheme: { primary: "#a855f7", secondary: "rgba(168,85,247,0.2)" } },
      }}
    />
  );
}
