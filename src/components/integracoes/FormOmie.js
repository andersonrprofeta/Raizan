"use client";

import { useState, useEffect } from "react";
import { Database, Key, Link as LinkIcon, Fingerprint, RefreshCw, ShoppingCart, Users, Receipt, Briefcase } from "lucide-react";
import toast from 'react-hot-toast';

export default function FormOmie({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formOmie, setFormOmie] = useState({
    nome_integracao: "Omie ERP (Matriz)",
    app_key: "",
    app_secret: "",
    tenant_id: "",
    // 🟢 ESTES SÃO OS CHECKBOXES MÁGICOS DE SINCRONIZAÇÃO
    sync_clientes: true,
    sync_pedidos: true,
    sync_produtos: true,
    sync_financeiro: false,
    sync_vendedores: true,
  });

  // Puxa o CNPJ (Tenant) logado para travar a integração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) {
        const cnpj = JSON.parse(storedUser).tenant_id;
        setFormOmie(prev => ({ ...prev, tenant_id: cnpj }));
      }
    }
  }, []);

  const toggleSync = (campo) => {
    setFormOmie(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const salvarOmie = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Conectando e salvando regras no ERP...");

    try {
      // 🟢 Quando você salvar isso, o Node.js vai gravar essas chaves true/false na tabela
      const res = await fetch("https://api.raizan.com.br/api/hub/integracoes/omie", {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "x-tenant-id": formOmie.tenant_id 
        },
        body: JSON.stringify(formOmie)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Omie ERP conectado e regras salvas!", { id: loadingToast });
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
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0c0c0e] border border-emerald-200 dark:border-emerald-500/30 rounded-3xl animate-in fade-in slide-in-from-right-4 shadow-2xl shadow-emerald-500/5 overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col">
      
      {/* 🟢 HEADER DO MODAL */}
      <div className="p-6 md:p-8 border-b border-emerald-100 dark:border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10 gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-[#121214] p-3 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-500/30 shrink-0">
            <img src="/omie.png" alt="Omie ERP" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-emerald-900 dark:text-emerald-100 tracking-tight">Omie ERP</h2>
            <p className="text-xs md:text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-1">Configure as credenciais e o fluxo de dados do sistema.</p>
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
        <form onSubmit={salvarOmie} className="space-y-8">
          
          {/* CREDENCIAIS DA API */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <Key size={16} className="text-emerald-500"/> Credenciais da API Omie
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-2 text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                Identificação Interna
              </label>
              <input 
                type="text" 
                required 
                value={formOmie.nome_integracao} 
                onChange={e => setFormOmie({...formOmie, nome_integracao: e.target.value})} 
                placeholder="Ex: Omie Matriz" 
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all dark:text-white" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold flex items-center gap-2 text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  App Key (Chave)
                </label>
                <input 
                  type="text" 
                  required 
                  value={formOmie.app_key} 
                  onChange={e => setFormOmie({...formOmie, app_key: e.target.value})} 
                  placeholder="Ex: 38333295000..." 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-emerald-500 transition-all dark:text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold flex items-center gap-2 text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  App Secret (Segredo)
                </label>
                <input 
                  type="password" 
                  required 
                  value={formOmie.app_secret} 
                  onChange={e => setFormOmie({...formOmie, app_secret: e.target.value})} 
                  placeholder="Ex: 8b3c3b..." 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl font-mono text-sm outline-none focus:border-emerald-500 transition-all dark:text-white" 
                />
                <p className="text-[11px] font-medium text-zinc-500 mt-1">Acesse o portal do desenvolvedor Omie para gerar as chaves.</p>
              </div>
            </div>
          </div>

          {/* 🟢 REGRAS DE SINCRONIZAÇÃO (SWITCHES) */}
          <div className="space-y-6 pt-2">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <RefreshCw size={16} className="text-emerald-500"/> Regras de Sincronização
            </h3>
            
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Selecione quais dados o Raizan Core e o aplicativo Força de Vendas terão permissão para buscar ou enviar para o Omie.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Opção Clientes */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500"><Users size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Clientes & B2B</p>
                    <p className="text-[10px] text-zinc-500">Busca clientes, limites e cadastra novos.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_clientes')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formOmie.sync_clientes ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formOmie.sync_clientes ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Opção Pedidos */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-500"><ShoppingCart size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Pedidos de Venda</p>
                    <p className="text-[10px] text-zinc-500">Injeta pedidos do App e do Site no ERP.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_pedidos')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formOmie.sync_pedidos ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formOmie.sync_pedidos ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Opção Produtos */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-500"><Database size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Produtos & Estoque</p>
                    <p className="text-[10px] text-zinc-500">Baixa tabela de preços, estoque e impostos.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_produtos')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formOmie.sync_produtos ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formOmie.sync_produtos ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Opção Vendedores */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg text-orange-500"><Briefcase size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Força de Vendas</p>
                    <p className="text-[10px] text-zinc-500">Importa vendedores e comissões.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_vendedores')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formOmie.sync_vendedores ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formOmie.sync_vendedores ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Opção Financeiro (Opcional) */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-500"><Receipt size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Financeiro & Boletos</p>
                    <p className="text-[10px] text-zinc-500">Lê pendências e baixa PDF de boletos.</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSync('sync_financeiro')} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${formOmie.sync_financeiro ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <span className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${formOmie.sync_financeiro ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* 🟢 TRAVA DE SEGURANÇA */}
          <div className="p-5 md:p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl space-y-4 relative overflow-hidden mt-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Fingerprint size={80}/>
            </div>
            <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2 relative z-10">
              <Fingerprint size={16} /> Vínculo de Segurança (Tenant)
            </h3>
            <div className="space-y-2 relative z-10">
              <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">CNPJ da Base de Dados</label>
              <input 
                type="text" 
                readOnly 
                value={formOmie.tenant_id} 
                className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-500/30 p-2.5 rounded-xl font-mono font-bold text-xs text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-80" 
              />
              <p className="text-[11px] font-medium text-zinc-500 mt-1">Os pedidos do Raizan Seller entrarão no Omie exclusivamente sob este CNPJ.</p>
            </div>
          </div>

          {/* BOTÃO SALVAR */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <LinkIcon size={18} /> {loading ? "Conectando e Salvando..." : "Conectar e Salvar Regras"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}