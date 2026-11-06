"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, PackageSearch } from "lucide-react";
import TabDesempenho from "@/components/vendedores/relatorio";
import { mesDeHoje } from "@/components/vendedores/SeletorMes";
import { api, Carregando, CascaPagina, VIDRO } from "@/components/vendedores/ui";
import { lerUsuario } from "@/components/utils/sessaoCore";

const CARTOES_POR_PERFIL = {
  Faturamento: ["aguardando_faturamento", "faturados_hoje"],
  "Expedição": ["em_separacao", "conferidos_hoje", "ocorrencias_hoje"],
};
const CARTOES_PADRAO = ["em_separacao", "aguardando_faturamento", "faturados_hoje"];

const CARTOES = {
  em_separacao: { rotulo: "Em separação", Icone: PackageSearch, href: "/checkout" },
  aguardando_faturamento: { rotulo: "Aguardando faturamento", Icone: FileText, href: "/pedidos" },
  faturados_hoje: { rotulo: "Faturados hoje", Icone: CheckCircle2, href: "/pedidos" },
  conferidos_hoje: { rotulo: "Conferidos hoje", Icone: ClipboardCheck, href: "/checkout/historico" },
  ocorrencias_hoje: { rotulo: "Ocorrências hoje", Icone: AlertTriangle, href: "/checkout/historico" },
};

function PainelOperacional({ perfil }) {
  const [painel, setPainel] = useState(null);

  useEffect(() => {
    api("/conferencia/painel").then((dados) => { if (dados.success) setPainel(dados.painel); }).catch(() => {});
  }, []);

  if (!painel) return <Carregando />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(CARTOES_POR_PERFIL[perfil] || CARTOES_PADRAO).map((chave) => {
        const { rotulo, Icone, href } = CARTOES[chave];
        return (
          <Link key={chave} href={href} className={`${VIDRO} p-5 block hover:ring-2 hover:ring-purple-500/30 transition-shadow`}>
            <Icone size={20} className="text-purple-600 dark:text-purple-400" aria-hidden />
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{painel[chave]}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{rotulo}</p>
          </Link>
        );
      })}
    </div>
  );
}

// Tela inicial de quem não tem o Dashboard Executivo
export default function PainelDoUsuario() {
  const [usuario] = useState(lerUsuario);
  const [competencia] = useState(mesDeHoje);
  const primeiroNome = String(usuario?.nome || "").split(" ")[0];

  return (
    <CascaPagina>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {primeiroNome}.</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{usuario?.cargo || usuario?.perfil}</p>
      </div>

      {usuario?.vendedor_id
        ? <TabDesempenho vendedor={{ id: usuario.vendedor_id, nome: usuario.nome }} competencia={competencia} />
        : <PainelOperacional perfil={usuario?.perfil} />}
    </CascaPagina>
  );
}
