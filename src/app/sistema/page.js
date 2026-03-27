"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Server, DownloadCloud, Terminal, AlertTriangle, CheckCircle2, RefreshCw, Zap } from "lucide-react";

export default function GestaoSistema() {
  const [loading, setLoading] = useState(false);
  const [terminalLog, setTerminalLog] = useState("Motor Raizan pronto.\nAguardando comando para buscar novas versões no servidor oficial.");
  const [status, setStatus] = useState("idle"); // idle, downloading, ready, error, success
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    // Escuta as mensagens enviadas pelo Electron (Main.js) em tempo real
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.onUpdateMessage((dados) => {
        setTerminalLog((prev) => prev + `\n> ${dados.text}`);
        setProgresso(dados.progress || 0);
        setStatus(dados.status);
        
        if (dados.status === 'success' || dados.status === 'error' || dados.status === 'ready') {
          setLoading(false);
        }
      });
    }
  }, []);

  const handleBuscarUpdate = () => {
    if (typeof window === "undefined" || !window.electronAPI) {
      setTerminalLog("ERRO: Ambiente Electron não detectado. Você está rodando no navegador?");
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("downloading");
    setProgresso(0);
    setTerminalLog("Estabelecendo conexão segura com o servidor central...");
    
    // Dispara o gatilho pro Electron procurar o arquivo
    window.electronAPI.buscarAtualizacao();
  };

  const handleInstalar = () => {
    setTerminalLog((prev) => prev + `\n> Iniciando sequência de reboot...`);
    // Manda o Electron fechar o programa e instalar a versão nova
    window.electronAPI.instalarAtualizacao();
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Gestão do Motor (Core)</h1>
              <p className="text-sm text-zinc-400 mt-1">Controle de atualizações e manutenção do software desktop.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LADO ESQUERDO: CONTROLES */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 mb-4 transition-all duration-500
                    ${status === 'downloading' ? 'bg-blue-500/10 border-blue-500/20' : 
                      (status === 'success' || status === 'ready') ? 'bg-emerald-500/10 border-emerald-500/20' : 
                      status === 'error' ? 'bg-red-500/10 border-red-500/20' : 
                      'bg-purple-500/10 border-purple-500/20'}`}
                  >
                    {status === 'downloading' ? <RefreshCw size={32} className="text-blue-400 animate-spin" /> :
                     status === 'ready' ? <Zap size={32} className="text-emerald-400 animate-pulse" /> :
                     status === 'success' ? <CheckCircle2 size={32} className="text-emerald-400" /> :
                     status === 'error' ? <AlertTriangle size={32} className="text-red-400" /> :
                     <Server size={32} className="text-purple-400" />}
                  </div>
                  
                  <h2 className="text-lg font-bold text-zinc-100">Atualização Remota</h2>
                  <p className="text-xs text-zinc-400 mb-6">Baixa e instala a versão mais recente empacotada.</p>
                  
                  {/* Se baixou tudo e tá pronto pra instalar, muda o botão */}
                  {status === 'ready' ? (
                    <button 
                      onClick={handleInstalar}
                      className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]"
                    >
                      <Zap size={18} /> Instalar e Reiniciar
                    </button>
                  ) : (
                    <button 
                      onClick={handleBuscarUpdate}
                      disabled={loading || status === 'downloading'}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                        ${(loading || status === 'downloading') 
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'}`}
                    >
                      <DownloadCloud size={18} />
                      {status === 'downloading' ? "Processando..." : "Buscar Versão"}
                    </button>
                  )}
                </div>
              </div>

              {/* LADO DIREITO: O TERMINAL HACKER */}
              <div className="md:col-span-2">
                <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col">
                  
                  {/* Barra superior do Terminal */}
                  <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Terminal size={14} className="text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-500">raizan-updater.exe</span>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso Estilizada */}
                    {(status === 'downloading' || status === 'ready') && (
                      <div className="flex items-center gap-3 w-1/3">
                        <span className="text-xs text-zinc-500 font-mono">{Math.round(progresso)}%</span>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300" 
                            style={{ width: `${progresso}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tela Preta do Terminal */}
                  <div className="p-5 flex-1 font-mono text-sm overflow-y-auto flex flex-col justify-end">
                    <pre className={`whitespace-pre-wrap transition-colors duration-300
                      ${status === 'error' ? 'text-red-400' : 
                        status === 'ready' || status === 'success' ? 'text-emerald-400' : 
                        'text-emerald-500/80'}`}
                    >
                      {terminalLog}
                      {(loading || status === 'downloading') && <span className="animate-pulse">_</span>}
                    </pre>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}