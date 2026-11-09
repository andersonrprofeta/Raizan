import { escapar, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";
import { motivoDa } from "./ocorrencias";

const dataHora = (valor) => (valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" }) : "Não informado");

export function montarPdfDaConferencia(registro) {
  const contagem = registro.itens.map((item) => `<tr>
    <td>${escapar(item.nome)}</td><td>${item.qtdPedida}</td>
    <td${item.qtdBipada === item.qtdPedida ? "" : ' class="alerta"'}>${item.qtdBipada}</td>
  </tr>`).join("");

  const ocorrencias = registro.ocorrencias.length === 0
    ? '<p class="vazio">Nenhuma ocorrência.</p>'
    : `<table>
        <thead><tr><th>Ocorrência</th><th>Horário</th></tr></thead>
        <tbody>${registro.ocorrencias.map((o) => `<tr>
          <td>${escapar(motivoDa(o).titulo)}${o.produto ? `: ${escapar(o.produto)}` : ""}${o.codigo ? `<small>Código ${escapar(o.codigo)}</small>` : ""}${o.detalhe ? `<small>${escapar(o.detalhe)}</small>` : ""}${motivoDa(o).oQueFazer ? `<small>O que fazer: ${escapar(motivoDa(o).oQueFazer)}</small>` : ""}</td>
          <td>${escapar(dataHora(o.hora))}</td>
        </tr>`).join("")}</tbody>
      </table>`;

  const corpo = `
    <section class="dados">
      <div><small>Pedido</small><b>#${escapar(registro.pedido_id)}</b></div>
      <div><small>Cliente</small><b>${escapar(registro.cliente || "Não informado")}</b></div>
      <div><small>Volumes</small><b>${escapar(registro.volumes ?? "Não informado")}</b></div>
      <div><small>Separado por</small><b>${escapar(registro.separador_nome)}</b></div>
      <div><small>Conferido por</small><b>${escapar(registro.conferente_nome)}</b></div>
      <div><small>Período</small><b>${escapar(dataHora(registro.inicio))} a ${escapar(dataHora(registro.fim))}</b></div>
    </section>

    <h2>Contagem</h2>
    <table>
      <thead><tr><th>Produto</th><th>Pedido</th><th>Bipado</th></tr></thead>
      <tbody>${contagem}</tbody>
    </table>

    <h2>Ocorrências durante a bipagem</h2>
    ${ocorrencias}`;

  return montarDocumento({
    empresa: lerEmpresa(),
    titulo: "Relatório da conferência",
    nomeDoArquivo: `Relatório da conferência pedido ${registro.pedido_id}`,
    corpo,
  });
}
