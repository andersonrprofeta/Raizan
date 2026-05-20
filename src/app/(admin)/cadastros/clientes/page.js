"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  Users, Search, Plus, Edit, Trash2, 
  Mail, Phone, Building2, User as UserIcon,
  Loader2, ChevronLeft, ChevronRight, Database, DownloadCloud
} from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { getHubUrl, getHeaders } from "@/components/utils/api"; 

export default function ListaClientesHub() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10; 

  const [modalDelete, setModalDelete] = useState({ open: false, cliente: null });
  const [excluirNoWoo, setExcluirNoWoo] = useState(false);

  // 🟢 NOVO: ESTADO PARA CONTROLAR A VISIBILIDADE DO BOTÃO
  const [temERP, setTemERP] = useState(false);
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

      // 🟢 BUSCA OS CLIENTES E AS CONFIGURAÇÕES AO MESMO TEMPO
      const [resClientes, resConfig] = await Promise.all([
        fetch(`${getHubUrl()}/api/hub/clientes`, { headers: { ...getHeaders(), "x-tenant-id": cnpj } }),
        fetch(`${getHubUrl()}/api/hub/configuracoes`, { headers: { ...getHeaders(), "x-tenant-id": cnpj } })
      ]);
      
      const dataClientes = await resClientes.json();
      const dataConfig = await resConfig.json();

      if (dataClientes.success) {
        setClientes(dataClientes.clientes);
      }

      // 🟢 SE O ORACLE HOST EXISTIR, LIBERA O BOTÃO!
      if (dataConfig.success && dataConfig.configuracoes?.oracle_host) {
        setTemERP(true);
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
    const toastId = toast.loading("Buscando dados no ERP...");

    try {
      const res = await fetch(`${getHubUrl()}/api/hub/clientes/importar-erp`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json", "x-tenant-id": cnpj },
        body: JSON.stringify({ codigo_erp: modalOracle.codigo })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Cliente importado com sucesso!", { id: toastId });
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

  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return (
      (c.nome && c.nome.toLowerCase().includes(termo)) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(termo))
    );
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);
  const indexUltimoCliente = paginaAtual * itensPorPagina;
  const indexPrimeiroCliente = indexUltimoCliente - itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indexPrimeiroCliente, indexUltimoCliente);

  const renderOrigem = (origem) => {
    const text = (origem || "manual").toLowerCase();
    
    if (text.includes("oracle") || text.includes("erp")) {
      return (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20 w-fit mx-auto shadow-sm">
          <img src="/oracle.svg" alt="Oracle" className="w-4 h-4 object-contain" />
          <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">ERP Local</span>
        </div>
      );
    }

    if (text.includes("woo")) {
      return (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 w-fit mx-auto shadow-sm">
          <img src="/woocommerce.svg" alt="WooCommerce" className="w-4 h-4 object-contain" />
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">WooCommerce</span>
        </div>
      );
    }
    if (text.includes("raizan") || text.includes("site")) {
      return (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 w-fit mx-auto shadow-sm">
          <img src="/globe.svg" alt="Raizan Commerce" className="w-4 h-4 object-contain" />
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Raizan Commerce</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 w-fit mx-auto shadow-sm">
        <UserIcon size={14} className="text-zinc-400" />
        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Manual / PDV</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                  <Users size={28} className="text-purple-600 dark:text-purple-400 transition-colors" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate transition-colors">Base de Clientes</h1>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Gerencie sua carteira de clientes integrada (CRM).</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
                {/* 🟢 O BOTÃO SÓ APARECE SE TIVER ERP CONFIGURADO */}
                {temERP && (
                  <button 
                    onClick={() => setModalOracle({ open: true, codigo: "", loading: false })}
                    className="w-full sm:w-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <Database size={16} /> Importar do ERP
                  </button>
                )}

                <Link href="/cadastros/clientes/novo" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all active:scale-95">
                    <Plus size={18} /> Novo Cliente
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 shadow-sm dark:shadow-none transition-colors">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Buscar cliente por Nome, Email ou CPF/CNPJ..." 
                  value={busca} 
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 px-11 py-3 rounded-xl text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-md dark:shadow-2xl relative transition-colors flex flex-col z-10 overflow-hidden">
              
              {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <Loader2 size={32} className="text-purple-600 dark:text-purple-500 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="w-full overflow-x-auto relative min-h-[350px]"> 
                    <table className="w-full min-w-[1000px] text-sm text-left relative z-20">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60 transition-colors">
                        <tr>
                          <th className="px-6 py-4 uppercase tracking-wider text-xs">Cliente</th>
                          <th className="px-6 py-4 uppercase tracking-wider text-xs">Contato</th>
                          <th className="px-6 py-4 uppercase tracking-wider text-xs">Documento</th>
                          <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Origem</th>
                          <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 transition-colors">
                        
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
                          clientesPaginados.map((cliente) => (
                            <tr key={cliente.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-500/5 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black border border-purple-200 dark:border-purple-800/50">
                                    {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : <UserIcon size={18} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <Link href={`/cadastros/clientes/detalhes?id=${cliente.id}`}>
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-purple-600 transition-colors cursor-pointer">
                                        {cliente.nome}
                                      </span>
                                    </Link>
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                                      {cliente.tipo_pessoa === 'juridica' ? <><Building2 size={10}/> Pessoa Jurídica</> : <><UserIcon size={10}/> Pessoa Física</>}
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
                                <span className="font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs border border-zinc-200 dark:border-zinc-700">
                                  {cliente.cpf_cnpj || 'N/A'}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 text-center">
                                {renderOrigem(cliente.origem)}
                              </td>
                              
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link href={`/cadastros/clientes/editar?id=${cliente.id}`}>
                                    <button className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-purple-50 dark:hover:bg-purple-500/10 text-zinc-500 hover:text-purple-600 rounded-lg shadow-sm transition-colors">
                                      <Edit size={16} />
                                    </button>
                                  </Link>
                                  <button 
                                    onClick={() => {
                                      setModalDelete({ open: true, cliente });
                                      setExcluirNoWoo(false); 
                                    }} 
                                    className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 rounded-lg shadow-sm transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPaginas > 1 && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50 dark:bg-[#0c0c0e]">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{indexPrimeiroCliente + 1}</strong> até <strong className="text-zinc-900 dark:text-zinc-100">{Math.min(indexUltimoCliente, clientesFiltrados.length)}</strong> de <strong className="text-zinc-900 dark:text-zinc-100">{clientesFiltrados.length}</strong> clientes
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                          disabled={paginaAtual === 1}
                          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                            <button
                              key={num}
                              onClick={() => setPaginaAtual(num)}
                              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                                paginaAtual === num 
                                ? 'bg-purple-600 text-white' 
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        <button 
                          onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                          disabled={paginaAtual === totalPaginas}
                          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500" />
                  
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100 dark:border-red-500/20">
                    <DownloadCloud size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Importar do ERP</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed px-2">
                    Digite o <strong className="text-zinc-800 dark:text-zinc-200">Código do Cliente</strong> para buscar no ERP e autorizar o acesso à plataforma.
                  </p>

                  <form onSubmit={handleImportarOracle} className="w-full space-y-5">
                    <input 
                      type="text" 
                      placeholder="Ex: 15482" 
                      required
                      value={modalOracle.codigo}
                      onChange={(e) => setModalOracle({...modalOracle, codigo: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl text-center text-lg font-black tracking-widest outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                    />

                    <div className="flex gap-3 w-full">
                      <button 
                        type="button"
                        onClick={() => setModalOracle({ open: false, codigo: "", loading: false })} 
                        className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={modalOracle.loading}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
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
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-500" />
                  <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Trash2 size={36} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">Excluir Cliente?</h2>
                  
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed px-2">
                    Tem certeza que deseja apagar o cliente <strong className="text-zinc-800 dark:text-zinc-200">"{modalDelete.cliente?.nome}"</strong>? <br />
                    <span className="mt-2 block">Esta ação é irreversível e apagará este registo do seu Hub.</span>
                  </p>

                  {modalDelete.cliente?.origem?.toLowerCase().includes('woo') && (
                    <div className="mb-6 w-full bg-zinc-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-start gap-3 text-left transition-colors">
                      <input 
                        type="checkbox" 
                        id="excluirWoo"
                        checked={excluirNoWoo}
                        onChange={(e) => setExcluirNoWoo(e.target.checked)}
                        className="mt-1 w-4 h-4 text-purple-600 bg-white border-zinc-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-zinc-900 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600 cursor-pointer"
                      />
                      <label htmlFor="excluirWoo" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                        Excluir também na loja WooCommerce
                        <span className="block text-[11px] font-normal text-zinc-500 mt-0.5 leading-snug">
                          Isso enviará um comando para a loja deletar o cadastro do cliente definitivamente.
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-3 w-full justify-center">
                    <button 
                      onClick={() => {
                        setModalDelete({ open: false, cliente: null });
                        setExcluirNoWoo(false);
                      }} 
                      className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={confirmarExclusao} 
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-rose-500/20"
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