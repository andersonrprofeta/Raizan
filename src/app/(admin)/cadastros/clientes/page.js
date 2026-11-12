"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Users, Search, Plus, Edit, Trash2, 
  Mail, Phone, Building2, User as UserIcon,
  Loader2, ChevronLeft, ChevronRight, Database, DownloadCloud, SlidersHorizontal, X
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api"; 
import { useErp } from "@/components/utils/erp";

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

// Superfície de vidro usada pelos cards (claro + escuro)
const CARD =
  "relative overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)] " +
  "transition-colors duration-300";

// Painel de vidro dos modais
const PAINEL =
  "bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] " +
  "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_90px_-20px_rgba(0,0,0,0.9)]";

// Botão de ícone redondo (ações da tabela)
const ICON_BTN =
  "w-9 h-9 flex items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] " +
  "border border-black/[0.04] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 " +
  "transition-all duration-300 active:scale-90";

// Botões de paginação (setas)
const PAG_SETA =
  "w-9 h-9 flex items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] " +
  "bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.08] " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-white/[0.04] " +
  "transition-all duration-300 active:scale-90";

// Pílulas de origem (Omie, ERP, Woo...)
const PILULA_BASE = "inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap";

const INPUT_MODAL =
  "w-full bg-zinc-100/80 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 " +
  "p-4 rounded-2xl text-center text-lg font-bold tracking-widest outline-none transition-all";

const FILTROS_VAZIOS = { vendedor: "", cidade: "", bairro: "", uf: "", situacao: "" };

const lerJson = (valor) => {
  try {
    return (typeof valor === "string" ? JSON.parse(valor) : valor) || {};
  } catch (erro) {
    return {};
  }
};

