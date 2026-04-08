// Arquivo: src/components/utils/api.js

// 1. A SUA LÓGICA ORIGINAL (MANTIDA INTACTA)
export function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol; 
    const hostname = window.location.hostname; 
    
    if (protocol === 'file:' || protocol === 'app:' || !hostname) {
      return "http://localhost:3001"; 
    }
    
    return `${protocol}//${hostname}:3001`;
  }
  
  return "http://localhost:3001"; 
}

// 2. A MÁGICA DO SUBDOMÍNIO (Necessário para a nuvem Hostinger depois)
export function getTenantId() {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // Se estiver testando no PC local ou via IP de rede, assume a rafany por padrão
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.match(/^[0-9.]+$/)) {
      return "rafany";
    }
    
    const parts = hostname.split('.');
    if (parts.length > 0) {
        return parts[0].toLowerCase(); 
    }
  }
  return "rafany"; 
}

// 3. O CRACHÁ (Essencial para as telas de login não travarem o npm run dev)
export function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-tenant-id": getTenantId() 
  };
}