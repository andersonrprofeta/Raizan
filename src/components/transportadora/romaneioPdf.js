// Romaneio de cargas impresso (e PDF pelo "Salvar como PDF" da impressão).
// Base visual: a mesma de todo PDF do Raizan (montarDocumento).
// Pedidos agrupados por rota (UF) e cidade, na ordem de descarga; coluna de conferência na doca;
// termo de recebimento com assinatura do motorista e da expedição.

import { escapar, formatarDocumento, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";

const dinheiro = (valor) => `R$ ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const quilos = (valor) => (valor === null || valor === undefined ? "—" : Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
const dataHora = (valor) => {
  if (!valor) return "—";
  const [dia, hora] = String(valor).split(" ");
  const [ano, mes, d] = dia.split("-");
  return `${d}/${mes}/${ano} ${String(hora || "").slice(0, 5)}`;
};

const ESTILO = `
  <style>
    .romaneio td, .romaneio th { padding: 6px 7px; }
    .romaneio td.texto, .romaneio th.texto { text-align: left; }
    .romaneio td.ok { width: 34px; text-align: center; }
    .romaneio .caixa { display: inline-block; width: 12px; height: 12px; border: 1.4px solid #52525b; border-radius: 3px; }
    .romaneio tr.grupo td { background: #f8f7fb; color: #4c1d95; font-weight: 700; font-size: 10.5px; text-transform: uppercase; letter-spacing: .4px; text-align: left; }
    .romaneio td small { display: block; color: #71717a; font-size: 9.5px; }
    .chave { font-family: Consolas, "Courier New", monospace; font-size: 9px; color: #71717a; letter-spacing: .2px; }
    .termo { margin-top: 18px; padding: 10px 12px; border: 1px solid #e4e4e7; border-radius: 10px; font-size: 10.5px; color: #3f3f46; break-inside: avoid; }
    .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 46px; break-inside: avoid; }
    .assinaturas div { padding-top: 6px; border-top: 1px solid #18181b; text-align: center; font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: .6px; }
    .assinaturas span { display: block; margin-top: 2px; text-transform: none; letter-spacing: 0; color: #a1a1aa; }
    .marca-cancelado { margin: 10px 0; padding: 8px 12px; border-radius: 8px; background: #fff1f2; color: #be123c; font-weight: 700; text-align: center; }
  </style>`;

function agrupar(expedicoes) {
  const grupos = new Map();
  for (const e of expedicoes) {
    const chave = `${e.uf || "??"} · ${e.cidade || "Cidade não informada"}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(e);
  }
  return [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
}

export function montarRomaneio({ romaneio, transportadora, expedicoes }) {
  const linhas = agrupar(expedicoes).map(([destino, lista]) => {
    const pesoGrupo = lista.reduce((t, e) => t + (Number(e.peso_bruto) || 0), 0);
    const volumesGrupo = lista.reduce((t, e) => t + (Number(e.volumes) || 0), 0);
    return `<tr class="grupo"><td colspan="7">${escapar(destino)} — ${lista.length} ${lista.length === 1 ? "entrega" : "entregas"} · ${volumesGrupo} vol. · ${quilos(pesoGrupo)} kg</td></tr>
      ${lista.map((e) => `<tr>
        <td class="ok"><span class="caixa"></span></td>
        <td class="texto"><b>${escapar(e.nfe_numero ? `${e.nfe_numero}${e.nfe_serie ? `-${e.nfe_serie}` : ""}` : "s/n")}</b><small>Pedido ${escapar(e.numero_pedido || "—")}</small></td>
        <td class="texto">${escapar(e.cliente_nome || "")}<small>${escapar(formatarDocumento(e.cliente_documento))}${e.nfe_chave ? ` <span class="chave">${escapar(e.nfe_chave)}</span>` : ""}</small></td>
        <td class="texto">${escapar(e.cidade || "")}${e.uf ? `/${escapar(e.uf)}` : ""}</td>
        <td>${e.volumes ?? "—"}</td>
        <td>${quilos(e.peso_bruto)}</td>
        <td>${dinheiro(e.valor_total)}</td>
      </tr>`).join("")}`;
  }).join("");

  const nomeTransportadora = transportadora ? (transportadora.nome_fantasia || transportadora.razao_social) : romaneio.transportadora_nome;
  const corpo = `${ESTILO}
    ${romaneio.status === "cancelado" ? `<p class="marca-cancelado">ROMANEIO CANCELADO${romaneio.motivo_cancelamento ? ` — ${escapar(romaneio.motivo_cancelamento)}` : ""}</p>` : ""}
    <section class="dados">
      <div><small>Romaneio</small><b>Nº ${escapar(romaneio.numero)}</b></div>
      <div><small>Coleta (data e hora)</small><b>${escapar(romaneio.gerado_em ? dataHora(romaneio.gerado_em) : "Em montagem")}</b></div>
      <div><small>Rota</small><b>${escapar(romaneio.rota_resumo || "—")}</b></div>
      <div style="grid-column: span 2"><small>Transportadora</small><b>${escapar(nomeTransportadora || "—")}</b>${transportadora?.cnpj ? ` <span style="color:#71717a">CNPJ ${escapar(formatarDocumento(transportadora.cnpj))}</span>` : ""}${transportadora?.rntrc ? ` <span style="color:#71717a">· RNTRC ${escapar(transportadora.rntrc)}</span>` : ""}</div>
      <div><small>Telefone</small><b>${escapar(transportadora?.telefone || transportadora?.whatsapp || "—")}</b></div>
      <div><small>Motorista</small><b>${escapar(romaneio.motorista || "______________________")}</b></div>
      <div><small>CPF / CNH</small><b>${escapar(romaneio.motorista_documento || "______________")}</b></div>
      <div><small>Veículo · Placa</small><b>${escapar([romaneio.veiculo, romaneio.placa ? `${romaneio.placa}${romaneio.uf_placa ? `/${romaneio.uf_placa}` : ""}` : ""].filter(Boolean).join(" · ") || "______________")}</b></div>
    </section>

    <section class="resumo" style="grid-template-columns: repeat(4, 1fr)">
      <div><small>Entregas</small><b>${expedicoes.length}</b></div>
      <div><small>Volumes</small><b>${expedicoes.reduce((t, e) => t + (Number(e.volumes) || 0), 0)}</b></div>
      <div><small>Peso bruto</small><b>${quilos(expedicoes.reduce((t, e) => t + (Number(e.peso_bruto) || 0), 0))} kg</b></div>
      <div><small>Valor das notas</small><b>${dinheiro(expedicoes.reduce((t, e) => t + (Number(e.valor_total) || 0), 0))}</b></div>
    </section>

    <table class="romaneio">
      <thead><tr><th class="ok">Ok</th><th class="texto">NF-e</th><th class="texto">Destinatário</th><th class="texto">Cidade</th><th>Vol.</th><th>Peso (kg)</th><th>Valor</th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="7" class="vazio">Sem pedidos.</td></tr>'}</tbody>
    </table>

    ${romaneio.observacao ? `<p class="termo"><b>Observação:</b> ${escapar(romaneio.observacao)}</p>` : ""}
    <p class="termo">Declaro que recebi as mercadorias e os volumes relacionados acima, conferidos na doca, com as respectivas notas fiscais, em perfeito estado de embalagem, e me responsabilizo pela entrega aos destinatários.</p>

    <div class="assinaturas">
      <div>Expedição<span>Nome e assinatura</span></div>
      <div>Motorista${romaneio.motorista ? ` — ${escapar(romaneio.motorista)}` : ""}<span>Assinatura · data e hora do recebimento</span></div>
    </div>`;

  return montarDocumento({
    empresa: lerEmpresa(),
    titulo: "Romaneio de cargas",
    nomeDoArquivo: `Romaneio ${romaneio.numero}`,
    corpo,
    rodape: "A data e hora da coleta é o momento em que o romaneio foi gerado no Raizan.",
  });
}
