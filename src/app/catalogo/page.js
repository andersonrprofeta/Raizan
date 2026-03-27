"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Search, ShoppingCart, CheckCircle2, AlertCircle, Package, Barcode, Heart, Eye, Loader2 } from "lucide-react";

// ==========================================
// CONFIGURAÇÕES DO MOTOR DE IMAGENS 🚀
// ==========================================
const BASE_URL_IMAGENS = "https://portalseller.com.br/img_pro/";

// Função para buscar a imagem real pelo EAN ou retornar a imagem padrão "sem foto"
const getProductImageUrl = (ean) => {
  if (ean && ean.trim() !== "") {
    // Se tem EAN, busca a imagem .webp lá no seu link
    return `${BASE_URL_IMAGENS}${ean}.webp`;
  }
  // Se não tem EAN, retorna uma imagem padrão cinza do layout
  return "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto";
};

// ==========================================
// DADOS FALSOS APENAS PARA DESENHAR A TELA
// ==========================================
const PRODUTOS_MOCK = [
  { id: 1, ean: "7898179710065", nome: "A.A.S. 100MG C/200CPR-DORMEC CX", fabricante: "IMEC", condicao: "DF: 1,5%", preco: 26.26, precoMinimo: 15.99, minQtd: 2, estoque: "alto" },
  { id: 2, ean: "7898975719002", nome: "ABAIXADOR DE LINGUA COLORIDO 10 UNID PCT", fabricante: "3B", condicao: "-", preco: 9.99, precoMinimo: null, minQtd: 1, estoque: "alto" },
  { id: 3, ean: "", nome: "PRODUTO TESTE SEM EAN NA MEMÓRIA", fabricante: "MARCA_PRÓPRIA", condicao: "-", preco: 10.35, precoMinimo: null, minQtd: 1, estoque: "baixo" },
];

// ==========================================
// COMPONENTE AUXILIAR DO SELECTOR DE QTD
// ==========================================
function SeletorQuantidade({ id, qtd, min, onQtdChange }) {
  if (qtd > 0) {
    return (
      <div className="flex items-center justify-between bg-zinc-950 border border-purple-500/30 rounded-lg overflow-hidden h-9">
        <button onClick={() => onQtdChange(id, Math.max(0, qtd - 1))} className="w-8 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">-</button>
        <span className="font-bold text-purple-400 text-sm">{qtd}</span>
        <button onClick={() => onQtdChange(id, qtd + 1)} className="w-8 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">+</button>
      </div>
    );
  }
  return (
    <button 
      onClick={() => onQtdChange(id, min || 1)}
      className="w-full h-9 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all text-xs"
    >
      Comprar
    </button>
  );
}


export default function CatalogoB2B() {
  const [carrinho, setCarrinho] = useState({});
  const [loading, setLoading] = useState(false);

  // Função para simular adição ao carrinho
  const handleQuantidade = (id, qtd) => {
    setCarrinho(prev => ({ ...prev, [id]: qtd }));
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-32">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO B2B COM BARRA DE PESQUISA INTEGRADA */}
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/60 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                  <Package className="text-purple-400" /> Catálogo de Reposição
                </h1>
                <p className="text-sm text-zinc-400 mt-1">Reponha o estoque da sua loja com a distribuidora Raizan.</p>
              </div>

              <div className="relative w-96">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Buscar por nome, EAN, princípio ativo ou fabricante..." 
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-purple-500 transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* TABELA ATACADISTA DE ALTA DENSIDADE (LAYOUT NOVO) */}
            <div className="border border-zinc-800/60 bg-[#0c0c0e] rounded-2xl overflow-hidden relative">
              
              {loading && (
                <div className="absolute inset-0 z-10 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={24} className="text-purple-500 animate-spin" />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800/60">
                    <tr>
                      <th className="px-5 py-4 w-16">Imagem</th> {/* w-16 para imagem */}
                      <th className="px-5 py-4 w-[40%]">Produto</th>
                      <th className="px-5 py-4 w-32">Fabricante (Marca)</th>
                      <th className="px-5 py-4 text-center">Estoque</th>
                      <th className="px-5 py-4 text-right">Preço</th>
                      <th className="px-5 py-4 text-center w-40 rounded-r-2xl">Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {PRODUTOS_MOCK.map((produto) => {
                      const qtdNoCarrinho = carrinho[produto.id] || 0;
                      const imageUrl = getProductImageUrl(produto.ean);

                      return (
                        <tr key={produto.id} className="hover:bg-zinc-800/20 transition-colors group">
                          
                          {/* COLUNA 1: IMAGEM DINÂMICA (PELO EAN) */}
                          <td className="px-5 py-4">
                            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-purple-500/50 transition-all">
                              <img 
                                src={imageUrl} 
                                alt={produto.nome} 
                                className="w-full h-full object-contain"
                                // Fallback para não dar erro se a imagem não existir no link
                                onError={(e) => { e.target.src = "https://placehold.co/100x100/18181b/52525b?text=Sem+Foto"; }}
                              />
                            </div>
                          </td>

                          {/* COLUNA 2: NOME E EAN ABAIXO */}
                          <td className="px-5 py-4">
                            <h3 className="font-bold text-zinc-100 group-hover:text-purple-400 transition-colors">{produto.nome}</h3>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-600 font-mono">
                              <Barcode size={13} className="text-zinc-700" />
                              {produto.ean || "SEM EAN"}
                              <span className="text-zinc-800 ml-2">💧 DORMEC 100MG C/200CPR</span>
                            </div>
                          </td>

                          {/* COLUNA 3: FABRICANTE (MARCA) */}
                          <td className="px-5 py-4 text-zinc-400">{produto.fabricante}</td>

                          {/* COLUNA 4: ESTOQUE (STATUS) */}
                          <td className="px-5 py-4 text-center">
                            {produto.estoque === "alto" ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                                <CheckCircle2 size={13}/> Em estoque
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                                <AlertCircle size={13}/> Poucas unidades
                              </div>
                            )}
                          </td>

                          {/* COLUNA 5: PREÇO */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-base font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">{formatarMoeda(produto.preco)}</span>
                            {produto.condicao && produto.condicao !== "-" && (
                              <div className="text-xs text-zinc-600">{produto.condicao}</div>
                            )}
                          </td>

                          {/* COLUNA 6: COMPRA / SELECTOR */}
                          <td className="px-5 py-4">
                            <SeletorQuantidade 
                              id={produto.id} 
                              qtd={qtdNoCarrinho} 
                              min={produto.minQtd} 
                              onQtdChange={handleQuantidade} 
                            />
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>

        {/* BARRA INFERIOR DO CARRINHO (Aparece só se tiver item) */}
        {Object.keys(carrinho).some(id => carrinho[id] > 0) && (
          <div className="fixed bottom-0 left-[260px] right-0 bg-[#0c0c0e]/90 backdrop-blur-md border-t border-purple-500/30 p-4 px-8 flex items-center justify-between animate-in slide-in-from-bottom-10 z-40 shadow-2xl shadow-purple-950/20 pr-40 HeaderB2BCarousel">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg">
                <ShoppingCart className="text-white" size={24} />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-100 leading-tight">Pedido em andamento</p>
                <p className="text-xs text-zinc-400">Passe para o Checkout para finalizar a compra.</p>
              </div>
            </div>
            
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all flex items-center gap-2 group HeaderB2BCarousel">
              Avançar para Checkout <Loader2 size={16} className="text-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}