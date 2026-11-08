import { BadgePercent, Clock, CreditCard, Gift, Headphones, Heart, Leaf, Package, QrCode, RotateCcw, ShieldCheck, Sparkles, Star, Store, Tag, Truck } from "lucide-react";
import { CAMPO, Etiquetas, Grupo, LinhaCampo, LinhaSwitch } from "@/components/parametros/ui";

// Mesmos padrões da API: valem enquanto a empresa não salvar esta aba
export const SELOS_PADRAO = {
  desconto: true,
  novidade: { ativo: true, texto: "Novidade", dias: 30 },
  ultimas: { ativo: true, texto: "Últimas unidades", ate: 3 },
  frete_gratis: { ativo: false, texto: "Frete grátis" },
  esgotado: "Esgotado",
  personalizado: { ativo: false, texto: "", marcas: [] },
};

export const VANTAGENS_PADRAO = [
  { icone: "Truck", titulo: "Entrega para sua casa", texto: "Frete calculado pelo CEP" },
  { icone: "QrCode", titulo: "Pix na hora", texto: "Aprovação imediata" },
  { icone: "CreditCard", titulo: "Cartão de crédito", texto: "Parcele suas compras" },
  { icone: "RotateCcw", titulo: "Troca garantida", texto: "Veja nossa política" },
];

const ICONES = { Truck, QrCode, CreditCard, RotateCcw, ShieldCheck, Gift, Clock, Headphones, Store, Star, Tag, Heart, Package, BadgePercent, Leaf, Sparkles };

const SUGESTOES = ["Exclusivo online", "Mais vendido", "Lançamento", "Kit", "Edição limitada", "Vegano"];

