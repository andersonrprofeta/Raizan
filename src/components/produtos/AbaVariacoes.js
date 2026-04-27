"use client";

import { useState, useEffect } from "react";
import { Layers, Plus, Trash2, Image as ImageIcon, Settings2, Palette, Type, X, Hash, Repeat } from "lucide-react";
import toast from "react-hot-toast";

export default function AbaVariacoes({ produto, atualizarCampo }) {
  
  // ==========================================
  // 🧠 ESTADOS E MEMÓRIA
  // ==========================================
  const atributosBrutos = Array.isArray(produto?.ficha_tecnica?.atributos) ? produto.ficha_tecnica.atributos : [];
  const atributosLimpos = atributosBrutos.map(attr => ({
    ...attr,
    termos: Array.isArray(attr?.termos) ? attr.termos : [] 
  }));

  const [atributos, setAtributos] = useState(atributosLimpos.length > 0 ? atributosLimpos : [
    { id: "attr_inicial", nome: "Cor", tipo: "color", termos: [] }
  ]);

  const [variacoes, setVariacoes] = useState(Array.isArray(produto?.variacoes) ? produto.variacoes : []);
  const [inputsTermos, setInputsTermos] = useState({});

  // 🟢 NOVO: Rastreador de alterações para o aviso de saída!
  const [teveAlteracao, setTeveAlteracao] = useState(false); 

  // ==========================================
  // 🛡️ TRAVA DE SEGURANÇA (FECHAR ABA / F5)
  // ==========================================
  useEffect(() => {
    if (!teveAlteracao) return;

    const avisarAntesDeSair = (e) => {
      e.preventDefault();
      e.returnValue = "Atenção: Você tem alterações na grade de variações que não foram salvas. Se sair agora, perderá o trabalho. Deseja sair?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", avisarAntesDeSair);
    return () => window.removeEventListener("beforeunload", avisarAntesDeSair);
  }, [teveAlteracao]);

  // ==========================================
  // 🔄 SINCRONIZADORES E CONVERSÃO
  // ==========================================
  const salvarAtributos = (novaLista) => {
    setAtributos(novaLista);
    atualizarCampo('ficha_tecnica', { ...(produto?.ficha_tecnica || {}), atributos: novaLista });
    setTeveAlteracao(true); // Marca que o usuário mexeu
  };

  const salvarVariacoes = (novaLista) => {
    setVariacoes(novaLista);
    // 🟢 CORREÇÃO DO BUG: Atualizamos APENAS a variação aqui. O React parou de bater cabeça!
    atualizarCampo('variacoes', novaLista);
    setTeveAlteracao(true); // Marca que o usuário mexeu
  };

  const converterParaSimples = () => {
    const estoqueTotal = variacoes.reduce((acc, curr) => acc + (Number(curr.estoque) || 0), 0);
    
    // 🟢 CORREÇÃO DO BUG: Criamos uma fila organizada (Cascata) com pequenos delays 
    // para evitar a "Condição de Corrida" no estado da tela principal.
    if (produto?.estoque) {
      atualizarCampo('estoque', { ...produto.estoque, inicial: estoqueTotal });
    }

    setTimeout(() => {
      setVariacoes([]);
      atualizarCampo('variacoes', []);
    }, 50);

    setTimeout(() => {
      setAtributos([]);
      atualizarCampo('ficha_tecnica', { ...(produto?.ficha_tecnica || {}), atributos: [] });
    }, 100);

    setTimeout(() => {
      if (produto?.basico) atualizarCampo('basico', { ...produto.basico, tipo_produto: 'simples' });
      else atualizarCampo('tipo_produto', 'simples'); 
    }, 150);

    setTeveAlteracao(true);
    toast.success("Convertido para Produto Simples! Estoque consolidado.", { icon: "🧹" });
  };

  // ==========================================
  // ⚙️ MOTOR DE ATRIBUTOS
  // ==========================================
  const adicionarAtributo = () => salvarAtributos([...atributos, { id: Date.now().toString(), nome: "", tipo: "label", termos: [] }]);
  const removerAtributo = (id) => salvarAtributos(atributos.filter(a => a.id !== id));
  const atualizarAtributo = (id, campo, valor) => salvarAtributos(atributos.map(a => a.id === id ? { ...a, [campo]: valor } : a));

  const atualizarInputTermo = (attrId, campo, valor) => {
    setInputsTermos(prev => ({ ...prev, [attrId]: { ...prev[attrId], [campo]: valor } }));
  };

  const atualizarValorDoTermoExistente = (attrId, termoNome, novoValor) => {
    salvarAtributos(atributos.map(attr => {
      if (attr.id === attrId) {
        return { 
          ...attr, 
          termos: (Array.isArray(attr.termos) ? attr.termos : []).map(t => 
            t.nome === termoNome ? { ...t, valor: novoValor } : t
          )
        };
      }
      return attr;
    }));
  };

  const adicionarTermo = (attrId, tipo) => {
    const termoAtual = inputsTermos[attrId];
    const termoDigitado = termoAtual?.nome?.trim();
    
    if (!termoDigitado) return;

    const novaLista = atributos.map(attr => {
      if (attr.id === attrId) {
        const termosAtuais = Array.isArray(attr.termos) ? attr.termos : [];
        if (termosAtuais.some(t => t.nome.toLowerCase() === termoDigitado.toLowerCase())) {
          toast.error(`O termo "${termoDigitado}" já existe!`);
          return attr;
        }
        const novoObjTermo = {
          nome: termoDigitado,
          valor: tipo === 'color' ? (termoAtual?.valor || '#9333EA') : (tipo === 'image' ? '' : termoDigitado)
        };
        return { ...attr, termos: [...termosAtuais, novoObjTermo] };
      }
      return attr;
    });

    salvarAtributos(novaLista);
    atualizarInputTermo(attrId, 'nome', ""); 
  };

  const removerTermo = (attrId, termoNome) => {
    salvarAtributos(atributos.map(attr => {
      if (attr.id === attrId) {
        return { ...attr, termos: (Array.isArray(attr.termos) ? attr.termos : []).filter(t => t.nome !== termoNome) };
      }
      return attr;
    }));
  };

  // ==========================================
  // 🪄 GERADOR MATEMÁTICO & SKUS
  // ==========================================
  const gerarGrade = () => {
    const atributosValidos = atributos.filter(a => a.nome.trim() !== "" && Array.isArray(a.termos) && a.termos.length > 0);
    
    if (atributosValidos.length === 0) {
      toast.error("Adicione os atributos e termos antes de gerar a grade.");
      return;
    }

    const combinacoes = atributosValidos.reduce((acc, curr) => {
      if (acc.length === 0) return curr.termos.map(t => ({ [curr.nome]: t.nome }));
      const temp = [];
      acc.forEach(comboExistente => {
        curr.termos.forEach(termo => temp.push({ ...comboExistente, [curr.nome]: termo.nome }));
      });
      return temp;
    }, []);

    const skuPai = produto?.basico?.sku || produto?.sku || "SKU";
    
    let maxSkuIndex = 0;
    variacoes.forEach(v => {
      if (v.sku) {
        const parts = v.sku.split('-');
        const num = parseInt(parts[parts.length - 1]);
        if (!isNaN(num) && num > maxSkuIndex) maxSkuIndex = num;
      }
    });
    
    let contadorSku = maxSkuIndex + 1;

    const novasVariacoes = combinacoes.map(combo => {
      const nomeCombo = Object.entries(combo).map(([_, value]) => `${value}`).join(" - ");
      
      const existente = variacoes.find(v => v.nome === nomeCombo);
      if (existente) return existente;

      return {
        nome: nomeCombo,
        sku: `${skuPai}-${contadorSku++}`,
        preco: produto?.precos?.venda || "",
        estoque: 0,
        imagem_variacao: "" 
      };
    });

    salvarVariacoes(novasVariacoes);
    toast.success(`Grade Matemática Atualizada com Sucesso!`);
  };

  const editarEstoqueVariacao = (index, campo, valor) => {
    const novas = [...variacoes];
    novas[index][campo] = valor;
    salvarVariacoes(novas);
  };

  const removerLinhaEstoque = (index) => salvarVariacoes(variacoes.filter((_, i) => i !== index));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 🟣 SEÇÃO 1: CONFIGURAÇÃO DE ATRIBUTOS */}
      <section className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="text-purple-600 dark:text-purple-500" size={20} /> Atributos e Termos
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
              Crie as opções (Cor, Tamanho) e defina como os botões vão aparecer no seu site.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {variacoes.length > 0 && (
              <button onClick={converterParaSimples} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl font-bold transition-all text-sm shrink-0 border border-rose-200 dark:border-rose-800">
                <Repeat size={16} /> Limpar e Voltar para Simples
              </button>
            )}
            <button onClick={adicionarAtributo} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl font-bold transition-all text-sm shrink-0">
              <Plus size={16} /> Novo Atributo
            </button>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          {atributos.map((attr) => {
            const termosSeguros = Array.isArray(attr.termos) ? attr.termos : [];
            const termoAtualInput = inputsTermos[attr.id] || {};

            return (
            <div key={attr.id} className="p-5 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl relative group shadow-sm">
              
              <button onClick={() => removerAtributo(attr.id)} className="absolute -top-3 -right-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-rose-500 hover:bg-rose-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                <X size={14} strokeWidth={3} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Nome do Atributo</label>
                  <input 
                    type="text" value={attr.nome} onChange={(e) => atualizarAtributo(attr.id, 'nome', e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all shadow-sm font-semibold"
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Tipo no Site</label>
                  <div className="relative">
                    <select 
                      value={attr.tipo} onChange={(e) => atualizarAtributo(attr.id, 'tipo', e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 pl-10 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all shadow-sm appearance-none font-semibold cursor-pointer"
                    >
                      <option value="label">Label (Botão de Texto)</option>
                      <option value="color">Color (Seletor de Cor)</option>
                      <option value="image">Image (Miniatura/Textura)</option>
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      {attr.tipo === 'label' && <Type size={16} />}
                      {attr.tipo === 'color' && <Palette size={16} />}
                      {attr.tipo === 'image' && <ImageIcon size={16} />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 block">Termos deste Atributo</label>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {attr.tipo === 'color' && (
                    <div className="relative w-10 h-10 rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden shrink-0 cursor-pointer shadow-sm">
                      <input 
                        type="color" 
                        value={termoAtualInput.valor || '#9333EA'} 
                        onChange={(e) => atualizarInputTermo(attr.id, 'valor', e.target.value)}
                        className="absolute -inset-4 w-20 h-20 cursor-pointer"
                      />
                    </div>
                  )}

                  {attr.tipo === 'image' && (
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 shrink-0">
                      <ImageIcon size={16} />
                    </div>
                  )}

                  <input 
                    type="text" 
                    placeholder="Adicionar novo termo..."
                    value={termoAtualInput.nome || ""} 
                    onChange={(e) => atualizarInputTermo(attr.id, 'nome', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && adicionarTermo(attr.id, attr.tipo)}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none min-w-[200px]"
                  />
                  <button 
                    onClick={() => adicionarTermo(attr.id, attr.tipo)}
                    className="bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2.5 rounded-xl font-bold transition-all text-sm shrink-0"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {termosSeguros.length === 0 ? (
                    <span className="text-sm text-zinc-400 dark:text-zinc-600 italic">Nenhum termo cadastrado ainda.</span>
                  ) : (
                    termosSeguros.map((termo, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-2 pr-1 py-1 rounded-full shadow-sm group">
                        
                        {/* 🟢 SE FOR COR: Input Editável */}
                        {attr.tipo === 'color' && (
                          <div className="relative w-4 h-4 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shrink-0 cursor-pointer" title="Clique para alterar a cor">
                            <input 
                              type="color" 
                              value={termo.valor && termo.valor.startsWith('#') ? termo.valor : '#000000'} 
                              onChange={(e) => atualizarValorDoTermoExistente(attr.id, termo.nome, e.target.value)}
                              className="absolute -inset-4 w-10 h-10 cursor-pointer"
                            />
                          </div>
                        )}

                        {/* 🟢 SE FOR IMAGEM: Upload REAL para Miniatura/Textura */}
                        {attr.tipo === 'image' && (
                          <label className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-purple-500 hover:bg-purple-100 cursor-pointer overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-sm" title="Subir Textura">
                            <input 
                              type="file" accept="image/*" className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if(file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => atualizarValorDoTermoExistente(attr.id, termo.nome, reader.result);
                                  reader.readAsDataURL(file);
                                }
                              }} 
                            />
                            {termo.valor && termo.valor.startsWith('data:image') ? (
                              <img src={termo.valor} alt={termo.nome} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={12} />
                            )}
                          </label>
                        )}
                        
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pl-1">{termo.nome}</span>
                        <button onClick={() => removerTermo(attr.id, termo.nome)} className="w-6 h-6 rounded-full hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-zinc-400 transition-colors ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )})}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={gerarGrade} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25 active:scale-95">
            <Settings2 size={18} /> Gerar Variações de Estoque
          </button>
        </div>
      </section>

      {/* 🟣 SEÇÃO 2: TABELA DE ESTOQUE E SKUS */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 px-1">
          <Hash className="text-zinc-400" size={20} /> Estoque e SKUs
        </h2>

        <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-x-auto custom-scrollbar shadow-sm">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-4 w-12 text-center"></th>
                <th className="px-5 py-4 w-28 text-center uppercase tracking-wider text-[11px]">Foto da Variação</th>
                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Variação Cruzada</th>
                <th className="px-5 py-4 w-40 uppercase tracking-wider text-[11px]">Código (SKU)</th>
                <th className="px-5 py-4 w-32 uppercase tracking-wider text-[11px]">Preço (R$)</th>
                <th className="px-5 py-4 w-28 uppercase tracking-wider text-[11px]">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {variacoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-16 text-center text-zinc-500 font-medium bg-zinc-50/50 dark:bg-zinc-950/50">
                    <div className="w-16 h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Settings2 size={24} className="text-zinc-400 dark:text-zinc-600" />
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 font-bold mb-1">Grade Vazia</p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">Configure os atributos acima e clique em "Gerar Variações".</p>
                  </td>
                </tr>
              ) : (
                variacoes.map((varItem, index) => (
                  <tr key={index} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-colors">
                    
                    <td className="p-3 text-center align-middle">
                      <button onClick={() => removerLinhaEstoque(index)} className="p-2 text-zinc-400 hover:bg-rose-100 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>

                    <td className="p-3 text-center align-middle">
                      <label className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-purple-500 rounded-xl flex items-center justify-center text-zinc-400 hover:text-purple-500 transition-all mx-auto group relative cursor-pointer overflow-hidden shadow-sm">
                        <input 
                          type="file" accept="image/*" className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if(file){
                              const reader = new FileReader();
                              reader.onloadend = () => editarEstoqueVariacao(index, 'imagem_variacao', reader.result);
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                        {varItem.imagem_variacao && varItem.imagem_variacao.startsWith('data:image') ? (
                          <img src={varItem.imagem_variacao} alt="Variação" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} />
                        )}
                        {!varItem.imagem_variacao && (
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                            Subir Foto
                          </span>
                        )}
                      </label>
                    </td>

                    <td className="p-3 align-middle font-bold text-zinc-800 dark:text-zinc-200">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {varItem.nome.split('-').map((parteCrua, i) => {
                          const parte = parteCrua.trim();
                          let corHex = null;
                          let imgUrl = null;

                          atributos.forEach(a => {
                            const termoEncontrado = (Array.isArray(a.termos) ? a.termos : []).find(t => t.nome.trim().toLowerCase() === parte.toLowerCase());
                            if (termoEncontrado) {
                              if (a.tipo === 'color') corHex = termoEncontrado.valor;
                              if (a.tipo === 'image') imgUrl = termoEncontrado.valor;
                            }
                          });

                          return (
                            <span key={i} className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-md text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm">
                              {corHex && (
                                <span className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: corHex }}></span>
                              )}
                              {imgUrl && imgUrl.startsWith('data:image') && (
                                <img src={imgUrl} alt={parte} className="w-3 h-3 rounded-full object-cover border border-black/10 dark:border-white/10" />
                              )}
                              {parte}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    
                    <td className="p-3 align-middle">
                      <input 
                        type="text" placeholder="SKU" value={varItem.sku} onChange={(e) => editarEstoqueVariacao(index, 'sku', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all font-mono font-bold shadow-sm" 
                      />
                    </td>
                    
                    <td className="p-3 align-middle">
                      <input 
                        type="number" step="0.01" placeholder="0.00" value={varItem.preco} onChange={(e) => editarEstoqueVariacao(index, 'preco', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all shadow-sm font-bold" 
                      />
                    </td>
                    
                    <td className="p-3 align-middle">
                      <input 
                        type="number" placeholder="0" value={varItem.estoque} onChange={(e) => editarEstoqueVariacao(index, 'estoque', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all shadow-sm font-bold text-center" 
                      />
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