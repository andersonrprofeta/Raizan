// Arquivo: src/components/utils/api.js

export function getHubUrl() {
  // A única URL que NUNCA muda. A nave-mãe.
  return "https://api.raizan.com.br";
}

//ajuste para rodar a api no admin tbm
export function getApiUrl() {
  // 1. PRIORIDADE B2B: Tenta pegar a URL dinâmica salva no login do lojista
  if (typeof window !== 'undefined') {
    const urlDinamica = localStorage.getItem("@raizan:b2b_api_url");
    if (urlDinamica) return urlDinamica.replace(/\/$/, "");
  }

  // 2. PRIORIDADE ADMIN: Se for o Painel Admin (ou ambiente local de dev), puxa do .env!
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  return ""; 
}

export function getTenantId() {
  if (typeof window === "undefined") return ""; 
  try {
    // 1. Se for o Admin logado na Matriz:
    const adminRaw = localStorage.getItem("@raizan:user");
    if (adminRaw) {
      const adminObj = JSON.parse(adminRaw);
      if (adminObj.tenant_id) return String(adminObj.tenant_id).replace(/\D/g, '');
    }

    // 2. Se for o Lojista no Portal B2B, pega a identidade que o site "descobriu" na tela de Login!
    const portalId = localStorage.getItem("@raizan:b2b_tenant_id");
    if (portalId) return String(portalId).replace(/\D/g, '');
    
  } catch (e) {}
  return ""; 
}

export function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('@raizan:token') : null;
  const tenantId = getTenantId();

  return {
    "Content-Type": "application/json",
    ...(tenantId && { "x-tenant-id": tenantId }), 
    ...(token && { "Authorization": `Bearer ${token}` }) 
  };
}