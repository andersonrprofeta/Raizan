// Sessão do lojista e chamadas à API do portal.

import { getHeaders, getHubUrl } from "@/components/utils/api";

const CHAVE_USUARIO = "raizan_user";

export function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO));
  } catch (erro) {
    return null;
  }
}

export function salvarUsuario(usuario) {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

// O carrinho fica guardado: quem entra de novo continua de onde parou
export function sair() {
  localStorage.removeItem(CHAVE_USUARIO);
  localStorage.removeItem("@raizan:token");
  window.location.href = "/login-b2b";
}

export function tenantDoPortal() {
  return localStorage.getItem("@raizan:b2b_tenant_id") || lerUsuario()?.tenant_id || "";
}

export async function chamarApi(caminho, { metodo = "GET", corpo } = {}) {
  const tenantId = tenantDoPortal();
  const resposta = await fetch(`${getHubUrl()}${caminho}`, {
    method: metodo,
    headers: { ...getHeaders(), ...(tenantId && { "x-tenant-id": tenantId }) },
    ...(corpo && { body: JSON.stringify(corpo) }),
  });

  if (resposta.status === 401) {
    sair();
    throw new Error("Sessão expirada");
  }
  return resposta.json();
}
