"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api";
import { ShoppingBag, Store, LayoutTemplate, Box, Layers, Search, Printer, X } from "lucide-react";

import TabelaPedidos from "@/components/pedidos/TabelaPedidos";
import ModalDetalhes from "@/components/pedidos/ModalDetalhes";

import MapaSeparacao from "@/components/checkout/MapaSeparacao"; 
import EtiquetaVolume from "@/components/checkout/etiqueta";

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, pílulas)
// ==========================================

// Barra de vidro (busca, empty state). Sem backdrop-blur no card da TABELA de propósito (ver abaixo).
const VIDRO =
  "relative rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] " +
  "transition-colors duration-300";

// Selects em formato de pílula (fundo sólido no escuro para a lista nativa ficar legível)
const SELECT_PILULA =
  "h-11 px-4 rounded-full bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] " +
  "text-sm font-semibold text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer " +
  "focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15 transition-all dark:[color-scheme:dark]";

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

const prepararDadosEtiqueta = (pedidoCru, dadosOmie) => {
  if (!pedidoCru) return null;

  let rawEnd = {};
  const tryParse = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch(e) { return null; }
  };
  
  if (pedidoCru.billing && Object.keys(pedidoCru.billing).length > 0) rawEnd = pedidoCru.billing;
  else if (pedidoCru.cliente && (pedidoCru.cliente.endereco || pedidoCru.cliente.endereco_json)) {
    rawEnd = tryParse(pedidoCru.cliente.endereco_json) || tryParse(pedidoCru.cliente.endereco) || {};
  } else if (pedidoCru.endereco || pedidoCru.endereco_json || pedidoCru.endereco_entrega) {
    rawEnd = tryParse(pedidoCru.endereco_json) || tryParse(pedidoCru.endereco) || tryParse(pedidoCru.endereco_entrega) || {};
  }

  const getMeta = (keys) => {
    if (!pedidoCru.meta_data || !Array.isArray(pedidoCru.meta_data)) return null;
    const m = pedidoCru.meta_data.find(x => keys.includes(x.key));
    return m ? m.value : null;
  };

  let idReal = pedidoCru.id || pedidoCru.pedido_id || "000000";
  const nomeLocal = rawEnd.first_name || pedidoCru.cliente?.nome || rawEnd.nome || rawEnd.fantasia || '';
  
  let doc = pedidoCru.cnpj_cpf || pedidoCru.cliente?.cnpj || pedidoCru.cliente?.cpf_cnpj || rawEnd.cnpj_cpf || rawEnd.cpf_cnpj || getMeta(['_billing_cpf', '_billing_cnpj', 'billing_cpf', 'billing_cnpj']) || 'Não informado';
  let cep = rawEnd.postcode || rawEnd.cep || pedidoCru.cep || pedidoCru.cliente?.cep || getMeta(['_billing_postcode', 'billing_postcode']) || '00000-000';
  let transportadora = pedidoCru.transportadora || pedidoCru.nome_transportadora || pedidoCru.frete?.nome_transportadora || getMeta(['transportadora', 'shipping_method']) || "LOGÍSTICA PADRÃO";
  let peso = pedidoCru.peso_total || "1.0 kg";
  let nfeNum = pedidoCru.numero_nfe || pedidoCru.codigo_externo || "000.000";
  let nfeSer = "1";
  let nfeChave = "00000000000000000000000000000000000000000000";
  let volumeTotal = 1; 
  
  if (dadosOmie) {
    if (dadosOmie.pedido && dadosOmie.pedido.numero) {
        idReal = dadosOmie.pedido.numero; 
    }
    if (dadosOmie.transporte) { 
        if (dadosOmie.transporte.peso) peso = dadosOmie.transporte.peso; 
        if (dadosOmie.transporte.volumes) volumeTotal = dadosOmie.transporte.volumes; 
        if (dadosOmie.transporte.nome) transportadora = dadosOmie.transporte.nome;
    }
    if (dadosOmie.nfe && dadosOmie.nfe.chave && dadosOmie.nfe.chave.length === 44) {
      nfeNum = dadosOmie.nfe.numero; nfeSer = dadosOmie.nfe.serie; nfeChave = dadosOmie.nfe.chave;
    }
    if (dadosOmie.cliente) {
      if (dadosOmie.cliente.cep && dadosOmie.cliente.cep !== '00000-000') cep = dadosOmie.cliente.cep;
      if (dadosOmie.cliente.documento && dadosOmie.cliente.documento !== 'Não informado') doc = dadosOmie.cliente.documento;
      if (dadosOmie.cliente.logradouro) rawEnd.address_1 = dadosOmie.cliente.logradouro;
      if (dadosOmie.cliente.numero) rawEnd.number = dadosOmie.cliente.numero;
      if (dadosOmie.cliente.bairro) rawEnd.neighborhood = dadosOmie.cliente.bairro;
      if (dadosOmie.cliente.cidade) rawEnd.city = dadosOmie.cliente.cidade;
      if (dadosOmie.cliente.estado) rawEnd.state = dadosOmie.cliente.estado;
    }
  }

  return {
    empresa: { 
      nome: typeof window !== 'undefined' ? localStorage.getItem("@raizan:nome") || 'DISTRIBUIDORA' : 'DISTRIBUIDORA', 
      cnpj: obterTenantSeguro() || 'CNPJ NÃO INFORMADO' 
    },
    cliente: {
      nome: dadosOmie?.cliente?.nome || `${nomeLocal} ${rawEnd.last_name || ''}`.trim() || 'Cliente Varejo',
      documento: doc,
      endereco: {
        logradouro: rawEnd.address_1 || rawEnd.endereco || rawEnd.logradouro || 'Endereço não informado',
        numero: rawEnd.number || rawEnd.numero || 'S/N',
        complemento: dadosOmie?.cliente?.complemento || rawEnd.address_2 || rawEnd.complemento || '',
        bairro: rawEnd.neighborhood || rawEnd.bairro || 'Bairro',
        cidade: rawEnd.city || rawEnd.cidade || 'Cidade',
        uf: rawEnd.state || rawEnd.estado || rawEnd.uf || 'UF',
        cep: cep
      }
    },
    pedido: { 
      numero: idReal, 
      data: new Date(pedidoCru.date_created || pedidoCru.data_criacao || pedidoCru.criado_em || new Date()).toLocaleDateString('pt-BR') 
    },
    transporte: { nome: transportadora, peso: peso },
    nfe: { numero: nfeNum, serie: nfeSer, chave: nfeChave },
    volume: { atual: 1, total: volumeTotal } 
  };
};

