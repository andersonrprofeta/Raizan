"use client";

// Avisos do módulo Meu site para o sino do Core:
//  - novos contatos do site (formulários), para quem tem a permissão de leads;
//  - vencimentos dos serviços pagos à Raizan (30, 15 e 5 dias antes e carência), para quem tem website/gestao.
// Peça isolada: o sino só encaixa o resultado. Sem o módulo "website" liberado ou sem a permissão,
// não faz nenhuma chamada. Se a API ainda não tiver a rota, para de perguntar.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Bell, Inbox, Receipt } from "lucide-react";
import { NotificacaoVidro } from "@/components/checkout/estilos";
import { temPermissao } from "@/components/utils/sessaoCore";
import { lerAvisos, lerServicos } from "./dados";

const INTERVALO_MS = 30000;
// Vencimento muda no máximo uma vez por dia: confere ao abrir e a cada 30 minutos
const INTERVALO_COBRANCA_MS = 30 * 60 * 1000;
const CHAVE_VISTOS = "@raizan:avisos_site_vistos";
const MAXIMO_GUARDADO = 200;
const MAXIMO_TOASTS = 2;
const ICONE_APP = "https://raizan.com.br/wp-content/uploads/2024/02/favicon.png";
export const EVENTO_ABRIR_INTERACAO = "raizan:abrir-interacao";

// Fica fora do componente porque o Header monta de novo a cada troca de tela
let chavesJaAvisadas = null;

export function podeReceberAvisosDoSite() {
  try {
    const modulos = JSON.parse(localStorage.getItem("@raizan:modulos") || "[]");
    return Array.isArray(modulos) && modulos.includes("website") && temPermissao("website/interacoes");
  } catch (e) {
    return false;
  }
}

function lerVistos() {
  try {
    const salvo = localStorage.getItem(CHAVE_VISTOS);
    return salvo ? new Set(JSON.parse(salvo)) : null;
  } catch (e) {
    return null;
  }
}

function guardarVistos(chaves) {
  try {
    localStorage.setItem(CHAVE_VISTOS, JSON.stringify([...chaves].slice(-MAXIMO_GUARDADO)));
  } catch (e) { }
}

function moduloLiberado() {
  try {
    const modulos = JSON.parse(localStorage.getItem("@raizan:modulos") || "[]");
    return Array.isArray(modulos) && modulos.includes("website");
  } catch (e) {
    return false;
  }
}

export function podeReceberAvisosDeCobranca() {
  return moduloLiberado() && temPermissao("website/gestao");
}

export function linkDoAviso(item) {
  if (item.tipo === "cobranca") return "/website?aba=gestao";
  const site = item.site_id ? `&site=${encodeURIComponent(item.site_id)}` : "";
  return `/website?aba=interacoes${site}&id=${encodeURIComponent(item.id)}`;
}

// Se a tela Meu site já estiver aberta, o link não remonta a página: ela escuta este evento
export function pedirAberturaDaInteracao(item) {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_ABRIR_INTERACAO, { detail: { site: item.site_id, id: item.id } }));
  } catch (e) { }
}

function detalheDoAviso(item) {
  return [item.formulario, item.site_nome].filter(Boolean).join(" · ");
}

function avisar(novos) {
  if (!novos.length) return;
  try {
    new Audio("/Newemail.mp3").play().catch(() => { });
  } catch (e) { }
  novos.slice(0, MAXIMO_TOASTS).forEach((item) => {
    try {
      if (Notification.permission === "granted") new Notification(`Novo contato do site: ${item.nome}`, { body: detalheDoAviso(item), icon: ICONE_APP, silent: true });
    } catch (e) { }
    toast.custom((t) => (
      <NotificacaoVidro visivel={t.visible} Icone={Inbox} titulo="Novo contato do site" subtitulo={item.nome} detalhe={detalheDoAviso(item)} />
    ), { duration: 7000 });
  });
  const restantes = novos.length - MAXIMO_TOASTS;
  if (restantes > 0) {
    toast.custom((t) => (
      <NotificacaoVidro visivel={t.visible} Icone={Bell} titulo={`Mais ${restantes} contatos do site`} subtitulo="Abra o sino para ver tudo" />
    ), { duration: 6000 });
  }
}

