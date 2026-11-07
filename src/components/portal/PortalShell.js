"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, ShoppingBag, Store, Wallet, Zap } from "lucide-react";
import { getHubUrl } from "@/components/utils/api";
import BarraFrete from "./BarraFrete";
import Busca from "./Busca";
import MenuDaConta from "./MenuDaConta";
import { useCarrinho } from "./carrinho";
import { useCadastro } from "./dados";
import { avaliarFrete } from "./precos";
import { lerUsuario } from "./sessao";
import { ESTILO, moeda } from "./ui";

const CATALOGO = "/b2b-pedidos";
const CARRINHO = "/b2b-carrinho";

const NAVEGACAO = [
  { href: "/b2b-inicio", rotulo: "Início", curto: "Início", Icone: Home },
  { href: CATALOGO, rotulo: "Pedido rápido", curto: "Comprar", Icone: Zap },
  { href: "/b2b-historico", rotulo: "Pedidos", curto: "Pedidos", Icone: ClipboardList },
  { href: "/b2b-financeiro", rotulo: "Financeiro", curto: "Financeiro", Icone: Wallet },
];

const emTela = (caminho, href) => caminho.startsWith(href);

function usarLogo() {
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    setLogo(localStorage.getItem("@raizan:logo"));
    fetch(`${getHubUrl()}/api/hub/integracoes/b2b/identificar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url_acesso: window.location.hostname }),
    })
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (dados.success && dados.logo_url) {
          localStorage.setItem("@raizan:logo", dados.logo_url);
          setLogo(dados.logo_url);
        }
      })
      .catch(() => {});
  }, []);

  return logo;
}

function Marca({ logo }) {
  return (
    <Link href="/b2b-inicio" aria-label="Início" className="flex h-10 max-w-[150px] shrink-0 items-center gap-2.5">
      {logo ? <img src={logo} alt="Logo da empresa" className="max-h-full max-w-full object-contain" /> : (
        <>
          <span className={`${ESTILO.tile} flex h-9 w-9 items-center justify-center rounded-[12px]`}><Store size={18} /></span>
          <span className="hidden text-[15px] font-bold leading-tight tracking-tight text-zinc-900 xl:block">Portal de<br />compras</span>
        </>
      )}
    </Link>
  );
}

function Navegacao({ caminho }) {
  return (
    <nav aria-label="Principal" className="hidden items-center gap-0.5 rounded-full bg-black/[0.04] p-1 lg:flex">
      {NAVEGACAO.map(({ href, rotulo, Icone }) => {
        const ativa = emTela(caminho, href);
        return (
          <Link key={href} href={href} aria-current={ativa ? "page" : undefined} className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-all ${ativa ? "bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "text-zinc-500 hover:text-zinc-900"}`}>
            <Icone size={16} className={ativa ? "text-violet-600" : ""} /> {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

function BotaoCarrinho({ unidades, subtotal }) {
  return (
    <Link href={CARRINHO} aria-label={`Carrinho, ${unidades} itens`} className={`${ESTILO.iconeRedondo} gap-2 ${unidades > 0 ? "pl-3.5 pr-2" : "w-11"}`}>
      <ShoppingBag size={18} />
      {unidades > 0 && (
        <>
          <span className="text-sm font-bold tabular-nums text-zinc-900">{moeda(subtotal)}</span>
          <span className="min-w-[24px] rounded-full bg-zinc-900 px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums text-white">{unidades > 999 ? "999+" : unidades}</span>
        </>
      )}
    </Link>
  );
}

function Topo({ logo, unidades, subtotal, caminho, largo }) {
  const buscaNoCelular = emTela(caminho, CATALOGO) || emTela(caminho, "/b2b-inicio");

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-b from-[#f5f5f7] via-[#f5f5f7]/90 to-transparent px-3 pb-2 pt-3 md:px-5 md:pt-4">
      <header className={`${ESTILO.vidro} mx-auto flex h-16 items-center gap-3 rounded-[24px] px-3 md:h-[68px] md:gap-4 md:px-4 ${largo ? "max-w-[1480px]" : "max-w-7xl"}`}>
        <Marca logo={logo} />
        <Navegacao caminho={caminho} />
        <div className="hidden min-w-0 flex-1 md:block"><Suspense><Busca /></Suspense></div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="hidden md:block"><BotaoCarrinho unidades={unidades} subtotal={subtotal} /></div>
          <MenuDaConta />
        </div>
      </header>
      {buscaNoCelular && <div className="mx-auto mt-2 md:hidden"><Suspense><Busca /></Suspense></div>}
    </div>
  );
}

function BarraInferior({ unidades, caminho }) {
  const abas = [
    NAVEGACAO[0],
    NAVEGACAO[1],
    { href: CARRINHO, curto: "Carrinho", Icone: ShoppingBag, contador: unidades },
    NAVEGACAO[2],
    NAVEGACAO[3],
  ];

  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
      <ul className="grid grid-cols-5">
        {abas.map(({ href, curto, Icone, contador }) => {
          const ativa = emTela(caminho, href);
          return (
            <li key={href}>
              <Link href={href} aria-current={ativa ? "page" : undefined} className={`flex h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${ativa ? "text-violet-700" : "text-zinc-500"}`}>
                <span className="relative">
                  <Icone size={22} strokeWidth={ativa ? 2.4 : 2} />
                  {contador > 0 && <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full border-2 border-white bg-zinc-900 px-1 text-center text-[10px] font-bold leading-[14px] text-white tabular-nums">{contador > 99 ? "99+" : contador}</span>}
                </span>
                {curto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ResumoFlutuante({ unidades, subtotal, frete }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(61px+env(safe-area-inset-bottom))] z-20 px-3 pb-2 md:hidden">
      <Link href={CARRINHO} className={`${ESTILO.vidro} flex items-center justify-between gap-3 rounded-[20px] bg-white/90 py-2.5 pl-4 pr-2.5`}>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold tabular-nums text-zinc-900">{moeda(subtotal)} <span className="font-medium text-zinc-500">· {unidades} {unidades === 1 ? "item" : "itens"}</span></span>
          <span className="mt-1 block"><BarraFrete frete={frete} compacta /></span>
        </span>
        <span className={`${ESTILO.cta} flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold`}>Ver carrinho</span>
      </Link>
    </div>
  );
}

function Estrutura({ children, caminho }) {
  const logo = usarLogo();
  const { unidades, subtotal } = useCarrinho();
  const { dados: cadastro } = useCadastro();
  const frete = avaliarFrete(cadastro?.rota, subtotal);

  const noCarrinho = emTela(caminho, CARRINHO);
  const largo = emTela(caminho, CATALOGO) || noCarrinho;
  const mostrarResumo = unidades > 0 && !noCarrinho;

  return (
    <div className="min-h-dvh bg-[#f5f5f7] text-zinc-900 antialiased">
      <Topo logo={logo} unidades={unidades} subtotal={subtotal} caminho={caminho} largo={largo} />
      <main className={`mx-auto ${largo ? "max-w-[1480px]" : "max-w-7xl"} px-4 pt-3 md:px-6 md:pt-4 ${noCarrinho ? "pb-32 md:pb-10" : mostrarResumo ? "pb-48 md:pb-10" : "pb-24 md:pb-10"}`}>
        {children}
      </main>
      {mostrarResumo && <ResumoFlutuante unidades={unidades} subtotal={subtotal} frete={frete} />}
      {!noCarrinho && <BarraInferior unidades={unidades} caminho={caminho} />}
    </div>
  );
}

export default function PortalShell({ children }) {
  const caminho = usePathname();
  const naEntrada = emTela(caminho, "/login-b2b");
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    if (naEntrada) return;
    if (lerUsuario()) setLiberado(true);
    else window.location.href = "/login-b2b";
  }, [naEntrada]);

  if (naEntrada) return children;
  if (!liberado) return <div className="min-h-dvh bg-[#f5f5f7]" />;
  return <Estrutura caminho={caminho}>{children}</Estrutura>;
}
