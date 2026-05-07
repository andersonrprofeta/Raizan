// Arquivo: src/components/utils/api.js

// ==========================================
// 1. O MOTOR (ORACLE / LEGADO) - PORTA 3001
// Não quebra nada que você já tem em produção!
// ==========================================
export function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "http://api.rafany.com.br:3001";
}

// ==========================================
// 2. O HUB CENTRAL (NUVEM / HOSTINGER)
// Usado APENAS nas telas novas: Clientes, Marcas, Categorias
// ==========================================
export function getHubUrl() {
  if (process.env.NEXT_PUBLIC_HUB_URL) {
    return process.env.NEXT_PUBLIC_HUB_URL.replace(/\/$/, "");
  }
  return "https://api.raizan.com.br";
}

// ==========================================
// 3. IDENTIDADE DA EMPRESA (TENANT ID)
// ==========================================
export function getTenantId() {
  if (typeof window === "undefined") return ""; 

  try {
    const configSalva = localStorage.getItem("raizan_config_geral");
    if (configSalva) {
      const parsed = JSON.parse(configSalva);
      if (parsed.tenantId) return parsed.tenantId.toLowerCase();
    }
  } catch (e) {}

  const tenantSalvo = localStorage.getItem("@raizan:tenant");
  if (tenantSalvo) return tenantSalvo.toLowerCase();

  const hostname = window.location.hostname;
  if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.match(/^[0-9.]+$/)) {
    const parts = hostname.split('.');
    if (parts.length > 0 && parts[0] !== 'www' && parts[0] !== 'api' && parts[0] !== 'app') {
      return parts[0].toLowerCase(); 
    }
  }
  return ""; 
}

// ==========================================
// 4. O CRACHÁ BLINDADO (Com JWT)
// ==========================================
export function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('@raizan:token') : null;
  const tenantId = getTenantId();

  return {
    "Content-Type": "application/json",
    ...(tenantId && { "x-tenant-id": tenantId }),
    ...(token && { "Authorization": `Bearer ${token}` }) 
  };
}