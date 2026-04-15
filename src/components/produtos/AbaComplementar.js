import { FolderTree, AlignLeft, Image as ImageIcon, Link2, Search, Type, Hash, Plus } from "lucide-react";

export default function AbaComplementar({ produto, atualizarCampo }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* SESSÃO 1: CATEGORIZAÇÃO */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <FolderTree className="text-purple-500" size={20} /> Categorização
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
               <label className="text-sm font-medium text-zinc-300">Categoria</label>
               {produto.complementares.categoria && (
                 <button onClick={() => atualizarCampo('complementares', 'categoria', '')} className="text-xs text-purple-400 hover:text-purple-300">remover</button>
               )}
            </div>
            <div className="relative">
              <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="Selecione ou pesquise uma categoria..." 
                value={produto.complementares.categoria}
                onChange={(e) => atualizarCampo('complementares', 'categoria', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 pl-10 pr-12 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                <Search size={16} />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">Categorização conforme a árvore de categorias dos produtos</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Marca</label>
            <input 
              type="text" placeholder="Pesquise pelo nome da marca"
              value={produto.complementares.marca}
              onChange={(e) => atualizarCampo('complementares', 'marca', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Tabela de medidas</label>
            <input 
              type="text" placeholder="Pesquise pelo nome da tabela"
              value={produto.complementares.tabela_medidas}
              onChange={(e) => atualizarCampo('complementares', 'tabela_medidas', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>
      </section>

      {/* SESSÃO 2: DESCRIÇÃO COMPLEMENTAR */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <AlignLeft className="text-purple-500" size={20} /> Descrição Complementar
        </h2>
        
        <div className="space-y-2">
          {/* Barra de Ferramentas Fake do Editor HTML */}
          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-t-xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <select className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded px-2 py-1 outline-none"><option>Simples</option><option>Título 1</option></select>
            <div className="w-px h-4 bg-zinc-800 mx-1"></div>
            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 font-bold">B</button>
            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 italic">I</button>
            <button className="p-1 hover:bg-zinc-800 rounded text-zinc-400 underline">U</button>
          </div>
          {/* Área de Texto */}
          <textarea 
            rows="6"
            placeholder="Digite a descrição detalhada do produto aqui..."
            value={produto.complementares.descricao}
            onChange={(e) => atualizarCampo('complementares', 'descricao', e.target.value)}
            className="w-full bg-zinc-950 border border-t-0 border-zinc-800 rounded-b-xl p-4 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y"
          ></textarea>
          <p className="text-[11px] text-zinc-500">Campo exibido em propostas comerciais, pedidos de venda e descrição do produto no e-commerce.</p>
        </div>
      </section>

      {/* SESSÃO 3: IMAGENS E ANEXOS */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <ImageIcon className="text-purple-500" size={20} /> Imagens e anexos
        </h2>
        <p className="text-xs text-zinc-400 mb-4">Facilite o gerenciamento de imagens de seus produtos com nosso gerenciador. Defina, reordene e compartilhe imagens entre o produto principal e suas variações.</p>
        
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-6 py-4 rounded-xl font-medium transition-all shadow-sm">
          <Plus size={18} /> Adicionar imagens ao produto
        </button>
      </section>

      {/* SESSÃO 4: CAMPOS ADICIONAIS (SEO, TAGS, LINKS) */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Link2 className="text-purple-500" size={20} /> Campos Adicionais e SEO
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Link2 size={14}/> Link do vídeo</label>
            <input 
              type="text" placeholder="Ex: https://youtube.com/watch?v=..."
              value={produto.complementares.link_video}
              onChange={(e) => atualizarCampo('complementares', 'link_video', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Slug</label>
            <input 
              type="text" placeholder="exemplo-de-produto-nike"
              value={produto.complementares.slug}
              onChange={(e) => atualizarCampo('complementares', 'slug', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
            <p className="text-[11px] text-zinc-500">Utilizado para identificação legível no link do produto no e-commerce</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Type size={14}/> Título para SEO</label>
            <input 
              type="text" placeholder="Título que aparece no Google"
              value={produto.complementares.seo_titulo}
              onChange={(e) => atualizarCampo('complementares', 'seo_titulo', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Descrição para SEO</label>
            <textarea 
              rows="3" placeholder="Resumo atrativo para o Google..."
              value={produto.complementares.seo_descricao}
              onChange={(e) => atualizarCampo('complementares', 'seo_descricao', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all resize-y"
            ></textarea>
            <p className="text-[11px] text-zinc-500">Descrição exibida abaixo do título nos resultados da busca no Google</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Keywords (Palavras-chave)</label>
            <input 
              type="text" placeholder="tenis, nike, corrida, preto"
              value={produto.complementares.keywords}
              onChange={(e) => atualizarCampo('complementares', 'keywords', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
            <p className="text-[11px] text-zinc-500">Informe os valores separados por vírgula</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Hash size={14}/> Tags Internas</label>
            <input 
              type="text" placeholder="Lançamento, Inverno, Promoção"
              value={produto.complementares.tags}
              onChange={(e) => atualizarCampo('complementares', 'tags', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-200 focus:border-purple-500 outline-none transition-all"
            />
            <p className="text-[11px] text-zinc-500">Servem para classificar os produtos internamente</p>
          </div>
        </div>
      </section>

    </div>
  );
}