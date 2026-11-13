"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertTriangle, Bell, FileText, ShoppingCart } from "lucide-react";
import { getHeaders, getHubUrl } from "@/components/utils/api";
import { NotificacaoVidro } from "@/components/checkout/estilos";
import { SecaoAvisosDoSite, useAvisosDoSite } from "@/components/website/avisosDoSino";

const INTERVALO_RADAR_MS = 15000;
const CHAVE_VISTOS = "@raizan:notificacoes_vistas";
const MAXIMO_TOASTS = 3;
const PEDIDOS_NO_PAINEL = 8;
const ESTOQUE_NO_PAINEL = 5;
const ICONE_APP = "https://raizan.com.br/wp-content/uploads/2024/02/favicon.png";

const NOME_DA_ORIGEM = { raizan_seller: "Raizan Seller", omie: "Omie", woocommerce: "Site", b2b: "Portal B2B" };

const moeda = (valor) => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Fica fora do componente porque o Header monta de novo a cada troca de tela
let chavesJaAvisadas = null;

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
    localStorage.setItem(CHAVE_VISTOS, JSON.stringify(chaves));
  } catch (e) { }
}

// Documento pendente fica no contador até ser atendido. O resto sai quando alguém abre o sino.
export function contarNovos(itens, vistos) {
  return itens.filter((item) => item.tipo === "documento" || !vistos.has(item.chave)).length;
}

export function detalheDoPedido(item) {
  const quem = item.vendedor ? `Vendedor: ${item.vendedor}` : NOME_DA_ORIGEM[item.origem] || "Novo pedido";
  return `${quem} · ${moeda(item.valor)}`;
}

function notificarSistema(titulo, corpo) {
  try {
    if (Notification.permission === "granted") new Notification(titulo, { body: corpo, icon: ICONE_APP, silent: true });
  } catch (e) { }
}

function tocar(arquivo) {
  try {
    new Audio(arquivo).play().catch(() => { });
  } catch (e) { }
}

function avisarPedido(item) {
  notificarSistema(`Novo pedido: ${item.cliente}`, detalheDoPedido(item));
  toast.custom((t) => (
    <NotificacaoVidro visivel={t.visible} Icone={ShoppingCart} titulo="Novo pedido" subtitulo={item.cliente} detalhe={detalheDoPedido(item)} />
  ), { duration: 6000 });
}

function avisarDocumento(item) {
  notificarSistema(`Documento solicitado: ${item.cliente}`, `O cliente pediu o XML/boleto do pedido #${item.numero}.`);
  toast.custom((t) => (
    <NotificacaoVidro visivel={t.visible} Icone={FileText} cor="rose" titulo="Documento solicitado" subtitulo={item.cliente} detalhe={`Pedido #${item.numero} aguarda XML/boleto`} />
  ), { duration: 8000 });
}

function avisarNovidades(novos) {
  const pedidos = novos.filter((item) => item.tipo === "pedido");
  const documentos = novos.filter((item) => item.tipo === "documento");

  if (pedidos.length) tocar("/plim.mp3");
  if (documentos.length) tocar("/Newemail.mp3");

  // Uma sincronização pode trazer vários de uma vez: mostra poucos e resume o resto
  const avisos = [...documentos, ...pedidos];
  avisos.slice(0, MAXIMO_TOASTS).forEach((item) => (item.tipo === "pedido" ? avisarPedido(item) : avisarDocumento(item)));

  const restantes = avisos.length - MAXIMO_TOASTS;
  if (restantes > 0) {
    toast.custom((t) => (
      <NotificacaoVidro visivel={t.visible} Icone={Bell} titulo={`Mais ${restantes} novidades`} subtitulo="Abra o sino para ver tudo" />
    ), { duration: 6000 });
  }
}

function Linha({ href, onClick, Tile, cor, Icone, titulo, detalhe, novo }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
      <Tile cor={cor} size={34}><Icone size={15} /></Tile>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">{titulo}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{detalhe}</p>
      </div>
      {novo && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" aria-label="Novo" />}
    </Link>
  );
}

function Secao({ titulo, classeRotulo, children }) {
  return (
    <section className="mb-3 last:mb-0">
      <h5 className={`${classeRotulo} px-2 mb-1`}>{titulo}</h5>
      {children}
    </section>
  );
}

