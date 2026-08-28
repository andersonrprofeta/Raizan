import { ShoppingBag, Store, Globe } from "lucide-react";

export default function TabsLojas({ integracoesInstaladas, activeTab, onTabChange }) {
  
  // 🟢 O Mapeador de Ícones BLINDADO E ATUALIZADO
  const getIcon = (tab) => {
    // A MÁGICA: Priorizamos a 'plataforma' verdadeira e ignoramos o iconType 'woo' salvo errado no banco!
    const key = String(tab.plataforma || tab.tipo || tab.iconType || '').toLowerCase();

    // 🟢 ERPs & Plataformas (Verifica se a palavra chave existe na string)
    if (key.includes('oracle')) return <img src="/oracle.svg" alt="Oracle" className="w-8 h-8 object-contain" />;
    if (key.includes('omie')) return <img src="/omie.png" alt="Omie" className="w-8 h-8 object-contain" />;
    
    // 🟢 Tiny e Olist adicionados! (Salve o tiny.png ou tiny.svg na pasta public)
    if (key.includes('tiny')) return <img src="/olist.svg" alt="Tiny" className="w-8 h-8 object-contain" />;
    if (key.includes('olist')) return <img src="/olist.svg" alt="Olist" className="w-8 h-8 object-contain" />;
    
    if (key.includes('woo')) return <img src="/woocommerce.svg" alt="Woo" className="w-8 h-8 object-contain" />;
    if (key.includes('raizan') || key.includes('b2b')) return <img src="/oracle.svg" alt="Raizan" className="w-8 h-8 object-contain" />;
    
    // 🟢 Marketplaces
    if (key.includes('shopee')) return <ShoppingBag size={24} className="text-orange-500" />;
    if (key.includes('meli') || key.includes('mercado')) return <Store size={24} className="text-amber-500" />;
    
    // Fallback padrão se não achar nenhum
    return <Globe size={24} className="text-zinc-500" />;
  };

  const getCardClasses = (theme, isActive) => {
    if (!isActive) return "border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-zinc-700 opacity-60 hover:opacity-100";
    switch (theme) {
      case "emerald": return "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/20";
      case "purple": return "border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-sm ring-1 ring-purple-500/20";
      case "blue": return "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm ring-1 ring-blue-500/20";
      case "orange": return "border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-sm ring-1 ring-orange-500/20";
      case "yellow": return "border-amber-400 bg-amber-50 dark:bg-amber-400/10 shadow-sm ring-1 ring-amber-400/20";
      default: return "border-purple-500 bg-purple-50 dark:bg-purple-500/10 shadow-sm ring-1 ring-purple-500/20";
    }
  };

  const getCardTextClasses = (theme, isActive) => {
    if (!isActive) return "text-zinc-700 dark:text-zinc-300";
    switch (theme) {
      case "emerald": return "text-emerald-800 dark:text-emerald-400";
      case "purple": return "text-purple-800 dark:text-purple-400";
      case "blue": return "text-blue-800 dark:text-blue-400";
      case "orange": return "text-orange-800 dark:text-orange-400";
      case "yellow": return "text-amber-800 dark:text-amber-400";
      default: return "text-purple-800 dark:text-purple-400";
    }
  };

  return (
    <div className="flex gap-4 pb-4 overflow-x-auto no-scrollbar snap-x">
      {integracoesInstaladas.map(tab => {
        const isActive = activeTab === tab.id; 
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab)} 
            className={`snap-start flex-shrink-0 flex items-center gap-3 p-3 min-w-[260px] rounded-2xl border-2 transition-all duration-300 text-left ${getCardClasses(tab.theme, isActive)}`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2 bg-white dark:bg-[#0c0c0e] shadow-sm border border-zinc-100 dark:border-zinc-800">
              {/* 🟢 Mandamos o objeto inteiro pro getIcon agora! */}
              {getIcon(tab)} 
            </div>
            <div className="flex flex-col items-start overflow-hidden w-full">
              <span className={`text-sm font-black truncate w-full ${getCardTextClasses(tab.theme, isActive)}`}>
                {tab.label}
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate w-full mt-0.5">
                {tab.sub}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  );
}