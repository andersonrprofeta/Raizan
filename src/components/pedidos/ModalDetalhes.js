import { useState, useEffect } from "react";
import { X, User, MapPin, FileText, Package, Phone, Mail, Calendar, Edit, Loader2, Truck, CheckCircle2 } from "lucide-react"; 
import Link from "next/link"; 
import { getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

const getMetaValue = (metaData, keys) => {
  if (!metaData || !Array.isArray(metaData)) return "Não informado";
  const meta = metaData.find(m => keys.includes(m.key));
  return meta ? meta.value : "Não informado";
};

// 🟢 SNIPER DE RASTREIO
const acharCodigoRastreio = (pedido) => {
  if (!pedido.meta_data || !Array.isArray(pedido.meta_data)) return null;
  const chavesRastreio = ['_wc_correios_tracking_codes', 'correios_tracking', '_tracking_number', '_frenet_tracking_code', '_frenet_tracking_number'];
  for (let meta of pedido.meta_data) {
    if (chavesRastreio.includes(meta.key) && meta.value) {
      let valorStr = typeof meta.value === 'string' ? meta.value : JSON.stringify(meta.value);
      const regexCorreios = /([A-Z]{2}[0-9]{9}[A-Z]{2})/i; 
      const match = valorStr.match(regexCorreios);
      if (match) return match[1]; 
      return valorStr.replace(/[\[\]"']/g, '').trim(); 
    }
  }
  const pedidoString = JSON.stringify(pedido);
  const regexGeralCorreios = /([A-Z]{2}[0-9]{9}[A-Z]{2})/i;
  const matchGeral = pedidoString.match(regexGeralCorreios);
  if (matchGeral) return matchGeral[1];
  return null;
};

const parseEndereco = (pedido) => {
  let rawEnd = {};
  const tryParse = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch(e) { return null; }
  };
  
  if (pedido.billing && Object.keys(pedido.billing).length > 0) rawEnd = pedido.billing;
  else if (pedido.cliente && (pedido.cliente.endereco || pedido.cliente.endereco_json)) {
    rawEnd = tryParse(pedido.cliente.endereco_json) || tryParse(pedido.cliente.endereco) || {};
  } else if (pedido.endereco || pedido.endereco_json || pedido.endereco_entrega) {
    rawEnd = tryParse(pedido.endereco_json) || tryParse(pedido.endereco) || tryParse(pedido.endereco_entrega) || {};
  }

  return {
    first_name: rawEnd.first_name || pedido.cliente?.nome || rawEnd.nome || rawEnd.fantasia || '',
    last_name: rawEnd.last_name || '',
    email: rawEnd.email || pedido.cliente?.email || '',
    phone: rawEnd.phone || rawEnd.telefone || pedido.cliente?.telefone || pedido.telefone || '',
    address_1: rawEnd.address_1 || rawEnd.endereco || rawEnd.logradouro || '',
    address_2: rawEnd.address_2 || rawEnd.complemento || '',
    neighborhood: rawEnd.neighborhood || rawEnd.bairro || '',
    city: rawEnd.city || rawEnd.cidade || '',
    state: rawEnd.state || rawEnd.estado || rawEnd.uf || '',
    postcode: rawEnd.postcode || rawEnd.cep || '',
    cpf_cnpj: pedido.cnpj_cpf || pedido.cliente?.cnpj || pedido.cliente?.cpf_cnpj || rawEnd.cnpj_cpf || rawEnd.cpf_cnpj || '',
    ie: pedido.inscricao_estadual || rawEnd.ie || rawEnd.inscricao_estadual || ''
  };
};

const obterTenantSeguro = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userRaw = localStorage.getItem("@raizan:user");
    if (userRaw) {
      const userObj = JSON.parse(userRaw);
      if (userObj.tenant_id) return userObj.tenant_id;
      if (userObj.cnpj) return userObj.cnpj;
    }
  } catch(e) {}
  return localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID || null;
};

