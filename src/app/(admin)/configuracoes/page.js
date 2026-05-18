"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Database, ShoppingCart, CheckCircle2, Loader2, Timer, 
  Server, CreditCard, Lock, ChevronRight, ChevronLeft, 
  TableProperties, Columns3, Globe, Laptop, Users, Store, Box, Settings
} from "lucide-react";
import toast from 'react-hot-toast'; 

export default function ConfiguracoesWizard() {
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

  // Mapeamento Dinâmico Separado (COM STATUS, EAN E AGORA MARCA)
  const [tabelasOracle, setTabelasOracle] = useState([]);
  const [colunasProdutos, setColunasProdutos] = useState([]);
  const [colunasClientes, setColunasClientes] = useState([]);
  const [mapeamento, setMapeamento] = useState({
    tabela_produtos: "", col_sku: "", col_cod_barras: "", col_nome: "", col_estoque: "", col_preco: "", col_status: "", col_marca: "",
    tabela_clientes: "", col_cli_cod: "", col_cli_nome: "", col_cli_email: "", col_cli_doc: ""
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
    setMapeamento({ ...mapeamento, tabela_clientes: nomeTabela, col_cli_cod: "", col_cli_nome: "", col_cli_email: "", col_cli_doc: "" });
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

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            
            {/* TÍTULO */}
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                Setup de Integração Oracle
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Lock size={12}/> {cnpjRender ? cnpjRender : "Carregando..."}
                </span>
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Conecte o ERP aos seus canais de venda e módulos.</p>
            </div>

            {/* 🟢 TELA DE CARREGAMENTO (IMPEDE O PISCAR DO FORMULÁRIO) */}
            {isFetchingInit ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                <Loader2 size={48} className="text-purple-600 animate-spin mb-4" />
                <p className="text-zinc-500 font-bold tracking-widest text-sm uppercase">Verificando status do ERP...</p>
              </div>
            ) : (
              <>
                {/* 🟢 TELA DE SUCESSO / LACRE VISUAL PREMIUM DA ORACLE */}
                {isConfigured && !isEditing ? (
                  <div className="bg-white dark:bg-[#0c0c0e] border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                    
                    {/* Fundo decorativo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                    {/* Logo Oracle Animada */}
                    <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                       <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-full animate-pulse border border-emerald-200 dark:border-emerald-500/30"></div>
                       <div className="relative z-10 w-20 h-20 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-500/30 shadow-md">
                         <img src="/oracle.svg" alt="Oracle" className="w-12 h-12 object-contain" />
                       </div>
                       <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0c0c0e] z-20 shadow-sm">
                         <CheckCircle2 size={16} className="text-white" />
                       </div>
                    </div>

                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight relative z-10">Conexão Oracle Operante</h2>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed relative z-10">
                      Sua máquina está vinculada com sucesso ao banco de dados Oracle. O Motor Local já tem todas as credenciais ativas para sincronizar com o Hub Raizan e canais de venda.
                    </p>
                    
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="relative z-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <Settings size={18} /> Editar Configurações
                    </button>
                  </div>
                ) : (
                  <>
                    {/* STEPPER VISUAL (5 PASSOS) */}
                    <div className="flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:bg-zinc-200 dark:before:bg-zinc-800 before:z-0">
                      {[
                        { num: 1, label: "Banco ERP", icon: Database },
                        { num: 2, label: "Tabelas", icon: TableProperties },
                        { num: 3, label: "Lojas", icon: ShoppingCart },
                        { num: 4, label: "Módulos", icon: CreditCard },
                        { num: 5, label: "Automação", icon: Timer }
                      ].map((s) => (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-zinc-50 dark:bg-[#09090b] px-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${step >= s.num ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                            {step > s.num ? <CheckCircle2 size={18} /> : s.num}
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.num ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* CONTEÚDO DO WIZARD */}
                    <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300">
                      
                      {/* PASSO 1: CONEXÃO */}
                      {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
                              <img src="/oracle.svg" className="w-5 h-5 object-contain" alt="Oracle" />
                            </div>
                            <div><h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Conexão com o Oracle (ERP)</h2></div>
                          </div>

                          <div className="space-y-3 p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Server size={14}/> Comunicação com o Motor Local</label>
                            <div className="flex gap-3">
                              <button onClick={() => setCoreUrl("http://localhost:3001")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Laptop size={16} /> Servidor Local</button>
                              <button onClick={() => setCoreUrl("https://api.rafany.com.br")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${!coreUrl.includes("localhost") ? "bg-blue-600 text-white border-blue-500" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500"}`}><Globe size={16} /> Acesso Remoto</button>
                            </div>
                            <input type="text" value={coreUrl} onChange={(e) => setCoreUrl(e.target.value)} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl text-sm outline-none font-mono mt-1" />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-2 space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Host / IP</label><input type="text" value={formData.oracle_host} onChange={(e) => setFormData({...formData, oracle_host: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Porta</label><input type="text" value={formData.oracle_port} onChange={(e) => setFormData({...formData, oracle_port: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                          </div>
                          <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Service Name / SID</label><input type="text" value={formData.oracle_service} onChange={(e) => setFormData({...formData, oracle_service: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Usuário</label><input type="text" value={formData.oracle_user} onChange={(e) => setFormData({...formData, oracle_user: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-zinc-500 uppercase">Senha</label><input type="password" value={formData.oracle_password} onChange={(e) => setFormData({...formData, oracle_password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-purple-500" /></div>
                          </div>
                        </div>
                      )}

                      {/* PASSO 2: MAPEAMENTO DUPLO */}
                      {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                          
                          {/* Produtos */}
                          <div>
                            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4"><Box size={18} className="text-purple-500" /><h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Base de Produtos</h2></div>
                            <select value={mapeamento.tabela_produtos} onChange={(e) => handleSelecionarTabelaProdutos(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer">
                              <option value="">Selecione a tabela de Produtos...</option>
                              {tabelasOracle.map((tb, idx) => <option key={idx} value={tb.NOME}>{tb.NOME} ({tb.TIPO})</option>)}
                            </select>
                            {colunasProdutos.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                                {[
                                  { label: "Código / SKU", key: "col_sku" }, 
                                  { label: "Cód. Barras (EAN)", key: "col_cod_barras" }, 
                                  { label: "Nome do Produto", key: "col_nome" }, 
                                  { label: "Preço de Venda", key: "col_preco" }, 
                                  { label: "Estoque Físico", key: "col_estoque" }, 
                                  { label: "Status (Ativo/Inativo)", key: "col_status" },
                                  { label: "Marca", key: "col_marca" } // 🟢 CAMPO DE MARCA ADICIONADO AQUI
                                ].map(campo => (
                                  <div key={campo.key} className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">{campo.label}</label>
                                    <select value={mapeamento[campo.key]} onChange={(e) => setMapeamento({...mapeamento, [campo.key]: e.target.value})} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 p-2 rounded-md text-xs outline-none focus:border-purple-500">
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
                            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 mb-4"><Users size={18} className="text-blue-500" /><h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Base de Clientes</h2></div>
                            <select value={mapeamento.tabela_clientes} onChange={(e) => handleSelecionarTabelaClientes(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg text-sm outline-none focus:border-blue-500 cursor-pointer">
                              <option value="">Selecione a tabela de Clientes...</option>
                              {tabelasOracle.map((tb, idx) => <option key={idx} value={tb.NOME}>{tb.NOME} ({tb.TIPO})</option>)}
                            </select>
                            {colunasClientes.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                                {[
                                  { label: "Código Cliente", key: "col_cli_cod" }, { label: "Razão Social / Nome", key: "col_cli_nome" },
                                  { label: "E-mail", key: "col_cli_email" }, { label: "CNPJ / CPF", key: "col_cli_doc" }
                                ].map(campo => (
                                  <div key={campo.key} className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase">{campo.label}</label>
                                    <select value={mapeamento[campo.key]} onChange={(e) => setMapeamento({...mapeamento, [campo.key]: e.target.value})} className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 p-2 rounded-md text-xs outline-none focus:border-blue-500">
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
                          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20"><Store size={20} className="text-blue-500" /></div>
                            <div>
                              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Canais de Venda</h2>
                              <p className="text-xs font-medium text-zinc-500">Selecione para quais lojas o ERP vai enviar os dados.</p>
                            </div>
                          </div>

                          {lojas.length === 0 ? (
                            <div className="text-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
                              <p className="text-sm text-zinc-500">Nenhuma loja ativa encontrada no menu "Integrações".</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {lojas.map(loja => (
                                <div 
                                  key={loja.id} 
                                  onClick={() => toggleSelecao(loja.id, lojasSelecionadas, setLojasSelecionadas)}
                                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center gap-4 ${lojasSelecionadas.includes(loja.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300'}`}
                                >
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${lojasSelecionadas.includes(loja.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {lojasSelecionadas.includes(loja.id) && <CheckCircle2 size={14}/>}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{loja.nome_integracao}</p>
                                    <p className="text-xs text-zinc-500 capitalize">{loja.plataforma.replace('_', ' ')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PASSO 4: MÓDULOS DE PAGAMENTO / FRETE */}
                      {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center border border-sky-100 dark:border-sky-500/20"><CreditCard size={20} className="text-sky-500" /></div>
                            <div>
                              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Módulos (Pagamento & Frete)</h2>
                              <p className="text-xs font-medium text-zinc-500">Selecione os módulos ativos para uso no Portal B2B.</p>
                            </div>
                          </div>

                          {pagamentos.length === 0 ? (
                            <div className="text-center p-8 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
                              <p className="text-sm text-zinc-500">Nenhum módulo ativo (Ex: Mercado Pago, Frenet). Instale no menu Integrações.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {pagamentos.map(mod => (
                                <div 
                                  key={mod.id} 
                                  onClick={() => toggleSelecao(mod.id, pagamentosSelecionados, setPagamentosSelecionados)}
                                  className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center gap-4 ${pagamentosSelecionados.includes(mod.id) ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-sky-300'}`}
                                >
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${pagamentosSelecionados.includes(mod.id) ? 'bg-sky-500 border-sky-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                    {pagamentosSelecionados.includes(mod.id) && <CheckCircle2 size={14}/>}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{mod.nome_integracao}</p>
                                    <p className="text-xs text-zinc-500 capitalize">{mod.plataforma.replace('_', ' ')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PASSO 5: AUTOMAÇÃO */}
                      {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20"><Timer size={20} className="text-emerald-500" /></div>
                            <div>
                              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Automação (Fila Fantasma)</h2>
                              <p className="text-xs font-medium text-zinc-500">A cada quantos minutos o motor deve atualizar estoques/pedidos?</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 flex flex-col items-center py-6">
                            <input type="number" min="1" max="60" value={formData.sync_interval_min} onChange={(e) => setFormData({...formData, sync_interval_min: Number(e.target.value)})} className="w-32 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl text-2xl outline-none focus:border-emerald-500 font-black text-center text-emerald-600 shadow-inner" />
                            <label className="text-xs font-bold text-zinc-500 uppercase mt-3">Minutos</label>
                          </div>
                        </div>
                      )}

                      {/* BOTÕES DE NAVEGAÇÃO LIVRE */}
                      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
                        <button 
                          onClick={() => {
                            if (step === 1 && isConfigured) setIsEditing(false);
                            else setStep(step - 1);
                          }} 
                          disabled={step === 1 && !isConfigured || loading}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-30"
                        >
                          <ChevronLeft size={16} /> {step === 1 && isConfigured ? "Cancelar" : "Voltar"}
                        </button>

                        {step === 1 && (
                          <button onClick={handleTestarConexao} disabled={testingConnection} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                            {testingConnection ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Testar Conexão
                          </button>
                        )}

                        {step > 1 && step < 5 && (
                          <button onClick={() => setStep(step + 1)} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 active:scale-95">
                            Avançar <ChevronRight size={16} />
                          </button>
                        )}

                        {step === 5 && (
                          <button onClick={handleSalvarTudo} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50">
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
        </main>
      </div>
    </div>
  );
}