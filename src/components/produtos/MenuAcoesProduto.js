import { 
  UploadCloud, DollarSign, Package, FileText, 
  Settings, Printer, TrendingDown, TrendingUp, 
  ShoppingCart, Copy, Tag, CloudSync 
} from "lucide-react";

export default function MenuAcoesProduto({ 
  menuRef, 
  menuParaCima, 
  produto, 
  onEnviarParaLoja,
  onEnviarForcaVendas 
}) {
  return (
    <div 
      ref={menuRef} 
      className={`absolute right-8 ${menuParaCima ? 'bottom-12 mb-1' : 'top-14 mt-1'} w-64 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-[100] py-2 text-left animate-in fade-in ${menuParaCima ? 'slide-in-from-bottom-2' : 'zoom-in-95'} duration-200 backdrop-blur-xl max-h-[65vh] overflow-y-auto custom-scrollbar`}
    >
      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 mb-2">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sincronização</p>
      </div>
      
      {/* 🚀 BOTAO DE ENVIAR PARA A LOJA (WOOCOMMERCE) */}
      <button 
        onClick={() => onEnviarParaLoja && onEnviarParaLoja(produto)}
        className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors"
      >
        <UploadCloud size={16} /> Enviar para o e-commerce
      </button>

      {/* 🟢 NOVO BOTAO: ENVIAR PARA O APP SELLER */}
      <button 
        onClick={() => onEnviarForcaVendas && onEnviarForcaVendas(produto)}
        className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-3 transition-colors"
      >
        <CloudSync size={16} /> Enviar p/ Força de Vendas
      </button>
      
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
        <DollarSign size={16} /> Enviar preços
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
        <Package size={16} /> Enviar estoque
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors">
        <FileText size={16} /> Enviar dados fiscais
      </button>

      <div className="px-4 py-2 border-y border-zinc-100 dark:border-zinc-800/60 my-2">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gestão</p>
      </div>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <Settings size={16} /> Gerenciar estoque
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <Printer size={16} /> Imprimir etiquetas
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <TrendingDown size={16} /> Histórico de compras
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <TrendingUp size={16} /> Histórico de vendas
      </button>

      <div className="px-4 py-2 border-y border-zinc-100 dark:border-zinc-800/60 my-2">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ações</p>
      </div>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <ShoppingCart size={16} /> Criar um pedido
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <Copy size={16} /> Clonar produto
      </button>
      <button className="w-full px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center gap-3 transition-colors">
        <Tag size={16} /> Editar tags
      </button>
    </div>
  );
}