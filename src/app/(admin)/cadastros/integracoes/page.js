"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Plug, Plus, Globe, Settings, Pencil, Trash2,
  CheckCircle2, RefreshCw, Loader2, Store, Database,
  Server, AlertTriangle, CreditCard, Truck, X, Mail, MessageCircle, ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";

// 🟢 IMPORTAÇÃO DOS COMPONENTES ISOLADOS
import FormWooCommerce from "@/components/integracoes/FormWooCommerce";
import FormRaizanCommerce from "@/components/integracoes/FormRaizanCommerce";
import FormPortalB2B from "@/components/integracoes/FormPortalB2B";
import FormMercadoPago from "@/components/integracoes/FormMercadoPago";
import FormFrenet from "@/components/integracoes/FormFrenet";
import FormOmie from "@/components/integracoes/FormOmie";
import FormTiny from "@/components/integracoes/FormTiny";
import EditarOmie from "@/components/integracoes/EditarOmie";
import FormEmailBusiness from "@/components/integracoes/FormEmailBusiness";
import FormWhatsappWeb from "@/components/integracoes/FormWhatsappWeb";
import FormCatalogoWhatsapp from "@/components/integracoes/FormCatalogoWhatsapp";
import { getHeaders, getHubUrl } from "@/components/utils/api";
import { encerrarAplicacao } from "@/components/apps/aplicacoes";
import { buscarAppsIntegrados, lerAppsGuardados, salvarAppIntegrado } from "@/components/apps/appsIntegrados";

/* ======================================================================
   🎨 TOKENS DE DESIGN (mesmo padrão das outras telas)
   ====================================================================== */
const CARD =
  "rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

const PAINEL =
  "rounded-[28px] border border-black/[0.06] dark:border-white/[0.1] bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl shadow-2xl";

const PILULA_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

const BTN_ROXO = `${PILULA_BASE} px-6 py-3 text-sm text-white bg-gradient-to-b from-purple-500 to-purple-700 shadow-lg shadow-purple-500/25 hover:brightness-110`;
const BTN_NEUTRO = `${PILULA_BASE} px-5 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.12]`;
const BTN_PERIGO = `${PILULA_BASE} px-5 py-2.5 text-sm text-white bg-gradient-to-b from-red-500 to-red-700 shadow-lg shadow-red-500/25 hover:brightness-110`;

// Cores completas (o Tailwind precisa ver a classe inteira escrita)
const TILE_CORES = {
  purple: "from-purple-500 to-violet-700 shadow-purple-500/30",
  indigo: "from-indigo-500 to-indigo-700 shadow-indigo-500/30",
  emerald: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
  red: "from-red-500 to-rose-700 shadow-red-500/30",
  zinc: "from-zinc-500 to-zinc-700 shadow-zinc-500/20",
};

const Tile = ({ icon: Icon, cor = "purple", size = 48 }) => (
  <div
    className={`shrink-0 flex items-center justify-center bg-gradient-to-br ${TILE_CORES[cor]} shadow-lg text-white`}
    style={{ width: size, height: size, borderRadius: size * 0.3 }}
  >
    <Icon size={size * 0.5} strokeWidth={2.2} />
  </div>
);

// Estilos do catálogo por cor
const CAT_CORES = {
  purple: {
    borda: "border-purple-200/80 dark:border-purple-500/25 hover:border-purple-400 dark:hover:border-purple-400/60",
    fundo: "from-purple-50/70 to-white/60 dark:from-purple-500/[0.08] dark:to-transparent",
    luz: "bg-purple-500/10",
    selo: "bg-purple-600",
    botao: "bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/25 hover:brightness-110",
    suave: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20",
  },
  indigo: {
    borda: "border-indigo-200/80 dark:border-indigo-500/25 hover:border-indigo-400 dark:hover:border-indigo-400/60",
    fundo: "from-indigo-50/70 to-white/60 dark:from-indigo-500/[0.08] dark:to-transparent",
    luz: "bg-indigo-500/10",
    selo: "bg-indigo-600",
    botao: "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110",
    suave: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20",
  },
  sky: {
    borda: "border-sky-200/80 dark:border-sky-500/25 hover:border-sky-400 dark:hover:border-sky-400/60",
    fundo: "from-sky-50/70 to-white/60 dark:from-sky-500/[0.08] dark:to-transparent",
    luz: "bg-sky-500/10",
    selo: "bg-sky-600",
    botao: "bg-gradient-to-b from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-500/25 hover:brightness-110",
    suave: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20",
  },
  orange: {
    borda: "border-orange-200/80 dark:border-orange-500/25 hover:border-orange-400 dark:hover:border-orange-400/60",
    fundo: "from-orange-50/70 to-white/60 dark:from-orange-500/[0.08] dark:to-transparent",
    luz: "bg-orange-500/10",
    selo: "bg-orange-500",
    botao: "bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:brightness-110",
    suave: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-500/20",
  },
  emerald: {
    borda: "border-emerald-200/80 dark:border-emerald-500/25 hover:border-emerald-400 dark:hover:border-emerald-400/60",
    fundo: "from-emerald-50/70 to-white/60 dark:from-emerald-500/[0.08] dark:to-transparent",
    luz: "bg-emerald-500/10",
    selo: "bg-emerald-600",
    botao: "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110",
    suave: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
  },
  blue: {
    borda: "border-blue-200/80 dark:border-blue-500/25 hover:border-blue-400 dark:hover:border-blue-400/60",
    fundo: "from-blue-50/70 to-white/60 dark:from-blue-500/[0.08] dark:to-transparent",
    luz: "bg-blue-500/10",
    selo: "bg-blue-600",
    botao: "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/25 hover:brightness-110",
    suave: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20",
  },
  red: {
    borda: "border-red-200/80 dark:border-red-500/25 hover:border-red-400 dark:hover:border-red-400/60",
    fundo: "from-red-50/70 to-white/60 dark:from-red-500/[0.08] dark:to-transparent",
    luz: "bg-red-500/10",
    selo: "bg-red-600",
    botao: "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-lg shadow-red-500/25 hover:brightness-110",
    suave: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20",
  },
  zinc: {
    borda: "border-black/[0.06] dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20",
    fundo: "from-white/60 to-white/30 dark:from-white/[0.04] dark:to-transparent",
    luz: "bg-zinc-500/10",
    selo: "bg-zinc-600",
    botao: "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200 border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14]",
    suave: "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.08] dark:hover:bg-white/[0.14]",
  },
};

