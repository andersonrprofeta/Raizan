"use client";

import { useState } from "react";
import { Clock, Download, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { esquecerDados, usePedidos } from "@/components/portal/dados";
import { lerMeta, situacaoDoPedido } from "@/components/portal/pedidos";
import { chamarApi } from "@/components/portal/sessao";
import { Cartao, Esqueleto, Vazio, dataCurta, moeda } from "@/components/portal/ui";

function AcaoDoDocumento({ pedido, onSolicitado }) {
  const [enviando, setEnviando] = useState(false);
  const link = lerMeta(pedido, "link_xml_boleto");

  const solicitar = async () => {
    setEnviando(true);
    try {
      const resposta = await chamarApi("/api/hub/pedidos/solicitar-documentos", { metodo: "POST", corpo: { pedidoId: pedido.id } });
      if (resposta.success) {
        toast.success("Pedimos seus documentos à equipe.");
        onSolicitado();
      } else toast.error(resposta.message || "Não foi possível solicitar.");
    } catch (erro) {
      toast.error("Sem conexão com o servidor.");
    }
    setEnviando(false);
  };

  if (link) return <a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold bg-zinc-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_24px_-10px_rgba(24,24,27,0.7)] hover:bg-zinc-800"><Download size={15} /> Baixar</a>;
  if (lerMeta(pedido, "solicitacao_documentos") === "pendente") return <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-700"><Clock size={14} /> Solicitado</span>;
  return (
    <button type="button" onClick={solicitar} disabled={enviando} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-violet-50 px-3 text-sm font-semibold text-violet-700">
      {enviando && <Loader2 size={14} className="animate-spin" />} Pedir
    </button>
  );
}

export default function NotasEBoletos() {
  const { dados, carregando, recarregar } = usePedidos();
  const elegiveis = (dados || []).filter((pedido) => situacaoDoPedido(pedido).grupo !== "cancelado" && pedido.status !== "aguardando-pagamento");

  const atualizar = () => {
    esquecerDados("pedidos");
    recarregar();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Notas e boletos</h1>
        <p className="text-sm text-zinc-500">Baixe os documentos dos pedidos já faturados.</p>
      </div>

      {carregando && !dados && <Esqueleto className="h-64" />}
      {dados && elegiveis.length === 0 && <Vazio Icone={FileText} titulo="Nenhum documento por aqui" texto="Os pedidos faturados aparecem nesta tela." />}

      {elegiveis.length > 0 && (
        <Cartao className="divide-y divide-zinc-100">
          {elegiveis.map((pedido) => {
            const nota = lerMeta(pedido, "nfe_numero");
            return (
              <div key={pedido.id} className="flex min-h-[72px] items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-zinc-900">Pedido #{pedido.id}</span>
                  <span className="text-[13px] tabular-nums text-zinc-500">{nota ? `NF ${nota} · ` : ""}{dataCurta(pedido.date_created)} · {moeda(pedido.total)}</span>
                </span>
                <AcaoDoDocumento pedido={pedido} onSolicitado={atualizar} />
              </div>
            );
          })}
        </Cartao>
      )}
    </div>
  );
}
