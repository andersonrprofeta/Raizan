"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react"; 
import { 
  Database, LogOut, X, AlertTriangle, ChevronDown, ChevronRight,
  LayoutDashboard, Store, Package, FileText, Receipt, Users
} from "lucide-react";
import packageJson from "../../package.json";
import toast from 'react-hot-toast';

export default function Sidebar() {
  const pathname = usePathname();
  
  const [modulosLiberados, setModulosLiberados] = useState([]);
  const [licencaExpirada, setLicencaExpirada] = useState(false);

  const [userRole, setUserRole] = useState(null); 
  const [userName, setUserName] = useState("Carregando...");
  
  const [openMenus, setOpenMenus] = useState({});
  const [textoPedido, setTextoPedido] = useState("Novo Pedido");
  const [temPedidoAberto, setTemPedidoAberto] = useState(false); 
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [menuDinamico, setMenuDinamico] = useState({});
  const [carregandoMenu, setCarregandoMenu] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("https://api.raizan.com.br/api/admin/modulos");
        const data = await res.json();
        if (data.success) {
          const agrupados = data.modulos.reduce((acc, mod) => {
            if (mod.slug === 'dashboard' || mod.slug === 'inicio' || mod.slug === 'resumo' || mod.slug === '/') return acc;
            const cat = mod.categoria || "Outros";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(mod);
            return acc;
          }, {});
          setMenuDinamico(agrupados);
        }
      } catch (error) {
        console.error("Erro ao carregar menu dinâmico:", error);
      } finally {
        setCarregandoMenu(false);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const handleToggleMenu = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggleMobileSidebar', handleToggleMenu);
    return () => window.removeEventListener('toggleMobileSidebar', handleToggleMenu);
  }, []);

  const closeMobileSidebar = () => setIsMobileOpen(false);

  useEffect(() => {
    if (!pathname || Object.keys(menuDinamico).length === 0) return;
    const newOpenState = { ...openMenus };
    Object.keys(menuDinamico).forEach(categoria => {
      const temRotaAtiva = menuDinamico[categoria].some(mod => pathname.includes(mod.slug));
      if (temRotaAtiva) newOpenState[categoria] = true;
    });
    setOpenMenus(newOpenState);
  }, [pathname, menuDinamico]);

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
      } catch (e) {}
    }

    setUserRole("admin");
    const nomeSalvo = localStorage.getItem("@raizan:nome");
    setUserName(nomeSalvo && nomeSalvo.trim() !== "" ? nomeSalvo.split(' ')[0] : "Admin");

    if (!adminLicenca) {
      if (pathname && pathname.includes("b2b")) window.location.href = "/login-b2b";
      else window.location.href = "/login";
      return;
    }

    const modulos = localStorage.getItem("@raizan:modulos");
    const vencimento = localStorage.getItem("@raizan:expires_at");
    let isExpired = false;

    if (vencimento && vencimento !== "undefined" && vencimento !== "null" && vencimento.trim() !== "") {
      try {
        const limpo = vencimento.replace(/\D/g, '');
        if (limpo.length >= 8) {
          let ano = parseInt(limpo.substring(0, 4)); 
          let mes = parseInt(limpo.substring(4, 6)) - 1; 
          let dia = parseInt(limpo.substring(6, 8));
          if (ano > 2100) { ano = parseInt(limpo.substring(4, 8)); mes = parseInt(limpo.substring(2, 4)) - 1; dia = parseInt(limpo.substring(0, 2)); }
          if (new Date(ano, mes, dia, 23, 59, 59).getTime() < new Date().getTime()) isExpired = true; 
        }
      } catch (e) { isExpired = true; }
    }

    setLicencaExpirada(isExpired);
    setModulosLiberados(isExpired ? [] : (modulos ? JSON.parse(modulos) : []));
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
    return () => { window.removeEventListener('storage', checarCarrinho); clearInterval(intervalo); };
  }, [pathname]);

  const handleSairDoApp = () => {
    if (userRole === "lojista") {
      toast.success("Saindo da conta...");
      setTimeout(() => { localStorage.removeItem("raizan_user"); window.location.href = "/login-b2b"; }, 1000);
    } else {
      toast.success("Encerrando o sistema...");
      setTimeout(() => window.close(), 1000);
    }
  };

  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  const isActive = (path) => pathname === path || pathname === `/${path}`;
  const hasAccess = (slug) => { if (!slug) return true; return modulosLiberados.includes(slug); };

  const DashboardNavLink = ({ href, icon: Icon, label }) => {
    const active = isActive(href);
    const isLojista = userRole === "lojista";
    
    const activeClass = isLojista 
      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold" 
      : "bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold";
      
    const hoverClass = isLojista
      ? "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-400";

    return (
      <Link href={href} onClick={closeMobileSidebar} className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm relative overflow-hidden group ${active ? activeClass : hoverClass}`}>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-white/40 rounded-r-full" />}
        <Icon size={18} className={`shrink-0 transition-colors duration-300 ${active ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    );
  };

  const SubNavLink = ({ href, iconName, label, colorTheme }) => {
    const active = isActive(href);
    const IconComponent = LucideIcons[iconName] || LucideIcons.Box;

    const themes = {
      emerald: { active: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400" },
      purple: { active: "bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-400" },
      orange: { active: "bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400" },
      blue: { active: "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400" },
      zinc: { active: "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-md shadow-zinc-800/20 font-bold", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200" }
    };
    const currentTheme = themes[colorTheme] || themes.purple;
    const safeHref = href.startsWith('/') ? href : `/${href}`;

    return (
      <Link href={safeHref} onClick={closeMobileSidebar} className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm relative overflow-hidden group ${active ? currentTheme.active : currentTheme.hover}`}>
        <IconComponent size={18} className={`shrink-0 transition-colors duration-300 ${active ? "text-white dark:text-zinc-900" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    );
  };

  const getCategoriaTheme = (nomeCategoria) => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    if (nomeNormalizado.includes("comercial") || nomeNormalizado.includes("venda")) return { cor: "emerald", iconePadrao: "TrendingUp" };
    if (nomeNormalizado.includes("gestão") || nomeNormalizado.includes("erp")) return { cor: "purple", iconePadrao: "Package" };
    if (nomeNormalizado.includes("marketing") || nomeNormalizado.includes("crm")) return { cor: "orange", iconePadrao: "Megaphone" };
    if (nomeNormalizado.includes("ecommerce") || nomeNormalizado.includes("loja")) return { cor: "blue", iconePadrao: "Store" };
    if (nomeNormalizado.includes("sistema") || nomeNormalizado.includes("infra")) return { cor: "zinc", iconePadrao: "Settings" };
    return { cor: "zinc", iconePadrao: "Folder" };
  };

  const themeClassesMap = {
    emerald: { open: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] border-emerald-200 dark:border-emerald-500/30", iconOpen: "text-emerald-600 dark:text-emerald-400" },
    purple: { open: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.15)] border-purple-200 dark:border-purple-500/30", iconOpen: "text-purple-600 dark:text-purple-400" },
    orange: { open: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.15)] border-orange-200 dark:border-orange-500/30", iconOpen: "text-orange-500 dark:text-orange-400" },
    blue: { open: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)] border-blue-200 dark:border-blue-500/30", iconOpen: "text-blue-600 dark:text-blue-400" },
    zinc: { open: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-200 shadow-[0_0_12px_rgba(39,39,42,0.15)] border-zinc-200 dark:border-zinc-700", iconOpen: "text-zinc-700 dark:text-zinc-300" }
  };

  if (!userRole) return <aside className="hidden h-screen sticky top-0 w-[260px] max-w-full shrink-0 flex-col overflow-x-hidden border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0e] z-20 lg:flex transition-colors duration-300"></aside>;

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in" onClick={closeMobileSidebar} />}

      {/* 🔥 A MÁGICA DA SIDEBAR FLUTUANTE (FLOATING LAYOUT) */}
      <aside className={`fixed top-0 z-50 flex h-screen lg:h-[calc(100vh-2rem)] w-[85vw] max-w-[260px] shrink-0 flex-col overflow-hidden bg-white dark:bg-[#121214] shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out sm:w-[320px] lg:sticky lg:top-4 lg:ml-4 lg:w-[260px] lg:max-w-[260px] lg:rounded-3xl border border-zinc-200/80 dark:border-white/5 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{ WebkitAppRegion: 'drag' }}>
        
        {/* LOGO */}
        <div className="flex h-20 shrink-0 items-center justify-between gap-2 border-b border-zinc-100 dark:border-white/5 px-4 sm:gap-3 sm:px-6 transition-colors duration-300" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_4px_14px_rgba(124,58,237,0.3)]">
              <Database size={18} className="text-white" />
            </div>
            <h1 className="truncate text-[17px] font-black tracking-tight text-zinc-900 dark:text-white">
              Raizan Core
            </h1>
          </div>
          <button onClick={closeMobileSidebar} className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white lg:hidden transition-colors border border-zinc-200 dark:border-zinc-700/50">
            <X size={18} />
          </button>
        </div>

        {/* NAVEGAÇÃO ROLÁVEL */}
        <nav className="custom-scrollbar flex-1 space-y-2 overflow-x-hidden overflow-y-auto px-4 py-6" style={{ WebkitAppRegion: 'no-drag' }}>
          
          {licencaExpirada && userRole === "admin" && (
            <div className="flex animate-pulse flex-col items-center rounded-2xl border border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-center mb-6">
              <AlertTriangle size={24} className="text-red-500 dark:text-red-400 mb-2" />
              <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">Licença Expirada</span>
            </div>
          )}

          {userRole === "lojista" && (
            <div className="space-y-1 mb-6">
              <div className="mb-4 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Portal de Compras</div>
              <DashboardNavLink href="/b2b-inicio" icon={LayoutDashboard} label="Dashboard" />
              <Link href="/b2b-pedidos" onClick={closeMobileSidebar} className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-all duration-300 sm:text-sm relative overflow-hidden group ${temPedidoAberto ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : isActive("/b2b-pedidos") ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold border border-transparent" : "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 border border-transparent"}`}>
                {isActive("/b2b-pedidos") && !temPedidoAberto && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-white/40 rounded-r-full" />}
                <Store size={18} className={`shrink-0 transition-colors duration-300 ${temPedidoAberto ? "text-emerald-600 dark:text-emerald-400" : isActive("/b2b-pedidos") ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
                <span className="min-w-0 truncate">{textoPedido}</span>
              </Link>
              <DashboardNavLink href="/b2b-historico" icon={Package} label="Meus Pedidos" />
              <DashboardNavLink href="/b2b-financeiro" icon={Receipt} label="Financeiro" />
            </div>
          )}

          {userRole === "admin" && (
            <>
              <div className="space-y-1 pb-4">
                <DashboardNavLink href="/" icon={LayoutDashboard} label="Dashboard Admin" />
              </div>

              {!carregandoMenu && Object.keys(menuDinamico).map(categoriaNome => {
                const modulosDaCat = menuDinamico[categoriaNome];
                const modulosLiberadosNestaCat = modulosDaCat.filter(m => hasAccess(m.slug));
                if (modulosLiberadosNestaCat.length === 0 || licencaExpirada) return null;

                const isOpen = openMenus[categoriaNome];
                const { cor, iconePadrao } = getCategoriaTheme(categoriaNome);
                const IconeGeral = LucideIcons[iconePadrao] || LucideIcons.Folder;
                const themeMap = themeClassesMap[cor];

                const btnClass = isOpen 
                  ? themeMap.open 
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200";
                
                const iconClass = isOpen ? themeMap.iconOpen : "text-zinc-400 dark:text-zinc-500";

                return (
                  <div key={categoriaNome} className="pt-2">
                    <button onClick={() => toggleMenu(categoriaNome)} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs transition-all duration-300 sm:text-sm border ${btnClass}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <IconeGeral size={18} className={`shrink-0 transition-colors ${iconClass}`} />
                        <span className="truncate text-[11px] font-bold uppercase tracking-wider sm:text-xs">{categoriaNome}</span>
                      </div>
                      {isOpen ? <ChevronDown size={14} className={iconClass}/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                    </button>

                    {isOpen && (
                      <div className="mt-2 ml-3 space-y-1 border-l-2 border-zinc-100 dark:border-white/5 pl-3 animate-in slide-in-from-top-2 pb-2">
                        {modulosLiberadosNestaCat.map(modulo => (
                          <SubNavLink key={modulo.slug} href={modulo.slug} iconName={modulo.icone} label={modulo.nome} colorTheme={cor} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {/* RODAPÉ DO MENU (LOGOUT E INFORMAÇÕES) */}
        <div className="shrink-0 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20 p-5 transition-colors duration-300" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="flex items-center justify-between bg-white dark:bg-[#0c0c0e] p-2.5 rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${userRole === "admin" ? "from-purple-100 to-indigo-50 border-purple-200 dark:from-purple-500/20 dark:to-indigo-500/10 dark:border-purple-500/30" : "from-emerald-100 to-teal-50 border-emerald-200 dark:from-emerald-500/20 dark:to-teal-500/10 dark:border-emerald-500/30"} border shadow-inner`}>
                <LucideIcons.Users size={18} className={userRole === "admin" ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-[13px] font-black text-zinc-800 dark:text-zinc-200 leading-tight">{userName}</p>
                <p className={`text-[10px] uppercase tracking-widest font-bold mt-0.5 ${userRole === "admin" ? "text-purple-600 dark:text-purple-500" : "text-emerald-600 dark:text-emerald-500"}`}>{userRole}</p>
              </div>
            </div>
            <button onClick={handleSairDoApp} className="mr-1 flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20">
              <LogOut size={16} />
            </button>
          </div>
          
          {userRole === "admin" && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-600 font-bold tracking-widest uppercase">
              <span>Raizan OS</span>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span>v{packageJson.version}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}