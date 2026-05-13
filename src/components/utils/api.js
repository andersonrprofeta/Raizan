// Arquivo: src/components/utils/api.js

export function getHubUrl() {
  // A única URL que NUNCA muda. A nave-mãe.
  return "https://api.raizan.com.br";
}

export function getApiUrl() {
  // A URL do motor local (túnel) será salva na memória assim que o cliente acessar a tela de Login!
  if (typeof window !== 'undefined') {
    const urlDinamica = localStorage.getItem("@raizan:b2b_api_url");
    if (urlDinamica) return urlDinamica.replace(/\/$/, "");
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