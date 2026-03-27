const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Manda o Electron buscar atualização
  buscarAtualizacao: () => ipcRenderer.send('buscar-atualizacao'),
  // Manda o Electron instalar e reiniciar
  instalarAtualizacao: () => ipcRenderer.send('instalar-atualizacao'),
  // Fica escutando as fofocas do Electron (progresso do download)
  onUpdateMessage: (callback) => ipcRenderer.on('update-message', (_event, value) => callback(value))
});