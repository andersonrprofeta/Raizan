import { useState, useEffect } from "react";
import { Loader2, FileDown, CheckCircle2, ChevronLeft, ChevronRight, CloudUpload, Printer, Tags, Scissors, Box, User, Gift } from "lucide-react"; 

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const parseEndereco = (pedido) => {
  if (pedido.billing) return pedido.billing;
  if (pedido.endereco_entrega) {
    try { return typeof pedido.endereco_entrega === 'string' ? JSON.parse(pedido.endereco_entrega) : pedido.endereco_entrega; } catch(e) {}
  }
  return {};
};

// ==========================================
// 🎨 TOKENS (estilo Apple: pílulas translúcidas, hairlines)
// ==========================================

// Tons das pílulas de status (classes completas para o Tailwind enxergar)
const TONS = {
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  zinc: 'bg-black/[0.05] dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.1]',
};

// Botões de ícone redondos (imprimir separação / etiqueta)
const ICON_BTN =
  "w-9 h-9 flex items-center justify-center rounded-full text-zinc-400 transition-all duration-300 active:scale-90";

// Botão de ação principal em formato de pílula
const ACAO_BASE =
  "flex w-fit whitespace-nowrap items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-300";
const ACAO_VERDE =
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default";
const ACAO_AMBAR =
  "bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-400/30 active:scale-95";
const ACAO_ROXA =
  "bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(147,51,234,0.6)] active:scale-95";

