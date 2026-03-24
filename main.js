const { app, BrowserWindow } = require('electron');
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
    minWidth: 1024, // <--- O usuário não consegue diminuir mais que isso
    minHeight: 768, // <--- Protege o seu layout de quebrar
    title: "Raizan Core",
    autoHideMenuBar: true, 
    // resizable: false, <--- APAGUE ESTA LINHA!
    
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#e4e4e7',
      height: 35
    },

    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.maximize(); // Ele ainda vai nascer grandão em tela cheia!

  appServe(mainWindow).then(() => {
    mainWindow.loadURL('app://-/');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- LÓGICA DE ATUALIZAÇÃO AUTOMÁTICA ---

// 1. Quando o app abrir e a tela estiver pronta, ele procura atualizações invisível no fundo
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

// 2. Se ele achar e baixar uma atualização, ele avisa o Windows para instalar na próxima vez que o app fechar
autoUpdater.on('update-downloaded', () => {
  // Opcional: Aqui poderíamos colocar um aviso na tela "Atualização baixada! Reinicie o app."
  // Mas por enquanto, ele apenas vai instalar silenciosamente quando o usuário fechar o sistema.
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});