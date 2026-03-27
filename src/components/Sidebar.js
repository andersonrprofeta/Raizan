"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Package, ShoppingBag, Users, 
  Briefcase, Terminal, BarChart3, CircleDollarSign, MonitorSmartphone, 
  Settings, Database, LogOut, Store, ShoppingCart, 
  Globe, BookOpen, Megaphone, MessageCircle, Server, 
  FileText, Boxes, AlertTriangle
} from "lucide-react";
import packageJson from "../../package.json";


export default function Sidebar() {
  const pathname = usePathname();
  const [modulosLiberados, setModulosLiberados] = useState([]);
  const [licencaExpirada, setLicencaExpirada] = useState(false);

  useEffect(() => {
    const licenca = localStorage.getItem("@raizan:license");
    if (!licenca) {
      window.location.href = "/login";
      return;
    }

    const modulos = localStorage.getItem("@raizan:modulos");
    const vencimento = localStorage.getItem("@raizan:expires_at");
    
    let isExpired = false;

    // O GUARDA-COSTAS DA SIDEBAR (Verifica se já passou da validade)
    if (vencimento && vencimento !== "undefined" && vencimento !== "null" && vencimento.trim() !== "") {
      try {
        let ano, mes, dia;
        if (vencimento.includes('/')) {
          const p = vencimento.split('/'); dia = parseInt(p[0]); mes = parseInt(p[1]) - 1; ano = parseInt(p[2]);
        } else if (vencimento.includes('-')) {
          const p = vencimento.split('T')[0].split('-'); ano = parseInt(p[0]); mes = parseInt(p[1]) - 1; dia = parseInt(p[2]);
        } else {
          const limpo = vencimento.replace(/\D/g, '');
          ano = parseInt(limpo.substring(0, 4)); mes = parseInt(limpo.substring(4, 6)) - 1; dia = parseInt(limpo.substring(6, 8));
          if (ano > 2100) { ano = parseInt(limpo.substring(4, 8)); mes = parseInt(limpo.substring(2, 4)) - 1; dia = parseInt(limpo.substring(0, 2)); }
        }
        
        const dataVenc = new Date(ano, mes, dia, 23, 59, 59);
        if (dataVenc.getTime() < new Date().getTime()) {
          isExpired = true; // O TEMPO ACABOU!
        }
      } catch (e) {
        isExpired = true; // Na dúvida de erro de data, bloqueia por segurança
      }
    }

    setLicencaExpirada(isExpired);

    // Se estiver expirada, esvazia os módulos. Se não, carrega normal.
    if (isExpired) {
      setModulosLiberados([]);
    } else if (modulos) {
      setModulosLiberados(JSON.parse(modulos));
    }
  }, []);

  const handleSairDoApp = () => {
    window.close();
  };

  const isActive = (path) => pathname === path;
  
  const menuClass = (path) => `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
    isActive(path) ? "bg-zinc-800/50 text-zinc-100 border border-zinc-700/50 shadow-sm" : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100"
  }`;

  const tem = (id) => modulosLiberados.includes(id);

  return (
    <aside className="h-screen sticky top-0 w-[260px] bg-[#09090b] border-r border-zinc-800/60 p-5 flex flex-col z-20" style={{ WebkitAppRegion: 'drag' }}>
      
      <div className="flex items-center gap-3 mb-8 px-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)] shrink-0">
          <Database size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight truncate">
          Raizan Core
        </h1>
      </div>

      <nav className="flex flex-col gap-1.5 overflow-y-auto pr-1 custom-scrollbar" style={{ WebkitAppRegion: 'no-drag' }}>
        
        {/* DASHBOARD SEMPRE VISÍVEL (Mesmo expirado, pra ele ver a tela principal e a de Conta) */}
        <Link href="/" className={menuClass("/")}>
          <LayoutDashboard size={18} className={isActive("/") ? "text-purple-400" : ""} /> Dashboard
        </Link>

        {/* ALERTA DE BLOQUEIO NA SIDEBAR */}
        {licencaExpirada && (
          <div className="mt-4 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center text-center">
            <AlertTriangle size={24} className="text-red-400 mb-2" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Licença Expirada</span>
            <span className="text-[10px] text-zinc-500 mt-1">Sincronize ou renove seu plano.</span>
          </div>
        )}

        {/* ECOSSISTEMA RAIZAN DINÂMICO (Só aparecem se a licença estiver em dia) */}
        {tem("produtos") && (
          <Link href="/produtos" className={menuClass("/produtos")}>
            <Package size={18} className={isActive("/produtos") ? "text-purple-400" : ""} /> ERP Produtos
          </Link>
        )}

        {tem("estoque") && (
          <Link href="/estoque" className={menuClass("/estoque")}>
            <Boxes size={18} className={isActive("/estoque") ? "text-purple-400" : ""} /> Estoque
          </Link>
        )}

        {tem("pedidos") && (
          <Link href="/pedidos" className={menuClass("/pedidos")}>
            <ShoppingBag size={18} className={isActive("/pedidos") ? "text-purple-400" : ""} /> Pedidos (Woo)
          </Link>
        )}
        
        {tem("mercado-livre") && (
          <Link href="/mercado-livre" className={menuClass("/mercado-livre")}>
            <Store size={18} className={isActive("/mercado-livre") ? "text-purple-400" : ""} /> Mercado Livre
          </Link>
        )}

        {tem("shopee") && (
          <Link href="/shopee" className={menuClass("/shopee")}>
            <ShoppingCart size={18} className={isActive("/shopee") ? "text-purple-400" : ""} /> Shopee
          </Link>
        )}

        {tem("magalu") && (
          <Link href="/magalu" className={menuClass("/magalu")}>
            <Store size={18} className={isActive("/magalu") ? "text-purple-400" : ""} /> Magalu
          </Link>
        )}

        {tem("pdv") && (
          <Link href="/pdv" className={menuClass("/pdv")}>
            <MonitorSmartphone size={18} className={isActive("/pdv") ? "text-purple-400" : ""} /> PDV
          </Link>
        )}

        {tem("notas") && (
          <Link href="/notas" className={menuClass("/notas")}>
            <FileText size={18} className={isActive("/notas") ? "text-purple-400" : ""} /> Emissão de Notas
          </Link>
        )}

        {tem("clientes") && (
          <Link href="/clientes" className={menuClass("/clientes")}>
            <Users size={18} className={isActive("/clientes") ? "text-purple-400" : ""} /> Clientes
          </Link>
        )}

        {tem("crm") && (
          <Link href="/crm" className={menuClass("/crm")}>
            <Briefcase size={18} className={isActive("/crm") ? "text-purple-400" : ""} /> CRM
          </Link>
        )}

        {tem("whatsapp") && (
          <Link href="/whatsapp" className={menuClass("/whatsapp")}>
            <MessageCircle size={18} className={isActive("/whatsapp") ? "text-purple-400" : ""} /> Auto WhatsApp
          </Link>
        )}

        {tem("website") && (
          <Link href="/website" className={menuClass("/website")}>
            <Globe size={18} className={isActive("/website") ? "text-purple-400" : ""} /> Website
          </Link>
        )}

        {tem("catalogo") && (
          <Link href="/catalogo" className={menuClass("/catalogo")}>
            <BookOpen size={18} className={isActive("/catalogo") ? "text-purple-400" : ""} /> Catálogo
          </Link>
        )}

        {tem("ads") && (
          <Link href="/ads" className={menuClass("/ads")}>
            <Megaphone size={18} className={isActive("/ads") ? "text-purple-400" : ""} /> Meta Ads
          </Link>
        )}

        {tem("relatorios") && (
          <Link href="/relatorios" className={menuClass("/relatorios")}>
            <BarChart3 size={18} className={isActive("/relatorios") ? "text-purple-400" : ""} /> Relatórios
          </Link>
        )}

        {tem("financeiro") && (
          <Link href="/financeiro" className={menuClass("/financeiro")}>
            <CircleDollarSign size={18} className={isActive("/financeiro") ? "text-purple-400" : ""} /> Financeiro
          </Link>
        )}

        {tem("host") && (
          <Link href="/host" className={menuClass("/host")}>
            <Server size={18} className={isActive("/host") ? "text-purple-400" : ""} /> Hospedagem
          </Link>
        )}

        {tem("configuracoes") && (
          <Link href="/configuracoes" className={menuClass("/configuracoes")}>
            <Settings size={18} className={isActive("/configuracoes") ? "text-purple-400" : ""} /> Configurações
          </Link>
        )}

        {/* TELA DO MOTOR DE ATUALIZAÇÕES (TERMINAL HACKER) */}
        {tem("sistema") && (
          <Link href="/sistema" className={menuClass("/sistema")}>
            <Terminal size={18} className={isActive("/sistema") ? "text-purple-400" : ""} /> Gestão do Sistema
          </Link>
        )}

        {/* ESPAÇADOR E BOTÃO DE SAIR */}
        <div className="flex-1 mt-8"></div>

        <button 
          onClick={handleSairDoApp}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100 w-full"
        >
          <LogOut size={18} className="text-zinc-500" /> Sair
        </button>

        <p className="mt-2 mb-4 text-xs text-zinc-500 text-center">
          Versão atual: v{packageJson.version}
        </p>
      </nav>
    </aside>
  );
}