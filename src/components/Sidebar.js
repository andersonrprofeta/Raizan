"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Settings, Database } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen sticky top-0 w-[260px] bg-[#09090b] border-r border-zinc-800/60 p-5 flex flex-col z-20">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          <Database size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight">
          Raizan Core
        </h1>
      </div>

      <nav className="flex flex-col gap-1.5">
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            pathname === "/" ? "bg-zinc-800/50 text-zinc-100 border border-zinc-700/50" : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100"
          }`}
        >
          <Home size={18} className={pathname === "/" ? "text-purple-400" : ""} /> Dashboard
        </Link>

        {/* ATUALIZADO AQUI: Produtos virou Pedidos */}
        <Link 
          href="/pedidos" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            pathname === "/pedidos" ? "bg-zinc-800/50 text-zinc-100 border border-zinc-700/50" : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100"
          }`}
        >
          <ShoppingBag size={18} className={pathname === "/pedidos" ? "text-purple-400" : ""} /> Pedidos
        </Link>

        <Link 
          href="/configuracoes" 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
            pathname === "/configuracoes" ? "bg-zinc-800/50 text-zinc-100 border border-zinc-700/50" : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100"
          }`}
        >
          <Settings size={18} className={pathname === "/configuracoes" ? "text-purple-400" : ""} /> Configurações
        </Link>
      </nav>
    </aside>
  );
}