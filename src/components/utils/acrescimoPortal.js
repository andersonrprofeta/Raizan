// Acréscimo de quem compra com CPF no Portal B2B. O percentual vem de Parâmetros de sistema.

const CHAVE = "@raizan:acrescimo_cpf";

export const guardarAcrescimo = (percentual) => localStorage.setItem(CHAVE, Number(percentual) || 0);

function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("raizan_user"));
  } catch (erro) {
    return null;
  }
}

// Sem navegador (renderização no servidor) não há lojista: vale o preço normal
export function fatorDoLojista(usuario) {
  if (typeof window === "undefined") return 1;

  const lojista = usuario || lerUsuario();
  const documento = String(lojista?.cpf_cnpj || lojista?.cnpj || lojista?.cpf || "").replace(/\D/g, "");
  const percentual = Number(localStorage.getItem(CHAVE)) || 0;
  return documento.length === 11 && percentual > 0 ? 1 + percentual / 100 : 1;
}
