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
  
  // 🟢 INTELIGÊNCIA DE ROTAS: O menu já "nasce" com a gaveta certa aberta, sem piscar
  const [openMenus, setOpenMenus] = useState(() => {
    const path = pathname || "";
    return {
      comercial: ["/pedidos", "/promocoes", "/xml", "/financeiro", "/relatorios", "/b2b-pedidos"].includes(path),
      gestao: ["/produtos", "/cadastros/produtos", "/clientes", "/pdv"].includes(path),
      marketing: ["/crm", "/whatsapp", "/catalogo", "/website", "/ads"].includes(path),
      sistema: ["/configuracoes", "/host", "/sistema"].includes(path)
    };
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

  // Garante que a gaveta correta se abra automaticamente ao navegar pelo sistema
  useEffect(() => {
    if (!pathname) return;
    setOpenMenus(prev => {
      const newState = { ...prev };
      if (["/pedidos", "/promocoes", "/xml", "/financeiro", "/relatorios", "/b2b-pedidos"].includes(pathname)) newState.comercial = true;
      if (["/produtos", "/cadastros/produtos", "/clientes", "/pdv"].includes(pathname)) newState.gestao = true;
      if (["/crm", "/whatsapp", "/catalogo", "/website", "/ads"].includes(pathname)) newState.marketing = true;
      if (["/configuracoes", "/host", "/sistema"].includes(pathname)) newState.sistema = true;
      return newState;
    });
  }, [pathname]);

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

  // ==========================================
  // NAVLINK PADRÃO SOU BÁSICA PREMIUM
  // ==========================================
  const NavLink = ({ href, icon: Icon, label }) => {
    const active = isActive(href);
    const isLojista = userRole === "lojista";
    
    const activeClass = isLojista 
      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold" 
      : "bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold";
      
    const hoverClass = isLojista
      ? "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-400";

    return (
      <Link 
        href={href} 
        onClick={closeMobileSidebar}
        className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm relative overflow-hidden group ${active ? activeClass : hoverClass}`}
      >
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-white/40 rounded-r-full" />}
        <Icon size={18} className={`shrink-0 transition-colors duration-300 ${active ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    );
  };

  const hasComercial = ["pedidos", "promocoes", "xml", "financeiro", "relatorios", "portal-b2b"].some(tem);
  const hasGestao = ["produtos", "clientes", "pdv"].some(tem);
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
                className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm relative overflow-hidden group ${
                  temPedidoAberto 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                    : isActive("/b2b-pedidos")
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold border border-transparent" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 border border-transparent"
                }`}
              >
                {isActive("/b2b-pedidos") && !temPedidoAberto && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-white/40 rounded-r-full" />}
                <Store size={18} className={`shrink-0 transition-colors duration-300 ${temPedidoAberto ? "text-emerald-600 dark:text-emerald-400" : isActive("/b2b-pedidos") ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
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
                <NavLink href="/" icon={LayoutDashboard} label="Dashboard Admin" />
              </div>

              {hasComercial && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('comercial')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm ${openMenus.comercial ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><TrendingUp size={16} className={`shrink-0 ${openMenus.comercial ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Comercial</span></div>
                    {openMenus.comercial ? <ChevronDown size={14} className="text-emerald-500 dark:text-emerald-400"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                  </button>
                  {openMenus.comercial && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 sm:ml-3 sm:pl-3 animate-in slide-in-from-top-2">
                      {tem("portal-b2b") && <NavLink href="/b2b-pedidos" icon={Building2} label="Simular Catálogo B2B" />}
                      {tem("pedidos") && <NavLink href="/pedidos" icon={ShoppingBag} label="Gestão de Pedidos" />}
                      {(tem("promocoes") || tem("portal-b2b")) && <NavLink href="/promocoes" icon={Tag} label="Gestão de Promoções" />}
                      {tem("xml") && <NavLink href="/xml" icon={Receipt} label="XML e Boletos" />}
                      {tem("financeiro") && <NavLink href="/financeiro" icon={CircleDollarSign} label="Financeiro" />}
                      {tem("relatorios") && <NavLink href="/relatorios" icon={BarChart3} label="Relatórios" />}
                    </div>
                  )}
                </div>
              )}

              {hasGestao && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('gestao')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm ${openMenus.gestao ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Package size={16} className={`shrink-0 ${openMenus.gestao ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Gestão do ERP</span></div>
                    {openMenus.gestao ? <ChevronDown size={14} className="text-blue-500 dark:text-blue-400"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                  </button>
                  {openMenus.gestao && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-zinc-200 dark:border-zinc-800 pl-2 sm:ml-3 sm:pl-3 animate-in slide-in-from-top-2">
                      {tem("produtos") && <NavLink href="/produtos" icon={Package} label="Produtos SYNC" />}
                      {tem("clientes") && <NavLink href="/clientes" icon={Users} label="Base de Clientes" />}
                      {tem("produtos") && <NavLink href="/cadastros/produtos" icon={Boxes} label="Cadastro de Produtos" />}
                      {tem("pdv") && <NavLink href="/pdv" icon={MonitorSmartphone} label="PDV Frente de Caixa" />}
                    </div>
                  )}
                </div>
              )}

              {hasMkt && !licencaExpirada && (
                <div className="pt-2">
                  <button onClick={() => toggleMenu('marketing')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm ${openMenus.marketing ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Megaphone size={16} className={`shrink-0 ${openMenus.marketing ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Marketing & CRM</span></div>
                    {openMenus.marketing ? <ChevronDown size={14} className="text-orange-500 dark:text-orange-400"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
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
                  <button onClick={() => toggleMenu('sistema')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm ${openMenus.sistema ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3"><Settings size={16} className={`shrink-0 ${openMenus.sistema ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`} /><span className="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs">Sistema</span></div>
                    {openMenus.sistema ? <ChevronDown size={14} className="text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent py-2.5 text-xs text-zinc-500 dark:text-zinc-400 transition-colors hover:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 sm:text-sm"
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