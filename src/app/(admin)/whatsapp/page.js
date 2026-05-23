"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  MessageCircle, Link as LinkIcon, Key, Save, RefreshCw, 
  Settings2, Activity, CheckCircle2, AlertCircle, XCircle, 
  Smartphone, Database, AlertTriangle, ShieldCheck
} from "lucide-react";
import toast from 'react-hot-toast';

export default function WhatsappCatalogPage() {
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  
  // Mock do Status de Conexão com a Meta
  const [isConnected, setIsConnected] = useState(true);

  // Estados do Formulário
  const [credentials, setCredentials] = useState({
    catalogId: "248901283940123",
    accessToken: "EAAQ... (Token Oculto)",
  });

  const [regras, setRegras] = useState({
    autoSync: true,
    syncPrices: true,
    removeZeroStock: false
  });

  // Mock de Logs do Meta
  const [logs, setLogs] = useState([
    { id: 1, data: "22/05/2026 11:30", status: "success", produto: "Loção Ton. Acnederm", msg: "Preço atualizado com sucesso." },
    { id: 2, data: "22/05/2026 10:15", status: "error", produto: "Gloss Liphoney 5g", msg: "Imagem recusada (mínimo 500x500px)." },
    { id: 3, data: "21/05/2026 18:40", status: "success", produto: "Sabonete Higienizante", msg: "Produto criado no catálogo." },
  ]);

  const handleSalvarConfig = () => {
    setSalvando(true);
    setTimeout(() => {
      toast.success("Configurações do WhatsApp salvas com sucesso!");
      setSalvando(false);
    }, 1200);
  };

  const handleForcarSincronizacao = () => {
    setSincronizando(true);
    toast("Iniciando varredura do catálogo...", { icon: '🔄' });
    setTimeout(() => {
      toast.success("Catálogo sincronizado com o Meta!");
      setSincronizando(false);
    }, 3000);
  };

  // Componente de Toggle (Chavinha estilo iOS)
  const Toggle = ({ checked, onChange, label, desc }) => (
    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-colors">
      <div>
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <button 
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 gap-4 shadow-sm dark:shadow-none transition-colors relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
                  <MessageCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Catálogo WhatsApp</h1>
                  <p className="text-sm text-zinc-500 mt-1">Sincronize o Raizan Core direto com o Meta Commerce.</p>
                </div>
              </div>

              <div className="flex w-full md:w-auto gap-3 relative z-10">
                <button onClick={handleSalvarConfig} disabled={salvando} className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Ajustes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* COLUNA ESQUERDA: CREDENCIAIS E STATUS */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* STATUS CARD */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 ${isConnected ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 text-emerald-500' : 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 text-rose-500'}`}>
                    {isConnected ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{isConnected ? 'Conectado à Meta' : 'Desconectado'}</h3>
                  <p className="text-xs text-zinc-500 mb-6">A Graph API está respondendo normalmente.</p>
                  
                  <div className="w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-3 flex justify-between items-center border border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Última Sync:</span>
                    <span className="text-xs font-mono font-medium">Há 15 min</span>
                  </div>
                </div>

                {/* CREDENCIAIS */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-5 flex items-center gap-2">
                    <Key size={16} /> Credenciais da API
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">ID do Catálogo (Meta)</label>
                      <input 
                        type="text" 
                        value={credentials.catalogId} 
                        onChange={(e) => setCredentials({...credentials, catalogId: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm font-mono" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Token de Acesso (Permanente)</label>
                      <input 
                        type="password" 
                        value={credentials.accessToken} 
                        onChange={(e) => setCredentials({...credentials, accessToken: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm font-mono" 
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Token gerado no Meta for Developers.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* COLUNA DIREITA: REGRAS E LOGS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* REGRAS DE AUTOMAÇÃO */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Settings2 className="text-emerald-500" size={20} /> Regras de Automação
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">Como o Raizan Hub deve se comportar com o WhatsApp.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Toggle 
                      checked={regras.autoSync} 
                      onChange={() => setRegras({...regras, autoSync: !regras.autoSync})}
                      label="Sincronização Ativa" 
                      desc="Ouve alterações no banco e envia para a Meta em tempo real." 
                    />
                    <Toggle 
                      checked={regras.syncPrices} 
                      onChange={() => setRegras({...regras, syncPrices: !regras.syncPrices})}
                      label="Atualizar Preços" 
                      desc="Se alterar o preço no Raizan, muda na loja do WhatsApp." 
                    />
                    <Toggle 
                      checked={regras.removeZeroStock} 
                      onChange={() => setRegras({...regras, removeZeroStock: !regras.removeZeroStock})}
                      label="Ocultar Sem Estoque" 
                      desc="Remove o produto do catálogo se o saldo for zero." 
                    />
                  </div>
                </div>

                {/* SINC MANUAL E LOGS */}
                <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  
                  <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-emerald-50 dark:bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-emerald-800 dark:text-emerald-400">Sincronização Manual (Batch)</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Use para forçar o envio de todos os produtos ativos.</p>
                    </div>
                    <button 
                      onClick={handleForcarSincronizacao}
                      disabled={sincronizando}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} />
                      {sincronizando ? "Sincronizando Catálogo..." : "Forçar Sincronização"}
                    </button>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                      <Activity size={14} /> Histórico de Transações Meta
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                          <tr>
                            <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                            <th className="pb-3 font-bold uppercase tracking-wider">Data / Hora</th>
                            <th className="pb-3 font-bold uppercase tracking-wider">Produto</th>
                            <th className="pb-3 font-bold uppercase tracking-wider">Mensagem (Meta API)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="py-3">
                                {log.status === 'success' ? (
                                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-6 h-6 rounded-md flex items-center justify-center">
                                    <CheckCircle2 size={14} />
                                  </div>
                                ) : (
                                  <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 w-6 h-6 rounded-md flex items-center justify-center">
                                    <XCircle size={14} />
                                  </div>
                                )}
                              </td>
                              <td className="py-3 text-zinc-500 text-xs whitespace-nowrap">{log.data}</td>
                              <td className="py-3 font-medium">{log.produto}</td>
                              <td className="py-3 text-xs text-zinc-500">
                                <span className={log.status === 'error' ? 'text-rose-500 dark:text-rose-400 font-medium' : ''}>
                                  {log.msg}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}