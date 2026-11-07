import { nomeDoMes } from "@/components/vendedores/SeletorMes";
import { moeda } from "@/components/vendedores/ui";
import { escapar, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";

export function montarPdfDaApuracao({ apuracao, totais, resumo, vendedor, competencia }) {
  const mes = nomeDoMes(competencia);

  const linhas = apuracao.map((item) => `<tr>
    <td>${escapar(item.marca)}</td><td>${moeda(item.vendas)}</td><td>${moeda(item.devolucoes)}</td><td>${moeda(item.base)}</td>
    <td>${String(item.regra).replace(".", ",")}%</td><td>${moeda(item.comissao)}</td>
  </tr>`).join("");

  const corpo = `
    <section class="dados">
      <div><small>Vendedor</small><b>${escapar(vendedor.nome)}</b></div>
      <div><small>Competência</small><b>${escapar(mes)}</b></div>
      <div><small>Situação</small><b>${resumo.fechado ? "Mês fechado" : "Mês em aberto"}</b></div>
    </section>

    <section class="saldo"><span>Comissão líquida do período</span><strong>${moeda(resumo.comissao_liquida)}</strong></section>

    <h2>Comissão por marca</h2>
    <table>
      <thead><tr><th>Marca</th><th>Vendas</th><th>Devoluções</th><th>Base</th><th>Regra</th><th>Comissão</th></tr></thead>
      <tbody>${linhas}</tbody>
      <tfoot><tr><td>Total</td><td>${moeda(totais.vendas)}</td><td>${moeda(totais.devolucoes)}</td><td>${moeda(totais.base)}</td><td></td><td>${moeda(totais.comissao)}</td></tr></tfoot>
    </table>`;

  return montarDocumento({
    empresa: lerEmpresa(),
    titulo: "Apuração de comissão",
    nomeDoArquivo: `Apuração de comissão ${vendedor.nome} ${mes}`,
    corpo,
    rodape: "Produtos bonificados não entram nesta apuração.",
  });
}
