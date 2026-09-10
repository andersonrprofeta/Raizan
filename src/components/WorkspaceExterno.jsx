"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function WorkspaceExterno() {
  const [app, setApp] = useState(null); // Vai guardar { nome: 'OMIE', url: '...' }

  useEffect(() => {
    // 🟢 Escuta o grito que o Header dá quando clica no Waffle Menu
    const handleAbrirApp = (e) => {
      setApp(e.detail);
    };

    window.addEventListener('abrirAppExterno', handleAbrirApp);
    return () => window.removeEventListener('abrirAppExterno', handleAbrirApp);
  }, []);

  // Se não tem nenhum app selecionado, ele fica invisível e não ocupa espaço
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#121214] flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* 🟢 BARRA DE CONTROLE DO RAIZAN CORE (Fica no topo) */}
      <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setApp(null)} // 🟢 FECHA A CORTINA E VOLTA PRO CORE
            className="flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-all text-sm font-bold border border-zinc-700"
          >
            <ArrowLeft size={16} /> Voltar ao Raizan
          </button>
          
          <div className="h-4 w-px bg-zinc-700"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-zinc-300 font-bold text-sm tracking-wide">
              Rodando {app.nome} Workspace
            </span>
          </div>
        </div>

        <button 
          onClick={() => window.open(app.url, '_blank')}
          className="text-zinc-500 hover:text-zinc-300 p-2"
          title="Abrir no navegador externo"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {/* 🟢 O NAVEGADOR EMBUTIDO (A MÁGICA) */}
      <div className="flex-1 bg-white relative">
        {/* @ts-ignore - webview é uma tag exclusiva do Electron, o React reclama se não puser o ignore */}
        <webview 
          src={app.url} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          allowpopups="true" // Permite que o OMIE abra modais e popups
        />
      </div>

    </div>
  );
}

