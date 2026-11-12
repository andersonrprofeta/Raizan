"use client";

// Conversa do módulo Meu site com a API (contrato em docs/RAIZAN-INSIGHT.md).
// Todas as rotas ficam em /api/hub/site, protegidas pelo token do Core. O tenant sai do token
// na API. O x-tenant-id e o tenant_id da URL são só o padrão das outras telas.
//
// Enquanto a API não tiver estas rotas, a resposta é "indisponivel" e a tela mostra como ativar
// a coleta. Nunca inventamos números: dado simulado só existe no ambiente de desenvolvimento.

import { getHubUrl, getHeaders, getTenantId } from "@/components/utils/api";

const CHAVE_SIMULADO = "@raizan:website-simulado";

// Só em `next dev` e só se a chave estiver ligada no navegador de quem programa.
// No build de produção esta condição vira false e o arquivo simulado nem entra no pacote.
function usarSimulado() {
  if (process.env.NODE_ENV === "production") return false;
  try {
    return localStorage.getItem(CHAVE_SIMULADO) === "1";
  } catch (e) {
    return false;
  }
}

/**
 * Resposta padronizada para as telas:
 * { estado: "ok", dados } | { estado: "indisponivel" } | { estado: "sem_permissao", mensagem } | { estado: "erro", mensagem }
 */
export async function chamarSite(caminho, { metodo = "GET", corpo } = {}) {
  if (process.env.NODE_ENV !== "production" && usarSimulado()) {
    const { responderSimulado } = await import("./simulado");
    return responderSimulado(caminho, { metodo, corpo });
  }

  let url = `${getHubUrl()}/api/hub/site${caminho}`;
  if (metodo === "GET") url += `${caminho.includes("?") ? "&" : "?"}tenant_id=${getTenantId()}`;

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: getHeaders(),
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch (e) {
    return { estado: "erro", mensagem: "Sem conexão com o servidor. Confira a internet e tente de novo." };
  }

  // Rota que ainda não existe na API: o módulo não foi ativado para esta empresa
  if (resposta.status === 404 || resposta.status === 501) return { estado: "indisponivel" };

  let json = null;
  try {
    json = await resposta.json();
  } catch (e) {
    return resposta.ok ? { estado: "indisponivel" } : { estado: "erro", mensagem: "O servidor respondeu de um jeito inesperado." };
  }

  if (resposta.status === 403) return { estado: "sem_permissao", mensagem: json?.message || "Seu usuário não tem acesso a esta informação." };
  if (!resposta.ok || json?.success === false) {
    return { estado: "erro", mensagem: json?.message || "Não foi possível concluir. Tente de novo em instantes." };
  }
  return { estado: "ok", dados: json };
}

// Monta a query string ignorando filtros vazios
export function consulta(filtros = {}) {
  const partes = Object.entries(filtros)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== "")
    .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`);
  return partes.length ? `?${partes.join("&")}` : "";
}

export const sitesDaEmpresa = () => chamarSite("/sites");
export const instalarSite = (corpo) => chamarSite("/sites", { metodo: "POST", corpo });
export const editarSite = (id, corpo) => chamarSite(`/sites/${encodeURIComponent(id)}`, { metodo: "PUT", corpo });
export const gerarChave = (id) => chamarSite(`/sites/${encodeURIComponent(id)}/chave`, { metodo: "POST" });
export const revogarChave = (id) => chamarSite(`/sites/${encodeURIComponent(id)}/chave`, { metodo: "DELETE" });
export const testarConexao = (id) => chamarSite(`/sites/${encodeURIComponent(id)}/testar`, { metodo: "POST" });
export const desconectarSite = (id) => chamarSite(`/sites/${encodeURIComponent(id)}`, { metodo: "DELETE" });

export const lerAnalytics = (filtros) => chamarSite(`/analytics${consulta(filtros)}`);
export const lerInteracoes = (filtros) => chamarSite(`/interacoes${consulta(filtros)}`);
export const lerInteracao = (id) => chamarSite(`/interacoes/${encodeURIComponent(id)}`);
export const atualizarInteracao = (id, corpo) => chamarSite(`/interacoes/${encodeURIComponent(id)}`, { metodo: "PATCH", corpo });
export const anotarInteracao = (id, texto) => chamarSite(`/interacoes/${encodeURIComponent(id)}/observacoes`, { metodo: "POST", corpo: { texto } });
export const lerGestao = (filtros) => chamarSite(`/gestao${consulta(filtros)}`);
