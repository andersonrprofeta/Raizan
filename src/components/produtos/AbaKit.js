import { Box, Plus, Trash2, Search } from "lucide-react";

export default function AbaKit({ produto, atualizarCampo }) {
  
  const adicionarItemKit = () => {
    const novosItens = [...produto.composicao_kit, { nome_sku: "", quantidade: 1, preco_unitario: 0 }];
    atualizarCampo('composicao_kit', novosItens);
  };

  const editarItemKit = (index, campo, valor) => {
    const novosItens = [...produto.composicao_kit];
    novosItens[index][campo] = valor;
    atualizarCampo('composicao_kit', novosItens);
  };

  const removerItemKit = (index) => {
    const novosItens = produto.composicao_kit.filter((_, i) => i !== index);
    atualizarCampo('composicao_kit', novosItens);
  };

  const calcularTotalKit = () => {
    return produto.composicao_kit.reduce((total, item) => total + (item.quantidade * item.preco_unitario), 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 transition-colors">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
              <Box className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Composição do Kit
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Pesquise e adicione produtos que farão parte deste kit.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto custom-scrollbar shadow-sm dark:shadow-none transition-colors">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 transition-colors">
              <tr>
                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Produto / Código (SKU)</th>
                <th className="px-5 py-4 w-32 text-center uppercase tracking-wider text-[11px]">Qtd</th>
                <th className="px-5 py-4 w-40 text-right uppercase tracking-wider text-[11px]">Preço Un. / Custo</th>
                <th className="px-5 py-4 w-40 text-right uppercase tracking-wider text-[11px]">Preço Total</th>
                <th className="px-5 py-4 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 transition-colors">
              {produto.composicao_kit.map((item, index) => (
                <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <td className="p-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors" />
                      <input 
                        type="text" placeholder="Buscar produto..."
                        value={item.nome_sku} onChange={(e) => editarItemKit(index, 'nome_sku', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pl-9 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <input 
                      type="number" min="1" placeholder="1"
                      value={item.quantidade} onChange={(e) => editarItemKit(index, 'quantidade', parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all text-center placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <input 
                      type="number" step="0.01" placeholder="0.00"
                      value={item.preco_unitario} onChange={(e) => editarItemKit(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all text-right placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
                    />
                  </td>
                  <td className="p-3 text-right font-black text-zinc-900 dark:text-zinc-200 transition-colors">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantidade * item.preco_unitario)}
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => removerItemKit(index)} 
                      className="p-2.5 text-zinc-400 dark:text-zinc-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      title="Remover Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* LINHA DE TOTAIS E BOTÃO DE ADICIONAR */}
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
                <td className="p-4" colSpan="2">
                   <button 
                      onClick={adicionarItemKit}
                      className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-600/30 px-4 py-2.5 rounded-lg transition-colors shadow-sm dark:shadow-none w-fit"
                    >
                      <Plus size={16} /> Adicionar produto no kit
                    </button>
                </td>
                <td className="p-4 text-right text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px] transition-colors">
                  Custo Total:
                </td>
                <td className="p-4 text-right text-lg font-black text-emerald-600 dark:text-emerald-400 transition-colors">
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