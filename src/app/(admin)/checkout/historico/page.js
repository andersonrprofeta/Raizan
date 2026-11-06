"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, ROTULO, VIDRO } from "@/components/vendedores/ui";

const dataHora = (valor) => (valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" }) : "Não informado");

function Detalhe({ id, aoFechar }) {
  const [registro, setRegistro] = useState(null);

  useEffect(() => {
    api(`/conferencia/historico/${id}`).then((dados) => {
      if (dados.success) setRegistro(dados.registro);
      else toast.error(dados.message);
    }).catch(() => toast.error("Erro de conexão."));
  }, [id]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Relatório da conferência" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-md print:static print:bg-white print:p-0">
      <div className={`${VIDRO} !bg-white dark:!bg-[#121214] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:border-0`}>
        <div className="flex items-center justify-between gap-3 p-5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <h2 className="text-lg font-bold tracking-tight">Pedido #{registro?.pedido_id}</h2>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className={`${BOTAO_SECUNDARIO} !h-9 !px-4`}><Printer size={15} /> Imprimir</button>
            <button type="button" onClick={aoFechar} aria-label="Fechar" className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center"><X size={17} /></button>
          </div>
        </div>

        {!registro ? <Carregando /> : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-zinc-500 dark:text-zinc-400">Cliente</dt><dd className="font-medium">{registro.cliente || "Não informado"}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Volumes</dt><dd className="font-medium">{registro.volumes ?? "Não informado"}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Separado por</dt><dd className="font-medium">{registro.separador_nome}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Conferido por</dt><dd className="font-medium">{registro.conferente_nome}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Início</dt><dd className="font-medium">{dataHora(registro.inicio)}</dd></div>
              <div><dt className="text-zinc-500 dark:text-zinc-400">Fim</dt><dd className="font-medium">{dataHora(registro.fim)}</dd></div>
            </dl>

            <section>
              <h3 className="font-semibold mb-2">Contagem</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-zinc-500 dark:text-zinc-400"><th className="py-1.5 font-medium">Produto</th><th className="py-1.5 font-medium text-right">Pedido</th><th className="py-1.5 font-medium text-right">Bipado</th></tr></thead>
                <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {registro.itens.map((item, indice) => (
                    <tr key={indice}><td className="py-1.5 pr-3">{item.nome}</td><td className="py-1.5 text-right tabular-nums">{item.qtdPedida}</td><td className="py-1.5 text-right tabular-nums">{item.qtdBipada}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Ocorrências durante a bipagem</h3>
              {registro.ocorrencias.length === 0 ? <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma ocorrência.</p> : (
                <ul className="space-y-1.5 text-sm">
                  {registro.ocorrencias.map((ocorrencia, indice) => (
                    <li key={indice}><span className="tabular-nums text-zinc-500 dark:text-zinc-400">{dataHora(ocorrencia.hora)}</span> · {ocorrencia.tipo}{ocorrencia.produto ? `: ${ocorrencia.produto}` : ""}{ocorrencia.codigo ? ` (${ocorrencia.codigo})` : ""}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoricoConferencia() {
  const [registros, setRegistros] = useState(null);
  const [filtros, setFiltros] = useState({ de: "", ate: "", pedido: "", pessoa: "" });
  const [aberto, setAberto] = useState(null);

  const buscar = useCallback(async (valores) => {
    const parametros = new URLSearchParams(Object.entries(valores).filter(([, valor]) => valor));
    const dados = await api(`/conferencia/historico?${parametros}`);
    if (dados.success) setRegistros(dados.registros);
    else toast.error(dados.message || "Sem acesso ao histórico.");
  }, []);

  useEffect(() => { buscar({}).catch(() => toast.error("Erro de conexão.")); }, [buscar]);

  const alterar = (campo, valor) => setFiltros((atual) => ({ ...atual, [campo]: valor }));

  const filtrar = (evento) => {
    evento.preventDefault();
    buscar(filtros).catch(() => toast.error("Erro de conexão."));
  };

  return (
    <CascaPagina>
      <div>
        <Link href="/checkout" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-2"><ChevronLeft size={16} /> Estação de Checkout</Link>
        <h1 className="text-3xl font-bold tracking-tight">Histórico da Conferência</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Quem separou, quem conferiu e o que aconteceu em cada pedido.</p>
      </div>

      <form onSubmit={filtrar} className={`${VIDRO} p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end`}>
        <div><label htmlFor="de" className={ROTULO}>De</label><input id="de" type="date" value={filtros.de} onChange={(e) => alterar("de", e.target.value)} className={CAMPO} /></div>
        <div><label htmlFor="ate" className={ROTULO}>Até</label><input id="ate" type="date" value={filtros.ate} onChange={(e) => alterar("ate", e.target.value)} className={CAMPO} /></div>
        <div><label htmlFor="pedido" className={ROTULO}>Pedido</label><input id="pedido" value={filtros.pedido} onChange={(e) => alterar("pedido", e.target.value)} className={CAMPO} /></div>
        <div><label htmlFor="pessoa" className={ROTULO}>Separador ou conferente</label><input id="pessoa" value={filtros.pessoa} onChange={(e) => alterar("pessoa", e.target.value)} className={CAMPO} /></div>
        <button type="submit" className={BOTAO_PRIMARIO}><Search size={16} /> Buscar</button>
      </form>

      {!registros ? <Carregando /> : (
        <div className={`${VIDRO} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.06]">
                <th className="p-4 font-medium">Pedido</th><th className="p-4 font-medium">Separou</th><th className="p-4 font-medium">Conferiu</th><th className="p-4 font-medium">Concluído em</th><th className="p-4 font-medium text-right">Unidades</th><th className="p-4 font-medium text-right">Ocorrências</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td className="p-4"><button type="button" onClick={() => setAberto(registro.id)} className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">#{registro.pedido_id}</button></td>
                  <td className="p-4">{registro.separador_nome}</td>
                  <td className="p-4">{registro.conferente_nome}</td>
                  <td className="p-4 tabular-nums">{dataHora(registro.fim)}</td>
                  <td className="p-4 text-right tabular-nums">{registro.total_unidades}</td>
                  <td className={`p-4 text-right tabular-nums ${registro.total_ocorrencias > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : ""}`}>{registro.total_ocorrencias}</td>
                </tr>
              ))}
              {registros.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-zinc-500">Nenhuma conferência encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {aberto && <Detalhe id={aberto} aoFechar={() => setAberto(null)} />}
    </CascaPagina>
  );
}
