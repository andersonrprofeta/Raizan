// Arquivo: utils/api.js
export function getApiUrl() {
  if (typeof window !== "undefined") {
    // Procura na memória se o usuário definiu um IP externo ou local
    const savedUrl = localStorage.getItem("raizan_core_url");
    if (savedUrl) {
      // Remove a barra do final se o usuário tiver digitado sem querer
      return savedUrl.replace(/\/$/, ""); 
    }
  }
  // Se for a primeira vez abrindo o app, assume que é local
  return "http://localhost:3001"; 
}