import { Loader2, FileDown, CheckCircle2, ChevronLeft, ChevronRight, CloudUpload } from "lucide-react"; 

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const parseEndereco = (pedido) => {
  if (pedido.billing) return pedido.billing;
  if (pedido.endereco_entrega) {
    try { return typeof pedido.endereco_entrega === 'string' ? JSON.parse(pedido.endereco_entrega) : pedido.endereco_entrega; } catch(e) {}
  }
  return {};
};

// 🟢 DICIONÁRIO VISUAL DOS STATUS PARA O CORE (Rede de Titânio com WooCommerce)
const renderStatus = (status) => {
  // .trim() tira espaços extras nas pontas para não dar erro
  const s = status ? String(status).toLowerCase().trim() : 'pendente'; 
  
  const styles = {
    // 🟡 STATUS LOCAIS
    'orcamento': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-200',
    'pendente': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200',
    
    // 🟢 ETAPA 1: Gerado (Omie Etapa 10)
    '10': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'sincronizado': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'gerado': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'pedido de venda': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    
    // 🔵 ETAPA 2: Separar Estoque (Omie Etapa 20)
    '20': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200',
    'processando': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200',
    'separacao': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200',
    'separar estoque': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200',
    
    // 🟣 ETAPA 3: Faturar (Omie Etapa 50)
    '50': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 border-purple-200',
    'aprovado': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 border-purple-200',
    'faturar': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 border-purple-200',
    'a faturar': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 border-purple-200',
    'a_faturar': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 border-purple-200',
    
    // 🟢 ETAPA 4: Faturado (Omie Etapa 60)
    '60': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'faturado': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'nfe_emitida': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    
    // 🚚 ETAPA 5: Entrega / Enviar (Omie Etapa 70 e 80)
    '70': 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 border-teal-200', // 🟢 70 AQUI!
    '80': 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 border-teal-200',
    
    // 🔴 CANCELAMENTOS
    'cancelado': 'bg-rose-50 dark:bg-red-500/10 text-rose-700 border-rose-200',
    'excluido': 'bg-rose-50 dark:bg-red-500/10 text-rose-700 border-rose-200',

    // ⚪ EXTRAS WOOCOMMERCE
    'completed': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200',
    'on-hold': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-200',
    'aguardando-pagamento': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 border-orange-200',
    'pago': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200'
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

    '70': 'Enviado', // 🟢 70 AQUI!
    '80': 'Enviado',
    'cancelado': 'Cancelado',
    'excluido': 'Cancelado',

    // Extras Woo
    'completed': 'Concluído', 
    'on-hold': 'Aguardando', 
    'aguardando-pagamento': 'Aguard. Pag.', 
    'pago': 'Pago'
  };

  const style = styles[s] || 'bg-zinc-100 text-zinc-600 border-zinc-300';
  const fallbackLabel = s.charAt(0).toUpperCase() + s.slice(1);
  
  return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>{labels[s] || fallbackLabel}</span>;
};

export default function TabelaPedidos({ pedidos, loading, page, totalPages, totalItems, onPageChange, onRowClick, baixados, onDownload, activeTab, plataformaAtiva }) {
  
  const isOmie = String(plataformaAtiva || '').toLowerCase().includes('omie');

  return (
    <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 rounded-2xl overflow-hidden backdrop-blur-sm relative flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
      
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 size={24} className="text-purple-600 dark:text-purple-500 animate-spin" />
        </div>
      )}

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 font-medium transition-colors">
            <tr>
              <th className="px-5 py-4 w-28">ID</th>
              <th className="px-5 py-4 w-full">Cliente</th>
              <th className="px-5 py-4 whitespace-nowrap">Data</th>
              <th className="px-5 py-4 text-right">Total</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 transition-colors">
            {pedidos.length === 0 && !loading && (
              <tr><td colSpan="6" className="px-5 py-12 text-center text-zinc-500 dark:text-zinc-400">Nenhum pedido encontrado nesta plataforma.</td></tr>
            )}

            {pedidos.map((pedido) => {
              const idReal = pedido.id || pedido.pedido_id;
              const foiBaixado = baixados[`${activeTab}_${idReal}`];
              const endereco = parseEndereco(pedido);
              const clienteNomeLista = endereco.first_name ? `${endereco.first_name || ''} ${endereco.last_name || ''}` : `Cliente #${pedido.cliente_id || 'Varejo'}`;
              const dataFormatada = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });

              const statusAtual = String(pedido.status || pedido.status_pedido || "pendente").toLowerCase();
              const codigoBanco = String(pedido.codigo_erp || pedido.codigo_omie || pedido.codigo_externo || "");
              
              const codigoOmieReal = codigoBanco.startsWith("APP-") ? null : codigoBanco;
              const codigoMostrar = typeof foiBaixado === 'string' ? foiBaixado : codigoOmieReal;

              const taEnviado = !!foiBaixado || !!codigoOmieReal || (isOmie && statusAtual !== 'pendente' && statusAtual !== 'cancelado');

              return (
                <tr key={idReal} onClick={() => onRowClick(pedido)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  
                  {/* 🟢 O NOVO LAYOUT PREMIUM DA COLUNA DE ID */}
                  <td className="px-5 py-4 font-medium">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-zinc-800 dark:text-zinc-200 font-mono font-bold text-sm">#{idReal}</span>
                      {taEnviado && codigoMostrar && !String(codigoMostrar).startsWith('APP') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black tracking-wider uppercase shadow-sm">
                          OMIE #{Number(codigoMostrar)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                    {clienteNomeLista}
                    {pedido.vendedor_nome && (
                      <div className="text-[10px] text-zinc-500 font-bold mt-1 bg-zinc-100 dark:bg-zinc-800 w-fit px-2 py-0.5 rounded-full">
                        👤 {pedido.vendedor_nome}
                      </div>
                    )}
                    {endereco.city && <div className="text-xs text-zinc-500 font-normal mt-0.5">{endereco.city} - {endereco.state}</div>}
                  </td>
                  <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">{dataFormatada}</td>
                  <td className="px-5 py-4 text-zinc-900 dark:text-zinc-200 font-medium text-right whitespace-nowrap">{formatarMoeda(pedido.total || pedido.valor_total)}</td>
                  <td className="px-5 py-4 text-center">{renderStatus(pedido.status || pedido.status_pedido)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(!taEnviado) onDownload(pedido); }}
                        title={taEnviado ? "Já Enviado para o ERP" : (isOmie ? "Enviar para o ERP" : "Baixar CSV")}
                        className={`flex w-fit whitespace-nowrap items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
                          taEnviado 
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 cursor-default" 
                            : (isOmie 
                                ? "bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95")
                        }`}
                      >
                        {taEnviado ? <CheckCircle2 size={16} className="shrink-0" /> : (isOmie ? <CloudUpload size={16} className="shrink-0" /> : <FileDown size={16} className="shrink-0" />)}
                        {taEnviado ? (isOmie ? "Enviado ERP" : "Baixado") : (isOmie ? "Enviar ERP" : "Exportar CSV")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-800/10 flex items-center justify-between text-sm transition-colors">
        <span className="text-zinc-500 dark:text-zinc-400">
          Mostrando pág <span className="font-medium text-zinc-900 dark:text-zinc-300">{page}</span> de <span className="font-medium text-zinc-900 dark:text-zinc-300">{totalPages || 1}</span>
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm hover:bg-zinc-50 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm hover:bg-zinc-50 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}