function Selo({ texto, cor = "bg-rose-600 text-white" }) {
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold ${cor}`}>{texto}</span>;
}

function Vantagem({ item, indice, mudar, remover }) {
  const Icone = ICONES[item.icone] || Star;
  return (
    <div className="space-y-3 rounded-2xl bg-black/[0.03] p-3.5 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-800 shadow-sm dark:bg-white/10 dark:text-zinc-100"><Icone size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.titulo || "Sem título"}</p>
          <p className="truncate text-xs text-zinc-500">{item.texto || "Sem texto"}</p>
        </div>
        <button type="button" onClick={remover} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-rose-500/10 hover:text-rose-600">Remover</button>
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Ícone da vantagem ${indice + 1}`}>
        {Object.entries(ICONES).map(([nome, Componente]) => (
          <button key={nome} type="button" role="radio" aria-checked={item.icone === nome} aria-label={nome} onClick={() => mudar({ icone: nome })} className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${item.icone === nome ? "bg-purple-500/15 text-purple-600 ring-1 ring-purple-500/40 dark:text-purple-300" : "text-zinc-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"}`}>
            <Componente size={17} />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={item.titulo} onChange={(e) => mudar({ titulo: e.target.value })} maxLength={40} placeholder="Título" aria-label={`Título da vantagem ${indice + 1}`} className={CAMPO} />
        <input value={item.texto} onChange={(e) => mudar({ texto: e.target.value })} maxLength={60} placeholder="Texto menor" aria-label={`Texto da vantagem ${indice + 1}`} className={CAMPO} />
      </div>
    </div>
  );
}

export default function AbaVitrine({ ecommerce, opcoes, alterar }) {
  const selos = { ...SELOS_PADRAO, ...(ecommerce.selos || {}) };
  const mudarSelo = (nome, mudanca) => alterar({ selos: { ...selos, [nome]: typeof mudanca === "object" ? { ...selos[nome], ...mudanca } : mudanca } });
  const vantagens = ecommerce.vantagens?.length ? ecommerce.vantagens : VANTAGENS_PADRAO;
  const mudarVantagens = (lista) => alterar({ vantagens: lista });

  return (
    <div className="space-y-5">
      <Grupo titulo="Selos nos produtos" texto="As etiquetas que aparecem em cima da foto, nos cards e na página do produto.">
        <div className="flex flex-wrap gap-2 py-3.5 first:pt-0" aria-label="Prévia dos selos">
          {selos.desconto && <Selo texto="-15%" />}
          {selos.novidade.ativo && <Selo texto={selos.novidade.texto || "Novidade"} cor="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" />}
          {selos.ultimas.ativo && <Selo texto={selos.ultimas.texto || "Últimas unidades"} cor="bg-amber-500 text-white" />}
          {selos.frete_gratis.ativo && <Selo texto={selos.frete_gratis.texto || "Frete grátis"} cor="bg-emerald-600 text-white" />}
          {selos.personalizado.ativo && selos.personalizado.texto && <Selo texto={selos.personalizado.texto} cor="bg-purple-600 text-white" />}
          <Selo texto={selos.esgotado || "Esgotado"} cor="bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-300" />
        </div>
        <LinhaSwitch titulo="Desconto em %" texto="Mostra -15% quando o produto está em oferta." ligado={selos.desconto} onChange={(valor) => mudarSelo("desconto", valor)} />

        <LinhaSwitch titulo="Novidade" texto="Produto que entrou no catálogo há poucos dias." ligado={selos.novidade.ativo} onChange={(valor) => mudarSelo("novidade", { ativo: valor })} />
        {selos.novidade.ativo && (
          <div className="grid gap-3 pb-3.5 sm:grid-cols-2">
            <input value={selos.novidade.texto} onChange={(e) => mudarSelo("novidade", { texto: e.target.value })} maxLength={24} placeholder="Novidade" aria-label="Texto do selo de novidade" className={CAMPO} />
            <div className="relative">
              <input inputMode="numeric" value={selos.novidade.dias} onChange={(e) => mudarSelo("novidade", { dias: e.target.value.replace(/\D/g, "") })} aria-label="Dias como novidade" className={`${CAMPO} pr-24`} />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">dias no ar</span>
            </div>
          </div>
        )}

        <LinhaSwitch titulo="Últimas unidades" texto="Cria urgência quando o estoque está acabando." ligado={selos.ultimas.ativo} onChange={(valor) => mudarSelo("ultimas", { ativo: valor })} />
        {selos.ultimas.ativo && (
          <div className="grid gap-3 pb-3.5 sm:grid-cols-2">
            <input value={selos.ultimas.texto} onChange={(e) => mudarSelo("ultimas", { texto: e.target.value })} maxLength={24} placeholder="Últimas unidades" aria-label="Texto do selo de últimas unidades" className={CAMPO} />
            <div className="relative">
              <input inputMode="numeric" value={selos.ultimas.ate} onChange={(e) => mudarSelo("ultimas", { ate: e.target.value.replace(/\D/g, "") })} aria-label="Mostrar com até quantas unidades" className={`${CAMPO} pl-20 pr-24`} />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">Com até</span>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">unidades</span>
            </div>
          </div>
        )}

        <LinhaSwitch titulo="Frete grátis" texto="Produto que sozinho já passa do valor de frete grátis da aba Regras." ligado={selos.frete_gratis.ativo} onChange={(valor) => mudarSelo("frete_gratis", { ativo: valor })} />
        {selos.frete_gratis.ativo && (
          <div className="pb-3.5"><input value={selos.frete_gratis.texto} onChange={(e) => mudarSelo("frete_gratis", { texto: e.target.value })} maxLength={24} placeholder="Frete grátis" aria-label="Texto do selo de frete grátis" className={CAMPO} /></div>
        )}

        <LinhaSwitch titulo="Selo personalizado" texto="Um texto seu para as marcas que você escolher." ligado={selos.personalizado.ativo} onChange={(valor) => mudarSelo("personalizado", { ativo: valor })} />
        {selos.personalizado.ativo && (
          <div className="space-y-3 pb-3.5">
            <input value={selos.personalizado.texto} onChange={(e) => mudarSelo("personalizado", { texto: e.target.value })} maxLength={24} placeholder="Ex.: Exclusivo online" aria-label="Texto do selo personalizado" className={CAMPO} />
            <div className="flex flex-wrap gap-1.5">
              {SUGESTOES.map((sugestao) => (
                <button key={sugestao} type="button" onClick={() => mudarSelo("personalizado", { texto: sugestao })} className="h-7 rounded-full bg-black/[0.04] px-3 text-xs font-medium text-zinc-600 hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-zinc-300">{sugestao}</button>
              ))}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-zinc-500">Nas marcas</p>
              <Etiquetas opcoes={(opcoes.marcas || []).map((marca) => ({ id: marca, rotulo: marca }))} marcadas={selos.personalizado.marcas || []} onChange={(marcas) => mudarSelo("personalizado", { marcas })} rotuloVazio="Nenhuma marca cadastrada" />
            </div>
          </div>
        )}

        <LinhaCampo titulo="Texto de esgotado" texto="Aparece na foto do produto sem estoque, que fica em cinza.">
          <input value={selos.esgotado} onChange={(e) => mudarSelo("esgotado", e.target.value)} maxLength={24} placeholder="Esgotado" aria-label="Texto de esgotado" className={CAMPO} />
        </LinhaCampo>
      </Grupo>

      <Grupo titulo="Pré-rodapé" texto="A faixa com ícones logo acima do rodapé da loja. Até 4 itens.">
        <div className="space-y-3 py-3.5 first:pt-0">
          {vantagens.map((item, indice) => (
            <Vantagem
              key={indice}
              item={item}
              indice={indice}
              mudar={(mudanca) => mudarVantagens(vantagens.map((atual, i) => (i === indice ? { ...atual, ...mudanca } : atual)))}
              remover={() => mudarVantagens(vantagens.filter((_, i) => i !== indice))}
            />
          ))}
          {vantagens.length < 4 && (
            <button type="button" onClick={() => mudarVantagens([...vantagens, { icone: "Star", titulo: "", texto: "" }])} className="flex h-10 items-center gap-2 rounded-full bg-black/[0.05] px-4 text-sm font-semibold text-zinc-700 hover:bg-black/[0.08] dark:bg-white/[0.07] dark:text-zinc-200">
              + Adicionar item
            </button>
          )}
        </div>
      </Grupo>
    </div>
  );
}

