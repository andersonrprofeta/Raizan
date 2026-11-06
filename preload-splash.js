const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('splash', {
  aoReceberLicenca: (callback) => ipcRenderer.on('splash-licenca', (_event, valor) => callback(valor)),
  aoSair: (callback) => ipcRenderer.on('splash-sair', () => callback()),
});
