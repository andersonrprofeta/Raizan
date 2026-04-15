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
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <AlignLeft className="text-purple-500" size={20} /> Resumo do Produto (WooCommerce)
        </h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Breve Descrição</label>
          <textarea 
            rows="3"
            placeholder="Aquele resumo rápido que aparece logo ao lado da foto do produto no site..."
            value={produto.ficha_tecnica.breve_descricao}
            onChange={(e) => atualizarCampo('ficha_tecnica', 'breve_descricao', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y"
          ></textarea>
          <p className="text-[11px] text-zinc-500">No WooCommerce, este é o campo "Short Description".</p>
        </div>
      </section>

      {/* SESSÃO 2: COMPOSIÇÃO E FÓRMULA */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Beaker className="text-purple-500" size={20} /> Composição & Fórmula
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Material ou Composição</label>
            <textarea 
              rows="3" placeholder="Ex: 100% Algodão, ou Plástico ABS Resistente..."
              value={produto.ficha_tecnica.composicao}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'composicao', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y"
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Fórmula / Princípio Ativo</label>
            <textarea 
              rows="3" placeholder="Ex: Ácido Hialurônico, Vitamina C, Sem Parabenos..."
              value={produto.ficha_tecnica.formula}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'formula', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y"
            ></textarea>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Cuidados e Instruções</label>
            <input 
              type="text" placeholder="Ex: Lavar à máquina com água fria. Não usar alvejante."
              value={produto.ficha_tecnica.cuidados}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'cuidados', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* SESSÃO 3: ATRIBUTOS DINÂMICOS (O Matador do Tiny) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <List className="text-purple-500" size={20} /> Atributos Técnicos (Customizável)
            </h2>
            <button 
                onClick={adicionarAtributo}
                className="flex items-center gap-1.5 text-xs font-bold bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-3 py-1.5 rounded-lg transition-colors"
            >
                <Plus size={14} /> Adicionar Linha
            </button>
        </div>
        <p className="text-xs text-zinc-400 -mt-2">Crie especificações sob medida (Ex: Voltagem, Potência, Tipo de Pele, Sabor).</p>

        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-zinc-400 font-medium border-b border-zinc-800">
                    <tr>
                        <th className="px-4 py-3 w-1/3">Nome do Atributo</th>
                        <th className="px-4 py-3">Valor da Especificação</th>
                        <th className="px-4 py-3 w-12 text-center"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {produto.ficha_tecnica.atributos.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-zinc-500">
                                Nenhum atributo extra adicionado. Clique no botão acima para adicionar.
                            </td>
                        </tr>
                    ) : (
                        produto.ficha_tecnica.atributos.map((attr, index) => (
                            <tr key={index} className="hover:bg-zinc-800/20">
                                <td className="p-2">
                                    <input 
                                        type="text" placeholder="Ex: Voltagem"
                                        value={attr.nome}
                                        onChange={(e) => editarAtributo(index, 'nome', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
                                    />
                                </td>
                                <td className="p-2">
                                    <input 
                                        type="text" placeholder="Ex: 110V / 220V (Bivolt)"
                                        value={attr.valor}
                                        onChange={(e) => editarAtributo(index, 'valor', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button 
                                        onClick={() => removerAtributo(index)}
                                        className="p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors"
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
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
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <ShieldAlert className="text-purple-500" size={20} /> Garantia
        </h2>
        
        <div className="space-y-2 md:w-1/2">
            <input 
              type="text" placeholder="Ex: 3 meses contra defeitos de fabricação..."
              value={produto.ficha_tecnica.garantia}
              onChange={(e) => atualizarCampo('ficha_tecnica', 'garantia', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
        </div>
      </section>

    </div>
  );
}