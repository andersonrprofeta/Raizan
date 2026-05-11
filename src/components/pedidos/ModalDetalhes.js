import { X, User, MapPin, FileText, Package, Phone, Mail, Calendar, Edit } from "lucide-react"; 
import Link from "next/link"; 

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const getMetaValue = (metaData, keys) => {
  if (!metaData) return "Não informado";
  const meta = metaData.find(m => keys.includes(m.key));
  return meta ? meta.value : "Não informado";
};

const parseEndereco = (pedido) => {
  if (pedido.billing) return pedido.billing;
  if (pedido.endereco_entrega) {
    try { return typeof pedido.endereco_entrega === 'string' ? JSON.parse(pedido.endereco_entrega) : pedido.endereco_entrega; } catch(e) {}
  }
  return {};
};

export default function ModalDetalhes({ pedido, onClose, activeTab, onUpdateStatus }) {
  if (!pedido) return null;

  const dataPedido = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em).toLocaleString('pt-BR');
  const cpfCnpj = getMetaValue(pedido.meta_data, ['_billing_cpf', '_billing_cnpj', 'billing_cpf', 'billing_cnpj']);
  const ie = getMetaValue(pedido.meta_data, ['_billing_ie', 'billing_ie']);
  const endereco = parseEndereco(pedido);

  const statusOpcoes = activeTab === 'b2b' 
    ? [
        { value: 'aguardando-pagamento', label: 'Aguardando Pagamento' }, { value: 'pago', label: 'Pago / Aprovado' },
        { value: 'enviado', label: 'Enviado / Em Trânsito' }, { value: 'entregue', label: 'Pedido Entregue' }, { value: 'cancelado', label: 'Cancelado' }
      ]
    : [
        { value: 'pending', label: 'Pagamento Pendente' }, { value: 'processing', label: 'Processando / Pago' },
        { value: 'on-hold', label: 'Aguardando' }, { value: 'completed', label: 'Concluído / Entregue' },
        { value: 'cancelled', label: 'Cancelado' }, { value: 'pendente', label: 'Pendente' }
      ];

  const clienteNome = endereco.first_name ? `${endereco.first_name || ''} ${endereco.last_name || ''}` : `Cliente #${pedido.cliente_id || 'Varejo'}`;
  const statusAtual = pedido.status || pedido.status_pedido || 'pendente';
  const itensPedido = pedido.line_items || pedido.itens || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">Pedido #{pedido.id || pedido.pedido_id}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Status:</span>
              <select value={statusAtual} onChange={(e) => onUpdateStatus(pedido.id || pedido.pedido_id, e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 text-xs px-2 py-1 rounded-md outline-none focus:border-purple-500 font-medium">
                {!statusOpcoes.find(o => o.value === statusAtual) && <option value={statusAtual}>{statusAtual}</option>}
                {statusOpcoes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {['aguardando-pagamento', 'pending', 'processing', 'on-hold', 'pago', 'pendente'].includes(statusAtual) && (
                <Link href={`/editar-pedido?id=${pedido.id || pedido.pedido_id}`}>
                  <button className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ml-2"><Edit size={14} /> Editar</button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl mb-1"><X size={20} /></button>
            <p className="text-xs text-zinc-500 flex items-center gap-1"><Calendar size={12} /> {dataPedido}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><User size={16} className="text-purple-600" /> Informações do Cliente</h3>
                <div className="space-y-3 text-sm">
                  <p><span className="text-zinc-500">Razão/Nome:</span> <span className="font-medium">{clienteNome}</span></p>
                  <p><span className="text-zinc-500">CPF/CNPJ:</span> <span>{cpfCnpj}</span></p>
                  <p><span className="text-zinc-500">Inscrição Est.:</span> <span>{ie}</span></p>
                  <p className="flex items-center gap-2 mt-2"><Mail size={14} className="text-zinc-500" /> <span className="truncate">{endereco.email || "Sem e-mail"}</span></p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-zinc-500" /> <span>{endereco.phone || "Não informado"}</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><MapPin size={16} className="text-blue-600" /> Cobrança / Entrega</h3>
                <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {endereco.first_name || endereco.address_1 ? (
                    <><p>{endereco.address_1}{endereco.address_2 ? `, ${endereco.address_2}` : ''}</p><p>{endereco.neighborhood || endereco.city} - {endereco.state}</p><p>CEP: {endereco.postcode}</p></>
                  ) : (<p>Endereço não disponível</p>)}
                </div>
              </div>
              {pedido.customer_note && (
                <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-orange-600 flex items-center gap-2 mb-2"><FileText size={16} /> Observação do Cliente</h3>
                  <p className="text-sm italic">{pedido.customer_note}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><Package size={16} className="text-emerald-600" /> Itens do Pedido</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-900/50">
                  <tr><th className="px-4 py-3 rounded-l-lg">Produto</th><th className="px-4 py-3 text-center">Qtd</th><th className="px-4 py-3 text-right">Preço Un.</th><th className="px-4 py-3 text-right rounded-r-lg">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                  {itensPedido.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/20">
                      <td className="px-4 py-3 font-medium">{item.name || item.nome_produto} <br/><span className="text-xs text-zinc-500 font-normal">SKU: {item.sku || 'N/A'}</span></td>
                      <td className="px-4 py-3 text-center">{item.quantity || item.quantidade}</td>
                      <td className="px-4 py-3 text-right">{formatarMoeda(item.price || item.preco_unitario)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatarMoeda(item.total || item.preco_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-end space-y-2 text-sm">
              <div className="flex justify-between w-56 text-zinc-500"><span>Subtotal:</span><span>{formatarMoeda((pedido.total || pedido.valor_total) - (pedido.shipping_total || pedido.valor_frete || 0))}</span></div>
              <div className="flex justify-between w-56 text-zinc-500"><span>Frete:</span><span>{formatarMoeda(pedido.shipping_total || pedido.valor_frete || 0)}</span></div>
              <div className="flex justify-between w-56 text-lg font-bold mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800"><span>Total:</span><span className="text-emerald-600">{formatarMoeda(pedido.total || pedido.valor_total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}