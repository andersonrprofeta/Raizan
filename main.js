const { app, BrowserWindow, ipcMain } = require('electron');
const serve = require('electron-serve');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const serveApp = serve.default || serve;
const appServe = serveApp({ directory: path.join(__dirname, 'out') });

let mainWindow;

function createWindow() {
  // 1. CRIANDO A TELA DE SPLASH (A tela de carregamento)
  const splash = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
  });
  
  splash.loadFile('splash.html').catch(() => {});

  // 2. CRIANDO A TELA PRINCIPAL (Invisível no início)
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Raizan Core",
    show: false, // Nasce invisível
    frame: false, // Arranca a moldura do Windows
    
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, 
      preload: path.join(__dirname, 'preload.js'),
      autoplayPolicy: 'no-user-gesture-required',
      webviewTag: true 
    },
  });

  appServe(mainWindow).then(() => {
    mainWindow.loadURL('app://-/');
  });

  // 4. QUANDO O NEXT.JS TERMINAR DE CARREGAR...
  mainWindow.once('ready-to-show', () => {
    // 🟢 MÁGICA: Força o Splash a ficar 3 segundos na tela para ficar elegante!
    setTimeout(() => {
      if (splash && !splash.isDestroyed()) {
        splash.destroy(); // Destrói o splash
      }
      mainWindow.maximize(); // Maximiza
      mainWindow.show(); // Aparece o sistema
    }, 3000); 
  });
}

// ==========================================
// LÓGICA DOS BOTÕES ESTILO APPLE (FECHAR, MIN, MAX)
// ==========================================
ipcMain.on('fechar-janela', () => app.quit());

ipcMain.on('minimizar-janela', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximizar-janela', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

// Mantemos o evento mudar-tema VAZIO para não dar erro se o React tentar chamar!
ipcMain.on('mudar-tema', (event, tema) => {
  // Fazemos nada, pois não temos mais barra do Windows para pintar!
});

// ==========================================
// LÓGICA DE ATUALIZAÇÃO AUTOMÁTICA
// ==========================================
autoUpdater.autoDownload = false; 

function sendStatusToWindow(text, progress = 0, status = 'info') {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', { text, progress, status });
  }
}

autoUpdater.on('checking-for-update', () => sendStatusToWindow('Procurando atualizações no servidor central...'));
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow(`Versão ${info.version} encontrada! Iniciando download...`, 0, 'downloading');
  autoUpdater.downloadUpdate();
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

ipcMain.on('buscar-atualizacao', () => autoUpdater.checkForUpdates());
ipcMain.on('instalar-atualizacao', () => autoUpdater.quitAndInstall(false, true));

// ==========================================
// INICIALIZAÇÃO DO APP
// ==========================================
app.on('ready', () => {
  createWindow();
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});