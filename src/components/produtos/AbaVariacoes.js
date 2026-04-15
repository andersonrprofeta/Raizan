import { Layers, Plus, Trash2, Image as ImageIcon, Settings2 } from "lucide-react";

export default function AbaVariacoes({ produto, atualizarCampo }) {
  
  const adicionarVariacao = () => {
    const novasVariacoes = [...produto.variacoes, { nome: "", sku: "", preco: produto.precos.venda || "", estoque: 0 }];
    atualizarCampo('variacoes', novasVariacoes);
  };

  const editarVariacao = (index, campo, valor) => {
    const novasVariacoes = [...produto.variacoes];
    novasVariacoes[index][campo] = valor;
    atualizarCampo('variacoes', novasVariacoes);
  };

  const removerVariacao = (index) => {
    const novasVariacoes = produto.variacoes.filter((_, i) => i !== index);
    atualizarCampo('variacoes', novasVariacoes);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="text-purple-500" size={20} /> Grade de Variações
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Atribua imagens, SKUs, preços e estoques específicos para cada variação.</p>
          </div>
          <button 
            onClick={adicionarVariacao}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Plus size={16} /> Adicionar Variação
          </button>
        </div>

        {/* TABELA DE VARIAÇÕES */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Foto</th>
                <th className="px-4 py-3">Nome da Variação (Ex: Cor e Tamanho)</th>
                <th className="px-4 py-3 w-40">Código (SKU)</th>
                <th className="px-4 py-3 w-32">Preço (R$)</th>
                <th className="px-4 py-3 w-28">Estoque</th>
                <th className="px-4 py-3 w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {produto.variacoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-zinc-500">
                    <Settings2 size={32} className="mx-auto mb-3 opacity-20" />
                    Nenhuma variação cadastrada. Clique no botão roxo acima para criar.
                  </td>
                </tr>
              ) : (
                produto.variacoes.map((varItem, index) => (
                  <tr key={index} className="hover:bg-zinc-800/20 group">
                    <td className="p-3 text-center">
                      <button className="w-10 h-10 bg-zinc-950 border border-zinc-700 hover:border-purple-500 rounded-lg flex items-center justify-center text-zinc-500 hover:text-purple-400 transition-all cursor-pointer">
                        <ImageIcon size={16} />
                      </button>
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" placeholder="Ex: Vermelho - M"
                        value={varItem.nome} onChange={(e) => editarVariacao(index, 'nome', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" placeholder="Ex: NIK-VER-M"
                        value={varItem.sku} onChange={(e) => editarVariacao(index, 'sku', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all font-mono text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" step="0.01" placeholder="0.00"
                        value={varItem.preco} onChange={(e) => editarVariacao(index, 'preco', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" placeholder="0"
                        value={varItem.estoque} onChange={(e) => editarVariacao(index, 'estoque', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => removerVariacao(index)}
                        className="p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors"
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