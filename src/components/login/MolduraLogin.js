"use client";

import { useSyncExternalStore } from "react";
import { Minus, X } from "lucide-react";
import { getHubUrl } from "@/components/utils/api";

// O que o Raizan Core entrega hoje: aparece no login do painel
export const ECOSSISTEMA = ["ERP", "Loja virtual", "Portal B2B", "Compras", "Logística", "Sites", "App de vendas"];

// Guarda por aba a resposta "este endereço é um portal B2B?", para não perguntar à API a cada tela
const CHAVE_PORTAL = "@raizan:endereco_e_portal";

export function lerPortalDoEndereco() {
  try {
    return sessionStorage.getItem(CHAVE_PORTAL);
  } catch (e) {
    return null;
  }
}

// "sim" ou "nao" quando a API respondeu; null quando não deu para saber (API fora do ar, por exemplo)
export async function descobrirPortalDoEndereco() {
  const guardado = lerPortalDoEndereco();
  if (guardado) return guardado;

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 6000);
  try {
    const res = await fetch(`${getHubUrl()}/api/hub/integracoes/b2b/identificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url_acesso: window.location.hostname }),
      signal: controle.signal
    });
    if (!res.ok) return null;
    const data = await res.json();
    const resposta = data.success ? "sim" : "nao";
    try { sessionStorage.setItem(CHAVE_PORTAL, resposta); } catch (e) {}
    return resposta;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(limite);
  }
}

// No navegador não existe window.electronAPI: só o app instalado mostra os botões da janela
const semAssinatura = () => () => {};

export function useNoAplicativo() {
  return useSyncExternalStore(semAssinatura, () => Boolean(window.electronAPI), () => false);
}

// O link para o portal B2B só aparece no navegador e quando este endereço não foi recusado como portal
export function useMostrarLinkDoPortal() {
  return useSyncExternalStore(semAssinatura, () => !window.electronAPI && lerPortalDoEndereco() !== "nao", () => false);
}

// A janela do app não tem a moldura do Windows: sem isto, o login só fechava com Ctrl+F4
export function ControlesDaJanela({ claro = false }) {
  const noAplicativo = useNoAplicativo();
  if (!noAplicativo) return null;

  const botao = `flex h-8 w-11 items-center justify-center rounded-full transition-colors ${
    claro ? "text-zinc-500 hover:bg-black/[0.06] hover:text-zinc-900" : "text-zinc-400 hover:bg-white/10 hover:text-white"
  }`;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex h-11 items-center justify-end gap-1 px-2" style={{ WebkitAppRegion: "drag" }}>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" }}>
        <button type="button" onClick={() => window.electronAPI?.minimizarJanela?.()} aria-label="Minimizar" title="Minimizar" className={botao}>
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI?.fecharJanela?.()}
          aria-label="Fechar (o Raizan Core continua na bandeja)"
          title="Fechar (continua na bandeja)"
          className={`${botao} hover:!bg-rose-500 hover:!text-white`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
