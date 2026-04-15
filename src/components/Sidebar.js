"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, 
  Briefcase, Terminal, BarChart3, CircleDollarSign, MonitorSmartphone, 
  Settings, Database, LogOut, Store, ShoppingCart, 
  Globe, BookOpen, Megaphone, MessageCircle, Server, 
  FileText, Boxes, AlertTriangle, ChevronDown, ChevronRight,
  TrendingUp, Building2, Receipt, Tag, X
} from "lucide-react";
import packageJson from "../../package.json";
import toast from 'react-hot-toast';

export default function Sidebar() {
  const pathname = usePathname();
  
  const [modulosLiberados, setModulosLiberados] = useState([]);
  const [licencaExpirada, setLicencaExpirada] = useState(false);

  const [userRole, setUserRole] = useState(null); 
  const [userName, setUserName] = useState("Carregando...");
  const [openMenus, setOpenMenus] = useState({
    vendas: true,
    gestao: false,
    marketing: false,
    sistema: false
  });

  const [textoPedido, setTextoPedido] = useState("Novo Pedido");
  const [temPedidoAberto, setTemPedidoAberto] = useState(false); 
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggleMenu = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggleMobileSidebar', handleToggleMenu);
    return () => window.removeEventListener('toggleMobileSidebar', handleToggleMenu);
  }, []);

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  useEffect(() => {
    const b2bUser = localStorage.getItem("raizan_user");
    const adminLicenca = localStorage.getItem("@raizan:license");

    if (b2bUser) {
      try {
        let userObj = JSON.parse(b2bUser);
        if (userObj.user) userObj = userObj.user; 

        const nomeOficial = userObj.nome || userObj.RAZAO || userObj.razao_social || "Lojista";
        setUserRole("lojista");
        setUserName(nomeOficial.trim().split(' ')[0]);
        return; 
      } catch (e) {
        console.error("Erro ao ler dados do Lojista", e);
      }
    }

    setUserRole("admin");
    const nomeSalvo = localStorage.getItem("@raizan:nome");
    setUserName(nomeSalvo && nomeSalvo.trim() !== "" ? nomeSalvo.split(' ')[0] : "Admin");

    if (!adminLicenca) {
      if (pathname && pathname.includes("b2b")) {
        window.location.href = "/login-b2b";
      } else {
        window.location.href = "/login";
      }
      return;
    }

    const modulos = localStorage.getItem("@raizan:modulos");
    const vencimento = localStorage.getItem("@raizan:expires_at");
    let isExpired = false;

    if (vencimento && vencimento !== "undefined" && vencimento !== "null" && vencimento.trim() !== "") {
      try {
        let ano, mes, dia;
        const limpo = vencimento.replace(/\D/g, '');
        if (limpo.length >= 8) {
          ano = parseInt(limpo.substring(0, 4)); 
          mes = parseInt(limpo.substring(4, 6)) - 1; 
          dia = parseInt(limpo.substring(6, 8));
          if (ano > 2100) { 
            ano = parseInt(limpo.substring(4, 8)); 
            mes = parseInt(limpo.substring(2, 4)) - 1; 
            dia = parseInt(limpo.substring(0, 2)); 
          }
          const dataVenc = new Date(ano, mes, dia, 23, 59, 59);
          if (dataVenc.getTime() < new Date().getTime()) isExpired = true; 
        }
      } catch (e) { isExpired = true; }
    }

    setLicencaExpirada(isExpired);
    if (isExpired) {
      setModulosLiberados([]);
    } else if (modulos) {
      setModulosLiberados(JSON.parse(modulos));
    }
  }, [pathname]);

  useEffect(() => {
    const checarCarrinho = () => {
      const carrinhoSalvo = localStorage.getItem("@raizan:carrinho");
      if (carrinhoSalvo) {
        try {
          const parsed = JSON.parse(carrinhoSalvo);
          if (Object.keys(parsed).length > 0) {
            setTextoPedido("Continuar Pedido");
            setTemPedidoAberto(true);
            return;
          }
        } catch (e) { }
      }
      setTextoPedido("Novo Pedido");
      setTemPedidoAberto(false);
    };

    checarCarrinho();
    window.addEventListener('storage', checarCarrinho);
    const intervalo = setInterval(checarCarrinho, 1000);
    
    return () => {
      window.removeEventListener('storage', checarCarrinho);
      clearInterval(intervalo);
    };
  }, [pathname]);

  const handleSairDoApp = () => {
    if (userRole === "lojista") {
      toast.success("Saindo da conta...");
      setTimeout(() => {
        localStorage.removeItem("raizan_user");
        window.location.href = "/login-b2b";
      }, 1000);
    } else {
      toast.success("Encerrando o sistema...");
      setTimeout(() => window.close(), 1000);
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isActive = (path) => pathname === path;
  const tem = (id) => modulosLiberados.includes(id);

  const NavLink = ({ href, icon: Icon, label }) => (
    <Link 
      href={href} 
      onClick={closeMobileSidebar}
      className={`flex w-full min-w-0 items-center gap-3 rounded-lg px-2.5 py-2 text-xs transition-all sm:px-3 sm:text-sm ${
        isActive(href) 
          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/20" 
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
      }`}
    >
      <Icon size={18} className={`shrink-0 ${isActive(href) ? "text-purple-600 dark:text-purple-400" : "text-zinc-400 dark:text-zinc-500"}`} />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );

  const hasVendas = ["pedidos", "mercado-livre", "shopee", "magalu", "pdv"].some(tem);
  const hasGestao = ["produtos", "estoque", "clientes", "financeiro", "notas", "relatorios", "xml"].some(tem);
  const hasMkt = ["crm", "whatsapp", "website", "catalogo", "ads"].some(tem);
  const hasSys = ["host", "configuracoes", "sistema"].some(tem);

  if (!userRole) {
    return <aside className="hidden h-screen sticky top-0 w-[260px] max-w-full shrink-0 flex-col overflow-x-hidden border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0e] z-20 lg:flex transition-colors duration-300"></aside>;
  }

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/20 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={closeMobileSidebar}
        />
      )}

      <aside 
        className={`fixed top-0 z-50 flex h-screen w-[85vw] max-w-[260px] shrink-0 flex-col overflow-x-hidden border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0e] shadow-2xl transition-transform duration-300 ease-in-out sm:w-[320px] lg:sticky lg:w-[260px] lg:max-w-[260px] lg:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} 
        style={{ WebkitAppRegion: 'drag' }}
      >
        
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 px-3 sm:gap-3 sm:px-5 transition-colors duration-300" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20">
              <Database size={18} className="text-white" />
            </div>
            <h1 className="truncate text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-lg">
              Raizan Core
            </h1>
          </div>
          
          <button onClick={closeMobileSidebar} className="rounded bg-zinc-100 dark:bg-zinc-900 p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-2 py-4 sm:px-3 sm:py-5" style={{ WebkitAppRegion: 'no-drag' }}>
          
          {licencaExpirada && userRole === "admin" && (
            <div className="flex animate-pulse flex-col items-center rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 text-center">
              <AlertTriangle size={24} className="text-red-500 dark:text-red-400 mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Licença Expirada</span>
              <span className="text-[10px] text-zinc-500 mt-1">Sincronize ou renove seu plano.</span>
            </div>
          )}

          {userRole === "lojista" && (
            <div className="space-y-1">
              <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 sm:text-xs">Portal de Compras</div>
              <NavLink href="/b2b-inicio" icon={LayoutDashboard} label="Dashboard" />
              
              <Link 
                href="/b2b-pedidos" 
                onClick={closeMobileSidebar}
                className={`flex w-full min-w-0 items-center gap-3 rounded-lg px-2.5 py-2 text-xs transition-all sm:px-3 sm:text-sm ${
                  temPedidoAberto 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                    : isActive("/b2b-pedidos")
                      ? "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/20" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Store size={18} className={`shrink-0 ${temPedidoAberto ? "text-emerald-600 dark:text-emerald-400" : isActive("/b2b-pedidos") ? "text-purple-600 dark:text-purple-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                <span className="min-w-0 truncate">{textoPedido}</span>
              </Link>
              
              <NavLink href="/b2b-historico" icon={Package} label="Meus Pedidos" />
              <NavLink href="/b2b-xml" icon={FileText} label="XML/NF-e" />
              <NavLink href="/b2b-financeiro" icon={Receipt} label="Financeiro" />
            </div>
          )}

          {userRole === "admin" && (
            <>
              <div className="space-y-1">
                <NavLink href="/" icon={LayoutDashboard} label="Dashboard Principal" />
              </div>

              {tem("portal-b2b") && (
                <div className="space-y-1 pb-2 border-b border-zinc-200 dark:border-zinc-800/50">
                  <div className="mt-4 mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 sm:text-xs">Atacado B2B</div>
                  <NavLink href="/b2b-pedidos" icon={Building2} label="Simular Catálogo" />
                  <NavLink href="/pedidos" icon={ShoppingBag} label="Gestão de Pedidos" />
                  <NavLink href="/promocoes" icon={Tag} label="Gestão de Promoções" />
                </div>
              )}

              {hasVendas && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('vendas')} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs transition-colors sm:text-sm ${openMenus.vendas ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><TrendingUp size={16} className={`shrink-0 ${openMenus.vendas ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Vendas & Canais</span></div>
                    {openMenus.vendas ? <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                  </button>
                  {openMenus.vendas && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 sm:ml-3 sm:pl-3 animate-in slide-in-from-top-2">
                      {tem("pedidos") && <NavLink href="/pedidos" icon={ShoppingBag} label="WooCommerce" />}
                      {tem("mercado-livre") && <NavLink href="/mercado-livre" icon={Store} label="Mercado Livre" />}
                      {tem("shopee") && <NavLink href="/shopee" icon={ShoppingCart} label="Shopee" />}
                      {tem("magalu") && <NavLink href="/magalu" icon={Store} label="Magalu" />}
                      {tem("pdv") && <NavLink href="/pdv" icon={MonitorSmartphone} label="PDV Frente de Caixa" />}
                    </div>
                  )}
                </div>
              )}

              {hasGestao && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('gestao')} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs transition-colors sm:text-sm ${openMenus.gestao ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Package size={16} className={`shrink-0 ${openMenus.gestao ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Gestão & ERP</span></div>
                    {openMenus.gestao ? <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                  </button>
                  {openMenus.gestao && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 sm:ml-3 sm:pl-3 animate-in slide-in-from-top-2">
                      {tem("produtos") && <NavLink href="/produtos" icon={Package} label="Produtos (Sinc)" />}
                      {tem("xml") && <NavLink href="/xml" icon={Receipt} label="XML e Boletos" />}
                      {tem("estoque") && <NavLink href="/estoque" icon={Boxes} label="Controle de Estoque" />}
                      {tem("clientes") && <NavLink href="/clientes" icon={Users} label="Base de Clientes" />}
                      {tem("financeiro") && <NavLink href="/financeiro" icon={CircleDollarSign} label="Financeiro" />}
                      {tem("notas") && <NavLink href="/notas" icon={FileText} label="Emissão de Notas" />}
                      {tem("relatorios") && <NavLink href="/relatorios" icon={BarChart3} label="Relatórios" />}
                    </div>
                  )}
                </div>
              )}

              {hasMkt && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('marketing')} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs transition-colors sm:text-sm ${openMenus.marketing ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Megaphone size={16} className={`shrink-0 ${openMenus.marketing ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Marketing & CRM</span></div>
                    {openMenus.marketing ? <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                  </button>
                  {openMenus.marketing && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 sm:ml-3 sm:pl-3 animate-in slide-in-from-top-2">
                      {tem("crm") && <NavLink href="/crm" icon={Briefcase} label="CRM de Vendas" />}
                      {tem("whatsapp") && <NavLink href="/whatsapp" icon={MessageCircle} label="Auto WhatsApp" />}
                      {tem("catalogo") && <NavLink href="/catalogo" icon={BookOpen} label="Vitrine Pública" />}
                      {tem("website") && <NavLink href="/website" icon={Globe} label="Construtor de Site" />}
                      {tem("ads") && <NavLink href="/ads" icon={Megaphone} label="Gestão Meta Ads" />}
                    </div>
                  )}
                </div>
              )}

              {hasSys && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('sistema')} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs transition-colors sm:text-sm ${openMenus.sistema ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Settings size={16} className={`shrink-0 ${openMenus.sistema ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Sistema</span></div>
                    {openMenus.sistema ? <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                  </button>
                  {openMenus.sistema && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 sm:ml-3 sm:pl-3 animate-in slide-in-from-top-2">
                      {tem("configuracoes") && <NavLink href="/configuracoes" icon={Settings} label="Ajustes do Motor" />}
                      {tem("host") && <NavLink href="/host" icon={Server} label="Hospedagem" />}
                      {tem("sistema") && <NavLink href="/sistema" icon={Terminal} label="Terminal Root" />}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/30 p-3 sm:p-4 transition-colors duration-300" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <Users size={18} className={userRole === "admin" ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-bold text-zinc-800 dark:text-zinc-200">{userName}</p>
              <p className={`text-xs capitalize font-medium ${userRole === "admin" ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"}`}>{userRole}</p>
            </div>
          </div>
          
          <button 
            onClick={handleSairDoApp}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent py-2 text-xs text-zinc-500 dark:text-zinc-400 transition-colors hover:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 sm:text-sm"
          >
            <LogOut size={16} /> {userRole === "admin" ? "Fechar App" : "Sair da Conta"}
          </button>
          
          {userRole === "admin" && (
            <p className="mt-3 text-[10px] text-zinc-400 dark:text-zinc-600 text-center uppercase tracking-widest font-bold">
              v{packageJson.version}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}