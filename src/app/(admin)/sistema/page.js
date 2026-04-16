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
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-24">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors">Gestão do Motor (Core)</h1>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Controle de atualizações e manutenção do software desktop.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LADO ESQUERDO: CONTROLES */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm dark:shadow-none transition-colors">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 mb-6 transition-all duration-500
                    ${status === 'downloading' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : 
                      (status === 'success' || status === 'ready') ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 
                      status === 'error' ? 'bg-rose-50 dark:bg-red-500/10 border-rose-200 dark:border-red-500/20' : 
                      'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20'}`}
                  >
                    {status === 'downloading' ? <RefreshCw size={32} className="text-blue-600 dark:text-blue-400 animate-spin" /> :
                     status === 'ready' ? <Zap size={32} className="text-emerald-600 dark:text-emerald-400 animate-pulse" /> :
                     status === 'success' ? <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" /> :
                     status === 'error' ? <AlertTriangle size={32} className="text-rose-600 dark:text-red-400" /> :
                     <Server size={32} className="text-purple-600 dark:text-purple-400" />}
                  </div>
                  
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 transition-colors">Atualização Remota</h2>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 transition-colors">Baixa e instala a versão mais recente empacotada.</p>
                  
                  {/* Se baixou tudo e tá pronto pra instalar, muda o botão */}
                  {status === 'ready' ? (
                    <button 
                      onClick={handleInstalar}
                      className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 dark:shadow-[0_0_15px_rgba(5,150,105,0.4)] active:scale-95"
                    >
                      <Zap size={18} /> Instalar e Reiniciar
                    </button>
                  ) : (
                    <button 
                      onClick={handleBuscarUpdate}
                      disabled={loading || status === 'downloading'}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95
                        ${(loading || status === 'downloading') 
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed shadow-none' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 dark:shadow-[0_0_15px_rgba(147,51,234,0.3)]'}`}
                    >
                      <DownloadCloud size={18} />
                      {status === 'downloading' ? "Processando..." : "Buscar Versão"}
                    </button>
                  )}
                </div>
              </div>

              {/* LADO DIREITO: O TERMINAL HACKER */}
              <div className="md:col-span-2">
                {/* A borda externa do terminal muda no modo claro, mas o miolo dele não! */}
                <div className="bg-[#0a0a0c] border border-zinc-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl h-full flex flex-col transition-colors">
                  
                  {/* Barra superior do Terminal (Mac Style Header) */}
                  <div className="bg-zinc-100 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3.5 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Botões do OS Mac */}
                      <div className="flex gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500/90 shadow-inner"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/90 shadow-inner"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/90 shadow-inner"></div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Terminal size={14} className="text-zinc-400 dark:text-zinc-500 transition-colors" />
                        <span className="text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400 transition-colors">raizan-updater.exe</span>
                      </div>
                    </div>
                    
                    {/* Barra de Progresso Estilizada */}
                    {(status === 'downloading' || status === 'ready') && (
                      <div className="flex items-center gap-3 w-1/3">
                        <span className="text-xs text-zinc-500 font-mono font-bold">{Math.round(progresso)}%</span>
                        <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden transition-colors">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                            style={{ width: `${progresso}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tela Preta do Terminal (Mantém o Hacker Style independente do modo) */}
                  <div className="p-6 flex-1 font-mono text-sm overflow-y-auto flex flex-col justify-end">
                    <pre className={`whitespace-pre-wrap font-medium transition-colors duration-300 leading-relaxed
                      ${status === 'error' ? 'text-rose-400' : 
                        status === 'ready' || status === 'success' ? 'text-emerald-400' : 
                        'text-emerald-500/90'}`}
                    >
                      {terminalLog}
                      {(loading || status === 'downloading') && <span className="animate-pulse font-black text-emerald-400">_</span>}
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