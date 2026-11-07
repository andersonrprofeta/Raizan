// Base visual de todo PDF do Raizan: mesma logo, cabeçalho e tabelas, com os dados da empresa logada

export const escapar = (texto) => String(texto ?? "").replace(/[&<>"']/g, (letra) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[letra]));

export function formatarDocumento(documento) {
  const n = String(documento || "").replace(/\D/g, "");
  if (n.length === 14) return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (n.length === 11) return n.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return String(documento || "");
}

export const lerEmpresa = () => {
  try {
    const usuario = JSON.parse(localStorage.getItem("@raizan:user") || "{}");
    return {
      nome: localStorage.getItem("@raizan:nome") || usuario.nome || "",
      cnpj: formatarDocumento(usuario.tenant_id),
      logo: localStorage.getItem("@raizan:logo") || "",
    };
  } catch (erro) {
    return { nome: "", cnpj: "", logo: "" };
  }
};

// No portal quem entra é o lojista: da empresa só existem a logo e o CNPJ do portal
export const lerEmpresaDoPortal = () => {
  try {
    return { nome: "", cnpj: formatarDocumento(localStorage.getItem("@raizan:b2b_tenant_id")), logo: localStorage.getItem("@raizan:logo") || "" };
  } catch (erro) {
    return { nome: "", cnpj: "", logo: "" };
  }
};

export const ESTILO_DO_DOCUMENTO = `
  @page { size: A4 portrait; margin: 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: "Segoe UI", -apple-system, Arial, sans-serif; color: #18181b; font-size: 12px; line-height: 1.45; }
  .topo { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 14px; border-bottom: 3px solid #6d28d9; }
  .empresa { display: flex; align-items: center; gap: 16px; min-width: 0; }
  .empresa img { display: block; width: auto; height: auto; max-width: 220px; max-height: 88px; object-fit: contain; flex-shrink: 0; }
  .empresa strong { display: block; font-size: 15px; }
  .empresa span { color: #71717a; font-size: 11px; }
  .titulo { text-align: right; flex-shrink: 0; }
  .titulo h1 { margin: 0; font-size: 19px; letter-spacing: -0.3px; color: #4c1d95; }
  .titulo span { color: #71717a; font-size: 11px; }
  .dados { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 20px; margin: 16px 0; padding: 12px 14px; background: #f8f7fb; border-radius: 10px; }
  .dados small { display: block; color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
  .dados b { font-size: 12.5px; font-weight: 600; }
  .saldo { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 16px 18px; color: #fff; background: #4c1d95; border-radius: 12px; }
  .saldo span { font-size: 12px; opacity: .85; }
  .saldo strong { font-size: 24px; letter-spacing: -0.4px; }
  .resumo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .resumo div { padding: 10px 12px; border: 1px solid #e4e4e7; border-radius: 10px; }
  .resumo small { display: block; color: #71717a; font-size: 10px; }
  .resumo b { font-size: 14px; }
  h2 { margin: 20px 0 6px; font-size: 13px; color: #4c1d95; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th { padding: 7px 8px; color: #52525b; font-size: 10px; font-weight: 600; text-align: right; text-transform: uppercase; letter-spacing: .3px; background: #f4f4f5; }
  td { padding: 7px 8px; text-align: right; border-bottom: 1px solid #ececf0; font-variant-numeric: tabular-nums; }
  th:first-child, td:first-child { text-align: left; }
  tr { break-inside: avoid; }
  td small { display: block; color: #71717a; font-size: 9.5px; }
  tfoot td { font-weight: 700; border-top: 2px solid #18181b; border-bottom: 0; }
  .vazio { padding: 16px; color: #71717a; text-align: center; }
  .positivo { color: #4c1d95; font-weight: 600; }
  .alerta { color: #be123c; font-weight: 600; }
  .apagado { color: #a1a1aa; text-decoration: line-through; }
  .rodape { margin-top: 24px; padding-top: 10px; color: #71717a; font-size: 9.5px; border-top: 1px solid #e4e4e7; }
`;

export function montarDocumento({ empresa, titulo, nomeDoArquivo, corpo, rodape }) {
  const emitido = new Date().toLocaleString("pt-BR");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(nomeDoArquivo || titulo)}</title><style>${ESTILO_DO_DOCUMENTO}</style></head><body>
    <header class="topo">
      <div class="empresa">
        ${empresa.logo ? `<img src="${escapar(empresa.logo)}" alt="">` : ""}
        <div>${empresa.nome ? `<strong>${escapar(empresa.nome)}</strong>` : ""}<span>${empresa.cnpj ? `CNPJ ${escapar(empresa.cnpj)}` : ""}</span></div>
      </div>
      <div class="titulo"><h1>${escapar(titulo)}</h1><span>Emitido em ${escapar(emitido)}</span></div>
    </header>
    ${corpo}
    <p class="rodape">${rodape ? `${escapar(rodape)} ` : ""}Documento gerado pelo Raizan.</p>
    <script>window.onload = function () { window.print(); };<\/script>
  </body></html>`;
}

// Devolve false quando o navegador bloqueia a janela
export function abrirDocumento(html) {
  const janela = window.open("", "", "width=900,height=700");
  if (!janela) return false;
  janela.document.write(html);
  janela.document.close();
  return true;
}
