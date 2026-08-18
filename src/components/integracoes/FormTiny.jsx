"use client";

import { useState, useEffect } from "react";
import { Database, Key, Link as LinkIcon, Fingerprint, RefreshCw, ShoppingCart, Users, Package } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormTiny({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formTiny, setFormTiny] = useState({
    nome_integracao: "Tiny ERP (Principal)",
    token: "",
    tenant_id: "",
    // 🟢 REGRAS DE SINCRONIZAÇÃO
    sync_clientes: true,
    sync_pedidos: true,
    sync_produtos: true,
  });

  // Puxa o CNPJ (Tenant) logado para travar a integração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        const cnpj = JSON.parse(storedUser).tenant_id;
        setFormTiny(prev => ({ ...prev, tenant_id: cnpj }));
      }
    }
  }, []);

  const toggleSync = (campo) => {
    setFormTiny(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const salvarTiny = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Conectando e salvando regras no ERP...");

    try {
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/tiny", {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "x-tenant-id": formTiny.tenant_id 
        },
        body: JSON.stringify(formTiny)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Tiny ERP conectado e regras salvas!", { id: loadingToast });
        onSuccess(); 
      } else { 
        toast.error(data.message || "Erro ao conectar com o ERP.", { id: loadingToast });
      }
    } catch (error) { 
      toast.error("Erro de conexão com a Nuvem Raizan.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-blue-200 dark:border-blue-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-blue-500/5 overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col">
      
      {/* 🟢 HEADER DO MODAL */}
      <div className="p-6 md:p-8 border-b border-blue-100 dark:border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-500/30 shrink-0">
            {/* Certifique-se de ter um tiny.png ou tiny.svg na sua pasta public */}
            <img src="/olist.svg" alt="Tiny ERP" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-100 tracking-tight">Tiny ERP</h2>
            <p className="text-xs md:text-sm text-blue-600/80 dark:text-blue-400/80 font-medium mt-1">Configure o Token e o fluxo de dados do sistema.</p>
          </div>
        </div>
        <button 
          onClick={onCancel} 
          className="text-xs md:text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm self-end md:self-auto"
        >
          Cancelar Configuração
        </button>
      </div>

      {/* 🟢 CORPO ROLÁVEL */}
      <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
        <form onSubmit={salvarTiny} className="space-y-8">
          
          {/* CREDENCIAIS DA API */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Key size={16} className="text-blue-500"/> Credenciais da API Tiny
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold flex items-center gap-2 text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  Identificação Interna
                </label>
                <input 
                  type="text" 
                  required 
                  value={formTiny.nome_integracao} 
                  onChange={e => setFormTiny({...formTiny, nome_integracao: e.target.value})} 
                  placeholder="Ex: Tiny Principal" 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold flex items-center gap-2 text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  Token da API
                </label>
                <input 
                  type="password" 
                  required 
                  value={formTiny.token} 
                  onChange={e => setFormTiny({...formTiny, token: e.target.value})} 
                  placeholder="Cole seu Token do Tiny aqui..." 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-blue-500 transition-all dark:text-white" 
                />
                <p className="text-[11px] font-medium text-zinc-500 mt-1">Acesse Configurações &gt; E-commerce &gt; API no Tiny.</p>
              </div>
            </div>
          </div>

          {/* 🟢 REGRAS DE SINCRONIZAÇÃO (SWITCHES) */}
          <div className="space-y-6 pt-2">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <RefreshCw size={16} className="text-blue-500"/> Regras de Sincronização
            </h3>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Selecione quais dados o Raizan Core e o aplicativo Força de Vendas terão permissão para buscar ou enviar para o Tiny ERP.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Opção Clientes */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500"><Users size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Contatos & Clientes</p>
                    <p className="text-[10px] text-zinc-500">Busca e envia novos cadastros.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_clientes')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formTiny.sync_clientes ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formTiny.sync_clientes ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Opção Pedidos */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-500"><ShoppingCart size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Pedidos de Venda</p>
                    <p className="text-[10px] text-zinc-500">Injeta pedidos do App direto no ERP.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_pedidos')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formTiny.sync_pedidos ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formTiny.sync_pedidos ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Opção Produtos */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-500"><Package size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Produtos & Estoque</p>
                    <p className="text-[10px] text-zinc-500">Baixa preços, estoque e fotos.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_produtos')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formTiny.sync_produtos ? 'bg-purple-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formTiny.sync_produtos ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* 🟢 TRAVA DE SEGURANÇA */}
          <div className="p-5 md:p-6 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl space-y-4 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Fingerprint size={80}/>
            </div>
            <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 flex items-center gap-2 relative z-10">
              <Fingerprint size={16} /> Vínculo de Segurança (Tenant)
            </h3>
            <div className="space-y-2 relative z-10">
              <label className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">CNPJ da Base de Dados</label>
              <input 
                type="text" 
                readOnly 
                value={formTiny.tenant_id} 
                className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-500/30 p-2.5 rounded-xl font-mono font-bold text-xs text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" 
              />
              <p className="text-[11px] font-medium text-zinc-500 mt-1">Os pedidos entrarão no Tiny exclusivamente sob este CNPJ.</p>
            </div>
          </div>

          {/* BOTÃO SALVAR */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              <LinkIcon size={18} /> {loading ? "Conectando e Salvando..." : "Conectar e Salvar Regras"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}