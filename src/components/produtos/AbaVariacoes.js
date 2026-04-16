import { Layers, Plus, Trash2, Image as ImageIcon, Settings2 } from "lucide-react";

export default function AbaVariacoes({ produto, atualizarCampo }) {
  
  const adicionarVariacao = () => {
    const novasVariacoes = [...produto.variacoes, { nome: "", sku: "", preco: produto.precos.venda || "", estoque: 0 }];
    atualizarCampo('variacoes', novasVariacoes);
  };

  const editarVariacao = (index, campo, valor) => {
    const novasVariacoes = [...produto.variacoes];
    novosVariacoes[index][campo] = valor;
    atualizarCampo('variacoes', novasVariacoes);
  };

  const removerVariacao = (index) => {
    const novasVariacoes = produto.variacoes.filter((_, i) => i !== index);
    atualizarCampo('variacoes', novasVariacoes);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 transition-colors">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
              <Layers className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Grade de Variações
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1 transition-colors">Atribua imagens, SKUs, preços e estoques específicos para cada variação.</p>
          </div>
          <button 
            onClick={adicionarVariacao}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-purple-500/20 dark:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
          >
            <Plus size={16} /> Adicionar Variação
          </button>
        </div>

        {/* TABELA DE VARIAÇÕES */}
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto custom-scrollbar shadow-sm dark:shadow-none transition-colors">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 transition-colors">
              <tr>
                <th className="px-5 py-4 w-16 text-center uppercase tracking-wider text-[11px]">Foto</th>
                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Nome da Variação (Ex: Cor e Tamanho)</th>
                <th className="px-5 py-4 w-40 uppercase tracking-wider text-[11px]">Código (SKU)</th>
                <th className="px-5 py-4 w-32 uppercase tracking-wider text-[11px]">Preço (R$)</th>
                <th className="px-5 py-4 w-28 uppercase tracking-wider text-[11px]">Estoque</th>
                <th className="px-5 py-4 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 transition-colors">
              {produto.variacoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-zinc-500 font-medium">
                    <Settings2 size={32} className="mx-auto mb-3 opacity-20 text-zinc-400 dark:text-zinc-600" />
                    Nenhuma variação cadastrada. Clique no botão roxo acima para criar.
                  </td>
                </tr>
              ) : (
                produto.variacoes.map((varItem, index) => (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 group transition-colors">
                    <td className="p-3 text-center">
                      <button className="w-12 h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-500 rounded-xl flex items-center justify-center text-zinc-400 hover:text-purple-600 dark:text-zinc-500 dark:hover:text-purple-400 transition-all cursor-pointer shadow-sm dark:shadow-none hover:shadow-md">
                        <ImageIcon size={18} />
                      </button>
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" placeholder="Ex: Vermelho - M"
                        value={varItem.nome} onChange={(e) => editarVariacao(index, 'nome', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" placeholder="Ex: NIK-VER-M"
                        value={varItem.sku} onChange={(e) => editarVariacao(index, 'sku', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all font-mono font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" step="0.01" placeholder="0.00"
                        value={varItem.preco} onChange={(e) => editarVariacao(index, 'preco', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" placeholder="0"
                        value={varItem.estoque} onChange={(e) => editarVariacao(index, 'estoque', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold text-center"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => removerVariacao(index)}
                        className="p-2.5 text-zinc-400 dark:text-zinc-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                        title="Remover Variação"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}