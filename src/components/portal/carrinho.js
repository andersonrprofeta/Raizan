"use client";

// O carrinho fica no navegador. Todas as telas leem daqui, e por isso mostram sempre o mesmo número.

import { useMemo, useSyncExternalStore } from "react";
import toast from "react-hot-toast";
import { resumirCarrinho } from "./precos";
import { lerUsuario } from "./sessao";

const CHAVE = "@raizan:carrinho";
const EVENTO = "raizan:carrinho";
const CHAVE_DO_DONO = "@raizan:carrinho_dono";
const VAZIO = {};

let textoLido = null;
let lido = VAZIO;

// Ofertas antigas entravam com o id. Hoje a chave é sempre o SKU, a mesma que a API confere.
function porSku(salvo) {
  const itens = Object.values(salvo || {}).filter((item) => item?.sku && item.qtd > 0);
  return itens.length ? Object.fromEntries(itens.map((item) => [String(item.sku), item])) : VAZIO;
}

function ler() {
  const texto = localStorage.getItem(CHAVE);
  if (texto === textoLido) return lido;
  textoLido = texto;
  try {
    lido = porSku(JSON.parse(texto));
  } catch (erro) {
    lido = VAZIO;
  }
  return lido;
}

function gravar(carrinho) {
  localStorage.setItem(CHAVE, JSON.stringify(carrinho));
  localStorage.setItem(CHAVE_DO_DONO, lerUsuario()?.email || "");
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(avisar) {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO, avisar);
  };
}

export function useCarrinho() {
  const carrinho = useSyncExternalStore(assinar, ler, () => VAZIO);
  return useMemo(() => ({ carrinho, ...resumirCarrinho(carrinho) }), [carrinho]);
}

export function definirQuantidade(produto, quantidade) {
  const atual = ler();
  const anterior = atual[produto.sku]?.qtd || 0;
  const qtd = Math.max(0, Math.floor(Number(quantidade)) || 0);
  const estoque = Number(produto.estoque_inicial) || 0;

  const novo = { ...atual };
  if (qtd === 0) delete novo[produto.sku];
  else novo[produto.sku] = { ...produto, qtd };
  gravar(novo);

  if (estoque > 0 && qtd > estoque && anterior <= estoque) {
    toast(`Só temos ${estoque} em estoque. O que passar disso pode ser cortado.`, { icon: "⚠️", id: "acima-do-estoque" });
  }
}

export function somarAoCarrinho(produtos) {
  const novo = { ...ler() };
  produtos.forEach(({ produto, qtd }) => {
    novo[produto.sku] = { ...produto, qtd: (novo[produto.sku]?.qtd || 0) + qtd };
  });
  gravar(novo);
}

// Põe de novo no carrinho os itens de um pedido antigo que ainda têm estoque
export function repetirPedido(pedido, catalogo) {
  const produtos = new Map((catalogo || []).map((produto) => [String(produto.sku), produto]));
  const encontrados = (pedido?.line_items || [])
    .map((item) => ({ produto: produtos.get(String(item.sku)), qtd: Number(item.quantity) || 1 }))
    .filter(({ produto }) => produto?.estoque_inicial > 0);

  if (encontrados.length === 0) {
    toast.error("Nenhum item deste pedido está disponível agora.");
    return false;
  }
  somarAoCarrinho(encontrados);
  const fora = (pedido.line_items?.length || 0) - encontrados.length;
  toast.success(fora > 0 ? `${encontrados.length} itens no carrinho. ${fora} sem estoque ficaram de fora.` : "Itens adicionados ao carrinho.");
  return true;
}

// Quem sai e entra de novo encontra o carrinho como deixou; outro lojista no mesmo aparelho começa vazio
export function prepararCarrinhoPara(email) {
  const dono = localStorage.getItem(CHAVE_DO_DONO);
  if (dono !== null && dono !== (email || "")) {
    localStorage.removeItem(CHAVE);
    localStorage.removeItem(CHAVE_DO_DONO);
  }
}

export function esvaziarCarrinho() {
  gravar({});
}

// O carrinho guarda o preço de quando o item entrou: sem isto, a API recusaria o pedido por preço antigo
export function atualizarPrecos(catalogo) {
  const atual = ler();
  const produtos = new Map(catalogo.map((produto) => [String(produto.sku), produto]));
  const novo = Object.fromEntries(Object.entries(atual).map(([sku, item]) => {
    const produto = produtos.get(sku);
    return [sku, produto ? { ...produto, qtd: item.qtd } : item];
  }));
  if (Object.keys(novo).length > 0) gravar(novo);
}
