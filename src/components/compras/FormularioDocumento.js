"use client";

// Formulário de orçamento e pedido de compra do Core (Central de Compras e página do documento).

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Search, Trash2 } from "lucide-react";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Modal, ROTULO, moeda } from "@/components/vendedores/ui";
import { TIPOS, quantidade } from "@/components/compras/ui";

// ==========================================
// FORMULÁRIO: ORÇAMENTO OU PEDIDO
// ==========================================
const itemVazio = (produto) => ({
  chave: `${Date.now()}-${Math.random()}`,
  produto_id: produto?.id || null,
  sku: produto?.sku || "",
  ean: produto?.gtin || "",
  descricao: produto?.nome || "",
  fabricante: produto?.marca || "",
  unidade: produto?.unidade || "UN",
  quantidade: "1",
  valor_unitario: produto?.ultimo_custo ? String(produto.ultimo_custo).replace(".", ",") : "",
});
const lerNumero = (texto) => Number(String(texto || "0").replace(/\./g, "").replace(",", ".")) || 0;

function BuscaDeProduto({ onEscolher }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const ultima = useRef(0);

  useEffect(() => {
    const busca = termo.trim();
    if (busca.length < 2) return undefined;
    const numero = ++ultima.current;
    const espera = setTimeout(async () => {
      setBuscando(true);
      try {
        const resposta = await api(`/compras/produtos?busca=${encodeURIComponent(busca)}`);
        if (numero === ultima.current) setResultados(resposta.success ? resposta.produtos : []);
      } catch (erro) {
        if (numero === ultima.current) setResultados([]);
      } finally {
        if (numero === ultima.current) setBuscando(false);
      }
    }, 250);
    return () => clearTimeout(espera);
  }, [termo]);

  const escolher = (produto) => { onEscolher(produto); setTermo(""); setResultados([]); };
  const aberto = termo.trim().length >= 2;

  return (
    <div className="relative">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (resultados[0]) escolher(resultados[0]); } }}
        placeholder="Buscar produto por nome, SKU ou EAN"
        aria-label="Buscar produto"
        className={`${CAMPO} pl-11`}
      />
      {aberto && (
        <div className="absolute z-30 left-0 right-0 mt-2 max-h-72 overflow-y-auto custom-scrollbar rounded-2xl bg-white dark:bg-[#1c1c1f] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)]">
          {buscando && resultados.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500"><Loader2 size={14} className="animate-spin" />Buscando...</p>
          ) : resultados.length === 0 ? (
            <button type="button" onClick={() => escolher({ nome: termo.trim() })} className="w-full text-left px-4 py-3 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.05]">
              Nenhum produto encontrado. <span className="font-semibold text-purple-600 dark:text-purple-400">Incluir “{termo.trim()}” como item avulso</span>
            </button>
          ) : resultados.map((produto) => (
            <button key={produto.id} type="button" onClick={() => escolher(produto)} className="w-full text-left flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-purple-500/[0.06] transition-colors">
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{produto.nome}</span>
                <span className="block text-[11px] font-mono text-zinc-500 truncate">{[produto.sku, produto.gtin, produto.marca].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-xs text-zinc-500">Estoque {quantidade(produto.estoque_inicial)}</span>
                {produto.ultimo_custo !== null && <span className="block text-[11px] text-zinc-400">Última compra {moeda(produto.ultimo_custo)}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// inicial: rascunho vindo de fora (ex.: sugestão de compras) com fornecedor e observação
export function FormularioDocumento({ tipo, documento, itensAtuais, fornecedores, inicial, onFechar, onSalvo }) {
  const [dados, setDados] = useState(() => ({
    fornecedor: documento?.fornecedor || inicial?.fornecedor || "",
    fornecedor_documento: documento?.fornecedor_documento || "",
    data_previsao: documento?.data_previsao || "",
    condicoes_comerciais: documento?.condicoes_comerciais || "",
    observacao: documento?.observacao || inicial?.observacao || "",
  }));
  const [itens, setItens] = useState(() => (itensAtuais || []).map((item) => ({
    ...itemVazio(),
    produto_id: item.produto_id, sku: item.sku || "", ean: item.ean || "", descricao: item.descricao, fabricante: item.fabricante || "", unidade: item.unidade || "UN",
    quantidade: String(item.quantidade).replace(".", ","), valor_unitario: String(item.valor_unitario ?? "").replace(".", ","),
  })));
  const [salvando, setSalvando] = useState(false);

  const total = itens.reduce((soma, item) => soma + lerNumero(item.quantidade) * lerNumero(item.valor_unitario), 0);
  const mudarItem = (chave, campo, valor) => setItens((lista) => lista.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)));

  const salvar = async () => {
    if (!dados.fornecedor.trim()) { toast.error("Informe o fornecedor."); return; }
    const validos = itens.filter((item) => item.descricao.trim() && lerNumero(item.quantidade) > 0);
    if (validos.length === 0) { toast.error("Inclua ao menos um produto com quantidade."); return; }

    setSalvando(true);
    const corpo = {
      ...dados,
      tipo_documento: tipo,
      itens: validos.map((item) => ({
        produto_id: item.produto_id, sku: item.sku, ean: item.ean, descricao: item.descricao, fabricante: item.fabricante, unidade: item.unidade,
        quantidade: lerNumero(item.quantidade), valor_unitario: lerNumero(item.valor_unitario),
      })),
    };
    try {
      const resposta = documento ? await api(`/compras/${documento.id}`, { metodo: "PUT", corpo }) : await api("/compras", { metodo: "POST", corpo });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível salvar."); return; }
      toast.success(documento ? "Alterações salvas." : `${TIPOS[tipo].rotulo} nº ${resposta.numero_documento} criado.`);
      onSalvo(documento?.id || resposta.id);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const titulo = documento ? `${TIPOS[tipo].rotulo} nº ${documento.numero_documento}` : tipo === "orcamento" ? "Novo orçamento" : "Novo pedido de compra";

  return (
    <Modal
      titulo={titulo}
      descricao={tipo === "orcamento" ? "Consulte o fornecedor antes de comprar. Depois de aprovado, vira pedido." : "O pedido passa pela aprovação antes de ser emitido ao fornecedor."}
      onFechar={onFechar}
      largura="max-w-4xl"
      rodape={(
        <>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-xl font-semibold tracking-tight tabular-nums">{moeda(total)}</p>
          </div>
          <button type="button" onClick={onFechar} className={BOTAO_SECUNDARIO}>Cancelar</button>
          <button type="button" onClick={salvar} disabled={salvando} className={BOTAO_PRIMARIO}>{salvando ? <Loader2 size={16} className="animate-spin" /> : null}Salvar</button>
        </>
      )}
    >
      <div className="space-y-6 pb-4">
        <div className="grid sm:grid-cols-[minmax(0,1fr)_200px] gap-4">
          <div>
            <label className={ROTULO} htmlFor="doc-fornecedor">Fornecedor</label>
            <input id="doc-fornecedor" list="lista-fornecedores" value={dados.fornecedor} onChange={(e) => setDados({ ...dados, fornecedor: e.target.value })} className={CAMPO} placeholder="Nome do fornecedor" autoComplete="off" />
            <datalist id="lista-fornecedores">{fornecedores.map((nome) => <option key={nome} value={nome} />)}</datalist>
          </div>
          <div>
            <label className={ROTULO} htmlFor="doc-cnpj">CNPJ (opcional)</label>
            <input id="doc-cnpj" inputMode="numeric" value={dados.fornecedor_documento} onChange={(e) => setDados({ ...dados, fornecedor_documento: e.target.value })} className={CAMPO} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className={ROTULO} htmlFor="doc-condicoes">Condições comerciais</label>
            <input id="doc-condicoes" value={dados.condicoes_comerciais} onChange={(e) => setDados({ ...dados, condicoes_comerciais: e.target.value })} className={CAMPO} placeholder="Ex.: 30/60/90 dias, frete CIF" maxLength={255} />
          </div>
          <div>
            <label className={ROTULO} htmlFor="doc-previsao">Previsão de entrega</label>
            <input id="doc-previsao" type="date" value={dados.data_previsao} onChange={(e) => setDados({ ...dados, data_previsao: e.target.value })} className={CAMPO} />
          </div>
        </div>

        <div>
          <p className={ROTULO}>Produtos</p>
          <BuscaDeProduto onEscolher={(produto) => setItens((lista) => [...lista, itemVazio(produto)])} />
          {itens.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] px-4 py-6 text-center text-sm text-zinc-500">Busque e inclua os produtos da compra.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {itens.map((item) => (
                <li key={item.chave} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_96px_128px_110px_36px] items-center gap-2 sm:gap-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-3 sm:px-4 py-2.5">
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <p className="text-sm font-medium truncate">{item.descricao}</p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">{[item.sku, item.ean, item.fabricante].filter(Boolean).join(" · ") || "Item avulso"}</p>
                  </div>
                  <input aria-label={`Quantidade de ${item.descricao}`} inputMode="decimal" value={item.quantidade} onChange={(e) => mudarItem(item.chave, "quantidade", e.target.value)} className={`${CAMPO} h-10 text-right tabular-nums`} placeholder="Qtd" />
                  <input aria-label={`Valor unitário de ${item.descricao}`} inputMode="decimal" value={item.valor_unitario} onChange={(e) => mudarItem(item.chave, "valor_unitario", e.target.value)} className={`${CAMPO} h-10 text-right tabular-nums`} placeholder="R$ unitário" />
                  <p className="hidden sm:block text-right text-sm font-semibold tabular-nums">{moeda(lerNumero(item.quantidade) * lerNumero(item.valor_unitario))}</p>
                  <button type="button" aria-label={`Tirar ${item.descricao}`} onClick={() => setItens((lista) => lista.filter((x) => x.chave !== item.chave))} className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={ROTULO} htmlFor="doc-obs">Observações</label>
          <textarea id="doc-obs" rows={3} maxLength={2000} value={dados.observacao} onChange={(e) => setDados({ ...dados, observacao: e.target.value })} className={`${CAMPO} h-auto py-3 resize-none`} placeholder="Combinados com o fornecedor, prazos, frete..." />
        </div>
      </div>
    </Modal>
  );
}

