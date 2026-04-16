import { ClipboardList, Beaker, ShieldAlert, List, Plus, Trash2, AlignLeft } from "lucide-react";

export default function AbaFichaTecnica({ produto, atualizarCampo }) {
  
  // Função para adicionar um novo atributo dinâmico na tabela
  const adicionarAtributo = () => {
    const novosAtributos = [...produto.ficha_tecnica.atributos, { nome: "", valor: "" }];
    atualizarCampo('ficha_tecnica', 'atributos', novosAtributos);
  };

  // Função para editar um atributo existente
  const editarAtributo = (index, campo, valor) => {
    const novosAtributos = [...produto.ficha_tecnica.atributos];
    novosAtributos[index][campo] = valor;
    atualizarCampo('ficha_tecnica', 'atributos', novosAtributos);
  };

  // Função para remover um atributo
  const removerAtributo = (index) => {
    const novosAtributos = produto.ficha_tecnica.atributos.filter((_, i) => i !== index);
    atualizarCampo('ficha_tecnica', 'atributos', novosAtributos);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* SESSÃO 1: RESUMO WOOCOMMERCE */}
      <section className="space-y-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <AlignLeft className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Resumo do Produto (WooCommerce)
        </h2>
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Breve Descrição</label>
          <textarea 
            rows="3"
            placeholder="Aquele resumo rápido que aparece logo ao lado da foto do produto no site..."
            value={produto.ficha_tecnica.breve_descricao}
            onChange={(e) => atualizarCampo('ficha_tecnica', 'breve_descricao', e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
          ></textarea>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">No WooCommerce, este é o campo "Short Description".</p>
        </div>
      </section>

      {/* SESSÃO 2: COMPOSIÇÃO E FÓRMULA */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <Beaker className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Composição & Fórmula
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Material ou Composição</label>
            <textarea 
              rows="3" placeholder="Ex: 100% Algodão, ou Plástico ABS Resistente..."
              value={produto.ficha_tecnica.composicao}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'composicao', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Fórmula / Princípio Ativo</label>
            <textarea 
              rows="3" placeholder="Ex: Ácido Hialurônico, Vitamina C, Sem Parabenos..."
              value={produto.ficha_tecnica.formula}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'formula', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            ></textarea>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Cuidados e Instruções</label>
            <input 
              type="text" placeholder="Ex: Lavar à máquina com água fria. Não usar alvejante."
              value={produto.ficha_tecnica.cuidados}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'cuidados', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>
        </div>
      </section>

      {/* SESSÃO 3: ATRIBUTOS DINÂMICOS (O Matador do Tiny) */}
      <section className="space-y-5 mt-10">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
            <List className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Atributos Técnicos (Customizável)
            </h2>
            <button 
                onClick={adicionarAtributo}
                className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-600/30 px-4 py-2 rounded-lg transition-colors shadow-sm dark:shadow-none"
            >
                <Plus size={14} /> Adicionar Linha
            </button>
        </div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 -mt-2 transition-colors">Crie especificações sob medida (Ex: Voltagem, Potência, Tipo de Pele, Sabor).</p>

        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 transition-colors">
                    <tr>
                        <th className="px-5 py-4 w-1/3 uppercase tracking-wider text-[11px]">Nome do Atributo</th>
                        <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Valor da Especificação</th>
                        <th className="px-5 py-4 w-12 text-center"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 transition-colors">
                    {produto.ficha_tecnica.atributos.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="px-5 py-10 text-center text-zinc-500 font-medium">
                                Nenhum atributo extra adicionado. Clique no botão acima para adicionar.
                            </td>
                        </tr>
                    ) : (
                        produto.ficha_tecnica.atributos.map((attr, index) => (
                            <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                                <td className="p-3">
                                    <input 
                                        type="text" placeholder="Ex: Voltagem"
                                        value={attr.nome}
                                        onChange={(e) => editarAtributo(index, 'nome', e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                                    />
                                </td>
                                <td className="p-3">
                                    <input 
                                        type="text" placeholder="Ex: 110V / 220V (Bivolt)"
                                        value={attr.valor}
                                        onChange={(e) => editarAtributo(index, 'valor', e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => removerAtributo(index)}
                                        className="p-2.5 text-zinc-400 dark:text-zinc-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                                        title="Remover"
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

      {/* SESSÃO 4: GARANTIA */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <ShieldAlert className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Garantia
        </h2>
        
        <div className="space-y-2 md:w-1/2">
            <input 
              type="text" placeholder="Ex: 3 meses contra defeitos de fabricação..."
              value={produto.ficha_tecnica.garantia}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'garantia', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
        </div>
      </section>

    </div>
  );
}