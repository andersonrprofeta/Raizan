"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, ClipboardCheck, Clock3, FileText, Inbox, PackageSearch } from "lucide-react";
import TabDesempenho from "@/components/vendedores/relatorio";
import { mesDeHoje } from "@/components/vendedores/SeletorMes";
import { api, Carregando, CascaPagina, EstadoVazio, VIDRO } from "@/components/vendedores/ui";
import { lerUsuario, temPermissao } from "@/components/utils/sessaoCore";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

// O Core instalado pode conversar com uma API mais antiga: campo que faltar não pode derrubar a tela
const PAINEL_VAZIO = { novos: 0, em_separacao: 0, a_faturar: 0, conferidos_hoje: 0, ocorrencias_hoje: 0, meus_conferidos_hoje: 0, parados: [], conferencias: [] };

// A etapa em destaque é a que depende desta pessoa
const ETAPA_DO_PERFIL = { "Expedição": "em_separacao", Faturamento: "a_faturar", Televendas: "novos" };

const ETAPAS = [
  { chave: "novos", rotulo: "Novos pedidos", Icone: Inbox, href: "/pedidos", permissao: "pedidos" },
  { chave: "em_separacao", rotulo: "Em separação", Icone: PackageSearch, href: "/checkout", permissao: "checkout" },
  { chave: "conferidos_hoje", rotulo: "Conferidos hoje", Icone: ClipboardCheck, href: "/checkout/historico", permissao: "checkout" },
  { chave: "a_faturar", rotulo: "A faturar", Icone: FileText, href: "/pedidos", permissao: "pedidos" },
];

const tempoDeEspera = (data) => {
  const dias = Math.floor((Date.now() - new Date(data).getTime()) / UM_DIA_MS);
  if (dias <= 0) return "Hoje";
  return dias === 1 ? "Há 1 dia" : `Há ${dias} dias`;
};

const horario = (data) => new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function Esteira({ painel, perfil }) {
  return (
    <section aria-label="Etapas da operação" className={`${VIDRO} grid grid-cols-2 lg:grid-cols-4 overflow-hidden`}>
      {ETAPAS.map(({ chave, rotulo, Icone, href, permissao }, indice) => {
        const destaque = ETAPA_DO_PERFIL[perfil] === chave;
        const conteudo = (
          <>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <Icone size={16} className={destaque ? "text-purple-600 dark:text-purple-400" : ""} aria-hidden />
              {rotulo}
            </span>
            <span className="mt-3 block text-[34px] leading-none font-bold tracking-tight tabular-nums">{painel[chave]}</span>
          </>
        );
        const classes = `relative block p-5 sm:p-6 ${destaque ? "bg-purple-500/[0.07]" : ""} ${indice > 0 ? "lg:border-l" : ""} ${indice % 2 === 1 ? "border-l lg:border-l" : ""} ${indice > 1 ? "border-t lg:border-t-0" : ""} border-black/[0.06] dark:border-white/[0.06]`;

        return temPermissao(permissao)
          ? <Link key={chave} href={href} className={`${classes} hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors`}>{conteudo}</Link>
          : <div key={chave} className={classes}>{conteudo}</div>;
      })}
    </section>
  );
}

function Cartao({ titulo, detalhe, children }) {
  return (
    <section className={`${VIDRO} min-w-0 overflow-hidden`}>
      <div className="flex items-baseline justify-between gap-3 p-5 pb-3">
        <h2 className="font-semibold tracking-tight">{titulo}</h2>
        {detalhe && <span className="text-xs text-zinc-500 dark:text-zinc-400">{detalhe}</span>}
      </div>
      {children}
    </section>
  );
}

function PedidosParados({ pedidos }) {
  if (pedidos.length === 0) return <EstadoVazio icone={ClipboardCheck} titulo="Fila em dia" texto="Nenhum pedido aguardando." />;

  return (
    <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
      {pedidos.map((pedido) => (
        <li key={pedido.id} className="flex items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">#{pedido.numero} · {pedido.cliente}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{pedido.etapa}</p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
            <Clock3 size={13} aria-hidden /> {tempoDeEspera(pedido.desde)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function UltimasConferencias({ conferencias }) {
  if (conferencias.length === 0) return <EstadoVazio icone={ClipboardCheck} titulo="Nenhuma conferência ainda" texto="As conferências finalizadas aparecem aqui." />;

  return (
    <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
      {conferencias.map((conferencia) => (
        <li key={conferencia.id} className="flex items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">#{conferencia.pedido_id}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">Separou {conferencia.separador_nome} · Conferiu {conferencia.conferente_nome}</p>
          </div>
          <span className="shrink-0 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {horario(conferencia.fim)}
            {conferencia.total_ocorrencias > 0 && <span className="mt-0.5 flex items-center justify-end gap-1 font-semibold text-amber-600 dark:text-amber-400"><AlertTriangle size={12} aria-hidden /> {conferencia.total_ocorrencias}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function InicioOperacional({ perfil }) {
  const [painel, setPainel] = useState(null);
  const [falhou, setFalhou] = useState(false);
  const veConferencia = temPermissao("checkout");

  useEffect(() => {
    api("/conferencia/painel")
      .then((dados) => { if (dados.success) setPainel({ ...PAINEL_VAZIO, ...dados.painel }); else setFalhou(true); })
      .catch(() => setFalhou(true));
  }, []);

  if (falhou) return <EstadoVazio icone={AlertTriangle} titulo="Não foi possível carregar" texto="Confira a conexão e abra esta tela novamente." />;
  if (!painel) return <Carregando />;

  return (
    <>
      <Esteira painel={painel} perfil={perfil} />

      <div className={`grid gap-6 ${veConferencia ? "lg:grid-cols-2" : ""}`}>
        <Cartao titulo="Aguardando há mais tempo" detalhe="Mais antigos primeiro">
          <PedidosParados pedidos={painel.parados} />
        </Cartao>

        {veConferencia && (
          <Cartao titulo="Últimas conferências" detalhe={`Você conferiu ${painel.meus_conferidos_hoje} hoje`}>
            <UltimasConferencias conferencias={painel.conferencias} />
            <Link href="/checkout/historico" className="flex items-center justify-between gap-2 px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.06] text-sm font-medium text-purple-700 dark:text-purple-300">
              {painel.ocorrencias_hoje > 0 ? `${painel.ocorrencias_hoje} ocorrências hoje. Ver histórico` : "Ver histórico"}
              <ChevronRight size={16} aria-hidden />
            </Link>
          </Cartao>
        )}
      </div>
    </>
  );
}

// Tela inicial de quem não tem o Dashboard Executivo: mostra trabalho, não dinheiro
export default function PainelDoUsuario() {
  const [usuario] = useState(lerUsuario);
  const [competencia] = useState(mesDeHoje);
  const [empresa] = useState(() => localStorage.getItem("@raizan:nome") || "");

  return (
    <CascaPagina>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{usuario?.vendedor_id ? "Meu desempenho" : "Operação de hoje"}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{empresa}</p>
      </div>

      {usuario?.vendedor_id
        ? <TabDesempenho vendedor={{ id: usuario.vendedor_id, nome: usuario.nome }} competencia={competencia} />
        : <InicioOperacional perfil={usuario?.perfil} />}
    </CascaPagina>
  );
}