/* ======================================================================
   🧩 COMPONENTES VISUAIS (só aparência, sem regra de negócio)
   ====================================================================== */

// Cartão de plataforma disponível no catálogo
const CartaoCatalogo = ({ cor, selo, icone, titulo, descricao, textoBotao, onClick, suave = false }) => {
  const c = CAT_CORES[cor];
  return (
    <div className={`relative overflow-hidden group rounded-3xl border bg-gradient-to-b ${c.fundo} ${c.borda} p-5 flex flex-col items-center text-center transition-all hover:shadow-xl`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${c.luz}`} />
      {selo && (
        <div className={`absolute top-3 right-3 ${c.selo} text-white text-[9px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wider z-10`}>
          {selo}
        </div>
      )}
      <div className="relative w-16 h-16 mb-4 rounded-[20px] bg-white dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
        {icone}
      </div>
      <h3 className="relative font-semibold text-base mb-1 text-zinc-900 dark:text-zinc-100">{titulo}</h3>
      <p className="relative text-xs font-medium text-zinc-500 mb-5 min-h-[32px]">{descricao}</p>
      <button
        onClick={onClick}
        className={`relative w-full py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${suave ? c.suave : c.botao}`}
      >
        {textoBotao}
      </button>
    </div>
  );
};

// Cartão "Em breve" (desativado)
const CartaoEmBreve = ({ src, alt, titulo, descricao }) => (
  <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-5 flex flex-col items-center text-center opacity-50 grayscale cursor-not-allowed">
    <div className="w-16 h-16 mb-4 rounded-[20px] bg-white dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] flex items-center justify-center">
      <img src={src} alt={alt} className="w-12 h-12 object-contain" />
    </div>
    <h3 className="font-semibold text-base mb-1">{titulo}</h3>
    <p className="text-xs font-medium text-zinc-500 mb-5 min-h-[32px]">{descricao}</p>
    <span className="w-full py-2.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
      Em Breve
    </span>
  </div>
);

// Título de seção do catálogo
const TituloSecao = ({ icon: Icon, children, topo = false }) => (
  <h3
    className={`text-xs font-bold text-zinc-400 uppercase tracking-[0.18em] mb-4 flex items-center gap-2 ${
      topo ? "" : "mt-2 border-t border-black/[0.06] dark:border-white/[0.06] pt-8"
    }`}
  >
    <Icon size={15} /> {children}
  </h3>
);

// Cartão de WhatsApp e E-mail: abrem dentro do Core e não têm sincronização
const CartaoAppConectado = ({ logo, titulo, detalhe, luz, rotuloEditar = "Editar", onEditar, onDesconectar }) => (
  <div className={`${CARD} relative flex min-h-[220px] flex-col justify-between overflow-hidden p-6 transition-shadow hover:shadow-xl`}>
    <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${luz}`} />
    <div className="relative flex items-start justify-between">
      {logo}
      <SeloAtivo />
    </div>
    <div className="relative mb-5 mt-4">
      <h3 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">{titulo}</h3>
      <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-zinc-500"><Globe size={12} /> {detalhe}</p>
    </div>
    <div className="relative mt-auto flex w-full gap-2">
      {onEditar && (
        <button onClick={(e) => { e.stopPropagation(); onEditar(); }} className={`${PILULA_BASE} flex-1 border border-black/[0.06] bg-black/[0.04] py-2.5 text-xs text-zinc-700 hover:bg-black/[0.07] dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-zinc-200 dark:hover:bg-white/[0.12]`}>
          <Pencil size={14} /> {rotuloEditar}
        </button>
      )}
      <button onClick={(e) => { e.stopPropagation(); onDesconectar(); }} aria-label={`Desconectar ${titulo}`} className={`${PILULA_BASE} ${onEditar ? "px-4" : "w-full"} border border-red-500/20 bg-red-500/10 py-2.5 text-xs text-red-600 hover:bg-red-500/20 dark:text-red-400`}>
        <Trash2 size={14} /> {!onEditar && "Desconectar"}
      </button>
    </div>
  </div>
);

const SeloAtivo = () => (
  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
    <CheckCircle2 size={12} /> Ativo
  </span>
);

export default function IntegracoesPage() {
  const [integracoesAtivas, setIntegracoesAtivas] = useState([]);
  const [oracleConfigurado, setOracleConfigurado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [instalando, setInstalando] = useState(null);
  const [menuAberto, setMenuAberto] = useState(null);
  const [integracaoParaDeletar, setIntegracaoParaDeletar] = useState(null);

  // 🟢 ESTADO PARA CONTROLAR A EDIÇÃO
  const [editandoInt, setEditandoInt] = useState(null);
  const [appsConectados, setAppsConectados] = useState({});
  const [catalogoWhatsapp, setCatalogoWhatsapp] = useState(null);

  const pegarCnpjLogado = () => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("@raizan:user");
      if (storedUser) return JSON.parse(storedUser).tenant_id;
    }
    return "";
  };

  useEffect(() => {
    carregarIntegracoesEStatus();
  }, []);

  const carregarIntegracoesEStatus = async () => {
    const cnpj = pegarCnpjLogado();
    if (!cnpj) {
      setLoading(false); // 🛠️ evita spinner infinito quando não há usuário logado
      return;
    }

    const cacheInt = localStorage.getItem(`@raizan:cache_integracoes_${cnpj}`);
    const cacheOracle = localStorage.getItem(`@raizan:cache_oracle_${cnpj}`);

    if (cacheInt) setIntegracoesAtivas(JSON.parse(cacheInt));
    if (cacheOracle) setOracleConfigurado(JSON.parse(cacheOracle));
    if (cacheInt || cacheOracle) setLoading(false);

    setAppsConectados(lerAppsGuardados());
    buscarAppsIntegrados().then(setAppsConectados).catch(() => {});

    fetch(`${getHubUrl()}/api/hub/catalogo-whatsapp/config`, { headers: getHeaders() })
      .then((resposta) => resposta.json())
      .then((dados) => { if (dados.success) setCatalogoWhatsapp(dados.config); })
      .catch(() => {});

    try {
      const [resInt, resConf] = await Promise.all([
        fetch("https://api.raizan.com.br/api/hub/integracoes", { headers: { "x-tenant-id": cnpj } }),
        fetch("https://api.raizan.com.br/api/hub/configuracoes", { headers: { "x-tenant-id": cnpj } })
      ]);

      const dataInt = await resInt.json();
      const dataConf = await resConf.json();

      if (dataInt.success) {
        setIntegracoesAtivas(dataInt.integracoes);
        localStorage.setItem(`@raizan:cache_integracoes_${cnpj}`, JSON.stringify(dataInt.integracoes));
      }

      if (dataConf.success && dataConf.configuracoes?.oracle_host) {
        setOracleConfigurado(true);
        localStorage.setItem(`@raizan:cache_oracle_${cnpj}`, JSON.stringify(true));
      } else {
        setOracleConfigurado(false);
        localStorage.setItem(`@raizan:cache_oracle_${cnpj}`, JSON.stringify(false));
      }
    } catch (error) {
      console.log("Aviso: Falha ao sincronizar em background.");
    } finally {
      setLoading(false);
    }
  };

  const [passosSync, setPassosSync] = useState([]);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // 🟢 FUNÇÃO PREMIUM DE SINCRONIZAÇÃO (COM O CARROSSEL COMPLETO)
  const sincronizarDadosDaLoja = async (idIntegracao) => {
    const cnpj = pegarCnpjLogado();
    setSincronizando(idIntegracao);
    setIsSyncModalOpen(true);

    // Passo 1 inicial (Mostrando já as pendentes!)
    setPassosSync([
      { id: 1, texto: "Mapeando Vendedores...", status: "loading" },
      { id: 2, texto: "Sincronizando Clientes e Títulos em Aberto...", status: "pending" },
      { id: 3, texto: "Carregando Catálogo de Produtos e Preços...", status: "pending" },
      { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "pending" },
    ]);

    // Animação progressiva das etapas no ecrã
    let estagio = 1;
    const temporizadorEtapas = setInterval(() => {
      estagio++;
      if (estagio === 2) {
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Sincronizando Clientes e Títulos em Aberto...", status: "loading" },
          { id: 3, texto: "Carregando Catálogo de Produtos e Preços...", status: "pending" },
          { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "pending" },
        ]);
      } else if (estagio === 3) {
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Clientes e Títulos Atualizados", status: "done" },
          { id: 3, texto: "Carregando Catálogo de Produtos e Preços...", status: "loading" },
          { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "pending" },
        ]);
      } else if (estagio === 4) {
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Clientes e Títulos Atualizados", status: "done" },
          { id: 3, texto: "Produtos e Fotos Atualizados", status: "done" },
          { id: 4, texto: "Consultando Saldos Físicos de Estoque...", status: "loading" },
        ]);
      }
    }, 2800);

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/sync/${idIntegracao}`, {
        method: "POST", headers: { "x-tenant-id": cnpj }
      });
      const data = await res.json();

      clearInterval(temporizadorEtapas);

      if (data.success) {
        // Marca todas as etapas como concluídas com sucesso!
        setPassosSync([
          { id: 1, texto: "Vendedores Mapeados", status: "done" },
          { id: 2, texto: "Clientes e Títulos Atualizados", status: "done" },
          { id: 3, texto: "Produtos e Fotos Atualizados", status: "done" },
          { id: 4, texto: "Saldos de Estoque Reais Gravados", status: "done" },
          { id: 5, texto: "Sincronização Finalizada!", status: "done" },
        ]);

        toast.success("Carga realizada com sucesso!");
        setTimeout(() => setIsSyncModalOpen(false), 3000);
      } else {
        // Mostra o erro no último passo caso falhe
        setPassosSync(prev => {
          const comErro = prev.map(p => ({ ...p })); // 🛠️ cópia (antes alterava o estado direto)
          const indiceLoading = comErro.findIndex(p => p.status === "loading");
          if (indiceLoading !== -1) comErro[indiceLoading].status = "error";
          return [...comErro, { id: 99, texto: data.message || "Erro na sincronização.", status: "error" }];
        });
        toast.error(data.message || "Erro na sincronização.");
        setTimeout(() => setIsSyncModalOpen(false), 4000);
      }
    } catch (error) {
      clearInterval(temporizadorEtapas);
      setPassosSync(prev => [
        ...prev.map(p => p.status === "loading" ? { ...p, status: "error" } : p),
        { id: 99, texto: "Erro crítico ao comunicar com o servidor.", status: "error" }
      ]);
      toast.error("Falha ao comunicar com o servidor.");
      setTimeout(() => setIsSyncModalOpen(false), 4000);
    } finally {
      setSincronizando(null);
    }
  };

  const confirmarExclusao = async () => {
    if (!integracaoParaDeletar) return;

    if (integracaoParaDeletar.catalogo) {
      try {
        const resposta = await fetch(`${getHubUrl()}/api/hub/catalogo-whatsapp/config`, { method: "DELETE", headers: getHeaders() });
        const dados = await resposta.json();
        if (!dados.success) throw new Error(dados.message);
        setCatalogoWhatsapp(null);
        toast.success("Catálogo desconectado. O link antigo parou de funcionar.");
      } catch (error) {
        toast.error("Não foi possível desconectar. Tente de novo.");
      }
      setIntegracaoParaDeletar(null);
      return;
    }

    if (integracaoParaDeletar.app) {
      const { app } = integracaoParaDeletar;
      try {
        setAppsConectados(await salvarAppIntegrado(app, null));
        encerrarAplicacao(app);
        toast.success("Desconectado. O atalho saiu das Aplicações.");
      } catch (error) {
        toast.error("Não foi possível desconectar. Tente de novo.");
      }
      setIntegracaoParaDeletar(null);
      return;
    }

    const cnpj = pegarCnpjLogado();
    const id = integracaoParaDeletar.id;
    const toastId = toast.loading("Excluindo integração...");

    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/integracoes/${id}`, {
        method: "DELETE", headers: { "x-tenant-id": cnpj }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Integração removida com sucesso!", { id: toastId });
        carregarIntegracoesEStatus();
      } else { toast.error(data.message || "Erro ao excluir.", { id: toastId }); }
    } catch (error) { toast.error("Erro ao comunicar com o servidor.", { id: toastId }); }
    finally { setIntegracaoParaDeletar(null); }
  };

  const editarIntegracao = (int) => {
    if (int.plataforma === "omie") {
      setEditandoInt(int);
    } else {
      toast("A tela de edição será liberada na próxima atualização!");
    }
    setMenuAberto(null);
  };

  const getPlataformaIcon = (plataforma) => {
    const imgClass = "h-12 w-auto max-w-[140px] object-contain drop-shadow-sm";
    const frenetClass = `${imgClass} brightness-0 dark:brightness-100`;

    if (plataforma === "woocommerce") return <img src="/woocommerce.svg" alt="WooCommerce" className={imgClass} />;
    if (plataforma === "raizan_commerce") return <img src="/RaizanCommerce.png" alt="Raizan" className={imgClass} />;
    if (plataforma === "mercadopago") return <img src="/Mercadopago.svg" alt="Mercado Pago" className={imgClass} />;
    if (plataforma === "frenet") return <img src="/Frenet.svg" alt="Frenet" className={frenetClass} />;
    if (plataforma === "shopify") return <img src="/shopify.svg" alt="Shopify" className={imgClass} />;
    if (plataforma === "mercadolivre") return <img src="/mercadolibre.svg" alt="Mercado Livre" className={imgClass} />;
    if (plataforma === "shopee") return <img src="/shopee.svg" alt="Shopee" className={imgClass} />;
    if (plataforma === "oracle") return <img src="/oracle.svg" alt="Oracle" className={imgClass} />;
    if (plataforma === "portal_b2b") return <Tile icon={Globe} cor="indigo" size={48} />;
    if (plataforma === "omie") return <img src="/omie.png" alt="Omie" className={imgClass} />;
    if (plataforma === "tiny") return <img src="/olist.svg" alt="Tiny" className={imgClass} />;

    return <Tile icon={Store} cor="zinc" size={48} />;
  };

  const handleSuccess = () => {
    setInstalando(null);
    setEditandoInt(null);
    carregarIntegracoesEStatus();
  };

  // Luz de fundo por plataforma (cartões ativos)
  const luzPlataforma = (plataforma) => {
    if (plataforma === "raizan_commerce") return "bg-purple-500/10";
    if (plataforma === "mercadopago") return "bg-sky-500/10";
    if (plataforma === "portal_b2b") return "bg-indigo-500/10";
    return "";
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      {/* Luzes suaves de fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />

        {/* ⚠️ sem z-index aqui: senão os modais ficam atrás da Header/Sidebar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative" onClick={() => setMenuAberto(null)}>
          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* HEADER DA PÁGINA */}
            <div className={`${CARD} relative overflow-hidden p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
              <div className="absolute -left-10 -top-10 w-44 h-44 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative">
                <Tile icon={Plug} cor="purple" size={56} />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Minhas Integrações</h1>
                  <p className="text-sm font-medium text-zinc-500 mt-0.5">Conecte o Raizan Hub com suas frentes de loja e ERP.</p>
                </div>
              </div>

              {!instalando && (
                <button
                  onClick={(e) => { e.stopPropagation(); setInstalando("catalogo"); }}
                  className={`${BTN_ROXO} relative w-full sm:w-auto`}
                >
                  <Plus size={18} /> Nova Integração
                </button>
              )}
            </div>

            {loading && integracoesAtivas.length === 0 && !oracleConfigurado ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={36} className="animate-spin text-purple-600 mb-4" />
                <p className="text-zinc-500 font-semibold tracking-widest text-xs uppercase">Carregando integrações...</p>
              </div>
            ) : (
              <>
                {/* LISTAGEM DAS INTEGRAÇÕES ATIVAS */}
                {!instalando && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">

                    {/* Cartão: Nova Integração */}
                    <div
                      onClick={(e) => { e.stopPropagation(); setInstalando("catalogo"); }}
                      className="group rounded-[28px] border-2 border-dashed border-black/[0.12] dark:border-white/[0.12] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.04] hover:border-purple-400 dark:hover:border-purple-400/50 transition-all min-h-[220px]"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.07] flex items-center justify-center mb-3 group-hover:bg-purple-500/10 transition-colors">
                        <Plus size={24} className="text-zinc-400 group-hover:text-purple-500 transition-colors" />
                      </div>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">Nova Integração</p>
                      <p className="text-xs font-medium text-zinc-500 mt-1">Ver plataformas disponíveis</p>
                    </div>

                    {/* Cartão: Oracle */}
                    {oracleConfigurado && (
                      <div className={`${CARD} p-6 flex flex-col justify-between min-h-[220px] relative group overflow-hidden hover:shadow-xl transition-shadow`}>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/15 transition-colors pointer-events-none" />
                        <div className="flex items-start justify-between relative">
                          <img src="/oracle.svg" alt="Oracle" className="h-10 w-auto max-w-[140px] object-contain drop-shadow-sm" />
                          <SeloAtivo />
                        </div>
                        <div className="mt-4 mb-5 relative">
                          <h3 className="font-semibold text-lg truncate text-zinc-900 dark:text-zinc-100">Oracle Database</h3>
                          <p className="text-xs font-medium text-zinc-500 mt-1 truncate flex items-center gap-1.5"><Database size={12} /> Motor Local Vinculado</p>
                        </div>
                        <div className="flex w-full mt-auto relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); window.location.href = "/configuracoes"; }}
                            className={`${PILULA_BASE} w-full py-2.5 text-xs bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20`}
                          >
                            <Settings size={14} /> Ajustar Conexão
                          </button>
                        </div>
                      </div>
                    )}

                    {appsConectados.whatsapp && (
                      <CartaoAppConectado
                        logo={<span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white p-2 ring-1 ring-black/5"><img src="/whatsapp.svg" alt="" className="h-full w-full object-contain" /></span>}
                        titulo="WhatsApp Web" detalhe="Disponível nas Aplicações" luz="bg-emerald-500/10"
                        onDesconectar={() => setIntegracaoParaDeletar({ app: "whatsapp", nome_integracao: "WhatsApp Web" })}
                      />
                    )}

                    {appsConectados.email && (
                      <CartaoAppConectado
                        logo={<Tile icon={Mail} cor="purple" size={48} />}
                        titulo="E-mail Business" detalhe={appsConectados.email.nome} luz="bg-purple-500/10"
                        onEditar={() => setInstalando("email")}
                        onDesconectar={() => setIntegracaoParaDeletar({ app: "email", nome_integracao: "E-mail Business" })}
                      />
                    )}

                    {catalogoWhatsapp && (
                      <CartaoAppConectado
                        logo={<Tile icon={ShoppingBag} cor="emerald" size={48} />}
                        titulo="Catálogo WhatsApp" detalhe={catalogoWhatsapp.nome_loja} luz="bg-emerald-500/10"
                        rotuloEditar="Abrir painel"
                        onEditar={() => { window.location.href = "/ads/whatsapp"; }}
                        onDesconectar={() => setIntegracaoParaDeletar({ catalogo: true, nome_integracao: "Catálogo WhatsApp" })}
                      />
                    )}

                    {/* Cartões: integrações ativas */}
                    {integracoesAtivas.map(int => {
                      const semSync = int.plataforma === "mercadopago" || int.plataforma === "portal_b2b";
                      return (
                        <div
                          key={int.id}
                          className={`${CARD} p-6 flex flex-col justify-between min-h-[220px] relative group hover:shadow-xl transition-shadow ${menuAberto === int.id ? "z-20" : ""}`}
                        >
                          <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none">
                            {luzPlataforma(int.plataforma) && (
                              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl ${luzPlataforma(int.plataforma)}`} />
                            )}
                          </div>

                          <div className="flex items-start justify-between relative">
                            <div className="flex items-center justify-center">
                              {getPlataformaIcon(int.plataforma)}
                            </div>
                            <SeloAtivo />
                          </div>

                          <div className="mt-4 mb-5 relative">
                            <h3 className="font-semibold text-lg truncate text-zinc-900 dark:text-zinc-100" title={int.nome_integracao}>{int.nome_integracao}</h3>
                            <p className="text-xs font-medium text-zinc-500 mt-1 truncate flex items-center gap-1.5"><Globe size={12} /> {int.url_loja || "Módulo Interno"}</p>
                          </div>

                          <div className="flex gap-2 w-full mt-auto relative">
                            {!semSync && (
                              <button
                                onClick={(e) => { e.stopPropagation(); sincronizarDadosDaLoja(int.id); }}
                                disabled={sincronizando === int.id}
                                className={`${PILULA_BASE} flex-1 py-2.5 text-xs text-zinc-700 dark:text-zinc-200 bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.12]`}
                              >
                                {sincronizando === int.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                Sync Manual
                              </button>
                            )}

                            <div className={`relative ${semSync ? "w-full" : ""}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAberto(menuAberto === int.id ? null : int.id);
                                }}
                                className={`${PILULA_BASE} ${semSync ? "w-full px-4" : "px-4"} py-2.5 text-xs border ${
                                  menuAberto === int.id
                                    ? "bg-black/[0.1] dark:bg-white/[0.16] border-black/10 dark:border-white/20 text-zinc-900 dark:text-white"
                                    : "bg-black/[0.04] dark:bg-white/[0.07] border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.07] dark:hover:bg-white/[0.12]"
                                }`}
                              >
                                <Settings size={16} />
                                {semSync && <span>Configurações</span>}
                              </button>

                              {menuAberto === int.id && (
                                <div
                                  className={`absolute bottom-full mb-2 w-44 ${PAINEL} !rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 ${semSync ? "left-1/2 -translate-x-1/2" : "right-0"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => editarIntegracao(int)}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors flex items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.06]"
                                  >
                                    <Pencil size={14} /> Editar
                                  </button>
                                  <button
                                    onClick={() => { setIntegracaoParaDeletar(int); setMenuAberto(null); }}
                                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                  >
                                    <Trash2 size={14} /> Excluir
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* O CATÁLOGO MESTRE DE APPs */}
                {instalando === "catalogo" && (
                  <div className={`${CARD} p-6 sm:p-8 animate-in fade-in zoom-in-95`}>
                    <div className="flex items-center justify-between gap-4 mb-8 pb-5 border-b border-black/[0.06] dark:border-white/[0.06]">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Catálogo de Aplicativos</h2>
                        <p className="text-sm font-medium text-zinc-500 mt-1">Selecione a plataforma para iniciar a configuração.</p>
                      </div>
                      <button onClick={() => setInstalando(null)} className={BTN_NEUTRO}>
                        <X size={15} /> Cancelar
                      </button>
                    </div>

                    <div className="space-y-10">

                      {/* E-COMMERCE */}
                      <div>
                        <TituloSecao icon={Store} topo>E-commerce & Portais</TituloSecao>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                          <CartaoCatalogo
                            cor="purple" selo="Nativo"
                            icone={<img src="/RaizanCommerce.png" alt="Raizan" className="w-11 h-11 object-contain drop-shadow-sm" />}
                            titulo="Raizan Commerce" descricao="Headless Store de altíssima performance."
                            textoBotao="Ativar Módulo"
                            onClick={(e) => { e.stopPropagation(); setInstalando("raizan"); }}
                          />

                          <CartaoCatalogo
                            cor="indigo" selo="Nativo"
                            icone={<Tile icon={Globe} cor="indigo" size={44} />}
                            titulo="Portal B2B" descricao="Seu portal de vendas exclusivo para lojistas."
                            textoBotao="Configurar"
                            onClick={(e) => { e.stopPropagation(); setInstalando("b2b"); }}
                          />

                          <CartaoCatalogo
                            cor="zinc"
                            icone={<img src="/woocommerce.svg" alt="Woo" className="w-11 h-11 object-contain" />}
                            titulo="WooCommerce" descricao="Sincronização de catálogo e pedidos WP."
                            textoBotao="Conectar"
                            onClick={(e) => { e.stopPropagation(); setInstalando("woocommerce"); }}
                          />

                          {["shopify", "mercadolivre", "shopee"].map(plataforma => (
                            <CartaoEmBreve
                              key={plataforma}
                              src={`/${plataforma}.svg`}
                              alt={plataforma}
                              titulo={plataforma === "mercadolivre" ? "Mercado Livre" : plataforma.charAt(0).toUpperCase() + plataforma.slice(1)}
                              descricao="Integração em desenvolvimento."
                            />
                          ))}
                        </div>
                      </div>

                      {/* COMUNICAÇÃO */}
                      <div>
                        <TituloSecao icon={MessageCircle}>Comunicação</TituloSecao>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <CartaoCatalogo
                            cor="purple" selo={appsConectados.email ? "Conectado" : "Novo"}
                            icone={<Tile icon={Mail} cor="purple" size={44} />}
                            titulo="E-mail Business" descricao="Seu webmail corporativo dentro do Core."
                            textoBotao={appsConectados.email ? "Ajustar" : "Conectar"}
                            suave={Boolean(appsConectados.email)}
                            onClick={(e) => { e.stopPropagation(); setInstalando("email"); }}
                          />
                          <CartaoCatalogo
                            cor="emerald" selo={catalogoWhatsapp ? "Conectado" : "Novo"}
                            icone={<Tile icon={ShoppingBag} cor="emerald" size={44} />}
                            titulo="Catálogo WhatsApp" descricao="Seus produtos na Meta, atualizados por link."
                            textoBotao={catalogoWhatsapp ? "Abrir painel" : "Instalar"}
                            suave={Boolean(catalogoWhatsapp)}
                            onClick={(e) => { e.stopPropagation(); if (catalogoWhatsapp) window.location.href = "/ads/whatsapp"; else setInstalando("catalogo_whatsapp"); }}
                          />
                          <CartaoCatalogo
                            cor="emerald" selo={appsConectados.whatsapp ? "Conectado" : "Novo"}
                            icone={<span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-white p-2 ring-1 ring-black/5"><img src="/whatsapp.svg" alt="WhatsApp" className="h-full w-full object-contain" /></span>}
                            titulo="WhatsApp Web" descricao="Conversas abertas enquanto você trabalha."
                            textoBotao={appsConectados.whatsapp ? "Conectado" : "Conectar"}
                            suave={Boolean(appsConectados.whatsapp)}
                            onClick={(e) => { e.stopPropagation(); if (appsConectados.whatsapp) toast("O WhatsApp já está nas Aplicações, no topo do sistema."); else setInstalando("whatsapp"); }}
                          />
                        </div>
                      </div>

                      {/* PAGAMENTOS */}
                      <div>
                        <TituloSecao icon={CreditCard}>Meios de Pagamento</TituloSecao>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <CartaoCatalogo
                            cor="sky"
                            icone={<img src="/Mercadopago.svg" alt="Mercado Pago" className="w-11 h-11 object-contain" />}
                            titulo="Mercado Pago" descricao="Pix, Cartões e Boleto Transparente."
                            textoBotao="Configurar"
                            onClick={(e) => { e.stopPropagation(); setInstalando("mercadopago"); }}
                          />
                        </div>
                      </div>

                      {/* LOGÍSTICA E FRETE */}
                      <div>
                        <TituloSecao icon={Truck}>Logística e Frete</TituloSecao>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <CartaoCatalogo
                            cor="orange"
                            icone={<img src="/Frenet.svg" alt="Frenet" className="w-11 h-11 object-contain brightness-0 dark:brightness-100" />}
                            titulo="Frenet" descricao="Cálculo de fretes e transportadoras."
                            textoBotao="Configurar"
                            onClick={(e) => { e.stopPropagation(); setInstalando("frenet"); }}
                          />
                        </div>
                      </div>

                      {/* ERP E BANCOS DE DADOS */}
                      <div>
                        <TituloSecao icon={Server}>Bancos de Dados & ERPs</TituloSecao>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                          <CartaoCatalogo
                            cor="emerald" selo="Ativo"
                            icone={<img src="/omie.png" alt="Omie" className="w-11 h-11 object-contain drop-shadow-sm" />}
                            titulo="Omie ERP" descricao="Sincronização de Pedidos e Clientes."
                            textoBotao="Configurar"
                            onClick={(e) => { e.stopPropagation(); setInstalando("omie"); }}
                          />

                          <CartaoCatalogo
                            cor="blue" selo="Novo"
                            icone={<img src="/olist.svg" alt="Tiny" className="w-11 h-11 object-contain drop-shadow-sm" />}
                            titulo="Tiny ERP" descricao="Sincronização Bidirecional."
                            textoBotao="Configurar"
                            onClick={(e) => { e.stopPropagation(); setInstalando("tiny"); }}
                          />

                          <CartaoCatalogo
                            cor={oracleConfigurado ? "red" : "zinc"}
                            selo={oracleConfigurado ? "Conectado" : null}
                            icone={<img src="/oracle.svg" alt="Oracle" className="w-11 h-11 object-contain" />}
                            titulo="Oracle Database"
                            descricao={oracleConfigurado ? "Sincronização bidirecional ativa." : "Sincronização bidirecional do ERP."}
                            textoBotao="Ajustar Conexão"
                            suave={oracleConfigurado}
                            onClick={(e) => { e.stopPropagation(); toast("Acesse o menu Configurações para ajustar os parâmetros do Oracle."); }}
                          />

                          {["microsoft-sql", "mysql"].map(db => (
                            <CartaoEmBreve
                              key={db}
                              src={`/${db}.svg`}
                              alt={db}
                              titulo={db === "mysql" ? "MySQL" : "SQL Server"}
                              descricao="Driver de banco de dados."
                            />
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* COMPONENTES ISOLADOS (FORMULÁRIOS) */}
                {instalando === "woocommerce" && <FormWooCommerce onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "raizan" && <FormRaizanCommerce onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "b2b" && <FormPortalB2B onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "mercadopago" && <FormMercadoPago onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "frenet" && <FormFrenet onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "omie" && <FormOmie onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "tiny" && <FormTiny onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "email" && <FormEmailBusiness atual={appsConectados.email} onCancel={() => setInstalando(appsConectados.email ? null : "catalogo")} onSuccess={handleSuccess} />}
                {instalando === "whatsapp" && <FormWhatsappWeb onCancel={() => setInstalando("catalogo")} onSuccess={handleSuccess} />}
                {instalando === "catalogo_whatsapp" && (
                  <FormCatalogoWhatsapp
                    siteInicial={integracoesAtivas.find((int) => int.plataforma === "portal_b2b")?.url_loja || ""}
                    onCancel={() => setInstalando("catalogo")}
                    onSuccess={() => { window.location.href = "/ads/whatsapp"; }}
                  />
                )}

              </>
            )}

          </div>
        </main>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      {integracaoParaDeletar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in"
          onClick={() => setIntegracaoParaDeletar(null)}
        >
          <div
            className={`${PAINEL} max-w-sm w-full p-7 animate-in zoom-in-95`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5">
              <Tile icon={AlertTriangle} cor="red" size={56} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Excluir Integração</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Tem certeza que deseja desconectar e excluir a integração <b className="text-zinc-800 dark:text-zinc-200">{integracaoParaDeletar.nome_integracao}</b>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIntegracaoParaDeletar(null)} className={BTN_NEUTRO}>Cancelar</button>
              <button onClick={confirmarExclusao} className={BTN_PERIGO}>Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL CHECKLIST DE ETAPAS */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in">
          <div className={`${PAINEL} max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95`}>
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-black/[0.06] dark:border-white/[0.06]">
              <Tile icon={RefreshCw} cor="emerald" size={48} />
              <div>
                <h3 className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">Motor de Sincronização</h3>
                <p className="text-xs text-zinc-500 font-medium">Processando fluxo Omie ERP em tempo real.</p>
              </div>
            </div>

            <div className="space-y-4">
              {passosSync.map((p) => (
                <div key={p.id} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                  {p.status === "done" && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
                  {p.status === "loading" && <Loader2 size={20} className="animate-spin text-emerald-500 shrink-0" />}
                  {p.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-700 shrink-0" />}
                  {p.status === "error" && <AlertTriangle size={20} className="text-rose-500 shrink-0" />}

                  <span className={`text-xs ${
                    p.status === "done" ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : p.status === "loading" ? "font-semibold text-zinc-900 dark:text-white"
                    : p.status === "error" ? "font-semibold text-rose-600 dark:text-rose-400"
                    : "font-medium text-zinc-400"
                  }`}>
                    {p.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editandoInt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in"
          onClick={() => setEditandoInt(null)}
        >
          {editandoInt.plataforma === "omie" && (
            <div onClick={(e) => e.stopPropagation()} className="contents">
              <EditarOmie
                integracao={editandoInt}
                onCancel={() => setEditandoInt(null)}
                onSuccess={() => {
                  setEditandoInt(null);
                  carregarIntegracoesEStatus();
                }}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
}