const INTERVALO_ATUALIZACAO_MS = 10000;

export default function Pedidos() {
  const [integracoesInstaladas, setIntegracoesInstaladas] = useState([]); 
  const [activeTabObj, setActiveTabObj] = useState(null); 

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baixados, setBaixados] = useState({});
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  const [documentoImpressao, setDocumentoImpressao] = useState({ tipo: null, pedido: null, dadosOmie: null });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ESTADOS DE BUSCA E FILTROS
  // 🆕 buscaQuery/filtroStatus = o que está digitado/selecionado.
  //    buscaAplicada/statusAplicado = o que realmente vai para a API (evita ler valor "velho" do React).
  const [buscaQuery, setBuscaQuery] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [statusAplicado, setStatusAplicado] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // Evita que uma resposta antiga (mais lenta) sobrescreva a mais recente
  const idRequisicao = useRef(0);
  const primeiraRodadaBusca = useRef(true);
  const requisicaoEmAndamento = useRef(false);
  const carregarPedidosRef = useRef(null);

  // ESTADO DO SWITCH (MODO DIGITAL SISTEMAS)
  const [modoDigital, setModoDigital] = useState(false);

  useEffect(() => {
    const fetchIntegracoes = async () => {
      try {
        const tenantId = obterTenantSeguro();
        if (!tenantId) return; 

        const res = await fetch(`${getHubUrl()}/api/hub/pedidos/integracoes-ativas`, {
          method: "GET", headers: { ...getHeaders(), "x-tenant-id": tenantId }
        });
        const data = await res.json();
        
        if (data.success && data.ativas.length > 0) {
          const canaisLimpados = data.ativas.filter(int => {
            if (int.id === null || int.id === undefined) return false;
            if (isNaN(Number(int.id))) return false;
            const plat = String(int.plataforma || int.tipo || '').toLowerCase();
            if (plat.includes('oracle') || plat.includes('motor')) return false;
            return true; 
          });

          const integracoesUnicas = canaisLimpados.filter((integracao, index, self) =>
            index === self.findIndex((t) => (t.id === integracao.id))
          );

          setIntegracoesInstaladas(integracoesUnicas);
          if (integracoesUnicas.length > 0) setActiveTabObj(integracoesUnicas[0]); 
        }
      } catch (e) {}
    };
    fetchIntegracoes();

    const salvos = localStorage.getItem("raizan_pedidos_baixados");
    if (salvos) setBaixados(JSON.parse(salvos));
    
    // Recuperar estado do switch no primeiro load
    const modoSalvo = localStorage.getItem("@raizan:modo_digital");
    if (modoSalvo === "true") setModoDigital(true);
  }, []);

  const toggleModoDigital = () => {
    const novoModo = !modoDigital;
    setModoDigital(novoModo);
    localStorage.setItem("@raizan:modo_digital", novoModo);
  };

  // silencioso = atualização automática: sem loading na tela e, se falhar, a lista atual continua
  const carregarPedidos = async (silencioso = false) => {
    if (!activeTabObj) return;
    if (silencioso && requisicaoEmAndamento.current) return;
    const meuId = ++idRequisicao.current;
    requisicaoEmAndamento.current = true;
    if (!silencioso) setLoading(true);
    try {
      const tenantId = obterTenantSeguro();
      const plataformaReal = (activeTabObj.plataforma || activeTabObj.tipo || "").toLowerCase();
      
      let endpoint = `${getHubUrl()}/api/hub/pedidos/woo`; 
      if (plataformaReal.includes("b2b") || plataformaReal.includes("portal")) {
        endpoint = `${getHubUrl()}/api/hub/pedidos/b2b`;
      } else if (plataformaReal.includes("omie")) {
        endpoint = `${getHubUrl()}/api/hub/pedidos/omie`;
      }

      const res = await fetch(endpoint, {
        method: "POST", 
        // 🆕 Content-Type explícito: sem ele o servidor pode ignorar o corpo (page, limit, busca, status)
        headers: { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ 
            page, 
            limit: Number(limit), 
            plataforma: plataformaReal, 
            integracao_id: activeTabObj.id,
            busca: buscaAplicada,
            status: statusAplicado
        }) 
      });
      
      const data = await res.json();
      
      // 🆕 Se já existe uma requisição mais nova, ignora esta resposta
      if (meuId !== idRequisicao.current) return;

      if (data.success && data.pedidos) {
        setPedidos(data.pedidos); setTotalPages(data.totalPages || 1); setTotalItems(data.totalItems || 0);
      } else if (!silencioso) {
        setPedidos([]); setTotalPages(1); setTotalItems(0);
      }
    } catch (error) {
      if (meuId !== idRequisicao.current) return;
      if (!silencioso) { setPedidos([]); setTotalPages(1); setTotalItems(0); }
    }
    requisicaoEmAndamento.current = false;
    setLoading(false);
  };

  useEffect(() => { carregarPedidosRef.current = carregarPedidos; });

  // 🆕 Recarrega sempre que aba, página, limite, busca ou status APLICADOS mudarem
  useEffect(() => { carregarPedidos(); }, [activeTabObj, page, limit, buscaAplicada, statusAplicado, refreshTick]);

  // Pedido novo, etapa ou cancelamento no Omie já chegam ao banco pelo webhook: a tela só precisa olhar de novo.
  // WooCommerce fica de fora do relógio porque cada consulta vai até a loja externa.
  useEffect(() => {
    const atualizar = () => { if (!document.hidden) carregarPedidosRef.current?.(true); };
    const plataforma = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase();
    const relogio = plataforma.includes('woo') ? null : setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);

    window.addEventListener('focus', atualizar);
    document.addEventListener('visibilitychange', atualizar);
    return () => {
      clearInterval(relogio);
      window.removeEventListener('focus', atualizar);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, [activeTabObj]);

  // 🆕 BUSCA AO DIGITAR (com pausa de 450ms para não disparar uma requisição por letra)
  useEffect(() => {
    if (primeiraRodadaBusca.current) { primeiraRodadaBusca.current = false; return; }
    const t = setTimeout(() => {
      setBuscaAplicada(buscaQuery.trim());
      setPage(1);
    }, 450);
    return () => clearTimeout(t);
  }, [buscaQuery]);

  // 🆕 Enter e botão "Filtrar": aplica na hora, volta para a página 1 e força o recarregamento
  const aplicarFiltros = () => {
    setBuscaAplicada(buscaQuery.trim());
    setStatusAplicado(filtroStatus);
    setPage(1);
    setRefreshTick(t => t + 1);
  };

  const atualizarStatus = async (pedidoId, novoStatus) => {
    const loadingToast = toast.loading("Atualizando status...");
    try {
      const tenantId = obterTenantSeguro();
      const plataformaReal = (activeTabObj.plataforma || activeTabObj.tipo || "").toLowerCase();
      
      let endpoint = `${getHubUrl()}/api/hub/pedidos/mudar-status-woo`;
      if (plataformaReal.includes('b2b')) endpoint = `${getHubUrl()}/api/hub/pedidos/mudar-status-b2b`;
      if (plataformaReal.includes('omie')) endpoint = `${getHubUrl()}/api/hub/pedidos/mudar-status-omie`;
      
      const res = await fetch(endpoint, {
        method: 'POST', headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ pedidoId, novoStatus, integracao_id: activeTabObj.id, plataforma: plataformaReal })
      });
      const data = await res.json();
      
      if(data.success) {
        toast.success("Status atualizado com sucesso!", { id: loadingToast });
        carregarPedidos(); 
        if((pedidoSelecionado?.id || pedidoSelecionado?.pedido_id) === pedidoId) {
          setPedidoSelecionado({ ...pedidoSelecionado, status: novoStatus, status_pedido: novoStatus });
        }
      } else { toast.error(data.message || "Erro ao atualizar", { id: loadingToast }); }
    } catch(error) { toast.error("Erro de conexão com o servidor", { id: loadingToast }); }
  };

  const handleSincronizarOmie = async (pedido) => {
    const idReal = pedido.id || pedido.pedido_id;
    const loadingToast = toast.loading("Enviando pedido para o Omie...");
    try {
      const tenantId = obterTenantSeguro();
      const res = await fetch(`${getHubUrl()}/api/hub/pedidos/enviar-omie`, {
        method: 'POST', headers: { ...getHeaders(), "x-tenant-id": tenantId },
        body: JSON.stringify({ pedido_id: idReal, integracao_id: activeTabObj.id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Sucesso! Pedido Omie: ${data.numero_omie}`, { id: loadingToast }); carregarPedidos(); 
      } else { toast.error(data.message || "Falha ao enviar.", { id: loadingToast }); }
    } catch (error) { toast.error("Erro de comunicação.", { id: loadingToast }); }
  };

  // 🟢 CSV REESTRUTURADO (Formato Digital Sistemas com Inteligência de SKU/EAN)
  const handleBaixarCSV = async (pedido) => {
    try {
      let csvContent = 'SKU;Quantidade;"Preco Unitario"\n';
      const itensExportar = pedido.line_items || pedido.itens || [];
      
      if (itensExportar.length === 0) {
          toast.error("O pedido não possui itens para exportar!");
          return;
      }

      itensExportar.forEach(item => {
        // 🟢 A MÁGICA SALVADORA: LÓGICA DE CASCATA DE CÓDIGO
        let codigoFinal = "";
        const eanValido = item.ean && String(item.ean).trim() !== "" && String(item.ean) !== "null";
        
        if (eanValido) {
            // 1ª Opção: Se tem código de barras, usa ele!
            codigoFinal = String(item.ean).trim(); 
        } else {
            // 2ª Opção: Pega o SKU do Omie e remove todas as letras
            const skuOriginal = String(item.sku || item.codigo || "");
            const skuSoNumeros = skuOriginal.replace(/\D/g, ''); 
            
            codigoFinal = skuSoNumeros !== "" ? skuSoNumeros : "SEM_COD";
        }

        const qtd = Number(item.quantity || item.quantidade || 1);
        
        // Blindagem Matemática de Preço
        let precoRaw = item.price || item.preco_unitario || 0;
        if (typeof precoRaw === 'string') precoRaw = precoRaw.replace(',', '.');
        const precoFloat = parseFloat(precoRaw) || 0;
        const preco = precoFloat.toFixed(2).replace('.', ',');
        
        // 🟢 BLINDAGEM MESTRA DO ZERO: Sinal de igual + aspas = "Fórmula de Texto"
        // É impossível qualquer ERP ou Excel do planeta cortar o zero agora!
        csvContent += `="${codigoFinal}";${qtd};"${preco}"\n`;
      });

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const idReal = pedido.id || pedido.pedido_id || "000";
      
      link.setAttribute("href", url);
      link.setAttribute("download", `pedido-digital-${idReal}.csv`);
      link.style.visibility = 'hidden'; 
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      
      const novosBaixados = { ...baixados, [`${activeTabObj.id}_${idReal}`]: true };
      setBaixados(novosBaixados); 
      localStorage.setItem("raizan_pedidos_baixados", JSON.stringify(novosBaixados));
      
      const isOmie = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase().includes('omie');
      if (isOmie) {
        const tenantId = obterTenantSeguro();
        await fetch(`${getHubUrl()}/api/hub/pedidos/marcar-baixado`, {
          method: 'POST', headers: { ...getHeaders(), "x-tenant-id": tenantId },
          body: JSON.stringify({ pedido_id: idReal })
        });
        carregarPedidos(); 
      }

      toast.success("Arquivo CSV baixado com sucesso!");
    } catch (err) {
      toast.error("Erro interno ao gerar a planilha.");
    }
  };

  const handleGerarEtiquetaInteligente = async (pedido) => {
    const isOmie = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase().includes('omie');
    
    if (isOmie) {
      const loadingToast = toast.loading("Buscando Dados no Omie...");
      try {
        const tenantId = obterTenantSeguro();
        const res = await fetch(`${getHubUrl()}/api/hub/pedidos/etiqueta-omie`, {
          method: 'POST', headers: { ...getHeaders(), "x-tenant-id": tenantId },
          body: JSON.stringify({ pedido_id: pedido.id || pedido.pedido_id, integracao_id: activeTabObj.id })
        });
        const data = await res.json();
        
        if (data.success && data.dadosOmie) {
          toast.dismiss(loadingToast); 
          setDocumentoImpressao({ tipo: 'etiqueta', pedido: pedido, dadosOmie: data.dadosOmie });
        } else {
          toast.dismiss(loadingToast);
          toast.error("NFe não encontrada. Usando dados locais.");
          setDocumentoImpressao({ tipo: 'etiqueta', pedido: pedido, dadosOmie: null });
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error("Falha ao comunicar com Omie.");
        setDocumentoImpressao({ tipo: 'etiqueta', pedido: pedido, dadosOmie: null });
      }
    } else {
      setDocumentoImpressao({ tipo: 'etiqueta', pedido: pedido, dadosOmie: null });
    }
  };

  const handleAcaoPrimaria = (pedido) => {
    const textoChave = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase();
    if (textoChave.includes('omie')) handleSincronizarOmie(pedido);
    else handleBaixarCSV(pedido);
  };

  const renderIconTab = (plataforma) => {
    const plat = String(plataforma).toLowerCase();
    if (plat.includes('woo')) return <Store size={14} />;
    if (plat.includes('b2b')) return <LayoutTemplate size={14} />;
    if (plat.includes('omie')) return <Box size={14} />;
    return <ShoppingBag size={14} />;
  };

  const obterNomeAba = (tab) => {
    const nomeSalvo = tab.nome_integracao || tab.label || "";
    if (nomeSalvo.trim() !== "" && nomeSalvo !== "Integração") return nomeSalvo;
    const p = String(tab.plataforma || tab.tipo || '').toLowerCase();
    if (p.includes('woo')) return 'WooCommerce';
    if (p.includes('omie')) return 'Omie ERP';
    if (p.includes('b2b')) return 'Portal B2B';
    return "Loja";
  };

  const isOmieAtivo = String(activeTabObj?.plataforma || activeTabObj?.tipo || '').toLowerCase().includes('omie');

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 print:block print:bg-white antialiased">
      
      <div className="print:hidden">
        <Sidebar />
      </div>

      {documentoImpressao.tipo === 'separacao' && (
        <MapaSeparacao 
          pedido={documentoImpressao.pedido} 
          onFechar={() => setDocumentoImpressao({ tipo: null, pedido: null, dadosOmie: null })} 
        />
      )}

      {documentoImpressao.tipo === 'etiqueta' && documentoImpressao.pedido && (
        (() => {
          const dadosEtiqueta = prepararDadosEtiqueta(documentoImpressao.pedido, documentoImpressao.dadosOmie);
          
          return (
            <div className="fixed inset-0 z-[9999] bg-zinc-900/70 backdrop-blur-xl overflow-y-auto print:static print:inset-auto print:w-full print:h-auto print:overflow-visible print:bg-white print:backdrop-blur-none font-sans flex flex-col print:block items-center py-10 print:py-0 print:m-0">
              
              <div className="print:hidden sticky top-0 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 text-white p-3 w-full max-w-md flex justify-between items-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] z-50 mb-8 rounded-full">
                <button 
                  onClick={() => setDocumentoImpressao({ tipo: null, pedido: null, dadosOmie: null })} 
                  className="flex items-center gap-2 text-zinc-300 hover:text-white bg-white/[0.08] hover:bg-white/[0.14] px-5 h-11 rounded-full font-semibold transition-all active:scale-95"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white px-6 h-11 rounded-full font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(147,51,234,0.6)] transition-all active:scale-95"
                >
                  <Printer size={18} /> Imprimir Etiqueta
                </button>
              </div>

              <EtiquetaVolume 
                config={{ largura: 100, altura: 150 }} 
                logoUrl={typeof window !== 'undefined' ? localStorage.getItem('@raizan:logo') : ''}
                empresa={dadosEtiqueta.empresa}
                cliente={dadosEtiqueta.cliente}
                pedido={dadosEtiqueta.pedido}
                transporte={dadosEtiqueta.transporte}
                nfe={dadosEtiqueta.nfe}
                volume={dadosEtiqueta.volume}
                autoPrint={true} 
              />
            </div>
          );
        })()
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:hidden relative">

        {/* Luzes suaves atrás do vidro */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        </div>

        <Header />
        
        {/* ⚠️ Sem z-index no <main>: senão os modais (fixed) ficam presos atrás do Header e da Sidebar */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Título + controles */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-3xl sm:text-[34px] leading-tight font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Pedidos</h1>
                <p className="text-sm sm:text-[15px] text-zinc-500 dark:text-zinc-400 mt-1">Gestão unificada de vendas e sincronização.</p>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* 🟢 O SWITCH DE MODO DIGITAL SISTEMAS */}
                {isOmieAtivo && (
                  <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 pl-4 pr-2 h-11 rounded-full">
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 hidden sm:block">Modo CSV (Digital Sistemas)</span>
                    <button 
                      role="switch"
                      aria-checked={modoDigital}
                      aria-label="Modo CSV (Digital Sistemas)"
                      onClick={toggleModoDigital} 
                      className={`relative w-[46px] h-[28px] rounded-full transition-colors duration-300 shrink-0 ${modoDigital ? 'bg-purple-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <span className={`absolute top-[2px] left-[2px] w-6 h-6 bg-white rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 ${modoDigital ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] pl-4 pr-1.5 h-11 rounded-full shadow-sm">
                  <span className="text-xs font-semibold text-zinc-400 hidden sm:block">Exibir</span>
                  <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }} className="bg-transparent text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded-full text-sm font-semibold outline-none cursor-pointer dark:[color-scheme:dark] dark:[&>option]:bg-[#1a1a1d]">
                    <option value="10">10 itens</option>
                    <option value="20">20 itens</option>
                    <option value="50">50 itens</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Abas dos canais: controle segmentado */}
            {integracoesInstaladas.length > 0 ? (
              <div className="relative w-full">
                <div className="flex items-center gap-1 p-1 bg-black/[0.05] dark:bg-white/[0.06] rounded-full overflow-x-auto no-scrollbar w-max max-w-full border border-black/[0.04] dark:border-white/[0.05]">
                  {integracoesInstaladas.map(tab => {
                    const isActive = activeTabObj?.id === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTabObj(tab); setPage(1); }}
                        className={`flex items-center gap-2 px-4 h-9 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap outline-none select-none active:scale-95
                          ${isActive 
                            ? 'bg-white dark:bg-white/[0.12] text-zinc-900 dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10' 
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                          }`}
                      >
                        <span className={isActive ? 'text-purple-600 dark:text-purple-400' : 'opacity-70'}>
                          {renderIconTab(tab.plataforma || tab.tipo)}
                        </span>
                        {obterNomeAba(tab)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className={`${VIDRO} p-6 flex items-center gap-4`}>
                <div className="w-12 h-12 shrink-0 rounded-[15px] flex items-center justify-center bg-gradient-to-br from-amber-300 to-amber-500 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-8px_rgba(245,158,11,0.6)]">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-zinc-900 dark:text-white">Nenhum canal ativo</h3>
                  <p className="text-sm text-zinc-500">Conecte uma loja ou ERP no menu de integrações para receber pedidos.</p>
                </div>
              </div>
            )}

            {/* Busca + filtro de status */}
            {integracoesInstaladas.length > 0 && (
              <div className={`${VIDRO} flex flex-col sm:flex-row items-center gap-3 p-3`}>
                <div className="flex-1 relative w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar por ID, Cliente, CNPJ..."
                    value={buscaQuery}
                    onChange={(e) => setBuscaQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                    className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/[0.07] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 pl-11 pr-10 h-11 rounded-full text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/15 transition-all"
                  />
                  {buscaQuery && (
                    <button
                      onClick={() => setBuscaQuery("")}
                      aria-label="Limpar busca"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/[0.08] dark:bg-white/[0.12] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-auto">
                  <select
                    value={filtroStatus}
                    onChange={(e) => { setFiltroStatus(e.target.value); setStatusAplicado(e.target.value); setPage(1); }}
                    className={`w-full sm:w-56 ${SELECT_PILULA}`}
                  >
                    <option value="">Todos os Status</option>
                    <option value="pendente">Pendente / Aguardando</option>
                    <option value="processando">Em Separação</option>
                    <option value="faturar">A Faturar / Faturar</option>
                    <option value="faturado">Faturado / NFe Emitida</option>
                    <option value="completed">Concluído / Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <button
                  onClick={aplicarFiltros}
                  className="w-full sm:w-auto h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-7 rounded-full text-sm font-semibold transition-all active:scale-95"
                >
                  Filtrar
                </button>
              </div>
            )}

            {/* Tabela. Sem backdrop-blur aqui de propósito: ele criaria um "contêiner" que pode quebrar menus fixos dentro da TabelaPedidos */}
            <div className="relative bg-white/90 dark:bg-[#121214]/90 border border-black/[0.06] dark:border-white/[0.07] rounded-[28px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] overflow-visible transition-colors duration-300">
              <TabelaPedidos 
                pedidos={pedidos} 
                loading={loading} 
                page={page} 
                totalPages={totalPages} 
                totalItems={totalItems} 
                onPageChange={setPage} 
                onRowClick={setPedidoSelecionado} 
                baixados={baixados} 
                onDownload={handleAcaoPrimaria} 
                onBaixarCSV={handleBaixarCSV}
                activeTab={activeTabObj?.id} 
                plataformaAtiva={activeTabObj?.tipo || activeTabObj?.iconType} 
                modoDigital={modoDigital} // 🟢 Passando o Switch para a Tabela!
                onPrintSeparacao={(ped) => setDocumentoImpressao({ tipo: 'separacao', pedido: ped, dadosOmie: null })}
                onPrintEtiqueta={handleGerarEtiquetaInteligente}
              />
            </div>

          </div>
        </main>
      </div>

      <div className="print:hidden">
        <ModalDetalhes 
          pedido={pedidoSelecionado} 
          activeTabObj={activeTabObj} 
          onUpdateStatus={atualizarStatus} 
          onClose={() => setPedidoSelecionado(null)} 
        />
      </div>
    </div>
  );
}
