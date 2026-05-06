"use client";

import { useState, useEffect, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  ArrowLeft, User as UserIcon, Mail, Phone, MapPin, 
  Building2, CreditCard, ShoppingBag, DollarSign, 
  TrendingUp, Calendar, Package, ExternalLink, Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from 'react-hot-toast';

function DashboardCliente() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idCliente = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState({
    cliente: null,
    kpis: { total_gasto: 0, ticket_medio: 0, total_pedidos: 0 },
    pedidos: []
  });

  // 🔥 Função para pegar o Tenant ID logado
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
    if (idCliente) carregarDashboard();
    else { toast.error("ID não encontrado"); router.push('/cadastros/clientes'); }
  }, [idCliente]);

  const carregarDashboard = async () => {
    const tenantId = pegarCnpjLogado();
    if (!tenantId) {
      toast.error("Sessão expirada. Faça login novamente.");
      return router.push('/login');
    }

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/clientes/${idCliente}/dashboard`, {
        headers: { 
          "Content-Type": "application/json",
          "x-tenant-id": tenantId // 🔥 INJETAMOS O CRACHÁ AQUI TAMBÉM!
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setDados(data);
      } else {
        toast.error("Cliente não encontrado.");
        router.push('/cadastros/clientes');
      }
    } catch (error) {
      toast.error("Erro ao carregar a Visão 360º.");
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatarData = (dataStr) => new Date(dataStr).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });

  const renderStatusPedido = (status) => {
    switch(status) {
      case 'entregue': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/20">Entregue</span>;
      case 'enviado': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-500/20">Enviado</span>;
      case 'cancelado': return <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-500/20">Cancelado</span>;
      default: return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">Pendente</span>;
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="text-indigo-500 animate-spin" /></div>;
  }

  // 🔥 Segurança para não dar tela branca caso a API não retorne o cliente
  if (!dados.cliente) {
    return null; 
  }

  const { cliente, kpis, pedidos } = dados;
  let endereco = {};
  try { endereco = typeof cliente.endereco_json === 'string' ? JSON.parse(cliente.endereco_json) : (cliente.endereco_json || {}); } catch(e){}

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cadastros/clientes">
              <button className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm text-zinc-500">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Visão 360º do Cliente</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Métricas e histórico completo.</p>
            </div>
          </div>
          
          <Link href={`/cadastros/clientes/editar?id=${cliente.id}`}>
            <button className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-colors shadow-sm text-sm">
              Editar Registo
            </button>
          </Link>
        </div>

        {/* KPIs (Métricas Principais) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LTV - Agora em roxo/índigo premium */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-500/20 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-bold text-indigo-50 uppercase tracking-wider text-xs">Total Gasto (LTV)</p>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <DollarSign size={20} className="text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-black relative z-10 tracking-tight">{formatarMoeda(kpis.total_gasto)}</h3>
          </div>

          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Total de Pedidos</p>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 relative z-10">{kpis.total_pedidos}</h3>
          </div>

          <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <p className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Ticket Médio</p>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 relative z-10">{formatarMoeda(kpis.ticket_medio)}</h3>
          </div>
        </div>

        {/* Layout de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna 1: Dados do Cliente */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-3xl font-black border-4 border-white dark:border-[#0c0c0e] shadow-lg mb-4">
                  {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : <UserIcon size={32} />}
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{cliente.nome}</h2>
                <p className="text-[10px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest flex items-center gap-1 justify-center bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full w-fit mx-auto">
                  {cliente.tipo_pessoa === 'juridica' ? <><Building2 size={12}/> Pessoa Jurídica</> : <><UserIcon size={12}/> Pessoa Física</>}
                </p>
              </div>

              <div className="pt-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <Mail size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">E-mail</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 break-all">{cliente.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <Phone size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Telefone</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cliente.telefone || "Não informado"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <CreditCard size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{cliente.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cliente.cpf_cnpj || "Não informado"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <MapPin size={14} className="text-zinc-500" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Endereço Principal</p>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      {endereco.logradouro ? `${endereco.logradouro}, ${endereco.numero || 'S/N'} - ${endereco.bairro}` : "Nenhum endereço registado."}
                      <br/>
                      {endereco.cidade && <span className="text-zinc-500 text-xs">{endereco.cidade} / {endereco.uf}</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2: Histórico de Pedidos */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <Package size={20} className="text-indigo-500" /> Histórico de Encomendas
                </h2>
              </div>
              
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800/60">
                    <tr>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Pedido</th>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Data</th>
                      <th className="px-6 py-4 uppercase tracking-wider text-xs">Produtos</th>
                      <th className="px-6 py-4 text-center uppercase tracking-wider text-xs">Estado</th>
                      <th className="px-6 py-4 text-right uppercase tracking-wider text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                    {pedidos.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center text-zinc-500">
                          <ShoppingBag size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                          <p className="font-medium text-base text-zinc-600 dark:text-zinc-400">Nenhuma compra registrada.</p>
                        </td>
                      </tr>
                    ) : (
                      pedidos.map((pedido) => {
                        const itensVisiveis = pedido.itens ? pedido.itens.slice(0, 2) : [];
                        const itensOcultos = pedido.itens ? pedido.itens.length - 2 : 0;

                        return (
                          <tr key={pedido.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer group">
                            
                            <td className="px-6 py-4">
                              <span className="font-black text-indigo-600 dark:text-indigo-400 block text-base">
                                #{pedido.codigo_externo || pedido.id}
                              </span>
                              <span className="text-[10px] text-zinc-500 capitalize tracking-wider font-bold mt-1 block">
                                {pedido.origem.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                              {formatarData(pedido.created_at)}
                            </td>
                            
                            <td className="px-6 py-4 min-w-[220px] max-w-[300px]">
                              {itensVisiveis.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {itensVisiveis.map((item) => (
                                    <div key={item.id} className="flex items-start gap-2.5 text-xs">
                                      <span className="font-black text-indigo-700 dark:text-indigo-300 min-w-[22px] bg-indigo-100 dark:bg-indigo-900/40 px-1 py-0.5 rounded text-center shrink-0">
                                        {item.quantidade}x
                                      </span>
                                      <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate pt-0.5" title={item.nome_produto}>
                                        {item.nome_produto}
                                      </span>
                                    </div>
                                  ))}
                                  {itensOcultos > 0 && (
                                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-md w-fit mt-1">
                                      + {itensOcultos} outro(s) item(ns)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-400 italic">Itens não sincronizados</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-center">
                              {renderStatusPedido(pedido.status_pedido)}
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">{formatarMoeda(pedido.valor_total)}</span>
                                <ExternalLink size={16} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function DetalhesCliente() {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="text-indigo-500 animate-spin" /></div>}>
          <DashboardCliente />
        </Suspense>
      </div>
    </div>
  );
}