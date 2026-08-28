import { Loader2, FileDown, CheckCircle2, ChevronLeft, ChevronRight, CloudUpload } from "lucide-react"; 

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const parseEndereco = (pedido) => {
  if (pedido.billing) return pedido.billing;
  if (pedido.endereco_entrega) {
    try { return typeof pedido.endereco_entrega === 'string' ? JSON.parse(pedido.endereco_entrega) : pedido.endereco_entrega; } catch(e) {}
  }
  return {};
};

const renderStatus = (status) => {
  const s = status || 'pendente';
  const styles = {
    'processing': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    'completed': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    'on-hold': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    'cancelled': 'bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-500/20',
    'aguardando-pagamento': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    'pendente': 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
    'pago': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    'enviado': 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    'entregue': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
  };
  const labels = {
    'processing': 'Processando', 'completed': 'Concluído', 'on-hold': 'Aguardando', 'cancelled': 'Cancelado',
    'aguardando-pagamento': 'Aguard. Pag.', 'pendente': 'Pendente', 'pago': 'Pago', 'enviado': 'Enviado', 'entregue': 'Entregue'
  };
  const style = styles[s] || 'bg-zinc-100 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-500/20';
  return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${style}`}>{labels[s] || s}</span>;
};

export default function TabelaPedidos({ pedidos, loading, page, totalPages, totalItems, onPageChange, onRowClick, baixados, onDownload, activeTab, plataformaAtiva }) {
  
  // 🟢 FORÇAMOS A LEITURA BLINDADA DA PLATAFORMA
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
              <th className="px-5 py-4 w-20">ID</th>
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

              return (
                <tr key={idReal} onClick={() => onRowClick(pedido)} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group">
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300 font-mono font-medium">#{idReal}</td>
                  <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                    {clienteNomeLista}
                    
                    {/* 🟢 Badge do Vendedor super elegante! */}
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
                        onClick={(e) => { e.stopPropagation(); onDownload(pedido); }}
                        title={foiBaixado ? (isOmie ? "Já Enviado" : "Baixar Novamente") : (isOmie ? "Enviar para o ERP" : "Baixar CSV do Pedido")}
                        
                        // 🟢 w-fit e whitespace-nowrap AQUI! Botão blindado contra crescimento!
                        className={`flex w-fit whitespace-nowrap items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 ${
                          foiBaixado 
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-500/20" 
                            : (isOmie 
                                ? "bg-purple-100 dark:bg-purple-500/10 text-purple-700 border-purple-200 dark:border-purple-500/20"
                                : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-500/20")
                        }`}
                      >
                        {foiBaixado ? <CheckCircle2 size={16} className="shrink-0" /> : (isOmie ? <CloudUpload size={16} className="shrink-0" /> : <FileDown size={16} className="shrink-0" />)}
                        {foiBaixado ? (isOmie ? "Enviado" : "Baixado") : (isOmie ? "Enviar ERP" : "Exportar CSV")}
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
          <span className="ml-2 hidden sm:inline">({totalItems} pedidos no total)</span>
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm hover:bg-zinc-50 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-transparent shadow-sm hover:bg-zinc-50 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}