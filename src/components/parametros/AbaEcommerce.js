import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { CAMPO, Etiquetas, Grupo, LinhaCampo, LinhaSwitch } from "@/components/parametros/ui";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const VEZES = Array.from({ length: 12 }, (_, i) => i + 1);

const MODOS_DE_COMPRA = [
  { id: "conta_na_finalizacao", titulo: "Cria a conta na finalização", texto: "Navega e monta a sacola à vontade; o cadastro é feito no checkout." },
  { id: "visitante", titulo: "Permitir compra sem cadastro", texto: "No checkout aparece a opção de comprar só com nome, e-mail, CPF e celular." },
  { id: "conta_antes", titulo: "Só compra com conta", texto: "Para colocar na sacola, a pessoa precisa entrar ou criar a conta antes." },
];

const MODOS_DE_MARCA = [
  { id: "todas", titulo: "Todas as marcas", texto: "A loja mostra o catálogo inteiro (respeitando as outras regras desta página)." },
  { id: "somente", titulo: "Só as marcas escolhidas", texto: "Para lojas de uma marca só, usando o mesmo estoque da empresa." },
  { id: "exceto", titulo: "Todas, menos as escolhidas", texto: "As marcas marcadas não aparecem na loja." },
];

const ROTULOS_DO_CARRINHO = [
  { id: "sacola", titulo: "Sacola", texto: "Adicionar à sacola, Sua sacola. Comum em moda e beleza." },
  { id: "carrinho", titulo: "Carrinho", texto: "Adicionar ao carrinho, Seu carrinho. Comum em mercado e eletrônicos." },
];

