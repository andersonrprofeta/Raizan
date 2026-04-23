"use client";

import { useState, useEffect } from "react";
import { FolderTree, AlignLeft, Image as ImageIcon, Link2, Search, Type, Hash, ChevronDown, Tag } from "lucide-react";
import UploaderImagens from "./UploaderImagens";

export default function AbaComplementar({ produto, atualizarCampo, setProduto, isEditMode }) {
  const [categorias, setCategorias] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  
  // 🟢 NOVOS ESTADOS PARA MARCAS
  const [marcas, setMarcas] = useState([]);
  const [carregandoMarcas, setCarregandoMarcas] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      // Busca Categorias
      try {
        const resCat = await fetch("https://api.raizan.com.br/api/hub/categorias");
        const dataCat = await resCat.json();
        if (dataCat.success) setCategorias(dataCat.categorias);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      } finally {
        setCarregandoCategorias(false);
      }

      // Busca Marcas
      try {
        const resMarca = await fetch("https://api.raizan.com.br/api/hub/marcas");
        const dataMarca = await resMarca.json();
        if (dataMarca.success) setMarcas(dataMarca.marcas);
      } catch (error) {
        console.error("Erro ao buscar marcas:", error);
      } finally {
        setCarregandoMarcas(false);
      }
    };

    buscarDados();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* SESSÃO 1: CATEGORIZAÇÃO */}
      <section className="space-y-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <FolderTree className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Categorização
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
               <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Categoria Oficial</label>
               {produto.complementares.categoria && (
                 <button onClick={() => atualizarCampo('complementares', 'categoria', '')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">remover</button>
               )}
            </div>
            
            <div className="relative">
              <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors pointer-events-none" size={16} />
              
              <select 
                value={produto.complementares.categoria}
                onChange={(e) => atualizarCampo('complementares', 'categoria', e.target.value)}
                disabled={carregandoCategorias}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pl-10 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer appearance-none shadow-sm dark:shadow-none disabled:opacity-50"
              >
                <option value="">
                  {carregandoCategorias ? "Carregando categorias..." : "Selecione uma categoria da sua árvore..."}
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                ))}
              </select>
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                <ChevronDown size={16} />
              </div>
            </div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">
              Mantenha o padrão de dados selecionando categorias previamente cadastradas no sistema.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Marca Oficial</label>
              {produto.complementares.marca && (
                 <button onClick={() => atualizarCampo('complementares', 'marca', '')} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">remover</button>
               )}
            </div>
            
            {/* 🟢 O NOVO DROPDOWN DE MARCAS */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 transition-colors pointer-events-none" size={16} />
              <select 
                value={produto.complementares.marca}
                onChange={(e) => atualizarCampo('complementares', 'marca', e.target.value)}
                disabled={carregandoMarcas}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pl-10 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer appearance-none shadow-sm dark:shadow-none disabled:opacity-50"
              >
                <option value="">
                  {carregandoMarcas ? "Carregando marcas..." : "Selecione a marca..."}
                </option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.nome}>{marca.nome}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Tabela de medidas</label>
            <input 
              type="text" placeholder="Pesquise pelo nome da tabela"
              value={produto.complementares.tabela_medidas}
              onChange={(e) => atualizarCampo('complementares', 'tabela_medidas', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>
        </div>
      </section>

      {/* SESSÃO 2: DESCRIÇÃO COMPLEMENTAR */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <AlignLeft className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Descrição Complementar
        </h2>
        
        <div className="space-y-2">
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar transition-colors">
            <select className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded px-2 py-1 outline-none transition-colors"><option>Simples</option><option>Título 1</option></select>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800 mx-1 transition-colors"></div>
            <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 font-bold transition-colors">B</button>
            <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 italic transition-colors">I</button>
            <button className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 underline transition-colors">U</button>
          </div>
          <textarea 
            rows="6"
            placeholder="Digite a descrição detalhada do produto aqui..."
            value={produto.complementares.descricao}
            onChange={(e) => atualizarCampo('complementares', 'descricao', e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-t-0 border-zinc-200 dark:border-zinc-800 rounded-b-xl p-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
          ></textarea>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Campo exibido em propostas comerciais, pedidos de venda e descrição do produto no e-commerce.</p>
        </div>
      </section>

      {/* SESSÃO 3: IMAGENS E ANEXOS */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <ImageIcon className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Imagens e anexos
        </h2>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4 transition-colors">Facilite o gerenciamento de imagens de seus produtos com nosso gerenciador.</p>
        
        {isEditMode ? (
          <UploaderImagens 
            imagens={produto.imagens_anexos || []} 
            setImagens={(novasImagens) => setProduto(prev => ({ ...prev, imagens_anexos: novasImagens }))} 
          />
        ) : (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-6 rounded-2xl flex items-start gap-4 transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
              <ImageIcon className="text-amber-600 dark:text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base mb-1">Upload Bloqueado Temporariamente</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-relaxed">
                Para evitar arquivos órfãos no servidor, o envio de imagens só é permitido <b>após o primeiro salvamento</b> do produto. Preencha os dados básicos, clique em "Salvar no Hub" e a área de imagens será liberada automaticamente.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* SESSÃO 4: CAMPOS ADICIONAIS (SEO, TAGS, LINKS) */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <Link2 className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Campos Adicionais e SEO
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"><Link2 size={14} className="text-zinc-400" /> Link do vídeo</label>
            <input 
              type="text" placeholder="Ex: https://youtube.com/watch?v=..."
              value={produto.complementares.link_video}
              onChange={(e) => atualizarCampo('complementares', 'link_video', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Slug</label>
            <input 
              type="text" placeholder="exemplo-de-produto"
              value={produto.complementares.slug}
              onChange={(e) => atualizarCampo('complementares', 'slug', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Utilizado para identificação legível no link do produto no e-commerce</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"><Type size={14} className="text-zinc-400" /> Título para SEO</label>
            <input 
              type="text" placeholder="Título que aparece no Google"
              value={produto.complementares.seo_titulo}
              onChange={(e) => atualizarCampo('complementares', 'seo_titulo', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Descrição para SEO</label>
            <textarea 
              rows="3" placeholder="Resumo atrativo para o Google..."
              value={produto.complementares.seo_descricao}
              onChange={(e) => atualizarCampo('complementares', 'seo_descricao', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            ></textarea>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Descrição exibida abaixo do título nos resultados da busca no Google</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Keywords (Palavras-chave)</label>
            <input 
              type="text" placeholder="tenis, maquiagem, rosto"
              value={produto.complementares.keywords}
              onChange={(e) => atualizarCampo('complementares', 'keywords', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Informe os valores separados por vírgula</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors"><Hash size={14} className="text-zinc-400" /> Tags Internas</label>
            <input 
              type="text" placeholder="Lançamento, Inverno, Promoção"
              value={produto.complementares.tags}
              onChange={(e) => atualizarCampo('complementares', 'tags', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Servem para classificar os produtos internamente</p>
          </div>
        </div>
      </section>

    </div>
  );
}