import { useState, useEffect } from "react";
import { X, User, MapPin, FileText, Package, Phone, Mail, Calendar, Edit, Loader2, Truck, CheckCircle2, Scissors, Briefcase, CreditCard, AlertTriangle } from "lucide-react"; 
import Link from "next/link"; 
import { getHubUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

// ==========================================
// 🎨 TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

const PAINEL =
  "bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] " +
  "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_90px_-20px_rgba(0,0,0,0.9)]";

// Cartão de seção dentro do modal
const SECAO = "rounded-[22px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] p-5";
const SECAO_TITULO = "flex items-center gap-2.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.07]";

// Select em pílula (fundo sólido no escuro para a lista nativa ficar legível)
const SELECT_PILULA =
  "h-9 px-3.5 rounded-full bg-white dark:bg-[#1a1a1d] border border-black/[0.08] dark:border-white/[0.1] " +
  "text-zinc-900 dark:text-zinc-100 text-xs font-semibold outline-none cursor-pointer " +
  "focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15 transition-all dark:[color-scheme:dark]";

const TILE_CORES = {
  emerald: "from-emerald-400 to-emerald-600",
  purple: "from-violet-400 to-purple-600",
  blue: "from-sky-400 to-blue-600",
  rose: "from-rose-400 to-rose-600",
  orange: "from-orange-400 to-orange-500",
};

const Tile = ({ cor = "purple", size = 28, children }) => (
  <div
    className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE_CORES[cor]} text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(0,0,0,0.35)]`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    {children}
  </div>
);

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
  return null;
};

// 🟢 TRADUTOR LOCAL (COM REFORÇO DA LISTA OFICIAL)
const formatarPrazo = (valorRaw, dicionarioCondicoes) => {
  if (!valorRaw) return "A Combinar";
  let valor = String(valorRaw).trim();
  
  if (valor.toUpperCase().startsWith('CÓD:')) {
      valor = valor.replace(/CÓD:\s*/i, '').trim();
  }

  if (dicionarioCondicoes && dicionarioCondicoes.length > 0) {
      const prazoEncontrado = dicionarioCondicoes.find(c => String(c.codigo) === valor || String(c.cCodigo) === valor);
      if (prazoEncontrado) return prazoEncontrado.descricao || prazoEncontrado.cDescricao;
  }

  if (isNaN(Number(valor)) && valor.length > 3 && !valor.startsWith('CÓD')) return valor;

  const mapaCodigos = {
    "000": "À Vista",
    "999": "A Combinar / Faturado",
    "0": "À Vista"
  };
  
  return mapaCodigos[valor] || `CÓD: ${valor}`;
};

export default function ModalDetalhes({ pedido, onClose, activeTabObj, onUpdateStatus }) {
  const [dadosRecuperados, setDadosRecuperados] = useState(null);
  const [recuperando, setRecuperando] = useState(false);
  const [loadingRastreio, setLoadingRastreio] = useState(false);
  const [timelineRastreio, setTimelineRastreio] = useState(null);
  const [condicoesOmie, setCondicoesOmie] = useState([]);

  useEffect(() => {
    if (!pedido) {
      setDadosRecuperados(null);
      setTimelineRastreio(null);
      return;
    }
    const currentPedidoId = pedido.id || pedido.pedido_id;
    setDadosRecuperados(null);
    setTimelineRastreio(null);

    const fetchPrazos = async () => {
        try {
            const tenantId = obterTenantSeguro();
            const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/omie/condicoes-pagamento`, {
                headers: { "x-tenant-id": tenantId }
            });
            const data = await res.json();
            if (data.success && data.condicoes) {
                setCondicoesOmie(data.condicoes);
            }
        } catch(e) { }
    };
    fetchPrazos();

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
  }, [pedido?.id, pedido?.pedido_id, activeTabObj]);

  if (!pedido) return null;

  // 🆕 Se a data vier vazia/inválida mostra "—" em vez de "Invalid Date"
  const dataObj = new Date(pedido.date_created || pedido.data_criacao || pedido.criado_em);
  const dataPedido = isNaN(dataObj.getTime()) ? '—' : dataObj.toLocaleString('pt-BR');
  const pedidoIdAtual = pedido.id || pedido.pedido_id;
  const statusAtual = pedido.status || pedido.status_pedido || 'pendente';
  
  let endereco = parseEndereco(pedido);
  
  // 🆕 String(...) evita erro "trim is not a function" quando a API manda CPF/telefone como número
  let cpfCnpj = String(endereco.cpf_cnpj || getMetaValue(pedido.meta_data, ['_billing_cpf', '_billing_cnpj', 'billing_cpf', 'billing_cnpj']) || '');
  if (!cpfCnpj || cpfCnpj === "Não informado" || cpfCnpj.trim() === '') cpfCnpj = 'Não informado';

  let ie = String(endereco.ie || getMetaValue(pedido.meta_data, ['_billing_ie', 'billing_ie']) || '');
  if (!ie || ie === "Não informado" || ie.trim() === '') ie = 'Não informado';

  let telefone = String(endereco.phone || "Não informado");
  if (!telefone || telefone.trim() === '') telefone = 'Não informado';

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
  const isEntregue = ['completed', 'entregue'].includes(statusAtual);
  const vendedor = pedido.vendedor_nome || "Loja Online"; 
  const prazo = formatarPrazo(pedido.payment_method_title || pedido.metodo_pagamento, condicoesOmie);

  // ============================================================================
  // 🧠 CÉREBRO MATEMÁTICO: PROCESSA TODOS OS ITENS E CORTES
  // ============================================================================
  const valorOriginalPedido = Number(pedido.total || pedido.valor_total || 0);
  const valorFaturadoERP = pedido.valor_faturado !== undefined && pedido.valor_faturado !== null && Number(pedido.valor_faturado) > 0 
    ? Number(pedido.valor_faturado) 
    : valorOriginalPedido;

  const houveReducaoValor = valorFaturadoERP < (valorOriginalPedido - 0.05);
  const isPedidoAlteradoERP = pedido.teve_corte === 1 || pedido.teve_corte === true;
  const itensPedidoBase = pedido.line_items || pedido.itens || [];

  // Desconto geral do app enquanto ele ainda não foi distribuído nos itens pelo Omie
  const descontoGeral = Number(pedido.desconto || 0);
  const percentualGeral = descontoGeral > 0 && Number(pedido.subtotal) > 0 ? (descontoGeral / Number(pedido.subtotal)) * 100 : 0;

  const itensProcessados = itensPedidoBase.map(item => {
      let qtdPedida = Number(item.quantity || item.quantidade || 0);
      let qtdFaturada = item.qtd_faturada !== undefined && item.qtd_faturada !== null ? Number(item.qtd_faturada) : qtdPedida;
      
      let precoUnOriginal = Number(item.price || item.preco_unitario || 0);
      let totalOriginal = Number(item.total || item.preco_total || 0);
      if (totalOriginal === 0) totalOriginal = qtdPedida * precoUnOriginal;

      let totalFaturado = item.valor_faturado !== undefined && item.valor_faturado !== null 
        ? Number(item.valor_faturado) 
        : (qtdFaturada * precoUnOriginal);

      // 🚑 SALVA-VIDAS GLOBAL (Se só tem 1 item e o backend não carimbou a linha)
      if (isPedidoAlteradoERP && qtdFaturada === qtdPedida && itensPedidoBase.length === 1) {
          totalFaturado = valorFaturadoERP;
          if (precoUnOriginal > 0 && totalFaturado < totalOriginal) {
              qtdFaturada = Math.floor((totalFaturado + 0.01) / precoUnOriginal);
          }
      }

      // 🟢 Se qtdFaturada for MAIOR que qtdPedida (cliente pediu mais), cortado é 0 (não destaca corte)!
      const cortado = qtdPedida > qtdFaturada ? (qtdPedida - qtdFaturada) : 0;
      let precoUnFaturado = qtdFaturada > 0 ? (totalFaturado / qtdFaturada) : precoUnOriginal;

      // A linha mostra só o desconto do próprio item. Com desconto geral, o que o Omie
      // grava no item é a parte do geral, que aparece apenas na totalização.
      const precoTabela = Number(item.preco_tabela || 0);
      const descontoDoItem = precoTabela > precoUnOriginal
        ? (precoTabela - precoUnOriginal) * qtdFaturada
        : (descontoGeral > 0 ? 0 : Number(item.desconto_valor || 0));
      const precoCheio = precoTabela > precoUnOriginal
        ? precoTabela
        : (qtdFaturada > 0 ? (totalFaturado + descontoDoItem) / qtdFaturada : precoUnOriginal);
      const percentualDoItem = precoCheio > 0 && qtdFaturada > 0 ? (descontoDoItem / (precoCheio * qtdFaturada)) * 100 : 0;

      return {
          nome: item.name || item.nome_produto,
          sku: item.sku || 'N/A',
          qtdPedida,
          qtdFaturada,
          cortado,
          precoUnOriginal,
          precoUnFaturado,
          totalOriginal,
          totalFaturado,
          descontoDoItem,
          percentualDoItem,
          precoCheio
      };
  });

  // 🟢 Na tabela principal só aparecem os produtos que tiveram pelo menos 1 unidade faturada!
  const itensAtendidos = itensProcessados.filter(i => i.qtdFaturada > 0);
  // 🟢 No card de cortes entram tanto os cortados parcialmente quanto os excluídos (qtdFaturada === 0)!
  const itensComCorte = itensProcessados.filter(i => i.cortado > 0);
  const teveAlgumCorte = itensComCorte.length > 0;

  const totalDosItens = itensAtendidos.reduce((acc, i) => acc + i.totalFaturado, 0);

  // Quando o Omie distribui o desconto geral, o item fica menor que quantidade x preço
  const descontoJaNosItens = itensAtendidos.some(i => i.totalFaturado < (i.qtdFaturada * i.precoUnOriginal) - 0.05);
  const mostrarDescontoGeral = descontoGeral > 0 && !descontoJaNosItens;

  // Calculado sobre o que foi atendido: item cortado leva junto a parte dele no desconto
  const brutoDosItens = itensAtendidos.reduce((acc, i) => acc + (i.qtdFaturada * i.precoUnOriginal), 0);
  const descontoEmAberto = mostrarDescontoGeral ? (totalDosItens * percentualGeral) / 100 : 0;
  const descontoGeralAplicado = descontoGeral > 0 ? (mostrarDescontoGeral ? descontoEmAberto : brutoDosItens - totalDosItens) : 0;

  // Sem o desconto no Omie, o valor dele ainda é o bruto. Pedido do app ainda não enviado já vem líquido.
  const totalSemDesconto = valorFaturadoERP >= totalDosItens - 0.05;
  const valorTotalReal = totalSemDesconto ? valorFaturadoERP - descontoEmAberto : valorFaturadoERP;
  const freteReal = Number(pedido.shipping_total || pedido.valor_frete || 0);
  const subtotalReal = descontoGeralAplicado > 0 ? (mostrarDescontoGeral ? totalDosItens : brutoDosItens) : valorTotalReal - freteReal;

  return (
    // z-[100]: fica acima do Header (z-40) e da Sidebar (z-50)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md transition-all animate-in fade-in duration-200" onClick={onClose}>
      <div className={`${PAINEL} rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.07]">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Pedido #{pedido.id || pedido.pedido_id}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs font-semibold text-zinc-500">Status:</span>
              <select value={statusAtual} onChange={(e) => onUpdateStatus(pedido.id || pedido.pedido_id, e.target.value)} className={SELECT_PILULA}>
                {!statusOpcoes.find(o => o.value === statusAtual) && <option value={statusAtual}>{statusAtual}</option>}
                {statusOpcoes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              
              {['aguardando-pagamento', 'pending', 'processing', 'on-hold', 'pago', 'pendente'].includes(statusAtual) && (
                <Link href={`/editar-pedido?id=${pedido.id || pedido.pedido_id}`}>
                  <button className="h-9 bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-400/30 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"><Edit size={14} /> Editar</button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.09] dark:hover:bg-white/[0.14] transition-all active:scale-90" aria-label="Fechar"><X size={18} /></button>
            <p className="text-xs text-zinc-500 flex items-center gap-1 tabular-nums"><Calendar size={12} /> {dataPedido}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Cliente */}
              <div className={`${SECAO} relative`}>
                {recuperando && <div className="absolute top-4 right-4"><Loader2 size={16} className="text-emerald-500 animate-spin" /></div>}
                
                <div className={`${SECAO_TITULO} justify-between`}>
                  <span className="flex items-center gap-2.5"><Tile cor="purple"><User size={14} /></Tile> Informações do Cliente</span>
                  <span className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full max-w-[45%]">
                    <Briefcase size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 truncate">{vendedor}</span>
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500 shrink-0">Razão/Nome</span>
                    <span className="font-semibold text-right text-zinc-900 dark:text-zinc-100 break-words">{clienteNome}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 shrink-0">CPF/CNPJ</span>
                    {recuperando ? <span className="w-32 h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" /> : <span className={`tabular-nums ${cpfCnpj !== 'Não informado' ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-900 dark:text-zinc-100"}`}>{cpfCnpj}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 shrink-0">Inscrição Est.</span>
                    {recuperando ? <span className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" /> : <span className="text-zinc-900 dark:text-zinc-100 tabular-nums">{ie}</span>}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-full w-max max-w-full">
                    <CreditCard size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                       Condição: {condicoesOmie.length === 0 ? "Buscando..." : prazo.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-zinc-500 flex items-center gap-2 shrink-0"><Mail size={14} /> E-mail</span>
                    <span className="truncate text-zinc-900 dark:text-zinc-100">{endereco.email || "Sem e-mail"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-zinc-500 flex items-center gap-2 shrink-0"><Phone size={14} /> Telefone</span>
                    {recuperando ? <span className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" /> : <span className={`tabular-nums ${telefone !== 'Não informado' ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-900 dark:text-zinc-100"}`}>{telefone}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Endereço */}
              <div className={SECAO}>
                <h3 className={SECAO_TITULO}><Tile cor="blue"><MapPin size={14} /></Tile> Cobrança / Entrega</h3>
                <div className={`space-y-1 text-sm ${endereco.address_1 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-700 dark:text-zinc-300"}`}>
                  {recuperando ? (
                    <div className="space-y-2 pt-1"><div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-full animate-pulse" /><div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-2/3 animate-pulse" /></div>
                  ) : endereco.address_1 ? (
                    <>
                      <p>{endereco.address_1}{endereco.address_2 ? `, ${endereco.address_2}` : ''}</p>
                      <p>{endereco.neighborhood}{endereco.neighborhood && endereco.city ? ' - ' : ''}{endereco.city} {endereco.state ? `- ${endereco.state}` : ''}</p>
                      {endereco.postcode && <p>CEP: {endereco.postcode}</p>}
                    </>
                  ) : (
                    <p className="text-zinc-500 font-normal">Endereço não cadastrado neste pedido.</p>
                  )}
                </div>
              </div>

              {/* Rastreio */}
              {codigoRastreio && (
                <div className="bg-white dark:bg-[#17171a] border border-blue-500/25 rounded-[22px] p-5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold tracking-tight text-blue-700 dark:text-blue-400 flex items-center gap-2.5">
                      <Tile cor="blue"><Truck size={14} /></Tile> Logística e Rastreio
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                      {codigoRastreio}
                    </span>
                  </div>

                  {!timelineRastreio ? (
                    <div className="mt-4">
                      <button 
                        onClick={handleRastrear}
                        disabled={loadingRastreio}
                        className="w-full h-11 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-600 text-white text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(37,99,235,0.6)] disabled:opacity-70 active:scale-[0.98]"
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
                          <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-[#17171a] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 ${isEntregue ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                            <CheckCircle2 size={12} />
                          </div>
                          <span className="absolute top-8 text-[11px] font-bold text-zinc-900 dark:text-zinc-100">Aprovado</span>
                        </div>

                        <div className="relative flex flex-col items-center z-10 group">
                          <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-[#17171a] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 ${isEntregue ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                            <Truck size={12} />
                          </div>
                          <span className={`absolute top-8 text-[11px] font-bold ${isEntregue ? 'text-emerald-600' : 'text-blue-600'}`}>Enviado</span>
                        </div>

                        <div className="relative flex flex-col items-center z-10 group">
                          <div className={`w-7 h-7 rounded-full border-4 border-white dark:border-[#17171a] flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${isEntregue ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                            {isEntregue ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>}
                          </div>
                          <span className={`absolute top-8 text-[11px] ${isEntregue ? 'font-bold text-emerald-600' : 'font-medium text-zinc-400'}`}>Entregue</span>
                        </div>
                      </div>
                      
                      <div className="mt-8 space-y-2 border-t border-black/[0.06] dark:border-white/[0.07] pt-4">
                        <p className="text-xs font-semibold text-zinc-400 mb-2">Últimas Atualizações</p>
                        {timelineRastreio.map((evento, index) => (
                           <div key={index} className="flex justify-between items-center text-xs">
                             <div className="flex items-center gap-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? (isEntregue ? 'bg-emerald-500' : 'bg-blue-600') : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                               <span className={index === 0 ? (isEntregue ? 'text-emerald-600 font-bold' : 'text-zinc-900 dark:text-zinc-100 font-bold') : 'text-zinc-500'}>{evento.status}</span>
                             </div>
                             <div className="text-right">
                               <span className="block text-zinc-400 text-[10px]">{evento.local}</span>
                             </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Observação do cliente */}
              {pedido.customer_note && (
                <div className="bg-orange-500/[0.07] border border-orange-500/20 rounded-[22px] p-5">
                  <h3 className="text-sm font-semibold tracking-tight text-orange-600 dark:text-orange-400 flex items-center gap-2.5 mb-2"><Tile cor="orange"><FileText size={14} /></Tile> Observação do Cliente</h3>
                  <p className="text-sm italic text-zinc-700 dark:text-zinc-300">{pedido.customer_note}</p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* TABELA PRINCIPAL LIMPA (O QUE REALMENTE FOI FATURADO) */}
          {/* ========================================================= */}
          <div className={`mt-6 ${SECAO}`}>
            <h3 className={SECAO_TITULO}><Tile cor="emerald"><Package size={14} /></Tile> Itens do Pedido</h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs font-semibold text-zinc-500 border-b border-black/[0.06] dark:border-white/[0.07]">
                  <tr><th className="px-4 py-3">Produto</th><th className="px-4 py-3 text-center">Qtd</th><th className="px-4 py-3 text-right">Preço Un.</th><th className="px-4 py-3 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                  {itensAtendidos.map((item, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                          {item.nome} <br/>
                          <span className="text-xs text-zinc-500 font-normal">SKU: {item.sku}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold tabular-nums">{item.qtdFaturada}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.descontoDoItem > 0 && <span className="block text-[11px] text-zinc-400 line-through">{formatarMoeda(item.precoCheio)}</span>}
                          {formatarMoeda(item.precoUnFaturado)}
                          {item.descontoDoItem > 0 && (
                            <span className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              -{item.percentualDoItem.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% ({formatarMoeda(item.descontoDoItem)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatarMoeda(item.totalFaturado)}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.07] flex flex-col items-end space-y-2 text-sm">
              {houveReducaoValor && (
                <div className="flex justify-between w-72 text-zinc-400 text-xs">
                  <span>Valor Original Solicitado:</span>
                  <span className="line-through tabular-nums">{formatarMoeda(valorOriginalPedido)}</span>
                </div>
              )}
              <div className="flex justify-between w-72 text-zinc-500">
                <span>{descontoGeralAplicado > 0 ? 'Total de Mercadorias:' : 'Subtotal Faturado:'}</span>
                <span className="tabular-nums">{formatarMoeda(subtotalReal)}</span>
              </div>
              {descontoGeralAplicado > 0 && (
                <div className="flex justify-between w-72 text-emerald-600 dark:text-emerald-400">
                  <span>Desconto geral ({percentualGeral.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%):</span>
                  <span className="tabular-nums">-{formatarMoeda(descontoGeralAplicado)}</span>
                </div>
              )}
              <div className="flex justify-between w-72 text-zinc-500">
                <span>Frete:</span>
                <span className="tabular-nums">{formatarMoeda(freteReal)}</span>
              </div>
              
              <div className="flex justify-between items-center w-72 text-lg font-bold mt-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
                <span className="tracking-tight">Total Final:</span>
                <div className="flex flex-col items-end">
                  {houveReducaoValor && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mb-1 tabular-nums">
                      Reduzido (-{formatarMoeda(valorOriginalPedido - valorTotalReal)})
                    </span>
                  )}
                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatarMoeda(valorTotalReal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ✂️ ZONA DE AUDITORIA DE CORTES (PONTILHADO) */}
          {/* ========================================================= */}
          {teveAlgumCorte && (
            <div className="mt-6 rounded-[22px] border-2 border-dashed border-rose-300 dark:border-rose-500/30 bg-rose-500/[0.04] p-5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-dashed border-rose-200 dark:border-rose-800/40">
                <div className="flex items-center gap-3">
                  <Tile cor="rose" size={36}><Scissors size={18} /></Tile>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Cortes no Pedido
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Itens removidos ou reduzidos no faturamento do ERP
                    </p>
                  </div>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                  {itensComCorte.length} {itensComCorte.length === 1 ? 'item cortado' : 'itens cortados'}
                </span>
              </div>

              <div className="space-y-2.5">
                {itensComCorte.map((ic, idx) => (
                  <div 
                    key={idx} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-white/[0.04] p-3.5 px-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] hover:border-rose-300 dark:hover:border-rose-500/40 transition-all shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                        {ic.nome}
                      </p>
                      <div className="flex items-center flex-wrap gap-2 mt-1">
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                          SKU: {ic.sku}
                        </span>
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                          • Impacto: -{formatarMoeda(ic.cortado * ic.precoUnOriginal)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center">
                      <div className="px-3 py-1.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.07] text-center min-w-[68px]">
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">Pedido</p>
                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300 mt-0.5 tabular-nums">{ic.qtdPedida} un</p>
                      </div>

                      <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[68px]">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Faturado</p>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 tabular-nums">{ic.qtdFaturada} un</p>
                      </div>

                      <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_18px_-8px_rgba(244,63,94,0.7)] text-center min-w-[72px]">
                        <p className="text-[10px] text-rose-100 font-semibold">Cortado</p>
                        <p className="text-xs font-bold mt-0.5 tabular-nums">-{ic.cortado} un</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}