export default function SinoNotificacoes({ classeBotao, classeBadge, classePainel, classeRotulo, Tile }) {
  const [itens, setItens] = useState([]);
  const [vistos, setVistos] = useState(new Set());
  const [novosNaAbertura, setNovosNaAbertura] = useState(new Set());
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);
  const avisosDoSite = useAvisosDoSite();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checarRadar = async () => {
      try {
        const res = await fetch(`${getHubUrl()}/api/admin/notificacoes`, { headers: getHeaders() });
        const data = await res.json();
        if (!data.success || !Array.isArray(data.itens)) return;

        const chaves = data.itens.map((item) => item.chave);
        let jaVistos = lerVistos();
        if (!jaVistos) {
          // Primeira vez neste computador: começa do zero, sem acusar todo o histórico
          jaVistos = new Set(chaves);
          guardarVistos(chaves);
        }

        // Ao abrir o programa não dispara aviso do que chegou com ele fechado: isso fica no contador do sino
        if (chavesJaAvisadas) {
          const avisadas = chavesJaAvisadas;
          avisarNovidades(data.itens.filter((item) => item.tipo !== "estoque" && !avisadas.has(item.chave)));
        }
        chavesJaAvisadas = new Set(chaves);

        setItens(data.itens);
        setVistos(jaVistos);
      } catch (e) { }
    };

    checarRadar();
    const timer = setInterval(checarRadar, INTERVALO_RADAR_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const fecharAoClicarFora = (e) => {
      if (caixa.current && !caixa.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, [aberto]);

  const alternar = () => {
    if (aberto) {
      setAberto(false);
      return;
    }
    const chaves = itens.map((item) => item.chave);
    setNovosNaAbertura(new Set(chaves.filter((chave) => !vistos.has(chave))));
    setVistos(new Set(chaves));
    guardarVistos(chaves);
    avisosDoSite.marcarVistos();
    setAberto(true);
  };

  const fechar = () => setAberto(false);

  const total = contarNovos(itens, vistos) + avisosDoSite.novos;
  const documentos = itens.filter((item) => item.tipo === "documento");
  const pedidos = itens.filter((item) => item.tipo === "pedido").slice(0, PEDIDOS_NO_PAINEL);
  const estoque = itens.filter((item) => item.tipo === "estoque");

  return (
    <div ref={caixa} className="relative shrink-0">
      <button type="button" onClick={alternar} className={classeBotao} title="Notificações" aria-label={total ? `${total} notificações novas` : "Notificações"} aria-expanded={aberto}>
        <Bell size={18} className={total ? "text-rose-500 dark:text-rose-400" : "text-zinc-600 dark:text-zinc-300"} />
        {total > 0 && <span className={`${classeBadge} bg-rose-500`}>{total > 9 ? "9+" : total}</span>}
      </button>

      {aberto && (
        <div className={`${classePainel} absolute right-0 max-sm:-right-20 top-full mt-3 w-[340px] max-w-[calc(100vw-24px)] rounded-[28px] p-3 z-[100]`}>
          <h4 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white px-2 pt-1 pb-2">Notificações</h4>

          <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
            {itens.length === 0 && avisosDoSite.itens.length === 0 && <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6 font-medium">Nenhuma novidade por aqui.</p>}

            {documentos.length > 0 && (
              <Secao titulo="Aguardando documento" classeRotulo={classeRotulo}>
                {documentos.map((item) => (
                  <Linha key={item.chave} href="/xml" onClick={fechar} Tile={Tile} cor="rose" Icone={FileText} titulo={item.cliente} detalhe={`Pedido #${item.numero}`} novo />
                ))}
              </Secao>
            )}

            <SecaoAvisosDoSite avisos={avisosDoSite} Tile={Tile} classeRotulo={classeRotulo} onEscolher={fechar} />

            {pedidos.length > 0 && (
              <Secao titulo="Últimos pedidos" classeRotulo={classeRotulo}>
                {pedidos.map((item) => (
                  <Linha key={item.chave} href="/pedidos" onClick={fechar} Tile={Tile} cor="purple" Icone={ShoppingCart} titulo={item.cliente} detalhe={detalheDoPedido(item)} novo={novosNaAbertura.has(item.chave)} />
                ))}
              </Secao>
            )}

            {estoque.length > 0 && (
              <Secao titulo={`Estoque baixo (${estoque.length})`} classeRotulo={classeRotulo}>
                {estoque.slice(0, ESTOQUE_NO_PAINEL).map((item) => (
                  <Linha key={item.chave} href="/produtos" onClick={fechar} Tile={Tile} cor="amber" Icone={AlertTriangle} titulo={item.nome} detalhe={`Restam ${item.estoque} · mínimo ${item.minimo}`} novo={novosNaAbertura.has(item.chave)} />
                ))}
              </Secao>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
