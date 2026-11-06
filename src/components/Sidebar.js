"use client";
import { useEffect, useState } from "react";
import { getHubUrl } from "@/components/utils/api";
import { lerUsuario, limparSessao, renovarSessao, sairDoCore, temPermissao } from "@/components/utils/sessaoCore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react"; 
import { 
  Database, LogOut, X, AlertTriangle, ChevronDown, ChevronRight,
  LayoutDashboard, Store, Package, FileText, Receipt, Users
} from "lucide-react";
import packageJson from "../../package.json";
import toast from 'react-hot-toast';

// ==========================================
// 🎨 DESIGN TOKENS (estilo Apple: vidro, hairlines, ícones em "tiles")
// ==========================================

// Classes completas (o Tailwind precisa enxergá-las inteiras no código)
const TILE_CORES = {
  emerald: "from-emerald-400 to-emerald-600",
  purple: "from-violet-400 to-purple-600",
  orange: "from-orange-400 to-orange-600",
  blue: "from-sky-400 to-blue-600",
  zinc: "from-zinc-500 to-zinc-700",
};

// Ícone em "tile" arredondado, igual aos ícones de app da Apple
const Tile = ({ cor = "purple", size = 40, children, className = "" }) => (
  <div
    className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE_CORES[cor] || TILE_CORES.zinc} text-white ring-1 ring-black/5 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(0,0,0,0.35)] ${className}`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    {children}
  </div>
);

// A sessão é conferida ao abrir e a cada 5 minutos: isso também mantém o terminal marcado como em uso
const INTERVALO_DA_SESSAO_MS = 5 * 60 * 1000;

// Chave onde guardamos se o menu está recolhido (só ícones)
const CHAVE_COLAPSO = "@raizan:sidebar_colapsada";

export default function Sidebar() {
  const pathname = usePathname();
  
  const [isClient, setIsClient] = useState(false);
  const [logoEmpresa, setLogoEmpresa] = useState(null); 

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

  // 🆕 MODO RECOLHIDO (só no desktop; no celular a gaveta continua sempre completa)
  const [colapsada, setColapsada] = useState(false);
  const c = colapsada;

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    if (!lerUsuario()) return;

    const conferirSessao = async () => {
      try {
        const { ok, encerrada } = await renovarSessao();
        if (encerrada) {
          limparSessao();
          window.location.href = "/login";
          return;
        }
        if (ok) {
          const modulos = localStorage.getItem("@raizan:modulos");
          setModulosLiberados(modulos ? JSON.parse(modulos) : []);
          setUsuario(lerUsuario());
        }
      } catch (e) {}
    };

    conferirSessao();
    const intervalo = setInterval(conferirSessao, INTERVALO_DA_SESSAO_MS);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE_COLAPSO) === "1") setColapsada(true);
    } catch (e) {}
  }, []);

  const salvarColapso = (valor) => {
    try { localStorage.setItem(CHAVE_COLAPSO, valor ? "1" : "0"); } catch (e) {}
  };

  const alternarColapso = () => {
    const novo = !colapsada;
    setColapsada(novo);
    salvarColapso(novo);
  };

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

    if (!adminLicenca && !b2bUser) {
      if (pathname && pathname.includes("b2b")) window.location.href = "/login-b2b";
      else window.location.href = "/login";
      return;
    }

    if (b2bUser) {
      try {
        let userObj = JSON.parse(b2bUser);
        if (userObj.user) userObj = userObj.user; 
        const nomeOficial = userObj.nome || userObj.RAZAO || userObj.razao_social || "Lojista";
        setUserRole("lojista");
        setUserName(nomeOficial.trim().split(' ')[0]);
        setIsClient(true);
        return; 
      } catch (e) {}
    }

    setUserRole("admin");
    const usuarioLogado = lerUsuario();
    setUsuario(usuarioLogado);
    const nomeSalvo = usuarioLogado?.nome || localStorage.getItem("@raizan:nome");
    setUserName(nomeSalvo && nomeSalvo.trim() !== "" ? nomeSalvo.split(' ')[0] : "Admin");

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
    setIsClient(true); 
  }, [pathname]);

  useEffect(() => {
    const checarDadosLocais = () => {
      const carrinhoSalvo = localStorage.getItem("@raizan:carrinho");
      if (carrinhoSalvo) {
        try {
          const parsed = JSON.parse(carrinhoSalvo);
          if (Object.keys(parsed).length > 0) {
            setTextoPedido("Continuar Pedido");
            setTemPedidoAberto(true);
          } else {
            setTextoPedido("Novo Pedido");
            setTemPedidoAberto(false);
          }
        } catch (e) { }
      } else {
        setTextoPedido("Novo Pedido");
        setTemPedidoAberto(false);
      }

      // 🟢 O FAREJADOR DA LOGO: Tenta no cache principal...
      let logoSalva = localStorage.getItem("@raizan:logo");
      
      // ... Se falhar, vasculha a mochila do Lojista B2B
      if (!logoSalva || logoSalva === "null") {
        const b2bData = localStorage.getItem("raizan_user");
        if (b2bData) {
          try {
            let parsedB2B = JSON.parse(b2bData);
            let u = parsedB2B.user ? parsedB2B.user : parsedB2B;
            if (u.logo_url) logoSalva = u.logo_url;
            else if (u.tenant_logo) logoSalva = u.tenant_logo;
            else if (u.logo) logoSalva = u.logo;
          } catch(e) {}
        }
      }

      setLogoEmpresa(logoSalva && logoSalva !== "null" ? logoSalva : null);
    };

    checarDadosLocais();

    // Lojista logado antes da correção não tem a logo no navegador, e ela pode mudar no Core
    const atualizarLogoDoPortal = async () => {
      if (!localStorage.getItem("raizan_user") || !localStorage.getItem("@raizan:b2b_tenant_id")) return;
      try {
        const res = await fetch(`${getHubUrl()}/api/hub/integracoes/b2b/identificar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url_acesso: window.location.hostname })
        });
        const data = await res.json();
        if (data.success && data.logo_url) {
          localStorage.setItem("@raizan:logo", data.logo_url);
          setLogoEmpresa(data.logo_url);
        }
      } catch (e) { }
    };
    atualizarLogoDoPortal();
    window.addEventListener('storage', checarDadosLocais);
    const intervalo = setInterval(checarDadosLocais, 1000);
    return () => { window.removeEventListener('storage', checarDadosLocais); clearInterval(intervalo); };
  }, [pathname]);

  const handleSairDoApp = () => {
    if (userRole === "lojista") {
      toast.success("Saindo da conta...");
      setTimeout(() => { localStorage.removeItem("raizan_user"); localStorage.removeItem("@raizan:token"); window.location.href = "/login-b2b"; }, 1000);
    } else if (lerUsuario()) {
      sairDoCore();
    } else {
      toast.success("Encerrando o sistema...");
      setTimeout(() => window.close(), 1000);
    }
  };

  const toggleMenu = (menu) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  const isActive = (path) => pathname === path || pathname === `/${path}`;
  // A licença é o teto: o usuário nunca vê um módulo que a empresa não tem
  const hasAccess = (slug) => { if (!slug) return true; return modulosLiberados.includes(slug) && temPermissao(slug); };

  // Sem barra de endereço ainda há atalhos e janelas antigas: a tela sem permissão volta para o início
  useEffect(() => {
    if (!usuario || !pathname) return;
    const modulos = Object.values(menuDinamico).flat();
    const atual = modulos.find((modulo) => pathname === `/${modulo.slug}` || pathname.startsWith(`/${modulo.slug}/`));
    if (atual && !temPermissao(atual.slug)) window.location.href = "/resumo";
  }, [usuario, pathname, menuDinamico]);

  // 🆕 Clique numa categoria: se o menu está recolhido (desktop), expande e já abre a categoria.
  // Caso contrário, funciona exatamente como antes (toggleMenu).
  const handleCategoriaClick = (categoriaNome) => {
    const ehDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    if (colapsada && ehDesktop) {
      setColapsada(false);
      salvarColapso(false);
      setOpenMenus(prev => ({ ...prev, [categoriaNome]: true }));
      return;
    }
    toggleMenu(categoriaNome);
  };

  // Base visual de todos os links (no modo recolhido o ícone fica centralizado)
  const linkBase = `relative group flex w-full min-w-0 items-center gap-3 rounded-[14px] px-3 py-2.5 text-[13px] sm:text-sm font-medium transition-all duration-300 overflow-hidden ${c ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`;
  const esconderNoRecolhido = c ? "lg:hidden" : "";

  const DashboardNavLink = ({ href, icon: Icon, label }) => {
    const active = isActive(href);
    const isLojista = userRole === "lojista";
    
    const activeClass = isLojista 
      ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(16,185,129,0.6)]" 
      : "bg-gradient-to-b from-purple-500 to-purple-600 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(147,51,234,0.6)]";
      
    const hoverClass = isLojista
      ? "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"
      : "text-zinc-600 dark:text-zinc-400 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-400";

    return (
      <Link href={href} onClick={closeMobileSidebar} title={c ? label : undefined} className={`${linkBase} ${active ? activeClass : hoverClass}`}>
        <Icon size={18} className={`shrink-0 transition-colors duration-300 ${active ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
        <span className={`min-w-0 truncate ${esconderNoRecolhido}`}>{label}</span>
      </Link>
    );
  };

  const SubNavLink = ({ href, iconName, label, colorTheme }) => {
    const active = isActive(href);
    const IconComponent = LucideIcons[iconName] || LucideIcons.Box;

    const themes = {
      emerald: { active: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(16,185,129,0.6)]", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400", iconActive: "text-white" },
      purple: { active: "bg-gradient-to-b from-purple-500 to-purple-600 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(147,51,234,0.6)]", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-400", iconActive: "text-white" },
      orange: { active: "bg-gradient-to-b from-orange-400 to-orange-500 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(249,115,22,0.6)]", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-400", iconActive: "text-white" },
      blue: { active: "bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(59,130,246,0.6)]", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400", iconActive: "text-white" },
      zinc: { active: "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_-8px_rgba(39,39,42,0.5)]", hover: "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] hover:text-zinc-900 dark:hover:text-zinc-200", iconActive: "text-white dark:text-zinc-900" }
    };
    const currentTheme = themes[colorTheme] || themes.purple;
    const safeHref = href.startsWith('/') ? href : `/${href}`;

    return (
      <Link href={safeHref} onClick={closeMobileSidebar} className={`${linkBase} ${active ? currentTheme.active : currentTheme.hover}`}>
        <IconComponent size={18} className={`shrink-0 transition-colors duration-300 ${active ? currentTheme.iconActive : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
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
    emerald: { open: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", iconOpen: "text-emerald-600 dark:text-emerald-400" },
    purple: { open: "bg-purple-500/10 text-purple-700 dark:text-purple-400", iconOpen: "text-purple-600 dark:text-purple-400" },
    orange: { open: "bg-orange-500/10 text-orange-700 dark:text-orange-400", iconOpen: "text-orange-500 dark:text-orange-400" },
    blue: { open: "bg-blue-500/10 text-blue-700 dark:text-blue-400", iconOpen: "text-blue-600 dark:text-blue-400" },
    zinc: { open: "bg-black/[0.05] dark:bg-white/[0.07] text-zinc-900 dark:text-zinc-200", iconOpen: "text-zinc-700 dark:text-zinc-300" }
  };

  if (!isClient || !userRole) {
      return <aside className="hidden h-screen sticky top-0 w-[260px] max-w-full shrink-0 flex-col overflow-x-hidden border-r border-black/[0.06] dark:border-white/[0.07] bg-white/80 dark:bg-[#0c0c0e] z-20 lg:flex transition-colors duration-300"></aside>;
  }

  // Ícone do botão de recolher (com plano B caso a versão do lucide não tenha os painéis)
  const IconeToggle = c
    ? (LucideIcons.PanelLeftOpen || LucideIcons.ChevronsRight)
    : (LucideIcons.PanelLeftClose || LucideIcons.ChevronsLeft);

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md z-40 lg:hidden animate-in fade-in" onClick={closeMobileSidebar} />}

      <aside
        className={`fixed top-0 z-50 flex h-screen lg:h-[calc(100vh-2rem)] w-[85vw] max-w-[260px] shrink-0 flex-col overflow-hidden
          bg-white/85 dark:bg-[#121214]/85 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08]
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_70px_-20px_rgba(0,0,0,0.9)]
          transition-all duration-300 ease-in-out sm:w-[320px] lg:sticky lg:top-4 lg:ml-4 lg:rounded-[28px]
          ${c ? "lg:w-[84px] lg:max-w-[84px]" : "lg:w-[260px] lg:max-w-[260px]"}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ WebkitAppRegion: 'drag' }}
      >
        
        {/* 🟢 CABEÇALHO DA LOGO */}
        <div
          className={`flex shrink-0 items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.07] px-4 sm:px-5 transition-all duration-300 ${c ? "h-20 lg:h-auto lg:flex-col lg:justify-center lg:gap-3 lg:px-2 lg:py-4" : "h-20"}`}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          
          <div className={`flex min-w-0 items-center gap-3 ${c ? "lg:flex-none lg:justify-center" : "flex-1"}`}>
            {logoEmpresa ? (
              <img 
                src={logoEmpresa} 
                alt="Logo do Cliente" 
                className={`w-auto object-contain drop-shadow-sm p-1 ${c ? "max-h-12 sm:max-h-14 max-w-full lg:max-h-10 lg:max-w-[48px]" : "max-h-12 sm:max-h-14 max-w-full"}`} 
              />
            ) : (
              <>
                <Tile cor="purple" size={38}>
                  <Database size={18} />
                </Tile>
                <h1 className={`truncate text-[17px] font-bold tracking-tight text-zinc-900 dark:text-white ${esconderNoRecolhido}`}>
                  Raizan Core
                </h1>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* 🆕 Botão de recolher / expandir (só no desktop) */}
            <button
              onClick={alternarColapso}
              title={c ? "Expandir menu" : "Recolher menu"}
              aria-label={c ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!c}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-all duration-300 active:scale-90"
            >
              <IconeToggle size={16} />
            </button>

            <button onClick={closeMobileSidebar} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:hover:text-white lg:hidden transition-all active:scale-90">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO E MOTOR DINÂMICO */}
        <nav className={`custom-scrollbar flex-1 space-y-2 overflow-x-hidden overflow-y-auto px-4 py-5 ${c ? "lg:px-3" : ""}`} style={{ WebkitAppRegion: 'no-drag' }}>
          
          {licencaExpirada && userRole === "admin" && (
            <div className={`flex animate-pulse flex-col items-center rounded-[20px] border border-red-500/20 bg-red-500/10 p-4 text-center mb-6 ${c ? "lg:p-2.5" : ""}`} title={c ? "Licença Expirada" : undefined}>
              <AlertTriangle size={24} className={`text-red-500 dark:text-red-400 ${c ? "lg:mb-0 mb-2" : "mb-2"}`} />
              <span className={`text-xs font-semibold text-red-600 dark:text-red-400 ${esconderNoRecolhido}`}>Licença Expirada</span>
            </div>
          )}

          {userRole === "lojista" && (
            <div className="space-y-1 mb-6">
              <div className={`mb-3 px-3 text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 ${esconderNoRecolhido}`}>Portal de Compras</div>
              <DashboardNavLink href="/b2b-inicio" icon={LayoutDashboard} label="Dashboard" />
              <Link
                href="/b2b-pedidos"
                onClick={closeMobileSidebar}
                title={c ? textoPedido : undefined}
                className={`${linkBase} ${temPedidoAberto
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
                  : isActive("/b2b-pedidos")
                    ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_20px_-8px_rgba(16,185,129,0.6)]"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400"}`}
              >
                <Store size={18} className={`shrink-0 transition-colors duration-300 ${temPedidoAberto ? "text-emerald-600 dark:text-emerald-400" : isActive("/b2b-pedidos") ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-inherit"}`} />
                <span className={`min-w-0 truncate ${esconderNoRecolhido}`}>{textoPedido}</span>
              </Link>
              <DashboardNavLink href="/b2b-historico" icon={Package} label="Meus Pedidos" />
              <DashboardNavLink href="/b2b-financeiro" icon={Receipt} label="Financeiro" />
            </div>
          )}

          {userRole === "admin" && (
            <>
              <div className="space-y-1 pb-4">
                <DashboardNavLink href="/" icon={LayoutDashboard} label={temPermissao("dashboard_executivo") ? "Dashboard Admin" : "Início"} />
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
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-zinc-900 dark:hover:text-zinc-200";
                
                const iconClass = isOpen ? themeMap.iconOpen : "text-zinc-400 dark:text-zinc-500";

                return (
                  <div key={categoriaNome} className="pt-1">
                    <button
                      onClick={() => handleCategoriaClick(categoriaNome)}
                      title={c ? categoriaNome : undefined}
                      className={`flex w-full items-center justify-between rounded-[16px] px-2.5 py-2 text-sm transition-all duration-300 ${c ? "lg:justify-center lg:px-0" : ""} ${btnClass}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Tile cor={cor} size={30}><IconeGeral size={15} /></Tile>
                        <span className={`truncate text-[13px] font-semibold tracking-tight ${esconderNoRecolhido}`}>{categoriaNome}</span>
                      </div>
                      <span className={esconderNoRecolhido}>
                        {isOpen ? <ChevronDown size={14} className={iconClass}/> : <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500"/>}
                      </span>
                    </button>

                    {isOpen && (
                      <div className={`mt-1.5 ml-5 space-y-1 border-l border-black/[0.08] dark:border-white/[0.08] pl-3 animate-in slide-in-from-top-2 pb-2 ${esconderNoRecolhido}`}>
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

        {/* RODAPÉ DO MENU */}
        <div className={`shrink-0 border-t border-black/[0.06] dark:border-white/[0.07] p-4 transition-all duration-300 ${c ? "lg:p-3" : ""}`} style={{ WebkitAppRegion: 'no-drag' }}>
          <div className={`flex items-center justify-between rounded-[20px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] p-2.5 ${c ? "lg:flex-col lg:gap-2 lg:p-2" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <Tile cor={userRole === "admin" ? "purple" : "emerald"} size={40}>
                <LucideIcons.Users size={18} />
              </Tile>
              <div className={`min-w-0 overflow-hidden ${esconderNoRecolhido}`}>
                <p className="truncate text-[13px] font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 leading-tight">{userName}</p>
                <p className={`text-[11px] capitalize font-medium mt-0.5 ${userRole === "admin" ? "text-purple-600 dark:text-purple-400" : "text-emerald-600 dark:text-emerald-400"}`}>{usuario?.perfil || userRole}</p>
              </div>
            </div>
            <button
              onClick={handleSairDoApp}
              title="Sair"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-90 ${c ? "" : "mr-0.5"}`}
            >
              <LogOut size={16} />
            </button>
          </div>
          
          {userRole === "admin" && (
            <div className={`mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-600 font-medium ${esconderNoRecolhido}`}>
              <span>Raizan Core</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span>v{packageJson.version}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}