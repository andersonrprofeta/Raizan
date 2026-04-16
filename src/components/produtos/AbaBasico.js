import { Package, DollarSign, Archive, Box } from "lucide-react";

export default function AbaBasico({ produto, atualizarCampo }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* SESSÃO 1: DADOS GERAIS */}
      <section className="space-y-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <Package className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Dados Gerais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Tipo do Produto */}
          <div className="space-y-2 md:col-span-4 lg:col-span-3">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Tipo do Produto</label>
            <select 
              value={produto.basico.tipo_produto}
              onChange={(e) => atualizarCampo('basico', 'tipo_produto', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none"
            >
              <option value="simples">Simples</option>
              <option value="kit">Kit</option>
              <option value="variacoes">Com Variações</option>
              <option value="materia-prima">Matéria-prima</option>
            </select>
          </div>

          <div className="hidden md:block md:col-span-8 lg:col-span-9"></div> {/* Espaçador */}

          {/* Nome */}
          <div className="space-y-2 md:col-span-8">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Nome do produto <span className="text-rose-500">*</span></label>
            <input 
              type="text" placeholder="Descrição completa do produto" 
              value={produto.basico.nome}
              onChange={(e) => atualizarCampo('basico', 'nome', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Necessário para emissão de Nota Fiscal</p>
          </div>

          {/* GTIN */}
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Código de barras (GTIN)</label>
            <input 
              type="text" placeholder="Ex: 7891234567890"
              value={produto.basico.gtin}
              onChange={(e) => atualizarCampo('basico', 'gtin', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Global Trade Item Number</p>
          </div>

          {/* Origem ICMS */}
          <div className="space-y-2 md:col-span-8">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Origem do produto conforme ICMS</label>
            <select 
              value={produto.basico.origem}
              onChange={(e) => atualizarCampo('basico', 'origem', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none"
            >
              <option value="0">0 – Nacional, exceto as indicadas nos códigos 3 a 5</option>
              <option value="1">1 – Estrangeira – Importação direta</option>
              <option value="2">2 – Estrangeira – Adquirida no mercado interno</option>
              <option value="3">3 – Nacional, com conteúdo de importação superior a 40% e ≤ 70%</option>
              <option value="4">4 – Nacional, produzida conforme PPB</option>
              <option value="5">5 – Nacional, com conteúdo de importação ≤ 40%</option>
              <option value="6">6 – Estrangeira – Importação direta, sem similar nacional</option>
              <option value="7">7 – Estrangeira – Adquirida mercado interno, sem similar nacional</option>
              <option value="8">8 – Nacional, com conteúdo de importação superior a 70%</option>
            </select>
          </div>

          {/* Unidade */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Unid. Medida</label>
            <input 
              type="text" placeholder="UN"
              value={produto.basico.unidade}
              onChange={(e) => atualizarCampo('basico', 'unidade', e.target.value.toUpperCase())}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all uppercase placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>

          {/* NCM */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">NCM</label>
            <input 
              type="text" placeholder="Ex: 1001.10.10"
              value={produto.basico.ncm}
              onChange={(e) => atualizarCampo('basico', 'ncm', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>

          {/* SKU */}
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Código (SKU)</label>
            <input 
              type="text" placeholder="Índice automático se vazio"
              value={produto.basico.sku}
              onChange={(e) => atualizarCampo('basico', 'sku', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Opcional</p>
          </div>

          {/* CEST */}
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Código CEST</label>
            <input 
              type="text" placeholder="Ex: 01.003.00"
              value={produto.basico.cest}
              onChange={(e) => atualizarCampo('basico', 'cest', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
            />
          </div>
          
          <div className="hidden md:block md:col-span-4"></div> {/* Espaçador */}

          {/* Preços */}
          <div className="space-y-2 md:col-span-4 relative group">
            <label className="text-sm font-black text-purple-700 dark:text-purple-400 transition-colors">Preço de venda (R$)</label>
            <input 
              type="number" step="0.01" placeholder="0,00"
              value={produto.precos.venda}
              onChange={(e) => atualizarCampo('precos', 'venda', e.target.value)}
              className="w-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/50 rounded-xl p-3.5 text-lg text-purple-700 dark:text-purple-400 font-black focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-all shadow-sm shadow-purple-500/20 dark:shadow-[0_0_15px_rgba(168,85,247,0.1)] placeholder:text-purple-300 dark:placeholder:text-purple-900/50"
            />
          </div>

          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Preço promocional (R$)</label>
            <input 
              type="number" step="0.01" placeholder="0,00"
              value={produto.precos.promocional}
              onChange={(e) => atualizarCampo('precos', 'promocional', e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-base text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
            />
          </div>

        </div>
      </section>

      {/* SESSÃO 2: DIMENSÕES E PESO */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <Box className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Dimensões e peso
        </h2>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 -mt-2 transition-colors">Indispensável para cálculo de frete em vendas online.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Pesos */}
            <div className="space-y-2 md:col-span-2 relative">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Peso Líquido</label>
              <div className="relative">
                <input 
                  type="number" step="0.01" placeholder="0,00"
                  value={produto.dimensoes.peso_liquido}
                  onChange={(e) => atualizarCampo('dimensoes', 'peso_liquido', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">kg</span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2 relative">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Peso Bruto</label>
              <div className="relative">
                <input 
                  type="number" step="0.01" placeholder="0,00"
                  value={produto.dimensoes.peso_bruto}
                  onChange={(e) => atualizarCampo('dimensoes', 'peso_bruto', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">kg</span>
              </div>
            </div>

            {/* Embalagens */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Tipo da embalagem</label>
              <select 
                value={produto.dimensoes.tipo_embalagem}
                onChange={(e) => atualizarCampo('dimensoes', 'tipo_embalagem', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none"
              >
                <option value="pacote">Pacote / Caixa</option>
                <option value="rolo">Rolo / Cilindro</option>
                <option value="envelope">Envelope</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Embalagem</label>
              <select 
                value={produto.dimensoes.embalagem}
                onChange={(e) => atualizarCampo('dimensoes', 'embalagem', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none"
              >
                <option value="customizada">Embalagem customizada</option>
                <option value="correios">Padrão Correios</option>
              </select>
            </div>

            {/* Medidas */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Largura</label>
              <div className="relative">
                <input 
                  type="number" step="0.1" placeholder="0,0"
                  value={produto.dimensoes.largura}
                  onChange={(e) => atualizarCampo('dimensoes', 'largura', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">cm</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Altura</label>
              <div className="relative">
                <input 
                  type="number" step="0.1" placeholder="0,0"
                  value={produto.dimensoes.altura}
                  onChange={(e) => atualizarCampo('dimensoes', 'altura', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">cm</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Comprimento</label>
              <div className="relative">
                <input 
                  type="number" step="0.1" placeholder="0,0"
                  value={produto.dimensoes.comprimento}
                  onChange={(e) => atualizarCampo('dimensoes', 'comprimento', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">cm</span>
              </div>
            </div>
        </div>
      </section>

      {/* SESSÃO 3: ESTOQUE */}
      <section className="space-y-5 mt-10">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 transition-colors">
          <Archive className="text-purple-600 dark:text-purple-500 transition-colors" size={20} /> Estoque
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Controlar estoque</label>
              <select 
                value={produto.estoque.controlar}
                onChange={(e) => atualizarCampo('estoque', 'controlar', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all cursor-pointer shadow-sm dark:shadow-none"
              >
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Acompanhamento automático</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Estoque inicial</label>
              <div className="relative">
                <input 
                  type="number" placeholder="0"
                  value={produto.estoque.inicial}
                  onChange={(e) => atualizarCampo('estoque', 'inicial', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">un</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Estoque mínimo</label>
              <div className="relative">
                <input 
                  type="number" placeholder="0"
                  value={produto.estoque.minimo}
                  onChange={(e) => atualizarCampo('estoque', 'minimo', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">un</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Estoque máximo</label>
              <div className="relative">
                <input 
                  type="number" placeholder="0"
                  value={produto.estoque.maximo}
                  onChange={(e) => atualizarCampo('estoque', 'maximo', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 pr-12 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-1 rounded transition-colors">un</span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Localização</label>
              <input 
                type="text" placeholder="Ex: Corredor A, Prateleira 3"
                value={produto.estoque.localizacao}
                onChange={(e) => atualizarCampo('estoque', 'localizacao', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
              />
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Localização física no estoque</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors">Dias para preparação</label>
              <input 
                type="number" placeholder="0"
                value={produto.estoque.dias_preparacao}
                onChange={(e) => atualizarCampo('estoque', 'dias_preparacao', e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-zinc-200 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:shadow-none"
              />
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 transition-colors">Tempo adicional somado ao frete</p>
            </div>

        </div>
      </section>

    </div>
  );
}