"use client";

// Peça central que decide o que cada pessoa vê no módulo Meu site.
// As telas perguntam aqui e não espalham condições pela página.
// A API repete a mesma regra: esconder na tela não protege o dado.
//
// Permissões (as chaves da API vêm na fase 2):
//   website             → visão geral e analytics agregados (sem dados pessoais)
//   website/interacoes  → formulários e leads (contêm dados pessoais)
//   website/gestao      → licença, domínio, hospedagem e financeiro do site
// Sessão por licença (sem usuário) e usuário com "*" continuam vendo tudo, como no resto do Core.

import { BarChart3, Globe, Inbox, ShieldCheck } from "lucide-react";
import { getTenantId } from "@/components/utils/api";
import { lerUsuario, temPermissao } from "@/components/utils/sessaoCore";

function lerModulos() {
  try {
    return JSON.parse(localStorage.getItem("@raizan:modulos") || "[]");
  } catch (e) {
    return [];
  }
}

export function contextoDoPainel() {
  const usuario = lerUsuario();
  return {
    tenantId: getTenantId(),
    usuario,
    perfil: usuario?.perfil || null,
    modulos: lerModulos(),
    pode: temPermissao,
  };
}

// Catálogo das áreas do módulo. A ordem aqui é a ordem das abas.
const AREAS = [
  { id: "visao", rotulo: "Visão geral", icone: Globe, permissao: "website" },
  { id: "interacoes", rotulo: "Interações", icone: Inbox, permissao: "website/interacoes" },
  { id: "analytics", rotulo: "Analytics", icone: BarChart3, permissao: "website" },
  { id: "gestao", rotulo: "Gestão do site", icone: ShieldCheck, permissao: "website/gestao" },
];

export function resolverAreasDoSite(contexto) {
  return AREAS.filter((area) => contexto.pode(area.permissao));
}

// Blocos que a Visão geral pode montar. Cada um declara de que permissão depende.
const BLOCOS_DA_VISAO = [
  { id: "status", permissao: "website" },
  { id: "indicadores", permissao: "website" },
  { id: "oportunidades", permissao: "website/interacoes" },
  { id: "licenca", permissao: "website/gestao" },
];

export function resolverBlocosDaVisao(contexto) {
  return new Set(BLOCOS_DA_VISAO.filter((bloco) => contexto.pode(bloco.permissao)).map((bloco) => bloco.id));
}