export default function ModalDetalhes({ pedido, onClose, activeTabObj, onUpdateStatus }) {
  const [dadosRecuperados, setDadosRecuperados] = useState(null);
  const [recuperando, setRecuperando] = useState(false);
  const [loadingRastreio, setLoadingRastreio] = useState(false);
  const [timelineRastreio, setTimelineRastreio] = useState(null);

  // 🟢 IDENTIFICADOR BLINDADO
  const isOmie = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase().includes('omie');

  useEffect(() => {
    if (!pedido) {
      setDadosRecuperados(null);
      setTimelineRastreio(null);
      return;
    }
    const currentPedidoId = pedido.id || pedido.pedido_id;
    setDadosRecuperados(null);
    setTimelineRastreio(null);

    // 🟢 AGORA O AUTO-RECUPERADOR FUNCIONA PRO B2B E PRO APP/OMIE!
    if (activeTabObj?.tipo !== 'b2b' && !isOmie) return; 

    const endParcial = parseEndereco(pedido);
    const emailBase = endParcial.email;

    if (!endParcial.address_1 && emailBase && emailBase !== "Sem e-mail") {
      const buscarNoCadastro = async () => {
        setRecuperando(true);
        try {
          const tenantId = obterTenantSeguro();
          const res = await fetch(`${getHubUrl()}/api/hub/clientes`, { headers: { ...getHeaders(), 'x-tenant-id': tenantId } });
          const data = await res.json();
          if (data.success) {
            const clienteCadastrado = data.clientes.find(c => c.email === emailBase);
            if (clienteCadastrado) {
              let endJson = {};
              try { endJson = typeof clienteCadastrado.endereco_json === 'string' ? JSON.parse(clienteCadastrado.endereco_json) : clienteCadastrado.endereco_json; } catch(e){}
              
              setDadosRecuperados({ 
                pedidoId: currentPedidoId, 
                cpf_cnpj: clienteCadastrado.cpf_cnpj, 
                ie: clienteCadastrado.inscricao_estadual || clienteCadastrado.ie || "",
                telefone: clienteCadastrado.telefone, 
                endereco: endJson 
              });
            }
          }
        } catch(e) {}
        setRecuperando(false);
      };
      buscarNoCadastro();
    }
  }, [pedido?.id, pedido?.pedido_id, activeTabObj, isOmie]);

  if (!pedido) return null;

  const dataPedido = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em).toLocaleString('pt-BR');
  const pedidoIdAtual = pedido.id || pedido.pedido_id;
  const statusAtual = pedido.status || pedido.status_pedido || 'pendente';
  
  let endereco = parseEndereco(pedido);
  
  let cpfCnpj = endereco.cpf_cnpj || getMetaValue(pedido.meta_data, ['_billing_cpf', '_billing_cnpj', 'billing_cpf', 'billing_cnpj']);
  if (!cpfCnpj || cpfCnpj === "Não informado" || cpfCnpj.trim() === '') cpfCnpj = 'Não informado';

  let ie = endereco.ie || getMetaValue(pedido.meta_data, ['_billing_ie', 'billing_ie']);
  if (!ie || ie === "Não informado" || ie.trim() === '') ie = 'Não informado';

  let telefone = endereco.phone || "Não informado";
  if (!telefone || telefone.trim() === '') telefone = 'Não informado';

  // 🟢 APLICANDO OS DADOS RECUPERADOS DA NUVEM (INCLUINDO A INSCRIÇÃO ESTADUAL)
  if (dadosRecuperados && dadosRecuperados.pedidoId === pedidoIdAtual) {
    if (dadosRecuperados.cpf_cnpj) cpfCnpj = dadosRecuperados.cpf_cnpj;
    if (dadosRecuperados.ie) ie = dadosRecuperados.ie;
    if (dadosRecuperados.telefone) telefone = dadosRecuperados.telefone;
    if (dadosRecuperados.endereco && Object.keys(dadosRecuperados.endereco).length > 0) {
      endereco.address_1 = dadosRecuperados.endereco.logradouro || dadosRecuperados.endereco.endereco || '';
      endereco.address_2 = dadosRecuperados.endereco.complemento || '';
      endereco.neighborhood = dadosRecuperados.endereco.bairro || '';
      endereco.city = dadosRecuperados.endereco.cidade || '';
      endereco.state = dadosRecuperados.endereco.estado || dadosRecuperados.endereco.uf || '';
      endereco.postcode = dadosRecuperados.endereco.cep || '';
    }
  }

  const codigoRastreio = acharCodigoRastreio(pedido);

  const handleRastrear = async () => {
    setLoadingRastreio(true);
    try {
      const tenantId = obterTenantSeguro();
      const res = await fetch(`${getHubUrl()}/api/hub/rastreio`, {
        method: "POST",
        headers: { ...getHeaders(), 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ codigo: codigoRastreio })
      });
      const data = await res.json();
      if (data.success && data.timeline) {
        setTimelineRastreio(data.timeline);
      } else {
        toast.error(data.message || "Rastreio não encontrado.");
      }
    } catch (error) {
      toast.error("Erro ao buscar rastreio.");
    }
    setLoadingRastreio(false);
  };

  const statusOpcoes = activeTabObj?.tipo === 'b2b' 
    ? [{ value: 'aguardando-pagamento', label: 'Aguardando Pagamento' }, { value: 'pago', label: 'Pago / Aprovado' }, { value: 'enviado', label: 'Enviado / Em Trânsito' }, { value: 'entregue', label: 'Pedido Entregue' }, { value: 'cancelado', label: 'Cancelado' }]
    : [{ value: 'pending', label: 'Pagamento Pendente' }, { value: 'processing', label: 'Processando / Pago' }, { value: 'on-hold', label: 'Aguardando' }, { value: 'completed', label: 'Concluído / Entregue' }, { value: 'cancelled', label: 'Cancelado' }, { value: 'pendente', label: 'Pendente' }, { value: 'sincronizado', label: 'Sincronizado ERP' }];

  const clienteNome = endereco.first_name ? `${endereco.first_name || ''} ${endereco.last_name || ''}` : `Cliente #${pedido.cliente_id || 'Varejo'}`;
  const itensPedido = pedido.line_items || pedido.itens || [];

  const isEntregue = ['completed', 'entregue'].includes(statusAtual);

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
              
              {/* 🟢 O BOTÃO EDITAR VOLTOU PRO JOGO! */}
              {['aguardando-pagamento', 'pending', 'processing', 'on-hold', 'pago', 'pendente'].includes(statusAtual) && (
                <Link href={`/editar-pedido?id=${pedido.id || pedido.pedido_id}`}>
                  <button className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 ml-2 shadow-sm"><Edit size={14} /> Editar</button>
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
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5 relative">
                {recuperando && <div className="absolute top-4 right-4"><Loader2 size={16} className="text-emerald-500 animate-spin" /></div>}
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><User size={16} className="text-purple-600" /> Informações do Cliente</h3>
                <div className="space-y-3 text-sm">
                  <p><span className="text-zinc-500">Razão/Nome:</span> <span className="font-medium text-zinc-900 dark:text-zinc-100">{clienteNome}</span></p>
                  <p className="flex items-center gap-2"><span className="text-zinc-500">CPF/CNPJ:</span> {recuperando ? <span className="w-32 h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /> : <span className={cpfCnpj !== 'Não informado' ? "text-emerald-600 font-bold" : "text-zinc-900 dark:text-zinc-100"}>{cpfCnpj}</span>}</p>
                  <p className="flex items-center gap-2"><span className="text-zinc-500">Inscrição Est.:</span> {recuperando ? <span className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /> : <span className="text-zinc-900 dark:text-zinc-100">{ie}</span>}</p>
                  <p className="flex items-center gap-2 mt-2"><Mail size={14} className="text-zinc-500" /> <span className="truncate text-zinc-900 dark:text-zinc-100">{endereco.email || "Sem e-mail"}</span></p>
                  <p className="flex items-center gap-2"><Phone size={14} className="text-zinc-500" /> {recuperando ? <span className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /> : <span className={telefone !== 'Não informado' ? "text-emerald-600 font-bold" : "text-zinc-900 dark:text-zinc-100"}>{telefone}</span>}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2"><MapPin size={16} className="text-blue-600" /> Cobrança / Entrega</h3>
                <div className={`space-y-1 text-sm ${endereco.address_1 ? "text-emerald-600 font-bold" : "text-zinc-700 dark:text-zinc-300"}`}>
                  {recuperando ? (
                    <div className="space-y-2 pt-1"><div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-full animate-pulse" /><div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3 animate-pulse" /></div>
                  ) : endereco.address_1 ? (
                    <>
                      <p>{endereco.address_1}{endereco.address_2 ? `, ${endereco.address_2}` : ''}</p>
                      <p>{endereco.neighborhood}{endereco.neighborhood && endereco.city ? ' - ' : ''}{endereco.city} {endereco.state ? `- ${endereco.state}` : ''}</p>
                      {endereco.postcode && <p>CEP: {endereco.postcode}</p>}
                    </>
                  ) : (
                    <p className="text-zinc-500">Endereço não cadastrado neste pedido.</p>
                  )}
                </div>
              </div>

              {codigoRastreio && (
                <div className="bg-white dark:bg-[#0c0c0e] border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                      <Truck size={16} /> Logística e Rastreio
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded">
                      {codigoRastreio}
                    </span>
                  </div>

                  {!timelineRastreio ? (
                    <div className="mt-4">
                      <button 
                        onClick={handleRastrear}
                        disabled={loadingRastreio}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        {loadingRastreio ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                        {loadingRastreio ? "Buscando dados..." : "Acompanhar Encomenda"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <div className="relative flex justify-between items-center w-full mb-10 px-2">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-1000 ${isEntregue ? 'w-full bg-emerald-500' : 'w-1/2 bg-blue-600'}`} />

                        <div className="relative flex flex-col items-center z-10 group">
                          <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-[#0c0c0e] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 ${isEntregue ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                            <CheckCircle2 size={12} />
                          </div>
                          <span className="absolute top-8 text-[11px] font-bold text-zinc-900 dark:text-zinc-100">Aprovado</span>
                        </div>

                        <div className="relative flex flex-col items-center z-10 group">
                          <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-[#0c0c0e] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 ${isEntregue ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                            <Truck size={12} />
                          </div>
                          <span className={`absolute top-8 text-[11px] font-bold ${isEntregue ? 'text-emerald-600' : 'text-blue-600'}`}>Enviado</span>
                        </div>

                        <div className="relative flex flex-col items-center z-10 group">
                          <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-[#0c0c0e] flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isEntregue ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                            {isEntregue ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>}
                          </div>
                          <span className={`absolute top-8 text-[11px] ${isEntregue ? 'font-bold text-emerald-600' : 'font-medium text-zinc-400'}`}>Entregue</span>
                        </div>
                      </div>

                      <div className="mt-8 space-y-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Últimas Atualizações</p>
                        {timelineRastreio.map((evento, index) => {
                          let textoStatus = evento.status;
                          if (isEntregue && index === 0 && evento.data === "Atualização Automática") {
                            textoStatus = "Objeto Entregue ao Destinatário";
                          }

                          return (
                            <div key={index} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? (isEntregue ? 'bg-emerald-500' : 'bg-blue-600') : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                                <span className={index === 0 ? (isEntregue ? 'text-emerald-600 font-bold' : 'text-zinc-900 dark:text-zinc-100 font-bold') : 'text-zinc-500'}>{textoStatus}</span>
                              </div>
                              <div className="text-right">
                                <span className="block text-zinc-400 text-[10px]">{evento.local}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

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