"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ClipboardList, FileText, LogOut, MapPin, UserRound, Wallet } from "lucide-react";
import { lerUsuario, sair } from "./sessao";
import { ESTILO, iniciais, nomeCurto } from "./ui";

export function documento(valor = "") {
  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length === 11) return `CPF ${digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`;
  if (digitos.length === 14) return `CNPJ ${digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}`;
  return valor ? `Documento ${valor}` : "";
}

const ATALHOS = [
  { href: "/b2b-perfil", rotulo: "Minha conta", Icone: UserRound },
  { href: "/b2b-historico", rotulo: "Pedidos", Icone: ClipboardList },
  { href: "/b2b-perfil#endereco", rotulo: "Endereços", Icone: MapPin },
  { href: "/b2b-financeiro", rotulo: "Financeiro", Icone: Wallet },
  { href: "/b2b-xml", rotulo: "Notas e boletos", Icone: FileText },
];

export function Avatar({ nome, grande }) {
  return (
    <span aria-hidden="true" className={`${ESTILO.tile} flex shrink-0 items-center justify-center font-bold ${grande ? "h-14 w-14 rounded-[18px] text-lg" : "h-9 w-9 rounded-[12px] text-[13px]"}`}>
      {iniciais(nome)}
    </span>
  );
}

export default function MenuDaConta() {
  const [usuario, setUsuario] = useState(null);
  const [aberto, setAberto] = useState(false);
  const caixa = useRef(null);

  useEffect(() => setUsuario(lerUsuario()), []);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (evento) => { if (!caixa.current?.contains(evento.target)) setAberto(false); };
    const esc = (evento) => { if (evento.key === "Escape") setAberto(false); };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const nome = usuario?.nome || "";
  return (
    <div ref={caixa} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((atual) => !atual)} className="flex h-11 items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-black/[0.04] md:pr-3">
        <Avatar nome={nome} />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-[140px] truncate text-sm font-semibold leading-tight text-zinc-900">{nomeCurto(nome, 2) || "Minha conta"}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium leading-tight text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado</span>
        </span>
        <ChevronDown size={16} className={`hidden text-zinc-400 transition-transform md:block ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div role="menu" className={`${ESTILO.vidro} absolute right-0 top-[calc(100%+10px)] z-40 w-[290px] rounded-[22px] bg-white/95 p-2`}>
          <div className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-3">
            <Avatar nome={nome} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">{nomeCurto(nome, 4)}</p>
              <p className="truncate text-xs tabular-nums text-zinc-500">{documento(usuario?.cnpj)}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><BadgeCheck size={13} /> Conta verificada</p>
            </div>
          </div>
          <nav className="mt-1.5">
            {ATALHOS.map(({ href, rotulo, Icone }) => (
              <Link key={href} href={href} role="menuitem" onClick={() => setAberto(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-black/[0.04] hover:text-zinc-900">
                <Icone size={17} className="text-zinc-400" /> {rotulo}
              </Link>
            ))}
          </nav>
          <div className="mt-1 border-t border-black/5 pt-1">
            <button type="button" role="menuitem" onClick={sair} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600">
              <LogOut size={17} /> Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
