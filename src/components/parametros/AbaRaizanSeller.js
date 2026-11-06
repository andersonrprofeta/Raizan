import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { CAMPO, Etiquetas, Grupo, LinhaCampo, LinhaSwitch } from "@/components/parametros/ui";

const RESTRICAO_VAZIA = { marca: "", vendedores: [], ufs: [] };

function RestricoesDeMarca({ restricoes, opcoes, onChange }) {
  const [nova, setNova] = useState(RESTRICAO_VAZIA);

  const nomeDoVendedor = (id) => opcoes.vendedores.find((vendedor) => vendedor.id === id)?.nome || `Vendedor ${id}`;

  const adicionar = () => {
    if (!nova.marca) return toast.error("Escolha a marca.");
    if (nova.vendedores.length === 0 && nova.ufs.length === 0) return toast.error("Escolha ao menos um vendedor ou estado.");
    onChange([...restricoes, nova]);
    setNova(RESTRICAO_VAZIA);
  };

  return (
    <div className="space-y-4 pt-1">
      {restricoes.map((restricao, indice) => (
        <div key={`${restricao.marca}-${indice}`} className="flex items-start justify-between gap-3 rounded-2xl bg-black/[0.03] p-3.5 dark:bg-white/[0.04]">
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{restricao.marca}</p>
            {restricao.vendedores.length > 0 && <p className="mt-0.5 text-xs text-zinc-500">Vendedores: {restricao.vendedores.map(nomeDoVendedor).join(", ")}</p>}
            {restricao.ufs.length > 0 && <p className="mt-0.5 text-xs text-zinc-500">Estados: {restricao.ufs.join(", ")}</p>}
          </div>
          <button type="button" onClick={() => onChange(restricoes.filter((_, i) => i !== indice))} aria-label={`Remover restrição de ${restricao.marca}`} className="shrink-0 p-1.5 text-zinc-400 hover:text-rose-500">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="space-y-3 rounded-2xl border border-dashed border-black/[0.12] p-4 dark:border-white/[0.12]">
        <select value={nova.marca} onChange={(e) => setNova({ ...nova, marca: e.target.value })} aria-label="Marca" className={CAMPO}>
          <option value="">Escolha a marca</option>
          {opcoes.marcas.map((marca) => <option key={marca} value={marca}>{marca}</option>)}
        </select>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-zinc-500">Não liberar para estes vendedores</p>
          <Etiquetas
            opcoes={opcoes.vendedores.map(({ id, nome }) => ({ id, rotulo: nome }))}
            marcadas={nova.vendedores}
            onChange={(vendedores) => setNova({ ...nova, vendedores })}
            rotuloVazio="Nenhum vendedor cadastrado."
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-zinc-500">Não liberar para clientes destes estados</p>
          <Etiquetas
            opcoes={opcoes.ufs.map((uf) => ({ id: uf, rotulo: uf }))}
            marcadas={nova.ufs}
            onChange={(ufs) => setNova({ ...nova, ufs })}
            rotuloVazio="Nenhum estado encontrado nos clientes."
          />
        </div>
        <button type="button" onClick={adicionar} className="flex h-10 items-center gap-2 rounded-full bg-black/[0.05] px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-black/[0.08] dark:bg-white/[0.07] dark:text-zinc-200 dark:hover:bg-white/[0.12]">
          <Plus size={15} /> Adicionar restrição
        </button>
      </div>
    </div>
  );
}

function ExcecoesDeProvador({ excecoes, onChange }) {
  const [sku, setSku] = useState("");

  const adicionar = () => {
    const limpo = sku.trim();
    if (!limpo) return;
    if (!excecoes.includes(limpo)) onChange([...excecoes, limpo]);
    setSku("");
  };

  return (
    <div className="py-3.5 last:pb-0">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Exceções</p>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">Informe o SKU dos produtos que podem entrar em qualquer pedido.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }}
          placeholder="SKU do produto"
          aria-label="SKU da exceção"
          className={CAMPO}
        />
        <button type="button" onClick={adicionar} aria-label="Adicionar exceção" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-zinc-700 dark:bg-white/[0.07] dark:text-zinc-200"><Plus size={17} /></button>
      </div>
      {excecoes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {excecoes.map((item) => (
            <span key={item} className="flex h-8 items-center gap-1.5 rounded-full bg-black/[0.05] pl-3 pr-1.5 font-mono text-xs dark:bg-white/[0.07]">
              {item}
              <button type="button" onClick={() => onChange(excecoes.filter((outro) => outro !== item))} aria-label={`Remover ${item}`} className="p-0.5 text-zinc-400 hover:text-rose-500"><X size={13} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AbaRaizanSeller({ parametros, opcoes, alterarApp, alterarProvadores }) {
  const { app, provadores } = parametros;

  return (
    <div className="space-y-5">
      <Grupo titulo="Catálogo e clientes" texto="O que chega ao aparelho do vendedor na próxima sincronização.">
        <LinhaSwitch
          titulo="Não enviar produtos sem estoque"
          texto="Produto zerado some do catálogo do app."
          ligado={app.ocultar_sem_estoque}
          onChange={(valor) => alterarApp({ ocultar_sem_estoque: valor })}
        />
        <LinhaSwitch
          titulo="Enviar clientes bloqueados"
          texto="Desligado, cliente bloqueado no ERP não aparece mais no app."
          ligado={app.enviar_clientes_bloqueados}
          onChange={(valor) => alterarApp({ enviar_clientes_bloqueados: valor })}
        />
      </Grupo>

      <Grupo titulo="Descontos" texto="O app limita na tela, e a API confere de novo quando o pedido chega.">
        <LinhaCampo titulo="Desconto geral máximo (%)" texto="Vale para todos os itens do pedido. Vazio é sem limite.">
          <input inputMode="decimal" value={app.desconto_geral_maximo ?? ""} onChange={(e) => alterarApp({ desconto_geral_maximo: e.target.value })} placeholder="Sem limite" aria-label="Desconto geral máximo" className={CAMPO} />
        </LinhaCampo>
        <LinhaCampo titulo="Desconto máximo por produto (%)" texto="Limite do desconto individual em cada item.">
          <input inputMode="decimal" value={app.desconto_item_maximo ?? ""} onChange={(e) => alterarApp({ desconto_item_maximo: e.target.value })} aria-label="Desconto máximo por produto" className={CAMPO} />
        </LinhaCampo>
        <LinhaSwitch
          titulo="Não dar desconto em produtos em promoção"
          texto="Com produto em promoção no carrinho, o desconto geral também fica bloqueado."
          ligado={app.sem_desconto_em_promocao}
          onChange={(valor) => alterarApp({ sem_desconto_em_promocao: valor })}
        />
      </Grupo>

      <Grupo titulo="Provadores" texto="Produtos bonificados, identificados pelo começo do nome da marca.">
        <LinhaSwitch
          titulo="Não misturar provador com produto normal"
          texto="O app não deixa colocar os dois no mesmo pedido."
          ligado={app.separar_provadores}
          onChange={(valor) => alterarApp({ separar_provadores: valor })}
        />
        <LinhaCampo titulo="A marca começa com" texto="Exemplo: provador pega Provador Nuev e todas as outras.">
          <input value={provadores.prefixo} onChange={(e) => alterarProvadores({ prefixo: e.target.value })} aria-label="Começo do nome da marca" className={CAMPO} />
        </LinhaCampo>
        <ExcecoesDeProvador excecoes={provadores.excecoes} onChange={(excecoes) => alterarProvadores({ excecoes })} />
      </Grupo>

      <Grupo titulo="Restrição de marcas" texto="Para vendedores, a marca some do catálogo. Para estados, o app bloqueia ao vender para clientes dali.">
        <RestricoesDeMarca restricoes={app.restricoes_marca} opcoes={opcoes} onChange={(restricoes_marca) => alterarApp({ restricoes_marca })} />
      </Grupo>
    </div>
  );
}
