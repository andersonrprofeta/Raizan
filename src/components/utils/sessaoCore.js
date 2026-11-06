import { getHubUrl, getHeaders } from "@/components/utils/api";

const CHAVE_USUARIO = "@raizan:usuario";
const CHAVE_TERMINAL = "@raizan:terminal";
// Marca a sessão por usuário. As telas antigas só conferem se existe algo nesta chave.
const SESSAO_POR_USUARIO = "usuario";

const CHAVES_DA_SESSAO = [
  "@raizan:token", "@raizan:email", "@raizan:license", "@raizan:expires_at", "@raizan:modulos",
  "@raizan:nome", "@raizan:logo", "@raizan:user", CHAVE_USUARIO
];

export function lerUsuario() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO) || "null");
  } catch (e) {
    return null;
  }
}

// O limite da licença conta computadores: cada instalação guarda o próprio identificador
export function identificarTerminal() {
  let terminal = localStorage.getItem(CHAVE_TERMINAL);
  if (!terminal) {
    terminal = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(CHAVE_TERMINAL, terminal);
  }
  return terminal;
}

// O cargo digitado no cadastro diz mais do que o nome técnico do perfil
export function rotuloDoUsuario(usuario) {
  if (!usuario) return "";
  if (usuario.cargo) return usuario.cargo;
  return usuario.principal ? "Administrador Master" : usuario.perfil || "";
}

// Sessão por licença não tem usuário e continua vendo tudo o que a licença libera
export function temPermissao(chave) {
  const usuario = lerUsuario();
  if (!usuario) return true;
  const permissoes = usuario.permissoes || [];
  return permissoes.includes("*") || permissoes.includes(chave);
}

// @raizan:nome continua sendo o nome da empresa: etiquetas e mapas imprimem esse valor
export function guardarSessao(dados) {
  localStorage.setItem("@raizan:token", dados.token);
  localStorage.setItem("@raizan:email", dados.email);
  localStorage.setItem("@raizan:license", SESSAO_POR_USUARIO);
  localStorage.setItem("@raizan:expires_at", dados.expires_at || "");
  localStorage.setItem("@raizan:modulos", JSON.stringify(dados.modulos || []));
  localStorage.setItem("@raizan:nome", dados.nome || "");
  localStorage.setItem("@raizan:user", JSON.stringify({ nome: dados.nome, email: dados.email, tenant_id: dados.tenant_id }));
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados.usuario));
  if (dados.logo_url) localStorage.setItem("@raizan:logo", dados.logo_url);
  else localStorage.removeItem("@raizan:logo");
}

export function limparSessao() {
  CHAVES_DA_SESSAO.forEach((chave) => localStorage.removeItem(chave));
}

// Atualiza módulos e permissões ao abrir o Core, sem o usuário precisar sincronizar
export async function renovarSessao() {
  const res = await fetch(`${getHubUrl()}/api/hub/usuarios/sessao`, { headers: getHeaders() });
  const dados = await res.json();
  if (dados.success) guardarSessao(dados);
  return { ok: Boolean(dados.success), encerrada: Boolean(dados.sessaoEncerrada) };
}

export async function sairDoCore() {
  try {
    await fetch(`${getHubUrl()}/api/hub/usuarios/sair`, { method: "POST", headers: getHeaders() });
  } catch (e) {}
  limparSessao();
  window.location.href = "/login";
}
