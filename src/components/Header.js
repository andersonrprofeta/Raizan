"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Search } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userInitial, setUserInitial] = useState("R");
  
  // NOVO ESTADO PARA O SININHO DE ATUALIZAÇÃO
  const [updateStatus, setUpdateStatus] = useState(null); // 'downloading' ou 'ready'

  useEffect(() => {
    // 1. Controle da Licença
    const vencimento = localStorage.getItem("@raizan:expires_at");
    if (vencimento) {
      const hoje = new Date();
      const dataVenc = new Date(vencimento);
      const diferencaTempo = dataVenc - hoje;
      const dias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
      setDiasRestantes(dias);
    }

    // 2. Dados do Usuário
    const emailStr = localStorage.getItem("@raizan:email");
    if (emailStr) {
      setUserEmail(emailStr);
      setUserInitial(emailStr.charAt(0).toUpperCase());
    }

    // 3. O OUVIDO DO SININHO (Escutando o Electron em segundo plano)
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.onUpdateMessage((dados) => {
        if (dados.status === 'downloading') setUpdateStatus('downloading');
        if (dados.status === 'ready') setUpdateStatus('ready');
      });
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full h-16 mt-8 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between px-8 pr-40" style={{ WebkitAppRegion: 'drag' }}>
      
      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' }}>
        <h2 className="text-lg font-medium text-zinc-100">Visão Geral</h2>
        
        {diasRestantes !== null && diasRestantes <= 15 && diasRestantes > 0 && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(249,115,22,0.1)]">
            <AlertTriangle size={16} className="text-orange-400 animate-pulse" />
            <span className="text-xs font-medium text-orange-400">
              Licença expira em {diasRestantes} dias.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' }}>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Comandos rápidos..."
            className="bg-zinc-900 border border-zinc-800 text-zinc-200 pl-9 pr-4 py-1.5 rounded-full text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all w-64 placeholder:text-zinc-500"
          />
        </div>

        {/* O NOVO SININHO INTELIGENTE */}
        <div className="relative group cursor-pointer">
          <Link href={updateStatus ? "/sistema" : "#"} className="transition-colors relative block">
            <Bell size={20} className={updateStatus ? "text-purple-400 animate-pulse" : "text-zinc-400 hover:text-zinc-100"} />
            
            {/* Bolinha roxa só aparece se tiver notificação */}
            {updateStatus && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-[#09090b]"></span>
            )}
          </Link>

          {/* Balão de Tooltip que aparece ao passar o mouse (Se houver update) */}
          {updateStatus && (
            <div className="absolute top-full right-0 mt-3 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <p className="text-xs font-bold text-zinc-100 mb-1">
                {updateStatus === 'ready' ? '🚀 Atualização Pronta!' : '📦 Baixando Versão...'}
              </p>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Clique aqui para abrir o painel do motor e acompanhar.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800/60">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-zinc-200 leading-tight">Operador</span>
            <span className="text-xs text-zinc-500 max-w-[120px] truncate">{userEmail}</span>
          </div>
          
          <Link href="/conta" title="Minha Conta">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-zinc-950 hover:ring-purple-500/50 hover:scale-105 transition-all cursor-pointer font-bold text-white text-lg">
              {userInitial}
            </div>
          </Link>

        </div>
      </div>
    </header>
  );
}