const normalizar = (texto) => String(texto || "").trim();
const opcoesDe = (lista) => [...new Set(lista.map(normalizar).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

function CampoFiltro({ rotulo, valor, opcoes, onChange }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{rotulo}</span>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-purple-500/50 text-sm text-zinc-900 dark:text-zinc-100 outline-none">
        <option value="">Todos</option>
        {opcoes.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
      </select>
    </label>
  );
}

export default function ListaClientesHub() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10; 

  const [modalDelete, setModalDelete] = useState({ open: false, cliente: null });
  const [excluirNoWoo, setExcluirNoWoo] = useState(false);

  // 🟢 NOVO: ESTADO PARA CONTROLAR A VISIBILIDADE DO BOTÃO
  // Botão "Importar do ERP" só com ERP que sabe importar cliente (hoje Omie ou Oracle com o motor local)
  const erpClientes = useErp().com("clientes");
  const doOmie = erpClientes?.plataforma === "omie";
  const [modalOracle, setModalOracle] = useState({ open: false, codigo: "", loading: false });

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        return JSON.parse(storedUser).tenant_id;
      }
    }
    return "";
  };

  useEffect(() => {
    carregarClientesEConfiguracoes();
  }, []);

  const carregarClientesEConfiguracoes = async () => {
    try {
      const cnpj = pegarCnpjLogado();
      
      if (!cnpj) {
        toast.error("Erro: CNPJ da empresa não encontrado na sessão.");
        setLoading(false);
        return;
      }

      // O botão do ERP vem de useErp(): aqui só a lista de clientes
      const resClientes = await fetch(`${getHubUrl()}/api/hub/clientes`, { headers: { ...getHeaders(), "x-tenant-id": cnpj } });
      const dataClientes = await resClientes.json();

      if (dataClientes.success) {
        setClientes(dataClientes.clientes);
      }


    } catch (error) { 
      toast.error("Erro de conexão com o Hub."); 
    } finally { 
      setLoading(false); 
    }
  };

  const confirmarExclusao = async () => {
    const id = modalDelete.cliente.id;
    const loadingToast = toast.loading("Excluindo cliente...");
    const cnpj = pegarCnpjLogado();

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/clientes/${id}?excluir_woo=${excluirNoWoo}`, { 
        method: "DELETE",
        headers: { ...getHeaders(), "x-tenant-id": cnpj }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Cliente removido!", { id: loadingToast });
        setClientes(clientes.filter(c => c.id !== id));
      } else {
        toast.error(data.message || "Erro ao excluir cliente.", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Erro de conexão ao tentar excluir.", { id: loadingToast });
    } finally {
      setModalDelete({ open: false, cliente: null });
      setExcluirNoWoo(false);
    }
  };

  const handleImportarOracle = async (e) => {
    e.preventDefault();
    if (!modalOracle.codigo) return toast.error("Digite o código do cliente!");

    const cnpj = pegarCnpjLogado();
    setModalOracle({ ...modalOracle, loading: true });
    const toastId = toast.loading(`Buscando no ${erpClientes?.nome || "ERP"}...`);

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/clientes/importar-erp`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify({ codigo_erp: modalOracle.codigo })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Cliente importado com sucesso!", { id: toastId });
        setModalOracle({ open: false, codigo: "", loading: false });
        carregarClientesEConfiguracoes(); 
      } else {
        toast.error(data.message || "Cliente não encontrado.", { id: toastId });
        setModalOracle({ ...modalOracle, loading: false });
      }
    } catch (error) {
      toast.error("Falha de comunicação com a API.", { id: toastId });
      setModalOracle({ ...modalOracle, loading: false });
    }
  };

  // Endereço e bloqueio ficam em JSON: lidos uma vez só para a lista não pesar a cada tecla
  const clientesComDados = useMemo(() => clientes.map((cliente) => {
    const endereco = lerJson(cliente.endereco_json);
    return {
      cliente,
      vendedor: normalizar(cliente.nome_vendedor),
      cidade: normalizar(endereco.cidade),
      bairro: normalizar(endereco.bairro),
      uf: normalizar(endereco.uf).toUpperCase(),
      bloqueado: Boolean(lerJson(cliente.metadata_json).bloqueado)
    };
  }), [clientes]);

  const opcoesDeFiltro = useMemo(() => {
    const naRegiao = clientesComDados.filter((c) => (!filtros.uf || c.uf === filtros.uf) && (!filtros.cidade || c.cidade === filtros.cidade));
    return {
      vendedor: opcoesDe(clientesComDados.map((c) => c.vendedor)),
      uf: opcoesDe(clientesComDados.map((c) => c.uf)),
      cidade: opcoesDe(clientesComDados.filter((c) => !filtros.uf || c.uf === filtros.uf).map((c) => c.cidade)),
      bairro: opcoesDe(naRegiao.map((c) => c.bairro))
    };
  }, [clientesComDados, filtros.uf, filtros.cidade]);

  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  const mudarFiltro = (campo, valor) => {
    setFiltros((atuais) => ({
      ...atuais,
      [campo]: valor,
      ...(campo === "uf" ? { cidade: "", bairro: "" } : {}),
      ...(campo === "cidade" ? { bairro: "" } : {})
    }));
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setPaginaAtual(1);
  };

  const clientesFiltrados = clientesComDados.filter((item) => {
    const c = item.cliente;
    const termo = busca.toLowerCase();
    const bateBusca = (c.nome && c.nome.toLowerCase().includes(termo)) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(termo));

    return bateBusca
      && (!filtros.vendedor || item.vendedor === filtros.vendedor)
      && (!filtros.uf || item.uf === filtros.uf)
      && (!filtros.cidade || item.cidade === filtros.cidade)
      && (!filtros.bairro || item.bairro === filtros.bairro)
      && (!filtros.situacao || (filtros.situacao === "Bloqueados") === item.bloqueado);
  }).map((item) => item.cliente);

  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);
  const indexUltimoCliente = paginaAtual * itensPorPagina;
  const indexPrimeiroCliente = indexUltimoCliente - itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indexPrimeiroCliente, indexUltimoCliente);

  // 🆕 PAGINAÇÃO INTELIGENTE: em vez de 1 botão por página (141 botões!), mostra uma "janela":
  // 1 2 3 4 … 141  |  1 … 5 6 7 … 141  |  1 … 138 139 140 141
  const gerarPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);

    let inicio, fim;
    if (paginaAtual <= 3) { inicio = 2; fim = 4; }
    else if (paginaAtual >= totalPaginas - 2) { inicio = totalPaginas - 3; fim = totalPaginas - 1; }
    else { inicio = paginaAtual - 1; fim = paginaAtual + 1; }

    const paginas = [1];
    if (inicio > 2) paginas.push("inicio…");
    for (let i = inicio; i <= fim; i++) paginas.push(i);
    if (fim < totalPaginas - 1) paginas.push("fim…");
    paginas.push(totalPaginas);
    return paginas;
  };

  // 🟢 BADGES DE ORIGEM (agora em pílulas)
  const renderOrigem = (origem) => {
    const text = (origem || "manual").toLowerCase();
    
    if (text.includes("omie")) {
      return (
        <div className={`${PILULA_BASE} bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400`}>
          <Database size={12} className="text-emerald-500" />
          <span>Omie ERP</span>
        </div>
      );
    }

    if (text.includes("oracle") || text.includes("erp")) {
      return (
        <div className={`${PILULA_BASE} bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400`}>
          <img src="/oracle.svg" alt="Oracle" className="w-3.5 h-3.5 object-contain" />
          <span>ERP Local</span>
        </div>
      );
    }

    if (text.includes("woo")) {
      return (
        <div className={`${PILULA_BASE} bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300`}>
          <img src="/woocommerce.svg" alt="WooCommerce" className="w-3.5 h-3.5 object-contain" />
          <span>WooCommerce</span>
        </div>
      );
    }
    
    if (text.includes("raizan") || text.includes("site")) {
      return (
        <div className={`${PILULA_BASE} bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300`}>
          <img src="/globe.svg" alt="Raizan Commerce" className="w-3.5 h-3.5 object-contain" />
          <span>Raizan Commerce</span>
        </div>
      );
    }
    
    return (
      <div className={`${PILULA_BASE} bg-black/[0.04] dark:bg-white/[0.06] border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300`}>
        <UserIcon size={12} className="text-zinc-400" />
        <span>Manual / PDV</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">

        {/* Luzes suaves atrás do vidro */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
        </div>

        <Header />
        
        {/* ⚠️ Sem z-index no <main>: um z-index aqui cria um "andar" de empilhamento e prende os modais (fixed) atrás do Header e da Sidebar */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Título */}
            <div className={`${CARD} flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 gap-4`}>
              <div className="absolute -left-10 -top-10 w-44 h-44 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-8px_rgba(124,58,237,0.6)] rounded-[16px] sm:rounded-[18px]"
                >
                  <Users size={26} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-[28px] leading-tight font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">Base de Clientes</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gerencie sua carteira de clientes integrada (CRM).</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                {/* 🟢 O BOTÃO SÓ APARECE SE TIVER ERP CONFIGURADO */}
                {erpClientes && (
                  <button 
                    onClick={() => setModalOracle({ open: true, codigo: "", loading: false })}
                    className="w-full sm:w-auto h-11 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] hover:bg-red-500/10 dark:hover:bg-red-500/10 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 px-5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Database size={16} /> Importar do {erpClientes.nome}
                  </button>
                )}

                <Link href="/cadastros/clientes/novo" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto h-11 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white px-6 rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(147,51,234,0.6)] transition-all active:scale-95">
                    <Plus size={18} /> Novo Cliente
                  </button>
                </Link>
              </div>
            </div>

            {/* Busca */}
            <div className={`${CARD} p-3 sm:p-4 !overflow-visible`}>
              <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar cliente por Nome, Email ou CPF/CNPJ..." 
                  value={busca} 
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-full bg-black/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/[0.07] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 pl-11 pr-4 h-11 rounded-full text-sm outline-none focus:ring-4 focus:ring-purple-500/15 font-medium transition-all"
                />
              </div>
                <button
                  type="button"
                  onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                  aria-expanded={filtrosAbertos}
                  className={`h-12 px-5 shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors ${filtrosAtivos > 0 ? "bg-purple-600 text-white" : "bg-black/[0.04] dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.07] dark:hover:bg-white/[0.08]"}`}
                >
                  <SlidersHorizontal size={16} /> Filtros{filtrosAtivos > 0 ? ` (${filtrosAtivos})` : ""}
                </button>
              </div>

              {filtrosAbertos && (
                <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.07]">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <CampoFiltro rotulo="Vendedor" valor={filtros.vendedor} opcoes={opcoesDeFiltro.vendedor} onChange={(v) => mudarFiltro("vendedor", v)} />
                    <CampoFiltro rotulo="Estado" valor={filtros.uf} opcoes={opcoesDeFiltro.uf} onChange={(v) => mudarFiltro("uf", v)} />
                    <CampoFiltro rotulo="Cidade" valor={filtros.cidade} opcoes={opcoesDeFiltro.cidade} onChange={(v) => mudarFiltro("cidade", v)} />
                    <CampoFiltro rotulo="Bairro" valor={filtros.bairro} opcoes={opcoesDeFiltro.bairro} onChange={(v) => mudarFiltro("bairro", v)} />
                    <CampoFiltro rotulo="Situação" valor={filtros.situacao} opcoes={["Ativos", "Bloqueados"]} onChange={(v) => mudarFiltro("situacao", v)} />
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>{clientesFiltrados.length} cliente(s) encontrado(s)</span>
                    {filtrosAtivos > 0 && (
                      <button type="button" onClick={limparFiltros} className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400"><X size={14} /> Limpar filtros</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabela */}
            <div className={`${CARD} flex flex-col z-10`}>
              
              {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto relative min-h-[350px] custom-scrollbar"> 
                    <table className="w-full min-w-[1000px] text-sm text-left relative z-20">
                      <thead className="text-zinc-500 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.07]">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold">Cliente</th>
                          <th className="px-6 py-4 text-xs font-semibold">Contato</th>
                          <th className="px-6 py-4 text-xs font-semibold">Documento</th>
                          <th className="px-6 py-4 text-xs font-semibold text-center">Origem</th>
                          <th className="px-6 py-4 text-xs font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                        
                        {clientesPaginados.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-16 text-center text-zinc-500 dark:text-zinc-400">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <Users size={32} className="text-zinc-300 dark:text-zinc-700" />
                                <p className="font-medium text-base">Nenhum cliente encontrado.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          clientesPaginados.map((cliente) => {
                            const documentoLimpo = cliente.cpf_cnpj ? String(cliente.cpf_cnpj).replace(/\D/g, '') : '';
                            const isPJ = cliente.tipo_pessoa === 'juridica' || documentoLimpo.length > 11;

                            return (
                              <tr key={cliente.id} className="hover:bg-purple-500/[0.04] dark:hover:bg-white/[0.03] transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-white flex items-center justify-center font-bold ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(124,58,237,0.6)]">
                                      {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : (isPJ ? <Building2 size={18} /> : <UserIcon size={18} />)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <Link href={`/cadastros/clientes/detalhes?id=${cliente.id}`}>
                                        <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                                          {cliente.nome}
                                        </span>
                                      </Link>
                                      <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                                        {isPJ ? <><Building2 size={11}/> Pessoa Jurídica</> : <><UserIcon size={11}/> Pessoa Física</>}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1.5 text-sm">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                      <Mail size={14} className="text-zinc-400" /> {cliente.email || 'Não informado'}
                                    </div>
                                    {cliente.telefone && (
                                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                        <Phone size={14} className="text-zinc-400" /> {cliente.telefone}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 rounded-full text-xs border border-black/[0.05] dark:border-white/[0.06]">
                                    {cliente.cpf_cnpj || 'N/A'}
                                  </span>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                  {renderOrigem(cliente.origem)}
                                </td>
                                
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link href={`/cadastros/clientes/editar?id=${cliente.id}`}>
                                      <button className={`${ICON_BTN} hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400`} title="Editar">
                                        <Edit size={16} />
                                      </button>
                                    </Link>
                                    <button 
                                      onClick={() => {
                                        setModalDelete({ open: true, cliente });
                                        setExcluirNoWoo(false); 
                                      }} 
                                      className={`${ICON_BTN} hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400`}
                                      title="Excluir"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 🆕 RODAPÉ DA TABELA: texto não quebra mais e a paginação usa janela com reticências */}
                  {totalPaginas > 1 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.07] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 text-center md:text-left md:whitespace-nowrap">
                        Mostrando <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{indexPrimeiroCliente + 1}</strong> até <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{Math.min(indexUltimoCliente, clientesFiltrados.length)}</strong> de <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{clientesFiltrados.length}</strong> clientes
                      </span>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                          disabled={paginaAtual === 1}
                          className={PAG_SETA}
                          aria-label="Página anterior"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        
                        {/* Telas médias/grandes: números com janela */}
                        <div className="hidden sm:flex items-center gap-1">
                          {gerarPaginas().map((num) => (
                            typeof num === "number" ? (
                              <button
                                key={num}
                                onClick={() => setPaginaAtual(num)}
                                aria-current={paginaAtual === num ? "page" : undefined}
                                className={`min-w-9 h-9 px-2 rounded-full text-sm font-semibold tabular-nums transition-all duration-300 active:scale-90 ${
                                  paginaAtual === num 
                                  ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_18px_-8px_rgba(147,51,234,0.7)]' 
                                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                                }`}
                              >
                                {num}
                              </button>
                            ) : (
                              <span key={num} className="w-7 text-center text-zinc-400 dark:text-zinc-600 select-none">…</span>
                            )
                          ))}
                        </div>

                        {/* Celular: só "Página X de Y" */}
                        <span className="sm:hidden px-3 text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
                          Página {paginaAtual} de {totalPaginas}
                        </span>

                        <button 
                          onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaAtual === totalPaginas}
                          className={PAG_SETA}
                          aria-label="Próxima página"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* MODAL DE IMPORTAÇÃO DO ERP */}
            {modalOracle.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                <div className={`${PAINEL} rounded-[32px] w-full max-w-md p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200`} onClick={(e) => e.stopPropagation()}>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative w-16 h-16 mb-6 rounded-[20px] flex items-center justify-center bg-gradient-to-br from-rose-400 to-red-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_14px_30px_-10px_rgba(239,68,68,0.7)]">
                    <DownloadCloud size={30} />
                  </div>
                  
                  <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Importar do {erpClientes?.nome || "ERP"}</h2>
                  <p className="relative text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed px-2">
                    {doOmie
                      ? <>Digite o <strong className="font-semibold text-zinc-800 dark:text-zinc-200">CNPJ, CPF ou código do cliente no Omie</strong>. Se ele já existir no Core, os dados são atualizados.</>
                      : <>Digite o <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Código do Cliente</strong> para buscar no ERP e autorizar o acesso à plataforma.</>}
                  </p>

                  <form onSubmit={handleImportarOracle} className="relative w-full space-y-5">
                    <input 
                      type="text" 
                      placeholder={doOmie ? "Ex: 11.222.333/0001-81" : "Ex: 15482"} 
                      required
                      value={modalOracle.codigo}
                      onChange={(e) => setModalOracle({...modalOracle, codigo: e.target.value})}
                      className={`${INPUT_MODAL} focus:border-red-500/50 focus:ring-4 focus:ring-red-500/15`}
                    />

                    <div className="flex gap-3 w-full">
                      <button 
                        type="button"
                        onClick={() => setModalOracle({ open: false, codigo: "", loading: false })} 
                        className="flex-1 h-12 bg-black/[0.05] hover:bg-black/[0.08] text-zinc-700 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:text-zinc-200 rounded-full font-semibold transition-all active:scale-95"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={modalOracle.loading}
                        className="flex-1 h-12 bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-600 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(239,68,68,0.6)] flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                      >
                        {modalOracle.loading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                        Importar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL DE DELETE */}
            {modalDelete.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                <div className={`${PAINEL} rounded-[32px] w-full max-w-md p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200`}>
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative w-20 h-20 mb-6 rounded-[24px] flex items-center justify-center bg-gradient-to-br from-rose-400 to-red-600 text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_16px_34px_-10px_rgba(239,68,68,0.7)]">
                    <Trash2 size={34} strokeWidth={2.2} />
                  </div>
                  <h2 className="relative text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">Excluir Cliente?</h2>
                  
                  <p className="relative text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed px-2">
                    Tem certeza que deseja apagar o cliente <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{modalDelete.cliente?.nome}"</strong>? <br />
                    <span className="mt-2 block">Esta ação é irreversível e apagará este registo do seu Hub.</span>
                  </p>

                  {modalDelete.cliente?.origem?.toLowerCase().includes('woo') && (
                    <div className="relative mb-6 w-full bg-black/[0.03] dark:bg-white/[0.05] p-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.07] flex items-start gap-3 text-left transition-colors">
                      <input 
                        type="checkbox" 
                        id="excluirWoo"
                        checked={excluirNoWoo}
                        onChange={(e) => setExcluirNoWoo(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-purple-600 rounded cursor-pointer"
                      />
                      <label htmlFor="excluirWoo" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                        Excluir também na loja WooCommerce
                        <span className="block text-[11px] font-normal text-zinc-500 mt-0.5 leading-snug">
                          Isso enviará um comando para a loja deletar o cadastro do cliente definitivamente.
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="relative flex gap-3 w-full justify-center">
                    <button 
                      onClick={() => {
                        setModalDelete({ open: false, cliente: null });
                        setExcluirNoWoo(false);
                      }} 
                      className="flex-1 h-12 bg-black/[0.05] hover:bg-black/[0.08] text-zinc-700 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] dark:text-zinc-200 rounded-full font-semibold transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={confirmarExclusao} 
                      className="flex-1 h-12 bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-600 text-white rounded-full font-semibold transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_-8px_rgba(239,68,68,0.6)] active:scale-95"
                    >
                      Sim, Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
//aplicar correção de excluir cliente da última página e ela ficar sem clientes, voltar para a página anterior.