// Lista de opções em que só uma fica marcada, com título e explicação
export function Escolha({ opcoes, valor, onChange, rotulo }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid gap-2 py-3.5 first:pt-0">
      {opcoes.map((opcao) => {
        const ligado = valor === opcao.id;
        return (
          <button key={opcao.id} type="button" role="radio" aria-checked={ligado} onClick={() => onChange(opcao.id)} className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${ligado ? "border-purple-500/50 bg-purple-500/10" : "border-black/[0.06] hover:bg-black/[0.03] dark:border-white/[0.08] dark:hover:bg-white/[0.04]"}`}>
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${ligado ? "border-purple-500" : "border-zinc-300 dark:border-zinc-600"}`}>{ligado && <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />}</span>
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{opcao.titulo}</span>
              <span className="block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{opcao.texto}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const Campo = ({ valor, onChange, rotulo, prefixo, sufixo, placeholder = "0" }) => (
  <div className="relative">
    {prefixo && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{prefixo}</span>}
    <input inputMode="decimal" value={valor ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={rotulo} className={`${CAMPO} ${prefixo ? "pl-11" : ""} ${sufixo ? "pr-10" : ""}`} />
    {sufixo && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">{sufixo}</span>}
  </div>
);

const Vezes = ({ valor, onChange, rotulo, ate = 12 }) => (
  <select value={valor} onChange={(e) => onChange(Number(e.target.value))} aria-label={rotulo} className={CAMPO}>
    {VEZES.filter((vez) => vez <= ate).map((vez) => <option key={vez} value={vez}>{vez === 1 ? "À vista (1x)" : `${vez}x`}</option>)}
  </select>
);

function BloqueioPorEstado({ restricoes, marcas, ufs, onChange }) {
  const [nova, setNova] = useState({ marca: "", ufs: [] });

  const adicionar = () => {
    if (!nova.marca) return toast.error("Escolha a marca.");
    if (nova.ufs.length === 0) return toast.error("Escolha ao menos um estado.");
    const outras = restricoes.filter((restricao) => restricao.marca !== nova.marca);
    onChange([...outras, nova]);
    setNova({ marca: "", ufs: [] });
  };

  return (
    <div className="space-y-4 pt-1">
      {restricoes.map((restricao, indice) => (
        <div key={`${restricao.marca}-${indice}`} className="flex items-start justify-between gap-3 rounded-2xl bg-black/[0.03] p-3.5 dark:bg-white/[0.04]">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{restricao.marca}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Não vende para: {restricao.ufs.join(", ")}</p>
          </div>
          <button type="button" onClick={() => onChange(restricoes.filter((_, i) => i !== indice))} aria-label={`Remover bloqueio de ${restricao.marca}`} className="shrink-0 p-1.5 text-zinc-400 hover:text-rose-500">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="space-y-3 rounded-2xl border border-dashed border-black/[0.12] p-4 dark:border-white/[0.12]">
        <select value={nova.marca} onChange={(e) => setNova({ ...nova, marca: e.target.value })} aria-label="Marca" className={CAMPO}>
          <option value="">Escolha a marca</option>
          {marcas.map((marca) => <option key={marca} value={marca}>{marca}</option>)}
        </select>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-zinc-500">Não vender para estes estados</p>
          <Etiquetas opcoes={ufs.map((uf) => ({ id: uf, rotulo: uf }))} marcadas={nova.ufs} onChange={(escolhidas) => setNova({ ...nova, ufs: escolhidas })} rotuloVazio="" />
        </div>
        <button type="button" onClick={adicionar} className="flex h-10 items-center gap-2 rounded-full bg-black/[0.05] px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-black/[0.08] dark:bg-white/[0.07] dark:text-zinc-200 dark:hover:bg-white/[0.12]">
          <Plus size={15} /> Adicionar bloqueio
        </button>
      </div>
    </div>
  );
}

export default function AbaEcommerce({ ecommerce, opcoes, alterar }) {
  const aviso = ecommerce.aviso || { ativo: false, texto: "", destaque: "", link: "" };
  const mudarAviso = (mudanca) => alterar({ aviso: { ...aviso, ...mudanca } });

  return (
    <div className="space-y-5">
      <Grupo titulo="Loja no ar" texto="As mudanças aparecem na loja em até 5 minutos.">
        <LinhaSwitch titulo="Colocar a loja em manutenção" texto="A loja mostra a tela de manutenção para todo mundo até você desligar." ligado={ecommerce.loja_fechada} onChange={(valor) => alterar({ loja_fechada: valor })} />
      </Grupo>

      <Grupo titulo="Aviso no topo da loja" texto="A faixa fina que aparece acima do cabeçalho, em todas as páginas.">
        <LinhaSwitch titulo="Mostrar o aviso" ligado={aviso.ativo} onChange={(valor) => mudarAviso({ ativo: valor })} />
        <div className="grid gap-3 py-3.5 last:pb-0">
          <input value={aviso.texto} onChange={(e) => mudarAviso({ texto: e.target.value })} maxLength={160} placeholder="Ex.: Frete grátis para Goiânia acima de R$ 199" aria-label="Texto do aviso" className={CAMPO} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={aviso.destaque} onChange={(e) => mudarAviso({ destaque: e.target.value })} maxLength={120} placeholder="Segundo aviso (opcional, só no computador)" aria-label="Segundo aviso" className={CAMPO} />
            <input value={aviso.link} onChange={(e) => mudarAviso({ link: e.target.value })} maxLength={300} placeholder="Link ao clicar (opcional): /ofertas" aria-label="Link do aviso" className={CAMPO} />
          </div>
        </div>
      </Grupo>

      <Grupo titulo="Página do produto">
        <LinhaSwitch titulo="Mostrar o botão Comprar agora" texto="Leva direto para a finalização, além do Adicionar à sacola." ligado={ecommerce.comprar_agora} onChange={(valor) => alterar({ comprar_agora: valor })} />
        <p className="pt-3.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nome do carrinho na loja</p>
        <Escolha opcoes={ROTULOS_DO_CARRINHO} valor={ecommerce.rotulo_carrinho || "sacola"} onChange={(rotulo_carrinho) => alterar({ rotulo_carrinho })} rotulo="Nome do carrinho" />
      </Grupo>

      <Grupo titulo="Estoque na loja">
        <LinhaSwitch titulo="Mostrar a quantidade em estoque" texto="Ligado: Restam 12 unidades. Desligado: só Em estoque ou Esgotado." ligado={ecommerce.mostrar_estoque} onChange={(valor) => alterar({ mostrar_estoque: valor })} />
        <LinhaSwitch titulo="Avise-me quando chegar" texto="No produto esgotado, o cliente deixa o e-mail e recebe um aviso quando o estoque voltar." ligado={ecommerce.avise_me} onChange={(valor) => alterar({ avise_me: valor })} />
      </Grupo>

      <Grupo titulo="Pagamento" texto="Aparece nos cards de produto e é conferido na hora de cobrar.">
        <LinhaCampo titulo="Desconto no Pix (%)" texto="Sobre os produtos, sem contar o frete. Use 0 para não dar desconto.">
          <Campo valor={ecommerce.desconto_pix} onChange={(valor) => alterar({ desconto_pix: valor })} rotulo="Desconto no Pix" sufixo="%" />
        </LinhaCampo>
        <LinhaCampo titulo="Parcelar no cartão em até" texto="Máximo de parcelas que o cliente pode escolher.">
          <Vezes valor={ecommerce.parcelas_maximo} onChange={(valor) => alterar({ parcelas_maximo: valor, parcelas_sem_juros: Math.min(ecommerce.parcelas_sem_juros, valor) })} rotulo="Máximo de parcelas" />
        </LinhaCampo>
        <LinhaCampo titulo="Sem juros até" texto="Acima disso, os juros são os da sua conta do Mercado Pago, pagos pelo cliente.">
          <Vezes valor={ecommerce.parcelas_sem_juros} onChange={(valor) => alterar({ parcelas_sem_juros: valor })} rotulo="Parcelas sem juros" ate={ecommerce.parcelas_maximo} />
        </LinhaCampo>
        <LinhaCampo titulo="Parcela mínima" texto="Evita parcelas muito pequenas. Ex.: R$ 10 faz uma compra de R$ 30 ir até 3x.">
          <Campo valor={ecommerce.parcela_minima} onChange={(valor) => alterar({ parcela_minima: valor })} rotulo="Parcela mínima" prefixo="R$" />
        </LinhaCampo>
      </Grupo>

      <Grupo titulo="Frete e pedido">
        <LinhaCampo titulo="Frete grátis a partir de" texto="Vale para todos os lugares que a loja entrega. Vazio desliga.">
          <Campo valor={ecommerce.frete_gratis_acima} onChange={(valor) => alterar({ frete_gratis_acima: valor })} rotulo="Frete grátis a partir de" prefixo="R$" placeholder="Desligado" />
        </LinhaCampo>
        <LinhaCampo titulo="Pedido mínimo" texto="Valor mínimo em produtos para finalizar. Vazio desliga.">
          <Campo valor={ecommerce.pedido_minimo} onChange={(valor) => alterar({ pedido_minimo: valor })} rotulo="Pedido mínimo" prefixo="R$" placeholder="Desligado" />
        </LinhaCampo>
      </Grupo>

      <Grupo titulo="Preço para o consumidor final" texto="Para distribuidoras: a loja vende ao consumidor com um acréscimo sobre o preço de venda. O portal B2B não muda.">
        <LinhaSwitch titulo="Aplicar acréscimo no preço da loja" texto="Desligado, a loja usa o preço de venda do cadastro." ligado={ecommerce.acrescimo_ativo} onChange={(valor) => alterar({ acrescimo_ativo: valor })} />
        {ecommerce.acrescimo_ativo && (
          <LinhaCampo titulo="Acréscimo (%)" texto="Somado a todos os preços da loja, inclusive ofertas.">
            <Campo valor={ecommerce.acrescimo} onChange={(valor) => alterar({ acrescimo: valor })} rotulo="Acréscimo" sufixo="%" />
          </LinhaCampo>
        )}
        <LinhaSwitch titulo="Esconder o preço de quem não entrou na conta" texto="O preço nem sai do sistema: só aparece depois do login." ligado={ecommerce.ocultar_preco_visitante} onChange={(valor) => alterar({ ocultar_preco_visitante: valor })} />
      </Grupo>

      <Grupo titulo="Contas de clientes">
        <Escolha opcoes={MODOS_DE_COMPRA} valor={ecommerce.compra} onChange={(compra) => alterar({ compra })} rotulo="Como o cliente compra" />
        <LinhaCampo titulo="Excluir contas sem pedido depois de" texto="Apaga cadastros que nunca compraram. Vazio desliga; o mínimo é 7 dias.">
          <Campo valor={ecommerce.excluir_contas_sem_pedido_dias} onChange={(valor) => alterar({ excluir_contas_sem_pedido_dias: valor })} rotulo="Dias para excluir contas sem pedido" sufixo="dias" placeholder="Desligado" />
        </LinhaCampo>
      </Grupo>

      <Grupo titulo="Catálogo da loja">
        <LinhaSwitch titulo="Não mostrar produtos sem estoque" ligado={ecommerce.ocultar_sem_estoque} onChange={(valor) => alterar({ ocultar_sem_estoque: valor })} />
        <LinhaSwitch titulo="Não mostrar produtos bonificados" texto="Some também a marca do provador da lista de marcas. O começo do nome é o definido na guia Raizan Seller." ligado={ecommerce.ocultar_provadores} onChange={(valor) => alterar({ ocultar_provadores: valor })} />
        <p className="pt-3.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Marcas que vão para a loja</p>
        <Escolha opcoes={MODOS_DE_MARCA} valor={ecommerce.marcas_modo || "todas"} onChange={(marcas_modo) => alterar({ marcas_modo })} rotulo="Marcas que vão para a loja" />
        {ecommerce.marcas_modo && ecommerce.marcas_modo !== "todas" && (
          <div className="pb-3.5">
            <p className="mb-1.5 text-xs font-semibold text-zinc-500">{ecommerce.marcas_modo === "somente" ? "Vender só estas marcas" : "Não mostrar estas marcas"}</p>
            <Etiquetas opcoes={(opcoes.marcas || []).map((marca) => ({ id: marca, rotulo: marca }))} marcadas={ecommerce.marcas_lista || []} onChange={(marcas_lista) => alterar({ marcas_lista })} rotuloVazio="Nenhuma marca cadastrada" />
          </div>
        )}
      </Grupo>

      <Grupo titulo="Marcas bloqueadas por estado" texto="Para marcas que a empresa não pode vender em certas regiões. A loja avisa no cálculo do frete e não deixa finalizar para esses estados.">
        <BloqueioPorEstado restricoes={ecommerce.restricoes_uf || []} marcas={opcoes.marcas || []} ufs={opcoes.ufs_brasil || UFS} onChange={(restricoes_uf) => alterar({ restricoes_uf })} />
      </Grupo>
    </div>
  );
}
