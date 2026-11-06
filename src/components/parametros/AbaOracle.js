"use client";

import { useState, useEffect } from "react";
import { 
  Database, ShoppingCart, CheckCircle2, Loader2, Timer, 
  Server, CreditCard, Lock, ChevronRight, ChevronLeft, 
  TableProperties, Columns3, Globe, Laptop, Users, Store, Box, Settings,
  Minus, Plus
} from "lucide-react";
import toast from 'react-hot-toast'; 

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

const CARD =
  "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] " +
  "transition-colors duration-300";

// Caixa interna dentro de um card (agrupa campos relacionados)
const CAIXA = "rounded-[22px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06]";

// Campos (fundo sólido no escuro para a lista do <select> ficar legível)
const CAMPO =
  "w-full h-12 px-4 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl outline-none " +
  "text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all dark:[color-scheme:dark] " +
  "focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15";

// Campo menor (mapeamento de colunas)
const CAMPO_PEQUENO =
  "w-full h-10 px-3 bg-white dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-xl outline-none " +
  "text-xs font-medium text-zinc-900 dark:text-zinc-100 transition-all dark:[color-scheme:dark] cursor-pointer " +
  "focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/15";

const ROTULO = "block text-xs font-semibold text-zinc-500 dark:text-zinc-400";

// Classes completas (o Tailwind precisa enxergá-las inteiras no código)
const TILE_CORES = {
  purple: "from-violet-400 to-purple-600",
  blue: "from-sky-400 to-blue-600",
  sky: "from-cyan-400 to-sky-600",
  emerald: "from-emerald-400 to-emerald-600",
};

