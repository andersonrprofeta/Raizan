const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Manda o Electron buscar atualização
  buscarAtualizacao: () => ipcRenderer.send('buscar-atualizacao'),
  // Manda o Electron instalar e reiniciar
  instalarAtualizacao: () => ipcRenderer.send('instalar-atualizacao'),
  // Fica escutando as fofocas do Electron (progresso do download)
  onUpdateMessage: (callback) => ipcRenderer.on('update-message', (_event, value) => callback(value)),
  // Muda o tema da barra (se houver)
  mudarTemaElectron: (tema) => ipcRenderer.send('mudar-tema', tema),

  // 🟢 AS 3 NOVAS FUNÇÕES DOS BOTÕES DE JANELA
  fecharJanela: () => ipcRenderer.send('fechar-janela'),
  minimizarJanela: () => ipcRenderer.send('minimizar-janela'),
  maximizarJanela: () => ipcRenderer.send('maximizar-janela')
});