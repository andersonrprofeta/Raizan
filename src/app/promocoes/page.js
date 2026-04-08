"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Tag, Calendar, DollarSign, Package, Plus, Trash2, Loader2, Percent } from "lucide-react";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

export default function GestaoPromocoes() {
  const [promocoes, setPromocoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Form states
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    carregarPromocoes();
  }, []);

  const carregarPromocoes = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/promocoes`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPromocoes(data.promocoes);
    } catch (error) {
      toast.error("Erro ao carregar promoções.");
    }
    setLoading(false);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    
    const precoFormatado = preco.replace(',', '.');

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/promocoes`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          sku,
          preco_promocional: precoFormatado,
          data_inicio: dataInicio,
          data_fim: dataFim
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSku(""); setPreco(""); setDataInicio(""); setDataFim("");
        carregarPromocoes();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    }
    setSalvando(false);
  };

  const handleRemover = async (skuRemover) => {
    if (!confirm(`Tem certeza que deseja remover a oferta deste produto?`)) return;
    
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/promocoes/${skuRemover}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Promoção removida!");
        carregarPromocoes();
      }
    } catch (error) {
      toast.error("Erro ao remover.");
    }
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatarData = (dataStr) => new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                  <Percent className="text-purple-400" /> Campanhas e Ofertas B2B
                </h1>
                <p className="text-sm text-zinc-400 mt-1">Gerencie preços promocionais exclusivos para o portal de lojistas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* COLUNA ESQUERDA: FORMULÁRIO */}
              <div className="bg-[#0c0c0e] border border-zinc-800/60 rounded-2xl p-6 shadow-xl h-fit relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[50px] pointer-events-none" />
                
                <h2 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2 border-b border-zinc-800/60 pb-3">
                  <Plus size={18} className="text-purple-400" /> Nova Oferta
                </h2>

                <form onSubmit={handleSalvar} className="space-y-4 relative z-10">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase">SKU do Produto</label>
                    <div className="relative mt-1">
                      <Package size={16} className="absolute left-3 top-3 text-zinc-500" />
                      <input 
                        type="text" required value={sku} onChange={(e) => setSku(e.target.value)}
                        placeholder="Ex: 32980"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase">Preço Promocional (R$)</label>
                    <div className="relative mt-1">
                      <DollarSign size={16} className="absolute left-3 top-3 text-emerald-500" />
                      <input 
                        type="text" required value={preco} onChange={(e) => setPreco(e.target.value)}
                        placeholder="19,99"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-emerald-400 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase">Data Inicial</label>
                      <div className="relative mt-1">
                        <Calendar size={16} className="absolute left-3 top-3 text-zinc-500" />
                        <input 
                          type="date" required value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-2 text-zinc-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm color-scheme-dark"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase">Data Final</label>
                      <div className="relative mt-1">
                        <Calendar size={16} className="absolute left-3 top-3 text-zinc-500" />
                        <input 
                          type="date" required value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-2 text-zinc-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm color-scheme-dark"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" disabled={salvando}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] disabled:opacity-50"
                  >
                    {salvando ? <Loader2 size={18} className="animate-spin" /> : <><Tag size={18} /> Ativar Oferta</>}
                  </button>
                </form>
              </div>

              {/* COLUNA DIREITA: LISTAGEM */}
              <div className="lg:col-span-2 bg-[#0c0c0e] border border-zinc-800/60 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-[500px]">
                <div className="p-6 border-b border-zinc-800/60 bg-zinc-900/30 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-zinc-100">Ofertas Ativas</h2>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold">
                    {promocoes.length} Itens
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 size={32} className="animate-spin text-purple-500" /></div>
                  ) : promocoes.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-zinc-500 space-y-3">
                      <Tag size={48} className="opacity-20" />
                      <p>Nenhuma promoção ativa no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {promocoes.map((promo) => (
                        <div key={promo.id} className="bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 rounded-xl p-5 transition-all group relative flex flex-col justify-between">
                          
                          {/* CABEÇALHO DO CARD: NOME E SKU */}
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="pr-6 w-full">
                                <p className="text-[10px] text-purple-400 font-mono font-bold tracking-wider mb-1 px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20 w-fit">
                                  SKU {promo.sku}
                                </p>
                                {/* 🟢 O NOME DO PRODUTO AQUI COM LIMITE DE 2 LINHAS */}
                                <p className="text-sm font-bold text-zinc-100 leading-snug line-clamp-2" title={promo.nome_produto}>
                                  {promo.nome_produto || "Produto não encontrado"}
                                </p>
                              </div>
                              <button 
                                onClick={() => handleRemover(promo.sku)}
                                className="text-zinc-500 hover:text-rose-400 p-1.5 bg-zinc-800 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4"
                                title="Remover Promoção"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          {/* RODAPÉ DO CARD: PREÇO E DATA */}
                          <div className="mt-4 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
                            <span className="text-2xl font-bold text-emerald-400">{formatarMoeda(promo.preco_promocional)}</span>
                            
                            <div className="flex flex-col items-end gap-1 text-[10px] text-zinc-400">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-zinc-500" />
                                <span>Início: <strong className="text-zinc-300">{formatarData(promo.data_inicio)}</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-purple-400" />
                                <span>Fim: <strong className="text-zinc-300">{formatarData(promo.data_fim)}</strong></span>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}

                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}