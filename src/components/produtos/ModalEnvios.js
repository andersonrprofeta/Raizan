"use client";

import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { X, PackageOpen, Store, Loader2, ChevronRight } from "lucide-react";

export default function ModalEnvios({ isOpen, onClose, produto, onSuccess }) {
  const [lojasWoo, setLojasWoo] = useState([]);
  const [lojaSelecionada, setLojaSelecionada] = useState("");
  const [categoriasWoo, setCategoriasWoo] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  
  const [loadingLojas, setLoadingLojas] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const pegarCnpjLogado = () => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  // 1. Quando o modal abre, busca as lojas WooCommerce disponíveis!
  useEffect(() => {
    if (isOpen && produto) {
      setLojaSelecionada("");
      setCategoriaSelecionada("");
      setCategoriasWoo([]);
      buscarLojas();
    }
  }, [isOpen, produto]);

  const buscarLojas = async () => {
    const tenantId = pegarCnpjLogado();
    setLoadingLojas(true);
    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/pedidos/integracoes-ativas", { 
        headers: { "x-tenant-id": tenantId } 
      });
      const data = await res.json();
      if (data.success) {
        // Filtra só o que for WooCommerce
        const wooStores = data.ativas.filter(int => String(int.plataforma).toLowerCase().includes('woo'));
        setLojasWoo(wooStores);
      }
    } catch (error) {
      toast.error("Falha ao buscar lojas.");
    } finally {
      setLoadingLojas(false);
    }
  };

  // 2. Quando o usuário escolhe a loja, buscamos as categorias DELA!
  const handleSelecionarLoja = async (lojaId) => {
    setLojaSelecionada(lojaId);
    setCategoriaSelecionada("");
    setLoadingCategorias(true);
    const tenantId = pegarCnpjLogado();

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/sincronizar/woocommerce/categorias?integracao_id=${lojaId}`, { 
        headers: { "x-tenant-id": tenantId } 
      });
      const data = await res.json();
      if (data.success) {
        setCategoriasWoo(data.categorias);
      } else {
        toast.error("Erro ao buscar categorias dessa loja.");
      }
    } catch (error) {
      toast.error("Falha na comunicação.");
    } finally {
      setLoadingCategorias(false);
    }
  };

  // 3. O DISPARO DO SNIPER
  const confirmarEnvioLoja = async () => {
    if (!lojaSelecionada) return toast.error("Selecione a Loja de destino!");
    if (!categoriaSelecionada) return toast.error("Selecione uma categoria!");

    const tenantId = pegarCnpjLogado();
    const toastId = toast.loading(`Sincronizando ${produto.nome}...`);
    setEnviando(true);
    
    try {
      const res = await fetch('https://api.raizan.com.br/api/hub/sincronizar/woocommerce', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ 
          produto_id: produto.id, 
          categoria_woo_id: categoriaSelecionada,
          integracao_id: lojaSelecionada 
        }) 
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Enviado com sucesso!`, { id: toastId });
        onSuccess(produto.id); // Avisa o pai que deu certo pra atualizar a tabela
        onClose(); // Fecha o modal
      } else {
        toast.error(data.message || "Erro ao sincronizar", { id: toastId });
      }
    } catch (error) {
      toast.error(`Falha ao enviar.`, { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e]">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Enviar para o e-commerce</h2>
            <p className="text-sm text-zinc-500 mt-1">Selecione o destino e a categoria para sincronizar.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm border border-purple-100 dark:border-purple-800/30">
              <PackageOpen size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Produto Selecionado</p>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{produto?.nome}</h3>
              <p className="text-sm text-zinc-500">SKU: {produto?.sku || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <Store size={14} className="text-purple-500"/> 1. Escolha a Loja
              </label>
              {loadingLojas ? (
                <div className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 text-sm text-zinc-500">
                  <Loader2 size={16} className="animate-spin" /> Buscando lojas...
                </div>
              ) : (
                <select 
                  value={lojaSelecionada} 
                  onChange={(e) => handleSelecionarLoja(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer shadow-sm"
                >
                  <option value="" disabled>Selecione o site destino...</option>
                  {lojasWoo.map(loja => (
                    <option key={loja.id} value={loja.id}>{loja.nome_integracao || "WooCommerce"}</option>
                  ))}
                </select>
              )}
              <div className="hidden md:flex absolute -right-4 top-[60%] translate-x-1/2 items-center justify-center w-8 h-8 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-full z-10 shadow-sm">
                <ChevronRight size={16} className="text-zinc-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <img src="/woocommerce.svg" alt="Woo" className="w-3 h-3 object-contain opacity-50" /> 
                2. Categoria na Loja
              </label>
              
              {!lojaSelecionada ? (
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-400 cursor-not-allowed text-center">
                  Aguardando loja...
                </div>
              ) : loadingCategorias ? (
                <div className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-purple-50 dark:bg-purple-900/10 text-sm text-purple-600 dark:text-purple-400">
                  <Loader2 size={16} className="animate-spin" /> Carregando categorias...
                </div>
              ) : (
                <select 
                  value={categoriaSelecionada} 
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100 font-medium cursor-pointer shadow-sm"
                >
                  <option value="" disabled>Selecione a categoria correspondente</option>
                  {categoriasWoo.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-50 dark:bg-[#0c0c0e] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={confirmarEnvioLoja}
            disabled={!categoriaSelecionada || loadingCategorias || enviando}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <img src="/woocommerce.svg" alt="Woo" className="w-4 h-4 object-contain brightness-0 invert" />}
            Sincronizar Produto
          </button>
        </div>

      </div>
    </div>
  );
}