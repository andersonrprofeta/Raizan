"use client";

// Vínculos da NF-e de entrada: ligar o item da nota a um produto do cadastro e ligar a nota a um pedido de compra.
// O vínculo de produto fica lembrado pelo código do fornecedor: a próxima nota dele já chega ligada.

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link2, Loader2, Search, Unlink } from "lucide-react";
import { api, BOTAO_SECUNDARIO, CAMPO, Modal, moeda } from "@/components/vendedores/ui";
import { SeloStatus, diaCurto, quantidade } from "@/components/compras/ui";

function useBusca(montarUrl, chave, minimo = 2) {
  const [termo, setTermo] = useState("");
  // Guarda para qual termo a lista veio: enquanto o termo digitado for outro, a tela mostra "carregando"
  const [achados, setAchados] = useState({ termo: null, lista: [] });
  const limpo = termo.trim();
  useEffect(() => {
    if (limpo.length < minimo) return undefined;
    let ativo = true;
    const espera = setTimeout(async () => {
      let lista = [];
      try {
        const resposta = await api(montarUrl(limpo));
        lista = resposta.success ? resposta[chave] || [] : [];
      } catch (erro) {
        lista = [];
      }
      if (ativo) setAchados({ termo: limpo, lista });
    }, limpo ? 280 : 0);
    return () => { ativo = false; clearTimeout(espera); };
  }, [limpo, montarUrl, chave, minimo]);
  const resultado = limpo.length < minimo ? [] : achados.termo === limpo ? achados.lista : null;
  return { termo, setTermo, resultado };
}

const urlDeProdutos = (termo) => `/compras/produtos?busca=${encodeURIComponent(termo)}`;

export function VincularProduto({ compraId, item, fornecedor, onFechar, onVinculado }) {
  const { termo, setTermo, resultado } = useBusca(urlDeProdutos, "produtos");
  const [enviando, setEnviando] = useState(null);

  const vincular = async (produtoId) => {
    setEnviando(produtoId || "desfazer");
    try {
      const resposta = await api(`/compras/${compraId}/itens/${item.id}/produto`, { metodo: "PUT", corpo: { produto_id: produtoId } });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível vincular."); return; }
      toast.success(resposta.message);
      onVinculado();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Modal titulo="Vincular produto" descricao="Escolha o produto do seu cadastro que corresponde a este item da nota." onFechar={onFechar} largura="max-w-2xl">
      <div className="space-y-4">
        <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3 text-sm">
          <p className="text-[11px] text-zinc-500">Na nota do fornecedor</p>
          <p className="font-semibold">{item.descricao}</p>
          <p className="text-xs text-zinc-500">
            {[item.codigo_fornecedor && `Código dele: ${item.codigo_fornecedor}`, item.ean && `EAN ${item.ean}`, `${quantidade(item.quantidade)} ${item.unidade || ""}`].filter(Boolean).join(" · ")}
          </p>
          {item.produto_id && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs">Ligado hoje a <b>{item.produto_nome || item.sku}</b></p>
              <button type="button" disabled={Boolean(enviando)} onClick={() => vincular(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"><Unlink size={12} />Desfazer vínculo</button>
            </div>
          )}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input autoFocus value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Busque por nome, SKU ou EAN" className={`${CAMPO} pl-11`} />
        </div>

        <div className="max-h-[320px] overflow-y-auto custom-scrollbar -mx-1">
          {termo.trim().length < 2 ? <p className="text-sm text-zinc-500 text-center py-8">Digite ao menos 2 letras para buscar.</p>
            : resultado === null ? <div className="py-8 flex justify-center text-zinc-400"><Loader2 className="animate-spin" /></div>
              : resultado.length === 0 ? <p className="text-sm text-zinc-500 text-center py-8">Nenhum produto encontrado.</p>
                : (
                  <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                    {resultado.map((produto) => (
                      <li key={produto.id}>
                        <button type="button" disabled={Boolean(enviando)} onClick={() => vincular(produto.id)} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-500/[0.06] disabled:opacity-50">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium truncate">{produto.nome}</span>
                            <span className="block text-[11px] font-mono text-zinc-500 truncate">{[produto.sku, produto.gtin, produto.marca].filter(Boolean).join(" · ")}</span>
                          </span>
                          {enviando === produto.id ? <Loader2 size={15} className="animate-spin text-purple-600" /> : <Link2 size={15} className="text-zinc-400" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
        </div>
        {fornecedor && <p className="text-xs text-zinc-500">O Core guarda este vínculo para {fornecedor}. Nas próximas notas dele, este item já chega ligado.</p>}
      </div>
    </Modal>
  );
}

export function VincularPedido({ compraId, pedidoAtual, onFechar, onVinculado }) {
  const [montarUrl] = useState(() => (termo) => `/compras/${compraId}/pedidos-para-vincular?busca=${encodeURIComponent(termo)}`);
  const { termo, setTermo, resultado } = useBusca(montarUrl, "pedidos", 0);
  const [enviando, setEnviando] = useState(null);

  const vincular = async (pedidoId) => {
    setEnviando(pedidoId || "desfazer");
    try {
      const resposta = await api(`/compras/${compraId}/pedido`, { metodo: "PUT", corpo: { pedido_id: pedidoId } });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível ligar a nota."); return; }
      toast.success(resposta.message);
      onVinculado();
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Modal titulo="Ligar a um pedido de compra" descricao="Pedidos do mesmo fornecedor aparecem primeiro." onFechar={onFechar} largura="max-w-2xl">
      <div className="space-y-4">
        {pedidoAtual && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-3 text-sm">
            <p>Ligada hoje ao pedido <b className="tabular-nums">nº {pedidoAtual.numero_documento}</b></p>
            <button type="button" disabled={Boolean(enviando)} onClick={() => vincular(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"><Unlink size={12} />Desligar</button>
          </div>
        )}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Número do pedido ou fornecedor" className={`${CAMPO} pl-11`} />
        </div>
        <div className="max-h-[340px] overflow-y-auto custom-scrollbar -mx-1">
          {resultado === null ? <div className="py-8 flex justify-center text-zinc-400"><Loader2 className="animate-spin" /></div>
            : resultado.length === 0 ? <p className="text-sm text-zinc-500 text-center py-8">Nenhum pedido de compra encontrado.</p>
              : (
                <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {resultado.map((pedido) => (
                    <li key={pedido.id}>
                      <button type="button" disabled={Boolean(enviando) || pedido.id === pedidoAtual?.id} onClick={() => vincular(pedido.id)} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-500/[0.06] disabled:opacity-50">
                        <span className="font-semibold tabular-nums w-16 shrink-0">{pedido.numero_documento}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate">{pedido.fornecedor || "Fornecedor não informado"}</span>
                          <span className="block text-[11px] text-zinc-500">
                            {diaCurto(pedido.data_emissao)} · {pedido.origem_documento === "core" ? "Feito no Core" : "Veio da integração"}
                            {pedido.mesmo_fornecedor && <span className="ml-1.5 font-semibold text-emerald-600 dark:text-emerald-400">· mesmo fornecedor</span>}
                          </span>
                        </span>
                        <span className="hidden sm:block"><SeloStatus status={pedido.status} /></span>
                        <span className="text-sm font-semibold tabular-nums">{moeda(pedido.valor_total)}</span>
                        {enviando === pedido.id && <Loader2 size={15} className="animate-spin text-purple-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
        </div>
        <div className="flex justify-end"><button type="button" onClick={onFechar} className={BOTAO_SECUNDARIO}>Fechar</button></div>
      </div>
    </Modal>
  );
}
