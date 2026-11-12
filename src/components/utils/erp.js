"use client";

// Qual ERP a empresa tem ligado e o que ele sabe fazer (vem da API: /api/hub/integracoes/erp).
// Regra do Core: botão de "puxar do ERP" só aparece quando o ERP ligado tem aquele recurso.
// Assim ninguém clica num botão que daria erro por falta de integração.
//
// Uso:  const erp = useErp();  ...  {erp.com("vendedores") && <button>Sincronizar {erp.com("vendedores").nome}</button>}

import { useEffect, useState } from "react";
import { getHeaders, getHubUrl, getTenantId } from "@/components/utils/api";

const GUARDA_MS = 60_000; // a mesma resposta serve para todas as telas por 1 minuto
let guardado = null; // { tenant, em, erps }
let emAndamento = null;

async function buscarErps() {
  const tenant = getTenantId();
  if (!tenant) return [];
  if (guardado && guardado.tenant === tenant && Date.now() - guardado.em < GUARDA_MS) return guardado.erps;
  if (!emAndamento) {
    emAndamento = fetch(`${getHubUrl()}/api/hub/integracoes/erp`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const erps = d?.success && Array.isArray(d.erps) ? d.erps : [];
        guardado = { tenant, em: Date.now(), erps };
        return erps;
      })
      .catch(() => [])
      .finally(() => { emAndamento = null; });
  }
  return emAndamento;
}

export function useErp() {
  const [estado, setEstado] = useState({ carregado: false, erps: [] });
  useEffect(() => {
    let vivo = true;
    buscarErps().then((erps) => { if (vivo) setEstado({ carregado: true, erps }); });
    return () => { vivo = false; };
  }, []);
  return {
    ...estado,
    // Primeiro ERP ligado que tem o recurso, ou null
    com: (recurso) => estado.erps.find((e) => (e.recursos || []).includes(recurso)) || null,
  };
}