const renderStatus = (status) => {
  const s = status ? String(status).toLowerCase().trim() : 'pendente'; 
  const tons = {
    'orcamento': 'amber',
    'pendente': 'blue',
    '10': 'emerald',
    'sincronizado': 'emerald',
    'gerado': 'emerald',
    'pedido de venda': 'emerald',
    '20': 'blue',
    'processando': 'blue',
    'separacao': 'blue',
    'separar estoque': 'blue',
    '50': 'purple',
    'aprovado': 'purple',
    'faturar': 'purple',
    'a faturar': 'purple',
    'a_faturar': 'purple',
    '60': 'emerald',
    'faturado': 'emerald',
    'nfe_emitida': 'emerald',
    '70': 'teal', 
    '80': 'teal',
    'cancelado': 'rose',
    'excluido': 'rose',
    'completed': 'emerald',
    'on-hold': 'amber',
    'aguardando-pagamento': 'orange',
    'pago': 'blue'
  };

  const labels = {
    'orcamento': 'Orçamento',
    'pendente': 'Pendente', 
    '10': 'Gerado',
    'sincronizado': 'Gerado',
    'gerado': 'Gerado',
    'pedido de venda': 'Gerado',
    '20': 'Em Separação',
    'processando': 'Em Separação',
    'separacao': 'Em Separação',
    'separar estoque': 'Em Separação',
    '50': 'A Faturar',
    'aprovado': 'A Faturar', 
    'faturar': 'A Faturar',
    'a faturar': 'A Faturar',
    'a_faturar': 'A Faturar',
    '60': 'NFE Emitida',
    'faturado': 'NFE Emitida', 
    'nfe_emitida': 'NFE Emitida',
    '70': 'Enviado',
    '80': 'Enviado',
    'cancelado': 'Cancelado',
    'excluido': 'Cancelado',
    'completed': 'Concluído', 
    'on-hold': 'Aguardando', 
    'aguardando-pagamento': 'Aguard. Pag.', 
    'pago': 'Pago'
  };

  const style = TONS[tons[s]] || TONS.zinc;
  const fallbackLabel = s.charAt(0).toUpperCase() + s.slice(1);
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${style}`}>{labels[s] || fallbackLabel}</span>;
};

export default function TabelaPedidos({ 
  pedidos, loading, page, totalPages, totalItems, 
  onPageChange, onRowClick, baixados, onDownload, 
  onBaixarCSV, activeTab, plataformaAtiva, 
  modoDigital, // 🟢 Variável do Switch que vem do page.js
  onPrintSeparacao, onPrintEtiqueta 
}) {
  const isOmie = String(plataformaAtiva || '').toLowerCase().includes('omie');

  return (
    // O "cartão" (borda, fundo e sombra) vem da página que usa a tabela; aqui só arredondamos e cortamos as pontas.
    <div className="rounded-[28px] overflow-hidden relative flex flex-col transition-colors duration-300">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/60 dark:bg-[#121214]/60 backdrop-blur-sm flex items-center justify-center">
          <Loader2 size={24} className="text-purple-600 dark:text-purple-500 animate-spin" />
        </div>
      )}

      <div className="overflow-x-auto flex-1 pb-2 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.07]">
            <tr>
              <th className="pl-10 pr-4 py-4 text-xs font-semibold whitespace-nowrap">ID</th>
              <th className="px-5 py-4 w-full text-xs font-semibold">Cliente</th>
              <th className="px-5 py-4 whitespace-nowrap text-xs font-semibold">Data</th>
              <th className="px-5 py-4 text-right text-xs font-semibold">Total</th>
              <th className="px-5 py-4 text-center text-xs font-semibold">Status</th>
              <th className="px-5 py-4 text-right text-xs font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {pedidos.length === 0 && !loading && (
              <tr><td colSpan="6" className="px-5 py-16 text-center text-zinc-500 dark:text-zinc-400">Nenhum pedido encontrado nesta plataforma.</td></tr>
            )}

            {pedidos.map((pedido) => {
              const idReal = pedido.id || pedido.pedido_id;
              const foiBaixado = baixados[`${activeTab}_${idReal}`];
              const endereco = parseEndereco(pedido);
              const clienteNomeLista = endereco.first_name ? `${endereco.first_name || ''} ${endereco.last_name || ''}` : `Cliente #${pedido.cliente_id || 'Varejo'}`;

              // 🆕 Se a data vier vazia/inválida mostra "—" em vez de "Invalid Date"
              const dataObj = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em);
              const dataFormatada = isNaN(dataObj.getTime())
                ? '—'
                : dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

              const statusAtual = String(pedido.status || pedido.status_pedido || "pendente").toLowerCase();
              const codigoBanco = String(pedido.codigo_erp || pedido.codigo_omie || pedido.codigo_externo || "");
              
              const codigoOmieReal = codigoBanco.startsWith("APP-") ? null : codigoBanco;
              const codigoMostrar = typeof foiBaixado === 'string' ? foiBaixado : codigoOmieReal;

              const taEnviado = !!foiBaixado || !!codigoOmieReal || (isOmie && statusAtual !== 'pendente' && statusAtual !== 'cancelado');
              const isCortado = pedido.teve_corte === 1 || pedido.teve_corte === true;
              const bonificado = pedido.bonificado === true;

              const isEmSeparacao = ['20', 'processando', 'separacao', 'separar estoque'].includes(statusAtual);
              const isNfeEmitida = ['60', 'faturado', 'nfe_emitida'].includes(statusAtual);

              // 🆕 Antes: OMIE #{Number(codigo)} mostrava "NaN" se o código não fosse numérico
              const numOmie = Number(codigoMostrar);
              const codigoOmieFmt = Number.isNaN(numOmie) ? codigoMostrar : numOmie;
              const mostrarOmie = taEnviado && codigoMostrar && !String(codigoMostrar).startsWith('APP');

              return (
                <tr key={idReal} onClick={() => onRowClick(pedido)} className={`transition-colors cursor-pointer group ${isCortado ? 'bg-amber-500/[0.06] hover:bg-amber-500/[0.1]' : bonificado ? 'bg-violet-500/[0.09] hover:bg-violet-500/[0.14] dark:bg-violet-500/[0.1] dark:hover:bg-violet-500/[0.15]' : 'hover:bg-purple-500/[0.04] dark:hover:bg-white/[0.03]'}`}>
                  
                  <td className="relative pl-10 pr-4 py-4 font-medium">
                    {/* Pedido de bonificação: faixa lilás na borda da linha */}
                    {bonificado && <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />}
                    {/* ✂️ Linha de corte tracejada na borda do card, com a tesoura em cima dela (só em pedido parcial) */}
                    {isCortado && (
                      <>
                        <span aria-hidden="true" className="absolute left-4 top-0 bottom-0 border-l-2 border-dashed border-amber-400/70 dark:border-amber-400/40" />
                        <span
                          role="img"
                          aria-label="Pedido parcial"
                          title="Pedido parcial: itens cortados no faturamento"
                          className="absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-amber-50 dark:bg-[#2b2310] border border-amber-300/80 dark:border-amber-500/40 text-amber-600 dark:text-amber-300 shadow-sm"
                        >
                          <Scissors size={12} />
                        </span>
                      </>
                    )}

                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold text-sm tabular-nums">#{idReal}</span>
                      {mostrarOmie && (
                        <span
                          title={`Pedido no Omie: ${codigoOmieFmt}`}
                          className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-semibold tabular-nums"
                        >
                          <Box size={10} /> {codigoOmieFmt}
                        </span>
                      )}
                    </div>
                    {bonificado && (
                      <span title="Pedido de bonificação" className="mt-1.5 inline-flex items-center gap-1 h-5 px-2 rounded-full bg-violet-500 text-white text-[10px] font-bold shadow-[0_4px_12px_-4px_rgba(139,92,246,0.7)]">
                        <Gift size={10} /> Bonificação
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    <span className="tracking-tight">{clienteNomeLista}</span>
                    {pedido.vendedor_nome && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold bg-black/[0.04] dark:bg-white/[0.06] w-fit px-2 py-0.5 rounded-full max-w-full">
                        <User size={10} className="shrink-0" /> <span className="truncate">{pedido.vendedor_nome}</span>
                      </div>
                    )}
                    {endereco.city && <div className="text-xs text-zinc-500 font-normal mt-0.5">{endereco.city} - {endereco.state}</div>}
                  </td>
                  <td className="px-5 py-4 text-zinc-500 whitespace-nowrap tabular-nums">{dataFormatada}</td>
                  <td className="px-5 py-4 text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums text-right whitespace-nowrap">
                    {isCortado ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-rose-400 dark:text-rose-400/70 text-[11px] font-normal">{formatarMoeda(pedido.total || pedido.valor_total)}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">{formatarMoeda(pedido.valor_faturado)}</span>
                      </div>
                    ) : (
                      formatarMoeda(pedido.total || pedido.valor_total)
                    )}
                  </td>
                  
                  <td className="px-5 py-4 text-center">{renderStatus(pedido.status || pedido.status_pedido)}</td>
                  
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      
                      <div className="flex items-center gap-1">
                        {isEmSeparacao && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPrintSeparacao(pedido); }}
                            title="Imprimir Mapa de Separação"
                            className={`${ICON_BTN} hover:text-blue-600 hover:bg-blue-500/10`}
                          >
                            <Printer size={18} />
                          </button>
                        )}

                        {isNfeEmitida && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPrintEtiqueta(pedido); }}
                            title="Imprimir Etiqueta de Volume"
                            className={`${ICON_BTN} hover:text-purple-600 hover:bg-purple-500/10`}
                          >
                            <Tags size={18} />
                          </button>
                        )}
                      </div>

                      {/* 🟢 AÇÃO PRINCIPAL INTELIGENTE (Obedece ao Switch 'modoDigital' e ao banco) */}
                      <div className="flex items-center gap-1">
                        {isOmie && modoDigital ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(!pedido.csv_baixado) onBaixarCSV(pedido); }}
                            title={pedido.csv_baixado ? "Já baixado por alguém" : "Baixar CSV para o Digital Sistemas"}
                            className={`${ACAO_BASE} ${pedido.csv_baixado ? ACAO_VERDE : ACAO_AMBAR}`}
                          >
                            {pedido.csv_baixado ? <CheckCircle2 size={16} /> : <FileDown size={16} />}
                            {pedido.csv_baixado ? "CSV Baixado" : "Exportar CSV"}
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(!taEnviado) onDownload(pedido); }}
                            title={taEnviado ? "Já Enviado para o ERP" : (isOmie ? "Enviar para o ERP" : "Baixar CSV")}
                            className={`${ACAO_BASE} ${
                              taEnviado 
                                ? ACAO_VERDE 
                                : (isOmie ? ACAO_ROXA : ACAO_AMBAR)
                            }`}
                          >
                            {taEnviado ? <CheckCircle2 size={16} className="shrink-0" /> : (isOmie ? <CloudUpload size={16} className="shrink-0" /> : <FileDown size={16} className="shrink-0" />)}
                            {taEnviado ? (isOmie ? "Enviado ERP" : "Baixado") : (isOmie ? "Enviar ERP" : "Exportar CSV")}
                          </button>
                        )}
                      </div>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 sm:px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-3 text-sm transition-colors">
        <span className="text-zinc-500 dark:text-zinc-400">
          Mostrando pág <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{page}</span> de <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{totalPages || 1}</span>
          {totalItems > 0 && <span className="hidden sm:inline"> · <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{totalItems}</span> pedidos</span>}
          <span className="hidden md:inline text-xs"> · Finalizados saem da lista após alguns minutos; use a busca para achá-los</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
          ><ChevronLeft size={17} /></button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || totalPages === 0}
            aria-label="Próxima página"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
          ><ChevronRight size={17} /></button>
        </div>
      </div>
    </div>
  );
}