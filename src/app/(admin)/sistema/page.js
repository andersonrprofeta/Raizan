"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Server, DownloadCloud, Terminal, AlertTriangle, CheckCircle2, RefreshCw, Zap } from "lucide-react";

/* ======================================================================
   🎨 TOKENS DE DESIGN (mesmo padrão das outras telas)
   ====================================================================== */
const CARD =
  "rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

const PILULA_BASE =
  "w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-all active:scale-95";

// Cada estado tem sua cor, seu rótulo e seu ícone (classes completas para o Tailwind enxergar)
const ESTADOS = {
  idle: {
    rotulo: "Pronto",
    tile: "from-purple-500 to-violet-700 shadow-purple-500/30",
    luz: "bg-purple-500/15",
    selo: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
  downloading: {
    rotulo: "Em andamento",
    tile: "from-blue-500 to-indigo-700 shadow-blue-500/30",
    luz: "bg-blue-500/15",
    selo: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  ready: {
    rotulo: "Pronto para instalar",
    tile: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
    luz: "bg-emerald-500/15",
    selo: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  success: {
    rotulo: "Atualizado",
    tile: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
    luz: "bg-emerald-500/15",
    selo: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  error: {
    rotulo: "Erro",
    tile: "from-red-500 to-rose-700 shadow-red-500/30",
    luz: "bg-red-500/15",
    selo: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  },
};

export default function GestaoSistema() {
  const [loading, setLoading] = useState(false);
  const [terminalLog, setTerminalLog] = useState("Motor Raizan pronto.\nAguardando comando para buscar novas versões no servidor oficial.");
  const [status, setStatus] = useState("idle"); // idle, downloading, ready, error, success
  const [progresso, setProgresso] = useState(0);

  // Referência para rolar o terminal sempre até a última linha
  const fimDoTerminal = useRef(null);

  useEffect(() => {
    // Escuta as mensagens enviadas pelo Electron (Main.js) em tempo real
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.onUpdateMessage((dados) => {
        setTerminalLog((prev) => prev + `\n> ${dados.text}`);
        setProgresso(dados.progress || 0);
        setStatus(dados.status);

        if (dados.status === "success" || dados.status === "error" || dados.status === "ready") {
          setLoading(false);
        }
      });
    }
  }, []);

  // ✨ Melhoria: acompanha o fim do log automaticamente
  useEffect(() => {
    fimDoTerminal.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [terminalLog]);

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
    // 🛠️ proteção: antes dava erro se o Electron não existisse
    if (typeof window === "undefined" || !window.electronAPI) {
      setTerminalLog("ERRO: Ambiente Electron não detectado. Você está rodando no navegador?");
      setStatus("error");
      return;
    }
    setTerminalLog((prev) => prev + `\n> Iniciando sequência de reboot...`);
    // Manda o Electron fechar o programa e instalar a versão nova
    window.electronAPI.instalarAtualizacao();
  };

  const estado = ESTADOS[status] || ESTADOS.idle;
  const ocupado = loading || status === "downloading";
  const mostrarProgresso = status === "downloading" || status === "ready";

  const corTexto =
    status === "error"
      ? "text-rose-400"
      : status === "ready" || status === "success"
      ? "text-emerald-400"
      : "text-emerald-500/90";

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden relative transition-colors duration-300">
      {/* Luzes suaves de fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header />

        {/* ⚠️ sem z-index aqui: senão modais ficam atrás da Header/Sidebar */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-24 relative">
          <div className="max-w-4xl mx-auto space-y-8">

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Gestão do Motor (Core)</h1>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Controle de atualizações e manutenção do software desktop.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* LADO ESQUERDO: CONTROLES */}
              <div className="md:col-span-1">
                <div className={`${CARD} relative overflow-hidden p-6 flex flex-col items-center text-center h-full`}>
                  <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${estado.luz}`} />

                  {/* Ícone do estado */}
                  <div
                    className={`relative w-20 h-20 mb-5 flex items-center justify-center bg-gradient-to-br ${estado.tile} shadow-xl text-white transition-all duration-500`}
                    style={{ borderRadius: 24 }}
                  >
                    {status === "downloading" ? <RefreshCw size={34} className="animate-spin" /> :
                     status === "ready" ? <Zap size={34} className="animate-pulse" /> :
                     status === "success" ? <CheckCircle2 size={34} /> :
                     status === "error" ? <AlertTriangle size={34} /> :
                     <Server size={34} />}
                  </div>

                  {/* Selo de estado */}
                  <span className={`relative mb-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${estado.selo}`}>
                    {estado.rotulo}
                  </span>

                  <h2 className="relative text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Atualização Remota</h2>
                  <p className="relative text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-6 mt-1">Baixa e instala a versão mais recente empacotada.</p>

                  <div className="relative w-full mt-auto">
                    {/* Se baixou tudo e tá pronto pra instalar, muda o botão */}
                    {status === "ready" ? (
                      <button
                        onClick={handleInstalar}
                        className={`${PILULA_BASE} text-white bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25 hover:brightness-110`}
                      >
                        <Zap size={18} /> Instalar e Reiniciar
                      </button>
                    ) : (
                      <button
                        onClick={handleBuscarUpdate}
                        disabled={ocupado}
                        className={`${PILULA_BASE} ${
                          ocupado
                            ? "bg-black/[0.05] dark:bg-white/[0.07] text-zinc-400 dark:text-zinc-500 cursor-not-allowed active:scale-100"
                            : "text-white bg-gradient-to-b from-purple-500 to-purple-700 shadow-lg shadow-purple-500/25 hover:brightness-110"
                        }`}
                      >
                        <DownloadCloud size={18} />
                        {status === "downloading" ? "Processando..." : "Buscar Versão"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* LADO DIREITO: O TERMINAL */}
              <div className="md:col-span-2">
                {/* A moldura acompanha o tema, mas o miolo do terminal fica sempre escuro */}
                <div className="rounded-[28px] overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-[#0a0a0c] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-2xl h-full min-h-[320px] flex flex-col">

                  {/* Barra superior (estilo macOS) */}
                  <div className="bg-zinc-100/90 dark:bg-white/[0.05] backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex gap-1.5 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Terminal size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
                        <span className="text-xs font-semibold font-mono text-zinc-500 dark:text-zinc-400 truncate">raizan-updater.exe</span>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    {mostrarProgresso && (
                      <div className="flex items-center gap-3 w-1/3 min-w-[110px]">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold tabular-nums w-9 text-right">{Math.round(progresso)}%</span>
                        <div className="flex-1 h-1.5 bg-black/[0.08] dark:bg-white/[0.1] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                            style={{ width: `${Math.min(100, Math.max(0, progresso))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tela do terminal */}
                  <div className="p-6 flex-1 font-mono text-sm overflow-y-auto max-h-[420px] flex flex-col">
                    <div className="mt-auto">
                      <pre className={`whitespace-pre-wrap font-medium transition-colors duration-300 leading-relaxed ${corTexto}`}>
                        {terminalLog}
                        {ocupado && <span className="animate-pulse font-black text-emerald-400">_</span>}
                      </pre>
                      <div ref={fimDoTerminal} />
                    </div>
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