/** { itens, novos (número para o contador), destacados (Set), marcarVistos() } */
export function useAvisosDoSite() {
  const [contatos, setItens] = useState([]);
  const [cobrancas, setCobrancas] = useState([]);
  const [vistos, setVistos] = useState(() => new Set());
  const [destacados, setDestacados] = useState(() => new Set());

  useEffect(() => {
    if (!podeReceberAvisosDoSite()) return undefined;
    let parado = false;
    let timer = null;

    const checar = async () => {
      const r = await lerAvisos();
      if (parado) return;
      // API sem a rota ou usuário sem a permissão: não insiste
      if (r.estado === "indisponivel" || r.estado === "sem_permissao") {
        clearInterval(timer);
        return;
      }
      if (r.estado !== "ok" || !Array.isArray(r.dados?.itens)) return;

      const lista = r.dados.itens;
      const chaves = lista.map((item) => item.chave);
      let salvos = lerVistos();
      if (!salvos) {
        // Primeira vez neste computador: não acusa o histórico inteiro
        salvos = new Set(chaves);
        guardarVistos(salvos);
      }
      // Ao abrir o programa não dispara aviso do que chegou com ele fechado: isso fica no contador
      if (chavesJaAvisadas) {
        const avisadas = chavesJaAvisadas;
        avisar(lista.filter((item) => !avisadas.has(item.chave)));
      }
      chavesJaAvisadas = new Set([...(chavesJaAvisadas || []), ...chaves]);

      setItens(lista);
      setVistos(salvos);
    };

    checar();
    timer = setInterval(checar, INTERVALO_MS);
    return () => {
      parado = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!podeReceberAvisosDeCobranca()) return undefined;
    let parado = false;
    let timer = null;
    const checar = async () => {
      const r = await lerServicos();
      if (parado) return;
      if (r.estado === "indisponivel" || r.estado === "sem_permissao") {
        clearInterval(timer);
        return;
      }
      if (r.estado !== "ok" || !Array.isArray(r.dados?.servicos)) return;
      // Quem não recebe contatos também precisa lembrar o que já viu
      setVistos((atual) => (atual.size ? atual : lerVistos() || atual));
      setCobrancas(r.dados.servicos.filter((s) => s.alerta).map((s) => ({
        chave: s.alerta.chave,
        tipo: "cobranca",
        id: String(s.id),
        nome: s.alerta.texto,
        nivel: s.alerta.nivel,
        detalhe: s.cobranca_aberta ? "Toque para ver e pagar" : "Serviços e pagamentos",
      })));
    };
    checar();
    timer = setInterval(checar, INTERVALO_COBRANCA_MS);
    return () => {
      parado = true;
      clearInterval(timer);
    };
  }, []);

  // Vencimentos primeiro: são poucos e pedem ação
  const itens = [...cobrancas, ...contatos];

  const marcarVistos = useCallback(() => {
    const chaves = itens.map((item) => item.chave);
    setDestacados(new Set(chaves.filter((chave) => !vistos.has(chave))));
    const todos = new Set([...vistos, ...chaves]);
    setVistos(todos);
    guardarVistos(todos);
  }, [itens, vistos]);

  const novos = itens.filter((item) => !vistos.has(item.chave)).length;
  return { itens, novos, destacados, marcarVistos };
}

/** Seções "Serviços da Raizan" e "Contatos do site" no painel do sino. Usa o mesmo Tile e rótulo do sino. */
export function SecaoAvisosDoSite({ avisos, Tile, classeRotulo, onEscolher, limite = 5 }) {
  if (!avisos?.itens?.length) return null;
  const vencimentos = avisos.itens.filter((item) => item.tipo === "cobranca");
  const contatos = avisos.itens.filter((item) => item.tipo !== "cobranca");
  return (
    <>
      {vencimentos.length > 0 && (
        <section className="mb-3 last:mb-0">
          <h5 className={`${classeRotulo} px-2 mb-1`}>Serviços da Raizan</h5>
          {vencimentos.map((item) => (
            <Link
              key={item.chave}
              href={linkDoAviso(item)}
              onClick={() => onEscolher?.()}
              className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              <Tile cor={item.nivel === "erro" ? "rose" : item.nivel === "atencao" ? "amber" : "purple"} size={34}><Receipt size={15} /></Tile>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-2">{item.nome}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{item.detalhe}</p>
              </div>
              {avisos.destacados.has(item.chave) && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-label="Novo" />}
            </Link>
          ))}
        </section>
      )}
      <SecaoContatos avisos={avisos} itens={contatos} Tile={Tile} classeRotulo={classeRotulo} onEscolher={onEscolher} limite={limite} />
    </>
  );
}

function SecaoContatos({ avisos, itens, Tile, classeRotulo, onEscolher, limite }) {
  if (!itens.length) return null;
  return (
    <section className="mb-3 last:mb-0">
      <h5 className={`${classeRotulo} px-2 mb-1`}>Contatos do site</h5>
      {itens.slice(0, limite).map((item) => (
        <Link
          key={item.chave}
          href={linkDoAviso(item)}
          onClick={() => { pedirAberturaDaInteracao(item); onEscolher?.(); }}
          className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          <Tile cor="emerald" size={34}><Inbox size={15} /></Tile>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{item.nome}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{detalheDoAviso(item)}</p>
          </div>
          {avisos.destacados.has(item.chave) && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-label="Novo" />}
        </Link>
      ))}
    </section>
  );
}
