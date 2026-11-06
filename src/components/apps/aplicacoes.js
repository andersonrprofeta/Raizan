import { useSyncExternalStore } from "react";

export const PROVEDORES_EMAIL = [
  { id: "hostinger", nome: "Hostinger", url: "https://mail.hostinger.com/" },
  { id: "google", nome: "Google Workspace", url: "https://mail.google.com/" },
  { id: "microsoft", nome: "Microsoft 365", url: "https://outlook.office.com/mail/" },
  { id: "zoho", nome: "Zoho Mail", url: "https://mail.zoho.com/" },
  { id: "outro", nome: "Outro provedor", url: "" },
];

// Cada aplicação só aparece depois de conectada. O Omie vem da integração que já existe na empresa.
export function montarAplicacoes(conectados, plataformas) {
  const lista = [];
  if (conectados.whatsapp) {
    lista.push({ id: "whatsapp", nome: "WhatsApp", descricao: "Conversas com clientes", url: "https://web.whatsapp.com/", logo: "/whatsapp.svg" });
  }
  if (conectados.email) {
    lista.push({ id: "email", nome: "E-mail", descricao: conectados.email.nome, url: conectados.email.url });
  }
  if (plataformas.has("omie")) {
    lista.push({ id: "omie", nome: "Omie", descricao: "Integração ativa", url: "https://app.omie.com.br/", logo: "/omie.png" });
  }
  return lista;
}

const VAZIO = { abertos: [], ativo: null };
let estado = VAZIO;
const aplicacoes = {};
const ouvintes = new Set();

export const buscarAplicacao = (id) => aplicacoes[id];

function mudar(novo) {
  estado = { ...estado, ...novo };
  ouvintes.forEach((ouvinte) => ouvinte());
}

const ouvir = (ouvinte) => {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
};

export const useWorkspace = () => useSyncExternalStore(ouvir, () => estado, () => VAZIO);

// A sessão só fica viva dentro do app desktop. No navegador, cada aplicação abre em outra aba.
export function abrirAplicacao(app) {
  if (!window.electronAPI) {
    window.open(app.url, "_blank", "noopener");
    return;
  }
  aplicacoes[app.id] = app;
  const abertos = estado.abertos.includes(app.id) ? estado.abertos : [...estado.abertos, app.id];
  mudar({ abertos, ativo: app.id });
}

export const voltarAoCore = () => mudar({ ativo: null });

export const selecionarAplicacao = (id) => mudar({ ativo: id });

export function encerrarAplicacao(id) {
  const abertos = estado.abertos.filter((aberto) => aberto !== id);
  mudar({ abertos, ativo: estado.ativo === id ? abertos[abertos.length - 1] ?? null : estado.ativo });
}
