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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Box className="text-purple-500" size={20} /> Composição do Kit
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Pesquise e adicione produtos que farão parte deste kit.</p>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3">Produto / Código (SKU)</th>
                <th className="px-4 py-3 w-32 text-center">Qtd</th>
                <th className="px-4 py-3 w-40 text-right">Preço Un. / Custo</th>
                <th className="px-4 py-3 w-40 text-right">Preço Total</th>
                <th className="px-4 py-3 w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {produto.composicao_kit.map((item, index) => (
                <tr key={index} className="hover:bg-zinc-800/20">
                  <td className="p-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text" placeholder="Buscar produto..."
                        value={item.nome_sku} onChange={(e) => editarItemKit(index, 'nome_sku', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 pl-9 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
                      />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <input 
                      type="number" min="1" placeholder="1"
                      value={item.quantidade} onChange={(e) => editarItemKit(index, 'quantidade', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all text-center"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <input 
                      type="number" step="0.01" placeholder="0.00"
                      value={item.preco_unitario} onChange={(e) => editarItemKit(index, 'preco_unitario', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all text-right"
                    />
                  </td>
                  <td className="p-3 text-right font-bold text-zinc-200">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantidade * item.preco_unitario)}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removerItemKit(index)} className="p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* LINHA DE TOTAIS E BOTÃO DE ADICIONAR */}
              <tr className="bg-zinc-900/50">
                <td className="p-4" colSpan="2">
                   <button 
                      onClick={adicionarItemKit}
                      className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold text-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar produto no kit
                    </button>
                </td>
                <td className="p-4 text-right text-zinc-400 font-medium">Custo Total:</td>
                <td className="p-4 text-right text-lg font-black text-emerald-400">
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