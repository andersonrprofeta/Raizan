// Arquivo: src/components/utils/api.js

// 1. A NOVA LÓGICA APONTANDO PRO TÚNEL (Cadeado Verde)
export function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // A MÁGICA: O Front-end agora fala direto com a Cloudflare com segurança!
  return "https://api.rafany.com.br"; 
}

// 2. A MÁGICA DO SUBDOMÍNIO DINÂMICO (Multi-Tenant Real)
export function getTenantId() {
  if (typeof window !== "undefined") {
    // 1. Tenta ler a Identidade (Tenant) salva na tela de Configurações
    try {
      const configSalva = localStorage.getItem("raizan_config_geral");
      if (configSalva) {
        const parsed = JSON.parse(configSalva);
        if (parsed.tenantId) return parsed.tenantId.toLowerCase();
      }
    } catch (e) {}
    
    // 2. Se for pelo navegador, pega o subdomínio da URL (ex: cliente1.raizan.com.br)
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.match(/^[0-9.]+$/)) {
      const parts = hostname.split('.');
      if (parts.length > 0 && parts[0] !== 'www' && parts[0] !== 'api') {
          return parts[0].toLowerCase(); 
      }
    }
  }
  return "rafany"; // Fallback final (só pra não quebrar se tudo falhar)
}

// 3. O CRACHÁ (MANTIDO INTACTO)
export function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-tenant-id": getTenantId() 
  };
}