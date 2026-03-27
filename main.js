const { app, BrowserWindow, ipcMain } = require('electron'); // <-- Adicionei o ipcMain aqui
const serve = require('electron-serve');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const serveApp = serve.default || serve;
const appServe = serveApp({ directory: path.join(__dirname, 'out') });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Raizan Core",
    autoHideMenuBar: true, 
    
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#e4e4e7',
      height: 35
    },

    webPreferences: {
      nodeIntegration: false, // O Next.js não precisa do Node direto, ele usa o tradutor
      contextIsolation: true, // Liga a blindagem de segurança (Obrigatório pro Preload funcionar)
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.maximize(); 

  appServe(mainWindow).then(() => {
    mainWindow.loadURL('app://-/');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==========================================
// LÓGICA DE ATUALIZAÇÃO AUTOMÁTICA (O MOTOR)
// ==========================================

// Desliga o download automático para o cliente poder ver o botão de atualizar
autoUpdater.autoDownload = false; 

// Função que envia as "fofocas" (textos e porcentagem) lá pro terminalzinho do React
function sendStatusToWindow(text, progress = 0, status = 'info') {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', { text, progress, status });
  }
}

// 1. Eventos do autoUpdater (Ouvindo o servidor do GitHub/Seu site)
autoUpdater.on('checking-for-update', () => sendStatusToWindow('Procurando atualizações no servidor central...'));

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow(`Versão ${info.version} encontrada! Iniciando download...`, 0, 'downloading');
  autoUpdater.downloadUpdate(); // Começa a baixar o .exe novo
});

autoUpdater.on('update-not-available', () => sendStatusToWindow('O sistema já está na versão mais recente.', 100, 'success'));

autoUpdater.on('error', (err) => sendStatusToWindow(`Erro de conexão: ${err.message}`, 0, 'error'));

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Baixando pacote criptografado: ${Math.round(progressObj.percent)}%`;
  sendStatusToWindow(log_message, progressObj.percent, 'downloading');
});

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('Download concluído! O sistema está pronto para reiniciar e instalar.', 100, 'ready');
});


// 2. Eventos do IPC Main (Ouvindo os botões que o cliente clica no React)
ipcMain.on('buscar-atualizacao', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('instalar-atualizacao', () => {
  autoUpdater.quitAndInstall(false, true); // Fecha o app, instala o novo .exe e reabre!
});

// ==========================================
// INICIALIZAÇÃO DO APP
// ==========================================
app.on('ready', () => {
  createWindow();
  
  // O PULO DO GATO: Assim que a tela abrir, ele já procura atualizações silenciosamente!
  // Como colocamos autoUpdater.autoDownload = false lá em cima, ele não vai baixar sozinho,
  // apenas vai acender o sininho de roxo se achar algo!
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000); // Dá 3 segundos pra tela terminar de carregar antes de bater no GitHub
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});