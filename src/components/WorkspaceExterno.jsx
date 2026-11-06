"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Maximize2, Minus, RotateCw, WifiOff, X } from "lucide-react";
import { getTenantId } from "@/components/utils/api";
import LogoApp from "@/components/apps/LogoApp";
import { buscarAplicacao, encerrarAplicacao, selecionarAplicacao, useWorkspace, voltarAoCore } from "@/components/apps/aplicacoes";

// O WhatsApp Web recusa navegadores que ele não reconhece, e o padrão do Electron é um deles
const NAVEGADOR = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

const idDoWebview = (id) => `app-${id}`;
const BOTAO_BARRA = "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white";

function JanelaApp({ app, visivel }) {
  const webview = useRef(null);
  const [situacao, setSituacao] = useState("carregando");
  // Login separado por empresa: duas contas no mesmo computador não dividem o WhatsApp
  const [particao] = useState(() => `persist:apps-${getTenantId() || "geral"}`);

  useEffect(() => {
    const elemento = webview.current;
    const aoCarregar = () => setSituacao((atual) => (atual === "erro" ? atual : "pronto"));
    const aoIniciar = () => setSituacao((atual) => (atual === "erro" ? "carregando" : atual));
    // -3 é o Chromium avisando que uma navegação foi trocada por outra, não uma falha
    const aoFalhar = (evento) => { if (evento.isMainFrame && evento.errorCode !== -3) setSituacao("erro"); };

    elemento.addEventListener("did-stop-loading", aoCarregar);
    elemento.addEventListener("did-start-loading", aoIniciar);
    elemento.addEventListener("did-fail-load", aoFalhar);
    return () => {
      elemento.removeEventListener("did-stop-loading", aoCarregar);
      elemento.removeEventListener("did-start-loading", aoIniciar);
      elemento.removeEventListener("did-fail-load", aoFalhar);
    };
  }, []);

  return (
    <div className={`absolute inset-0 bg-white ${visivel ? "" : "invisible"}`}>
      <webview
        ref={webview}
        id={idDoWebview(app.id)}
        src={app.url}
        partition={particao}
        useragent={NAVEGADOR}
        allowpopups="true"
        style={{ width: "100%", height: "100%", border: "none" }}
      />

      {situacao !== "pronto" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b] text-center">
          {situacao === "erro" ? (
            <>
              <WifiOff size={26} className="text-zinc-500" aria-hidden />
              <p className="mt-4 text-sm font-semibold text-white">Não foi possível abrir {app.nome}</p>
              <p className="mt-1 text-xs text-zinc-500">Confira a internet e tente de novo.</p>
              <button type="button" onClick={() => webview.current?.reload()} className="mt-5 h-9 rounded-full bg-white px-4 text-xs font-semibold text-black transition-colors hover:bg-white/90">Tentar de novo</button>
            </>
          ) : (
            <>
              <LogoApp app={app} tamanho={56} />
              <Loader2 size={18} className="mt-5 animate-spin text-purple-400" aria-hidden />
              <p className="mt-3 text-xs text-zinc-500">Abrindo {app.nome}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Aba({ app, ativa }) {
  return (
    <div
      className={`flex h-9 min-w-0 max-w-44 shrink items-center gap-2 rounded-xl border pl-2 pr-1 transition-colors ${ativa ? "border-white/10 bg-white/[0.09]" : "border-transparent hover:bg-white/[0.05]"}`}
      style={{ WebkitAppRegion: "no-drag" }}
    >
      <button type="button" onClick={() => selecionarAplicacao(app.id)} className="flex min-w-0 flex-1 items-center gap-2">
        <LogoApp app={app} tamanho={20} />
        <span className={`truncate text-[13px] font-medium ${ativa ? "text-white" : "text-zinc-400"}`}>{app.nome}</span>
      </button>
      <button type="button" onClick={() => encerrarAplicacao(app.id)} aria-label={`Fechar ${app.nome}`} title="Fechar" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-white">
        <X size={13} />
      </button>
    </div>
  );
}

export default function WorkspaceExterno() {
  const { abertos, ativo } = useWorkspace();

  // Sem app aberto não existe nada na tela
  if (abertos.length === 0) return null;

  const appAtivo = ativo ? buscarAplicacao(ativo) : null;

  // As janelas continuam montadas ao voltar para o Core: é isso que mantém login e conversa abertos
  return (
    <div className={`fixed inset-0 z-[99999] flex flex-col bg-[#09090b] ${ativo ? "" : "pointer-events-none invisible"}`}>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#0c0c10] pl-3 pr-2" style={{ WebkitAppRegion: "drag" }}>
        <button
          type="button"
          onClick={voltarAoCore}
          className="flex h-9 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-[13px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.1] hover:text-white"
          style={{ WebkitAppRegion: "no-drag" }}
        >
          <ArrowLeft size={15} aria-hidden /> Raizan Core
        </button>

        <div className="h-5 w-px shrink-0 bg-white/10" />

        <div className="flex min-w-0 flex-1 items-center gap-1">
          {abertos.map((id) => <Aba key={id} app={buscarAplicacao(id)} ativa={id === ativo} />)}
        </div>

        <div className="flex shrink-0 items-center gap-0.5" style={{ WebkitAppRegion: "no-drag" }}>
          <button type="button" onClick={() => document.getElementById(idDoWebview(ativo))?.reload()} aria-label="Recarregar" title="Recarregar" className={BOTAO_BARRA}><RotateCw size={15} /></button>
          <button type="button" onClick={() => appAtivo && window.open(appAtivo.url, "_blank")} aria-label="Abrir no navegador" title="Abrir no navegador" className={BOTAO_BARRA}><ExternalLink size={15} /></button>
          <div className="mx-1.5 h-5 w-px bg-white/10" />
          <button type="button" onClick={() => window.electronAPI?.minimizarJanela()} aria-label="Minimizar" className={BOTAO_BARRA}><Minus size={15} /></button>
          <button type="button" onClick={() => window.electronAPI?.maximizarJanela()} aria-label="Maximizar" className={BOTAO_BARRA}><Maximize2 size={14} /></button>
          <button type="button" onClick={() => window.electronAPI?.fecharJanela()} aria-label="Fechar o sistema" className={`${BOTAO_BARRA} hover:bg-rose-500/20 hover:text-rose-300`}><X size={16} /></button>
        </div>
      </div>

      <div className="relative flex-1">
        {abertos.map((id) => <JanelaApp key={id} app={buscarAplicacao(id)} visivel={id === ativo} />)}
      </div>
    </div>
  );
}
