"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Barcode, Trash2 } from "lucide-react";

const formatarMoeda = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);

export default function PDV() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({});
  const [search, setSearch] = useState("");

  // 🔥 MOCK (depois liga na sua API igual catálogo)
  useEffect(() => {
    setProdutos([
      { id: 1, nome: "Perfume A", preco: 59.9 },
      { id: 2, nome: "Perfume B", preco: 89.9 },
      { id: 3, nome: "Body Splash", preco: 29.9 },
    ]);
  }, []);

  const addProduto = (p) => {
    setCarrinho((prev) => {
      const novo = { ...prev };
      if (!novo[p.id]) {
        novo[p.id] = { ...p, qtd: 1 };
      } else {
        novo[p.id].qtd++;
      }
      return novo;
    });
  };

  const remover = (id) => {
    setCarrinho((prev) => {
      const novo = { ...prev };
      delete novo[id];
      return novo;
    });
  };

  const total = Object.values(carrinho).reduce(
    (acc, item) => acc + item.preco * item.qtd,
    0
  );

  return (
    <div className="flex h-screen bg-[#09090b] text-white">

      {/* PRODUTOS */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* BUSCA */}
        <div className="mb-6 flex gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 text-zinc-500" />
            <input
              placeholder="Buscar ou bipar código..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="bg-zinc-900 border border-zinc-800 px-4 rounded-xl">
            <Barcode />
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-4 gap-4">
          {produtos.map((p) => (
            <div
              key={p.id}
              onClick={() => addProduto(p)}
              className="bg-zinc-900 hover:bg-zinc-800 p-4 rounded-xl cursor-pointer transition"
            >
              <div className="h-28 bg-zinc-800 rounded mb-3" />
              <h2 className="font-bold text-sm">{p.nome}</h2>
              <p className="text-emerald-400 font-bold">
                {formatarMoeda(p.preco)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CARRINHO */}
      <div className="w-[360px] bg-zinc-950 border-l border-zinc-800 flex flex-col">

        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <ShoppingCart className="text-emerald-400" />
          <h2 className="font-bold">Carrinho</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Object.values(carrinho).map((item) => (
            <div key={item.id} className="bg-zinc-900 p-3 rounded-xl">
              <div className="flex justify-between">
                <span>{item.nome}</span>
                <button onClick={() => remover(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-sm text-zinc-400">
                {item.qtd}x {formatarMoeda(item.preco)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex justify-between mb-3">
            <span>Total</span>
            <span className="text-emerald-400 font-bold">
              {formatarMoeda(total)}
            </span>
          </div>

          <button className="w-full bg-emerald-600 hover:bg-emerald-500 p-3 rounded-xl font-bold">
            Finalizar Venda
          </button>
        </div>
      </div>
    </div>
  );
}