const Tile = ({ cor = "purple", size = 40, children }) => (
  <div
    className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE_CORES[cor]} text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(0,0,0,0.35)]`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    {children}
  </div>
);

// Ícone em tile branco (para a logo da Oracle aparecer bem)
const TileLogoOracle = ({ size = 40, iconSize = 20 }) => (
  <div
    className="shrink-0 flex items-center justify-center bg-white dark:bg-white/[0.08] ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_14px_-6px_rgba(0,0,0,0.3)]"
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    <img src="/oracle.svg" alt="Oracle" style={{ width: iconSize, height: iconSize }} className="object-contain" />
  </div>
);

const BTN_VOLTAR =
  "h-11 px-5 rounded-full text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-black/[0.04] dark:bg-white/[0.06] " +
  "hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-all flex items-center gap-2 disabled:opacity-30 active:scale-95";

export default function AbaOracle() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // --- CONTROLES DE VISUALIZAÇÃO E LACRE ---
  const [cnpjRender, setCnpjRender] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingInit, setIsFetchingInit] = useState(true); // 🟢 NOVA TRAVA DE PERSISTÊNCIA
  
  // URL do Motor Local (PM2)
  const [coreUrl, setCoreUrl] = useState("http://localhost:3001");

  // Dados Básicos e Automação
  const [formData, setFormData] = useState({
    oracle_host: "", oracle_port: "1521", oracle_service: "", oracle_user: "", oracle_password: "",
    sync_interval_min: 5
  });

  // Mapeamento Dinâmico Separado (AGORA COM IE NOS CLIENTES)
  const [tabelasOracle, setTabelasOracle] = useState([]);
  const [colunasProdutos, setColunasProdutos] = useState([]);
  const [colunasClientes, setColunasClientes] = useState([]);
  const [mapeamento, setMapeamento] = useState({
    tabela_produtos: "", col_sku: "", col_cod_barras: "", col_nome: "", col_estoque: "", col_preco: "", col_status: "", col_marca: "",
    tabela_clientes: "", col_cli_cod: "", col_cli_nome: "", col_cli_email: "", col_cli_doc: "", col_cli_ie: ""
  });

  // Integrações Puxadas da Nuvem
  const [integracoesDisponiveis, setIntegracoesDisponiveis] = useState([]);
  const [lojasSelecionadas, setLojasSelecionadas] = useState([]);
  const [pagamentosSelecionados, setPagamentosSelecionados] = useState([]);

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  useEffect(() => {
    setCnpjRender(pegarCnpjLogado());
    
    // 🟢 Busca as configurações ANTES de liberar a tela
    Promise.all([carregarConfiguracoesDaNuvem(), carregarIntegracoesAtivas()])
      .finally(() => {
        setIsFetchingInit(false); // Libera a tela (com ou sem lacre)
      });
  }, []);

  // 1. CARREGA CONFIGURAÇÕES DO ORACLE E TRAVA A TELA
  const carregarConfiguracoesDaNuvem = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) return;

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/configuracoes", {
        headers: { "x-tenant-id": tenantId }
      });
      const data = await res.json();
      if (data.success && data.configuracoes) {
        const c = data.configuracoes;
        setFormData({
          oracle_host: c.oracle_host || "", oracle_port: c.oracle_port || "1521", 
          oracle_service: c.oracle_service || "", oracle_user: c.oracle_user || "", oracle_password: c.oracle_password || "",
          sync_interval_min: c.sync_interval_min || 5
        });
        
        // Garante que se o banco devolver Array, ele lê como Array
        if (c.mapeamento_tabelas) setMapeamento(typeof c.mapeamento_tabelas === 'string' ? JSON.parse(c.mapeamento_tabelas) : c.mapeamento_tabelas);
        if (c.canais_venda) setLojasSelecionadas(typeof c.canais_venda === 'string' ? JSON.parse(c.canais_venda) : c.canais_venda);
        if (c.modulos_pagamento) setPagamentosSelecionados(typeof c.modulos_pagamento === 'string' ? JSON.parse(c.modulos_pagamento) : c.modulos_pagamento);

        // 🟢 PERSISTÊNCIA: Se tem host salvo de verdade, já trava a tela na inicialização
        if (c.oracle_host && c.oracle_host.trim() !== "") {
          setIsConfigured(true);
        }
      }
    } catch (error) {
      console.log("Nenhuma configuração anterior encontrada.");
    }
  };

  const carregarIntegracoesAtivas = async () => {
    const tenantId = pegarCnpjLogado();
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes?tenant=${tenantId}`, {
        headers: { "x-tenant-id": tenantId }
      });
      const data = await res.json();
      if (data.success) setIntegracoesDisponiveis(data.integracoes);
    } catch (error) {
      console.log("Erro ao carregar integrações.");
    }
  };

  const handleTestarConexao = async () => {
    if (!formData.oracle_host || !formData.oracle_user || !formData.oracle_password) {
      return toast.error("Preencha os dados do Oracle!");
    }
    setTestingConnection(true);
    const urlLimpa = coreUrl.trim().replace(/\/$/, "");
    try {
      const res = await fetch(`${urlLimpa}/api/wizard/oracle/testar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.oracle_host, port: formData.oracle_port, serviceName: formData.oracle_service,
          user: formData.oracle_user, password: formData.oracle_password
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Oracle Conectado com Sucesso!");
        await buscarTabelasDoOracle(urlLimpa);
        setStep(2); 
      } else {
        toast.error(data.message || "Falha ao conectar.");
      }
    } catch (error) { toast.error("Motor Local offline."); } 
    finally { setTestingConnection(false); }
  };

  const buscarTabelasDoOracle = async (urlLimpa) => {
    try {
      const res = await fetch(`${urlLimpa}/api/wizard/oracle/tabelas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.oracle_host, port: formData.oracle_port, serviceName: formData.oracle_service,
          user: formData.oracle_user, password: formData.oracle_password
        }),
      });
      const data = await res.json();
      if (data.success) setTabelasOracle(data.tabelas);
    } catch (error) { toast.error("Erro ao ler tabelas."); }
  };

  const handleSelecionarTabelaProdutos = async (nomeTabela) => {
    setMapeamento({ ...mapeamento, tabela_produtos: nomeTabela, col_sku: "", col_cod_barras: "", col_nome: "", col_estoque: "", col_preco: "", col_status: "", col_marca: "" });
    if (!nomeTabela) return setColunasProdutos([]);
    const urlLimpa = coreUrl.trim().replace(/\/$/, "");
    try {
      const res = await fetch(`${urlLimpa}/api/wizard/oracle/colunas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.oracle_host, port: formData.oracle_port, serviceName: formData.oracle_service,
          user: formData.oracle_user, password: formData.oracle_password, tabelaEscolhida: nomeTabela
        }),
      });
      const data = await res.json();
      if (data.success) setColunasProdutos(data.colunas);
    } catch (error) { toast.error("Erro ao ler colunas de produtos."); }
  };

  const handleSelecionarTabelaClientes = async (nomeTabela) => {
    setMapeamento({ ...mapeamento, tabela_clientes: nomeTabela, col_cli_cod: "", col_cli_nome: "", col_cli_email: "", col_cli_doc: "", col_cli_ie: "" });
    if (!nomeTabela) return setColunasClientes([]);
    const urlLimpa = coreUrl.trim().replace(/\/$/, "");
    try {
      const res = await fetch(`${urlLimpa}/api/wizard/oracle/colunas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.oracle_host, port: formData.oracle_port, serviceName: formData.oracle_service,
          user: formData.oracle_user, password: formData.oracle_password, tabelaEscolhida: nomeTabela
        }),
      });
      const data = await res.json();
      if (data.success) setColunasClientes(data.colunas);
    } catch (error) { toast.error("Erro ao ler colunas de clientes."); }
  };

  const toggleSelecao = (id, lista, setLista) => {
    if (lista.includes(id)) setLista(lista.filter(item => item !== id));
    else setLista([...lista, id]);
  };

  const handleSalvarTudo = async () => {
    const tenantId = pegarCnpjLogado();
    setLoading(true);
    const payload = { 
      ...formData, 
      mapeamento_tabelas: JSON.stringify(mapeamento),
      canais_venda: JSON.stringify(lojasSelecionadas),
      modulos_pagamento: JSON.stringify(pagamentosSelecionados)
    };

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/configuracoes/salvar", {
        method: "POST", headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configurações salvas e máquina pronta!");
        setIsConfigured(true); // 🟢 Trava a tela novamente
        setIsEditing(false); // 🟢 Sai do modo de edição
        setStep(1); // 🟢 Reseta o passo para a próxima vez
      } else {
        toast.error("Erro ao salvar.");
      }
    } catch (error) { toast.error("Erro de conexão."); } 
    finally { setLoading(false); }
  };

  const lojas = integracoesDisponiveis.filter(i => i.plataforma === 'woocommerce' || i.plataforma === 'raizan_commerce');
  const pagamentos = integracoesDisponiveis.filter(i => i.plataforma === 'mercadopago' || i.plataforma === 'mercado_pago' || i.plataforma === 'pagseguro' || i.plataforma === 'frenet');

  const passos = [
    { num: 1, label: "Banco ERP", icon: Database },
    { num: 2, label: "Tabelas", icon: TableProperties },
    { num: 3, label: "Lojas", icon: ShoppingCart },
    { num: 4, label: "Módulos", icon: CreditCard },
    { num: 5, label: "Automação", icon: Timer }
  ];

  // Cartão selecionável (usado nas lojas e nos módulos de pagamento/frete)
  const renderCartaoSelecionavel = (item, lista, setLista, cor) => {
    const marcado = lista.includes(item.id);
    const estilos = {
      blue: { on: "border-blue-500/50 bg-blue-500/10 ring-4 ring-blue-500/10", box: "bg-blue-500 border-blue-500", hover: "hover:border-blue-400/50" },
      sky: { on: "border-sky-500/50 bg-sky-500/10 ring-4 ring-sky-500/10", box: "bg-sky-500 border-sky-500", hover: "hover:border-sky-400/50" },
    }[cor];

    return (
      <div 
        key={item.id} 
        role="checkbox"
        aria-checked={marcado}
        tabIndex={0}
        onClick={() => toggleSelecao(item.id, lista, setLista)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelecao(item.id, lista, setLista); } }}
        className={`p-4 border rounded-[20px] cursor-pointer transition-all duration-300 flex items-center gap-4 outline-none active:scale-[0.99] ${marcado ? estilos.on : `border-black/[0.06] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] ${estilos.hover}`}`}
      >
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${marcado ? `${estilos.box} text-white` : 'border-zinc-300 dark:border-zinc-600'}`}>
          {marcado && <CheckCircle2 size={14}/>}
        </div>
        <div className="min-w-0">
          <p className="font-semibold tracking-tight text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.nome_integracao}</p>
          <p className="text-xs text-zinc-500 capitalize">{item.plataforma.replace('_', ' ')}</p>
        </div>
      </div>
    );
  };

  // Cabeçalho de cada passo (ícone em tile + título + legenda)
  const CabecalhoPasso = ({ tile, titulo, legenda }) => (
    <div className="flex items-center gap-3.5 border-b border-black/[0.06] dark:border-white/[0.07] pb-5">
      {tile}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{titulo}</h2>
        {legenda && <p className="text-xs font-medium text-zinc-500 mt-0.5">{legenda}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
            {/* TÍTULO */}
            <div>
              <h1 className="text-2xl sm:text-[32px] leading-tight font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex flex-wrap items-center gap-x-3 gap-y-2">
                Setup de Integração Oracle
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 tabular-nums">
                  <Lock size={12}/> {cnpjRender ? cnpjRender : "Carregando..."}
                </span>
              </h1>
              <p className="text-sm sm:text-[15px] text-zinc-500 dark:text-zinc-400 mt-1.5">Conecte o ERP aos seus canais de venda e módulos.</p>
            </div>

            {/* 🟢 TELA DE CARREGAMENTO (IMPEDE O PISCAR DO FORMULÁRIO) */}
            {isFetchingInit ? (
              <div className={`${CARD} flex flex-col items-center justify-center py-20 animate-in fade-in`}>
                <Loader2 size={44} className="text-purple-600 dark:text-purple-500 animate-spin mb-4" />
                <p className="text-zinc-500 font-medium text-sm">Verificando status do ERP...</p>
              </div>
            ) : (
              <>
                {/* 🟢 TELA DE SUCESSO / LACRE VISUAL PREMIUM DA ORACLE */}
                {isConfigured && !isEditing ? (
                  <div className={`${CARD} p-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300`}>
                    
                    {/* Fundo decorativo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                    {/* Logo Oracle com selo de OK */}
                    <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                       <div className="absolute inset-0 bg-emerald-500/15 rounded-full animate-pulse border border-emerald-500/25"></div>
                       <div className="relative z-10">
                         <TileLogoOracle size={80} iconSize={46} />
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center border-4 border-white dark:border-[#121214] z-20 shadow-[0_6px_16px_-4px_rgba(16,185,129,0.7)]">
                         <CheckCircle2 size={16} className="text-white" />
                       </div>
                    </div>

                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight relative z-10">Conexão Oracle Operante</h2>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed relative z-10">
                      Sua máquina está vinculada com sucesso ao banco de dados Oracle. O Motor Local já tem todas as credenciais ativas para sincronizar com o Hub Raizan e canais de venda.
                    </p>
                    
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="relative z-10 h-12 px-7 bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.12] rounded-full font-semibold transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Settings size={18} /> Editar Configurações
                    </button>
                  </div>
                ) : (
                  <>
                    {/* STEPPER VISUAL (5 PASSOS) */}
                    <div className="relative">
                      {/* trilho + parte já concluída */}
                      <div className="absolute top-5 left-10 right-10 h-[3px] rounded-full bg-black/[0.08] dark:bg-white/[0.1]" aria-hidden="true">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" style={{ width: `${((step - 1) / (passos.length - 1)) * 100}%` }} />
                      </div>
                      <div className="relative flex items-start justify-between">
                        {passos.map((s) => {
                          const atingido = step >= s.num;
                          const Icone = s.icon;
                          return (
                            <div key={s.num} className="flex flex-col items-center gap-2 w-20">
                              <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-300 ${atingido ? 'bg-gradient-to-br from-violet-400 to-purple-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-6px_rgba(124,58,237,0.6)]' : 'bg-white dark:bg-[#1a1a1d] text-zinc-400 border border-black/[0.08] dark:border-white/[0.1]'}`}>
                                {step > s.num ? <CheckCircle2 size={18} /> : <Icone size={18} />}
                              </div>
                              <span className={`text-xs font-semibold text-center ${atingido ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-400'}`}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CONTEÚDO DO WIZARD */}
                    <div className={`${CARD} p-6 sm:p-8 transition-all duration-300`}>
                      
                      {/* PASSO 1: CONEXÃO */}
                      {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <CabecalhoPasso tile={<TileLogoOracle size={44} iconSize={22} />} titulo="Conexão com o Oracle (ERP)" />

                          <div className={`space-y-3 p-5 ${CAIXA}`}>
                            <label className={`${ROTULO} flex items-center gap-2`}><Server size={14}/> Comunicação com o Motor Local</label>
                            <div className="flex gap-1 p-1 bg-black/[0.05] dark:bg-white/[0.06] rounded-full">
                              <button onClick={() => setCoreUrl("http://localhost:3001")} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-sm font-semibold transition-all active:scale-95 ${coreUrl.includes("localhost") ? "bg-white dark:bg-white/[0.14] text-blue-600 dark:text-blue-300 shadow-[0_1px_3px_rgba(0,0,0,0.15)]" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}><Laptop size={16} /> Servidor Local</button>
                              <button onClick={() => setCoreUrl("https://api.rafany.com.br")} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-full text-sm font-semibold transition-all active:scale-95 ${!coreUrl.includes("localhost") ? "bg-white dark:bg-white/[0.14] text-blue-600 dark:text-blue-300 shadow-[0_1px_3px_rgba(0,0,0,0.15)]" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}><Globe size={16} /> Acesso Remoto</button>
                            </div>
                            <input type="text" value={coreUrl} onChange={(e) => setCoreUrl(e.target.value)} className={`${CAMPO} font-mono mt-1`} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-2 space-y-2"><label className={ROTULO}>Host / IP</label><input type="text" placeholder="Ex: 192.168.0.10" value={formData.oracle_host} onChange={(e) => setFormData({...formData, oracle_host: e.target.value})} className={CAMPO} /></div>
                            <div className="space-y-2"><label className={ROTULO}>Porta</label><input type="text" value={formData.oracle_port} onChange={(e) => setFormData({...formData, oracle_port: e.target.value})} className={CAMPO} /></div>
                          </div>
                          <div className="space-y-2"><label className={ROTULO}>Service Name / SID</label><input type="text" placeholder="Ex: ORCL" value={formData.oracle_service} onChange={(e) => setFormData({...formData, oracle_service: e.target.value})} className={CAMPO} /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2"><label className={ROTULO}>Usuário</label><input type="text" value={formData.oracle_user} onChange={(e) => setFormData({...formData, oracle_user: e.target.value})} className={CAMPO} /></div>
                            <div className="space-y-2"><label className={ROTULO}>Senha</label><input type="password" value={formData.oracle_password} onChange={(e) => setFormData({...formData, oracle_password: e.target.value})} className={CAMPO} /></div>
                          </div>
                        </div>
                      )}

                      {/* PASSO 2: MAPEAMENTO DUPLO */}
                      {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                          
                          {/* Produtos */}
                          <div>
                            <div className="flex items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.07] pb-3 mb-4"><Tile cor="purple" size={32}><Box size={16} /></Tile><h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Base de Produtos</h2></div>
                            <select value={mapeamento.tabela_produtos} onChange={(e) => handleSelecionarTabelaProdutos(e.target.value)} className={`${CAMPO} cursor-pointer`}>
                              <option value="">Selecione a tabela de Produtos...</option>
                              {tabelasOracle.map((tb, idx) => <option key={idx} value={tb.NOME}>{tb.NOME} ({tb.TIPO})</option>)}
                            </select>
                            {colunasProdutos.length > 0 && (
                              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 ${CAIXA}`}>
                                {[
                                  { label: "Código / SKU", key: "col_sku" }, 
                                  { label: "Cód. Barras (EAN)", key: "col_cod_barras" }, 
                                  { label: "Nome do Produto", key: "col_nome" }, 
                                  { label: "Preço de Venda", key: "col_preco" }, 
                                  { label: "Estoque Físico", key: "col_estoque" }, 
                                  { label: "Status (Ativo/Inativo)", key: "col_status" },
                                  { label: "Marca", key: "col_marca" }
                                ].map(campo => (
                                  <div key={campo.key} className="space-y-1.5">
                                    <label className={ROTULO}>{campo.label}</label>
                                    <select value={mapeamento[campo.key]} onChange={(e) => setMapeamento({...mapeamento, [campo.key]: e.target.value})} className={CAMPO_PEQUENO}>
                                      <option value="">Selecionar...</option>
                                      {colunasProdutos.map((col, idx) => <option key={idx} value={col.COLUNA}>{col.COLUNA}</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Clientes */}
                          <div>
                            <div className="flex items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.07] pb-3 mb-4"><Tile cor="blue" size={32}><Users size={16} /></Tile><h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Base de Clientes</h2></div>
                            <select value={mapeamento.tabela_clientes} onChange={(e) => handleSelecionarTabelaClientes(e.target.value)} className={`${CAMPO} cursor-pointer`}>
                              <option value="">Selecione a tabela de Clientes...</option>
                              {tabelasOracle.map((tb, idx) => <option key={idx} value={tb.NOME}>{tb.NOME} ({tb.TIPO})</option>)}
                            </select>
                            {colunasClientes.length > 0 && (
                              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 ${CAIXA}`}>
                                {[
                                  { label: "Código Cliente", key: "col_cli_cod" }, 
                                  { label: "Razão Social / Nome", key: "col_cli_nome" },
                                  { label: "E-mail", key: "col_cli_email" }, 
                                  { label: "CNPJ / CPF", key: "col_cli_doc" },
                                  { label: "Inscrição Estadual (IE)", key: "col_cli_ie" } // 🟢 NOVA COLUNA ADICIONADA AQUI
                                ].map(campo => (
                                  <div key={campo.key} className="space-y-1.5">
                                    <label className={ROTULO}>{campo.label}</label>
                                    <select value={mapeamento[campo.key]} onChange={(e) => setMapeamento({...mapeamento, [campo.key]: e.target.value})} className={CAMPO_PEQUENO}>
                                      <option value="">Selecionar...</option>
                                      {colunasClientes.map((col, idx) => <option key={idx} value={col.COLUNA}>{col.COLUNA}</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                      {/* PASSO 3: CANAIS DE VENDA Puxados da Integração */}
                      {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <CabecalhoPasso tile={<Tile cor="blue" size={44}><Store size={20} /></Tile>} titulo="Canais de Venda" legenda="Selecione para quais lojas o ERP vai enviar os dados." />

                          {lojas.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-black/[0.1] dark:border-white/[0.12] rounded-[22px]">
                              <p className="text-sm text-zinc-500">Nenhuma loja ativa encontrada no menu "Integrações".</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {lojas.map(loja => renderCartaoSelecionavel(loja, lojasSelecionadas, setLojasSelecionadas, 'blue'))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PASSO 4: MÓDULOS DE PAGAMENTO / FRETE */}
                      {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <CabecalhoPasso tile={<Tile cor="sky" size={44}><CreditCard size={20} /></Tile>} titulo="Módulos (Pagamento & Frete)" legenda="Selecione os módulos ativos para uso no Portal B2B." />

                          {pagamentos.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-black/[0.1] dark:border-white/[0.12] rounded-[22px]">
                              <p className="text-sm text-zinc-500">Nenhum módulo ativo (Ex: Mercado Pago, Frenet). Instale no menu Integrações.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {pagamentos.map(mod => renderCartaoSelecionavel(mod, pagamentosSelecionados, setPagamentosSelecionados, 'sky'))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PASSO 5: AUTOMAÇÃO */}
                      {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <CabecalhoPasso tile={<Tile cor="emerald" size={44}><Timer size={20} /></Tile>} titulo="Automação (Fila Fantasma)" legenda="A cada quantos minutos o motor deve atualizar estoques/pedidos?" />

                          <div className="flex flex-col items-center py-6">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                aria-label="Diminuir 1 minuto"
                                onClick={() => setFormData({...formData, sync_interval_min: Math.max(1, (Number(formData.sync_interval_min) || 1) - 1)})}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.09] dark:hover:bg-white/[0.12] transition-all active:scale-90"
                              ><Minus size={18} /></button>

                              <input type="number" min="1" max="60" value={formData.sync_interval_min} onChange={(e) => setFormData({...formData, sync_interval_min: Number(e.target.value)})} className="w-32 h-20 bg-zinc-100 dark:bg-[#1a1a1d] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] text-4xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/15 font-bold tabular-nums text-center text-emerald-600 dark:text-emerald-400 transition-all" />

                              <button
                                type="button"
                                aria-label="Aumentar 1 minuto"
                                onClick={() => setFormData({...formData, sync_interval_min: Math.min(60, (Number(formData.sync_interval_min) || 0) + 1)})}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.09] dark:hover:bg-white/[0.12] transition-all active:scale-90"
                              ><Plus size={18} /></button>
                            </div>
                            <label className="text-sm font-medium text-zinc-500 mt-4">minutos</label>
                          </div>
                        </div>
                      )}

                      {/* BOTÕES DE NAVEGAÇÃO LIVRE */}
                      <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between">
                        <button 
                          onClick={() => {
                            if (step === 1 && isConfigured) setIsEditing(false);
                            else setStep(step - 1);
                          }} 
                          disabled={step === 1 && !isConfigured || loading}
                          className={BTN_VOLTAR}
                        >
                          <ChevronLeft size={16} /> {step === 1 && isConfigured ? "Cancelar" : "Voltar"}
                        </button>

                        {step === 1 && (
                          <button onClick={handleTestarConexao} disabled={testingConnection} className="h-11 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white px-6 rounded-full text-sm font-semibold transition-all flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(147,51,234,0.6)] active:scale-95 disabled:opacity-50">
                            {testingConnection ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Testar Conexão
                          </button>
                        )}

                        {step > 1 && step < 5 && (
                          <button onClick={() => setStep(step + 1)} className="h-11 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-6 rounded-full text-sm font-semibold transition-all shadow-sm flex items-center gap-2 active:scale-95">
                            Avançar <ChevronRight size={16} />
                          </button>
                        )}

                        {step === 5 && (
                          <button onClick={handleSalvarTudo} disabled={loading} className="h-11 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 text-white px-8 rounded-full text-sm font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(16,185,129,0.6)] flex items-center gap-2 active:scale-95 disabled:opacity-50">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Concluir Setup
                          </button>
                        )}
                      </div>

                    </div>
                  </>
                )}
              </>
            )}
    </div>
  );
}
