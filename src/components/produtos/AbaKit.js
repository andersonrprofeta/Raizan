"use client";

import { useState, useEffect } from "react";
import { Box, Plus, Trash2, Search, Package } from "lucide-react";
import toast from "react-hot-toast";

export default function AbaKit({ produto, atualizarCampo }) {
  
  // 🧠 TRAVA DE SEGURANÇA E ESTADOS
  const itensKit = Array.isArray(produto?.composicao_kit) ? produto.composicao_kit : [];
  
  // 🟢 ESTADOS DO MOTOR DE BUSCA
  const [catalogo, setCatalogo] = useState([]);
  const [linhaBuscando, setLinhaBuscando] = useState(null); // Guarda o índice da linha que está pesquisando
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);

  // 🔥 Função para pegar o Tenant ID logado (O Crachá!)
  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        return JSON.parse(storedUser).tenant_id;
      }
    }
    return "";
  };

  // 🟢 BUSCA O CATÁLOGO REAL NA NUVEM AO ABRIR A ABA
  useEffect(() => {
    const buscarProdutos = async () => {
      const tenantId = pegarCnpjLogado();
      if (!tenantId) return;

      try {
        // 🟢 INJETANDO O CABEÇALHO AQUI
        const res = await fetch("https://api.raizan.com.br/api/hub/produtos", {
          headers: { "x-tenant-id": tenantId }
        });
        const data = await res.json();
        if (data.success) {
          setCatalogo(data.produtos);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setCarregandoCatalogo(false);
      }
    };
    buscarProdutos();
  }, []);

  const adicionarItemKit = () => {
    const novosItens = [...itensKit, { nome_sku: "", quantidade: 1, preco_unitario: 0 }];
    atualizarCampo('composicao_kit', novosItens);
  };

  const editarItemKit = (index, campo, valor) => {
    const novosItens = [...itensKit];
    novosItens[index][campo] = valor;
    atualizarCampo('composicao_kit', novosItens);
  };

  const removerItemKit = (index) => {
    const novosItens = itensKit.filter((_, i) => i !== index);
    atualizarCampo('composicao_kit', novosItens);
  };

  const calcularTotalKit = () => {
    return itensKit.reduce((total, item) => {
      const qtd = Number(item.quantidade) || 0;
      const preco = Number(item.preco_unitario) || 0;
      return total + (qtd * preco);
    }, 0);
  };

  // 🟢 A MÁGICA DO AUTO-PREENCHIMENTO
  const selecionarProdutoDoCatalogo = (index, prod) => {
    const novosItens = [...itensKit];
    // Formata bonitinho: "Base Liquida (SKU: 12345)"
    novosItens[index].nome_sku = `${prod.nome} ${prod.sku ? `(SKU: ${prod.sku})` : ''}`;
    // Puxa o preço oficial do banco
    novosItens[index].preco_unitario = Number(prod.preco_venda) || 0;
    
    atualizarCampo('composicao_kit', novosItens);
    setLinhaBuscando(null); // Fecha o menu flutuante
    toast.success("Produto vinculado!", { icon: "🔗" });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 transition-colors">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
              <Box className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Composição do Kit
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">
              Pesquise e adicione produtos reais da loja que farão parte deste kit.
            </p>
          </div>
        </div>

        {/* 🟢 overflow-visible é CRUCIAL aqui para o menu flutuante não ser cortado pela tabela */}
        <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-visible shadow-sm transition-colors">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 transition-colors">
              <tr>
                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Busca de Produto / SKU</th>
                <th className="px-5 py-4 w-32 text-center uppercase tracking-wider text-[11px]">Qtd</th>
                <th className="px-5 py-4 w-40 text-right uppercase tracking-wider text-[11px]">Preço Un. / Custo</th>
                <th className="px-5 py-4 w-40 text-right uppercase tracking-wider text-[11px]">Preço Total</th>
                <th className="px-5 py-4 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 transition-colors">
              {itensKit.map((item, index) => {
                
                // 🟢 LÓGICA DE FILTRO AO VIVO
                const termo = item.nome_sku.toLowerCase();
                const produtosFiltrados = catalogo.filter(p => 
                  p.nome?.toLowerCase().includes(termo) || p.sku?.toLowerCase().includes(termo)
                );

                return (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    
                    {/* 🟢 CÉLULA DO INPUT DE BUSCA */}
                    <td className="p-3 relative align-top pt-4">
                      <div className="relative">
                        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${linhaBuscando === index ? 'text-purple-500' : 'text-zinc-400 dark:text-zinc-500'}`} />
                        <input 
                          type="text" 
                          placeholder={carregandoCatalogo ? "Carregando catálogo..." : "Digite o nome ou SKU para buscar..."}
                          disabled={carregandoCatalogo}
                          value={item.nome_sku} 
                          onChange={(e) => {
                            editarItemKit(index, 'nome_sku', e.target.value);
                            setLinhaBuscando(index); // Abre o menu
                          }}
                          onFocus={() => setLinhaBuscando(index)}
                          // O onBlur tem um delay de 200ms para dar tempo do usuário clicar na sugestão antes de fechar!
                          onBlur={() => setTimeout(() => setLinhaBuscando(null), 200)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pl-9 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm font-medium"
                        />
                      </div>

                      {/* 🟢 MENU FLUTUANTE (DROPDOWN DE SUGESTÕES) */}
                      {linhaBuscando === index && termo.length > 1 && (
                        <div className="absolute z-50 left-3 right-3 top-[calc(100%-8px)] bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-700/80 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar flex flex-col py-2 animate-in fade-in slide-in-from-top-2">
                          
                          <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
                            Produtos Encontrados
                          </div>

                          {produtosFiltrados.length === 0 ? (
                            <div className="px-4 py-4 text-center text-sm text-zinc-500 italic">
                              Nenhum produto encontrado com "{item.nome_sku}".
                            </div>
                          ) : (
                            produtosFiltrados.map((prod) => (
                              <div 
                                key={prod.id}
                                onClick={() => selecionarProdutoDoCatalogo(index, prod)}
                                className="px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-500/10 cursor-pointer flex items-center justify-between group/item transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex flex-shrink-0 items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                    <Package size={14} className="text-zinc-400 group-hover/item:text-purple-500" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400">
                                      {prod.nome}
                                    </p>
                                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                      SKU: {prod.sku || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 pl-2">
                                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.preco_venda || 0)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center align-top pt-4">
                      <input 
                        type="number" min="1" placeholder="1"
                        value={item.quantidade} onChange={(e) => editarItemKit(index, 'quantidade', parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all text-center shadow-sm font-bold"
                      />
                    </td>
                    <td className="p-3 text-right align-top pt-4">
                      <input 
                        type="number" step="0.01" placeholder="0.00"
                        value={item.preco_unitario} onChange={(e) => editarItemKit(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all text-right shadow-sm font-bold"
                      />
                    </td>
                    <td className="p-3 text-right font-black text-zinc-900 dark:text-zinc-200 transition-colors align-top pt-6">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(item.quantidade) || 0) * (Number(item.preco_unitario) || 0))}
                    </td>
                    <td className="p-3 text-center align-top pt-4">
                      <button 
                        onClick={() => removerItemKit(index)} 
                        className="p-2.5 text-zinc-400 dark:text-zinc-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                        title="Remover Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {/* LINHA DE TOTAIS E BOTÃO DE ADICIONAR */}
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
                <td className="p-4" colSpan="2">
                   <button 
                      onClick={adicionarItemKit}
                      className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-600/30 px-4 py-2.5 rounded-lg transition-colors shadow-sm w-fit"
                    >
                      <Plus size={16} /> Linha de Produto
                    </button>
                </td>
                <td className="p-4 text-right text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px] transition-colors">
                  Custo Total do Kit:
                </td>
                <td className="p-4 text-right text-xl font-black text-emerald-600 dark:text-emerald-400 transition-colors">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularTotalKit())}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}