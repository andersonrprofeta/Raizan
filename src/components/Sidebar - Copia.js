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
  TrendingUp, Building2, CreditCard, Receipt
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

  // O ÚNICO E SOBERANO SEGURANÇA DA BOATE 🛑
  useEffect(() => {
    const b2bUser = localStorage.getItem("raizan_user");
    const adminLicenca = localStorage.getItem("@raizan:license");

    // 1. REGRA DO LOJISTA VIP (Se tiver crachá, libera e MORRE a função)
    if (b2bUser) {
      try {
        const user = JSON.parse(b2bUser);
        setUserRole("lojista");
        setUserName(user.nome || "Usuário");
        return; // SINAL DE PARE! NADA ABAIXO DESSA LINHA VAI EXECUTAR PARA O LOJISTA.
      } catch (e) {
        console.error("Erro ao ler dados do Lojista");
      }
    }

    // 2. REGRA DO ADMIN
    setUserRole("admin");
    setUserName("Admin Raizan");

    // Se NÃO é lojista e NÃO tem licença, é invasor. Expulsa!
    if (!adminLicenca) {
      // Devolve para a porta certa
      if (pathname && pathname.includes("b2b")) {
        window.location.href = "/login-b2b";
      } else {
        window.location.href = "/login";
      }
      return;
    }

    // Processamento da Licença do Admin
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
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
        isActive(href) 
          ? "bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20" 
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
      }`}
    >
      <Icon size={18} className={isActive(href) ? "text-purple-400" : "text-zinc-500"} />
      {label}
    </Link>
  );

  const hasVendas = ["pedidos", "mercado-livre", "shopee", "magalu", "pdv"].some(tem);
  const hasGestao = ["produtos", "estoque", "clientes", "financeiro", "notas", "relatorios"].some(tem);
  const hasMkt = ["crm", "whatsapp", "website", "catalogo", "ads"].some(tem);
  const hasSys = ["host", "configuracoes", "sistema"].some(tem);

  // SE AINDA NÃO DESCOBRIU O PAPEL, MOSTRA A BARRA VAZIA (FIM DO PISCA-PISCA)
  if (!userRole) {
    return <aside className="h-screen sticky top-0 w-[260px] bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col z-20 shrink-0"></aside>;
  }

  return (
    <aside className="h-screen sticky top-0 w-[260px] bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col z-20 shrink-0 transition-all" style={{ WebkitAppRegion: 'drag' }}>
      
      <div className="flex items-center gap-3 h-16 px-5 border-b border-zinc-800/80 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
          <Database size={18} className="text-white" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight truncate">
          Raizan Core
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar py-5 px-3 space-y-5" style={{ WebkitAppRegion: 'no-drag' }}>
        
        {licencaExpirada && userRole === "admin" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center text-center animate-pulse">
            <AlertTriangle size={24} className="text-red-400 mb-2" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Licença Expirada</span>
            <span className="text-[10px] text-zinc-500 mt-1">Sincronize ou renove seu plano.</span>
          </div>
        )}

        {userRole === "lojista" && (
          <div className="space-y-1">
            <div className="text-xs font-bold text-zinc-600 tracking-wider uppercase mb-3 px-2">Portal de Compras</div>
            <NavLink href="/b2b-inicio" icon={LayoutDashboard} label="Dashboard" />
            <NavLink href="/b2b-pedidos" icon={Store} label="Novo Pedido" />
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
              <div className="space-y-1">
                <div className="text-xs font-bold text-zinc-600 tracking-wider uppercase mb-2 px-2 mt-4">Atacado</div>
                <NavLink href="/b2b-pedidos" icon={Building2} label="Simular Catálogo B2B" />
                <NavLink href="/pedidos" icon={ShoppingBag} label="Gestão de Pedidos B2B" />
              </div>
            )}

            {hasVendas && !licencaExpirada && (
              <div className="pt-2">
                <button onClick={() => toggleMenu('vendas')} className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg transition-colors ${openMenus.vendas ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <div className="flex items-center gap-3"><TrendingUp size={16} className={openMenus.vendas ? 'text-emerald-400' : 'text-zinc-500'} /><span className="font-semibold uppercase tracking-wide text-xs">Vendas & Canais</span></div>
                  {openMenus.vendas ? <ChevronDown size={14} className="text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-500"/>}
                </button>
                {openMenus.vendas && (
                  <div className="mt-1 ml-3 pl-3 border-l border-zinc-800 space-y-1 animate-in slide-in-from-top-2">
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
                <button onClick={() => toggleMenu('gestao')} className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg transition-colors ${openMenus.gestao ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <div className="flex items-center gap-3"><Package size={16} className={openMenus.gestao ? 'text-blue-400' : 'text-zinc-500'} /><span className="font-semibold uppercase tracking-wide text-xs">Gestão & ERP</span></div>
                  {openMenus.gestao ? <ChevronDown size={14} className="text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-500"/>}
                </button>
                {openMenus.gestao && (
                  <div className="mt-1 ml-3 pl-3 border-l border-zinc-800 space-y-1 animate-in slide-in-from-top-2">
                    {tem("produtos") && <NavLink href="/produtos" icon={Package} label="Produtos (Sinc)" />}
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
                <button onClick={() => toggleMenu('marketing')} className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg transition-colors ${openMenus.marketing ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <div className="flex items-center gap-3"><Megaphone size={16} className={openMenus.marketing ? 'text-orange-400' : 'text-zinc-500'} /><span className="font-semibold uppercase tracking-wide text-xs">Marketing & CRM</span></div>
                  {openMenus.marketing ? <ChevronDown size={14} className="text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-500"/>}
                </button>
                {openMenus.marketing && (
                  <div className="mt-1 ml-3 pl-3 border-l border-zinc-800 space-y-1 animate-in slide-in-from-top-2">
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
                <button onClick={() => toggleMenu('sistema')} className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded-lg transition-colors ${openMenus.sistema ? 'text-zinc-200' : 'text-zinc-400 hover:text-zinc-200'}`}>
                  <div className="flex items-center gap-3"><Settings size={16} className={openMenus.sistema ? 'text-zinc-300' : 'text-zinc-500'} /><span className="font-semibold uppercase tracking-wide text-xs">Sistema</span></div>
                  {openMenus.sistema ? <ChevronDown size={14} className="text-zinc-500"/> : <ChevronRight size={14} className="text-zinc-500"/>}
                </button>
                {openMenus.sistema && (
                  <div className="mt-1 ml-3 pl-3 border-l border-zinc-800 space-y-1 animate-in slide-in-from-top-2">
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

      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Users size={18} className={userRole === "admin" ? "text-purple-400" : "text-emerald-400"} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-zinc-200 truncate">{userName}</p>
            <p className={`text-xs capitalize font-medium ${userRole === "admin" ? "text-purple-400" : "text-emerald-400"}`}>{userRole}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSairDoApp}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={16} /> {userRole === "admin" ? "Fechar App" : "Sair da Conta"}
        </button>
        
        {userRole === "admin" && (
          <p className="mt-3 text-[10px] text-zinc-600 text-center uppercase tracking-widest font-bold">
            v{packageJson.version}
          </p>
        )}
      </div>
    </aside>
  );
}