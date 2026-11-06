// WhatsApp e E-mail ficam em hub_configuracoes, e não em hub_integracoes:
// as rotinas de sincronização leem aquela tabela, e estes apps não têm pedido nem catálogo.
import { getHubUrl, getTenantId } from "@/components/utils/api";

const ENDERECO = `${getHubUrl()}/api/hub/configuracoes/apps_integrados`;
export const EVENTO_APPS_INTEGRADOS = "raizan:apps-integrados";

const chaveLocal = (tenant) => `@raizan:apps_integrados_${tenant}`;

export function lerAppsGuardados() {
  try {
    return JSON.parse(localStorage.getItem(chaveLocal(getTenantId()))) || {};
  } catch {
    return {};
  }
}

export async function buscarAppsIntegrados() {
  const tenant = getTenantId();
  const resposta = await fetch(ENDERECO, { headers: { "x-tenant-id": tenant } });
  const dados = await resposta.json();
  if (!dados.success) throw new Error("Falha ao ler os apps conectados.");

  const conectados = dados.config || {};
  localStorage.setItem(chaveLocal(tenant), JSON.stringify(conectados));
  return conectados;
}

/** Passe null para desconectar. Lê antes de gravar para não apagar o outro app. */
export async function salvarAppIntegrado(id, valor) {
  const tenant = getTenantId();
  const atuais = await buscarAppsIntegrados();
  const conectados = { ...atuais, [id]: valor };
  if (valor === null) delete conectados[id];

  const resposta = await fetch(ENDERECO, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-tenant-id": tenant },
    body: JSON.stringify(conectados),
  });
  const dados = await resposta.json();
  if (!dados.success) throw new Error(dados.message || "Falha ao salvar.");

  localStorage.setItem(chaveLocal(tenant), JSON.stringify(conectados));
  window.dispatchEvent(new CustomEvent(EVENTO_APPS_INTEGRADOS, { detail: conectados }));
  return conectados;
}

/** Devolve o endereço pronto, ou null se não for um site válido. */
export function normalizarEndereco(texto) {
  const limpo = texto.trim();
  if (!limpo) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(limpo) ? limpo : `https://${limpo}`);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}
