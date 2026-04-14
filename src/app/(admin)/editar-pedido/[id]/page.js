"use client";

import { useState, useEffect, use } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Save, Plus, Minus, Trash2, Package, Loader2, AlertTriangle, Calculator, MessageSquare } from "lucide-react";
import Link from "next/link";
import { getApiUrl, getHeaders } from "@/components/utils/api";
import toast from 'react-hot-toast';

export default function EditarPedidoB2B({ params }) {
  const unwrappedParams = use(params); // 🟢 Desempacota a Promessa
  const id = unwrappedParams.id;       // 🟢 Agora sim pegamos o ID real!
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [itens, setItens] = useState([]);
  // 🟢 NOVOS ESTADOS AQUI:
  const [motivo, setMotivo] = useState("");
  const [gerarCredito, setGerarCredito] = useState(true);

  useEffect(() => {
    carregarPedido();
  }, [id]);

  const carregarPedido = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pedidos/${id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setPedido(data.pedido);
        // Extraímos os itens do JSON do pedido
        setItens(data.pedido.line_items || []);
      }
    } catch (e) {
      toast.error("Erro ao carregar detalhes do pedido.");
    } finally {
      setLoading(false);
    }
  };

  const handleQtdChange = (index, novaQtd) => {
    const novosItens = [...itens];
    // 🟢 Agora usamos .quantity em vez de .qtd
    novosItens[index].quantity = Math.max(0, novaQtd); 
    setItens(novosItens);
  };

  const totalOriginal = parseFloat(pedido?.subtotal || pedido?.total || 0);
  // 🟢 Lemos o .price e .quantity (usando parseFloat para garantir que não dê erro com strings)
  const novoTotal = itens.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (item.quantity || 0)), 0);
  const diferenca = totalOriginal - novoTotal;

  const salvarAlteracoes = async () => {
    // 🟢 Validação rápida: exigir motivo se houve alteração
    if (diferenca !== 0 && motivo.trim() === "") {
      toast.error("Por favor, informe o motivo da edição.");
      return;
    }

    setSalvando(true);
    // 🟢 Verifica se o pedido já estava pago para saber se manda o crédito
    const pedidoJaPago = ['pago', 'processing', 'completed'].includes(pedido?.status);

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/pedidos/editar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          pedidoId: id,
          novosItens: itens,
          novoSubtotal: novoTotal,
          motivo: motivo, // 🟢 Mandando o motivo
          gerarCredito: pedidoJaPago && diferenca > 0 ? gerarCredito : false, // 🟢 Manda o crédito só se já pagou
          valorCredito: diferenca
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pedido atualizado e sincronizado com o ERP!");
        window.location.href = "/pedidos"; // aqui ta errado não pode voltar para b2b pedidos se no painel admin é /pedidos
      }
    } catch (e) {
      toast.error("Falha ao salvar edições.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 gap-4">
              <div>
                <Link href="/pedidos" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-2 text-sm mb-2 transition-all">
                  <ArrowLeft size={16} /> Voltar para Gestão
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Package className="text-amber-500" /> Ajustar Pedido #{id}
                </h1>
              </div>

              <button 
                onClick={salvarAlteracoes}
                disabled={salvando}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar e Sincronizar ERP
              </button>
            </div>

            {/* 🟢 ALERTA INTELIGENTE E CAMPO DE MOTIVO */}
            {diferenca > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl flex flex-col gap-4">
                <div className="flex items-start gap-4 text-amber-400">
                  <AlertTriangle size={24} className="shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-base mb-1">
                      Ajuste de Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferenca)} a menos
                    </h4>
                    
                    {/* A lógica que você pediu: verifica se já pagou */}
                    {['pago', 'processing', 'completed'].includes(pedido?.status) ? (
                       <p className="text-sm text-amber-500/80">O cliente <b>já realizou o pagamento</b> deste pedido. Escolha como tratar a diferença financeira:</p>
                    ) : (
                       <p className="text-sm text-emerald-500 font-medium">O cliente <b>ainda não pagou</b>. O valor da cobrança (PIX/Boleto) será atualizado automaticamente para o novo total.</p>
                    )}
                  </div>
                </div>

                {/* Se já pagou, mostra a opção da carteira */}
                {['pago', 'processing', 'completed'].includes(pedido?.status) && (
                   <label className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-xl border border-amber-500/20 cursor-pointer w-fit transition-all hover:bg-zinc-900/80">
                     <input
                       type="checkbox"
                       checked={gerarCredito}
                       onChange={(e) => setGerarCredito(e.target.checked)}
                       className="w-5 h-5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-950 cursor-pointer"
                     />
                     <span className="text-sm font-bold text-zinc-200">
                       Gerar {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diferenca)} em créditos na Carteira do Lojista
                     </span>
                   </label>
                )}
              </div>
            )}

            {/* 🟢 CAMPO DE MOTIVO DA EDIÇÃO (Sempre aparece para log) */}
            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5">
              <label className="flex items-center gap-2 text-sm font-bold text-zinc-200 mb-3">
                 <MessageSquare size={16} className="text-blue-400" />
                 Motivo da Edição <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Furo de estoque no produto XYZ. Combinado com o cliente via WhatsApp."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none h-24 placeholder:text-zinc-600"
              />
            </div>

            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 text-center">Preço Unit.</th>
                    <th className="px-6 py-4 text-center">Qtd Atual</th>
                    <th className="px-6 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {itens.map((item, index) => {
                    // Extraímos e garantimos que são números
                    const preco = parseFloat(item.price || 0);
                    const quantidade = item.quantity || 0;

                    return (
                    <tr key={item.id || item.sku} className="hover:bg-zinc-900/30 transition-colors">
                      {/* 🟢 item.name em vez de PDNOME */}
                      <td className="px-6 py-4 font-medium text-zinc-200">{item.name}</td>
                      
                      <td className="px-6 py-4 text-center text-zinc-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco)}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleQtdChange(index, quantidade - 1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg"><Minus size={14}/></button>
                          
                          {/* 🟢 Mostra a quantidade nova */}
                          <span className="w-8 text-center font-bold text-emerald-400">{quantidade}</span>
                          
                          <button onClick={() => handleQtdChange(index, quantidade + 1)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg"><Plus size={14}/></button>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right font-bold text-zinc-100">
                        {/* 🟢 Calcula o subtotal da linha */}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco * quantidade)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="p-8 bg-zinc-900/20 border-t border-zinc-800 flex flex-col items-end gap-2">
                 <div className="flex items-center gap-4 text-zinc-500">
                    <span>Total Anterior:</span>
                    <span className="line-through">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOriginal)}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-zinc-100">Novo Total:</span>
                    <span className="text-3xl font-black text-emerald-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(novoTotal)}
                    </span>
                 </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
