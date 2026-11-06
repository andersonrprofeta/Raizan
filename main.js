const { app, BrowserWindow, ipcMain, screen } = require('electron');
const serve = require('electron-serve');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const serveApp = serve.default || serve;
const appServe = serveApp({ directory: path.join(__dirname, 'out') });

let mainWindow;

const LARGURA_SPLASH = 1000;
const ALTURA_SPLASH = 650;
// Tempo para a abertura terminar, mesmo que o sistema carregue antes
const TEMPO_MINIMO_SPLASH = 3800;
// Se o sistema travar ao carregar, a splash não pode ficar presa na tela
const TEMPO_LIMITE_SPLASH = 25000;
const DURACAO_TRANSICAO = 420;

function criarSplash() {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const escala = Math.min(1, (area.width * 0.85) / LARGURA_SPLASH, (area.height * 0.85) / ALTURA_SPLASH);

  const splash = new BrowserWindow({
    width: Math.round(LARGURA_SPLASH * escala),
    height: Math.round(ALTURA_SPLASH * escala),
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload-splash.js') },
  });

  splash.once('ready-to-show', () => splash.show());
  splash.loadFile(path.join(__dirname, 'splash.html'), {
    query: { versao: app.getVersion(), ambiente: app.isPackaged ? 'Produção' : 'Desenvolvimento' },
  }).catch(() => {});

  return splash;
}

// A chave nunca sai da janela principal: a splash só recebe a situação pronta.
// A validade é a gravada no último login; quem confirma de verdade é a API.
async function informarLicenca(splash) {
  try {
    const expira = await mainWindow.webContents.executeJavaScript(`(() => {
      if (!localStorage.getItem('@raizan:license')) return null;
      return localStorage.getItem('@raizan:expires_at') || '';
    })()`);
    if (expira === null || splash.isDestroyed()) return;

    const data = new Date(expira);
    if (!expira || Number.isNaN(data.getTime())) return;
    const vencida = data.getTime() < Date.now();
    splash.webContents.send('splash-licenca', {
      texto: vencida ? 'Licença vencida' : `Licença ativa até ${data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
      alerta: vencida,
    });
  } catch (e) {}
}

function surgirJanela(janela) {
  const inicio = Date.now();
  const passo = setInterval(() => {
    if (janela.isDestroyed()) return clearInterval(passo);
    const progresso = Math.min(1, (Date.now() - inicio) / DURACAO_TRANSICAO);
    janela.setOpacity(progresso);
    if (progresso === 1) clearInterval(passo);
  }, 16);
}

function createWindow() {
  const splash = criarSplash();

  // A TELA PRINCIPAL nasce invisível e só aparece quando a splash sair
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

  mainWindow.webContents.once('did-finish-load', () => informarLicenca(splash));

  let abriu = false;
  const abrirSistema = () => {
    if (abriu || mainWindow.isDestroyed()) return;
    abriu = true;

    if (!splash.isDestroyed()) splash.webContents.send('splash-sair');
    mainWindow.setOpacity(0);
    mainWindow.maximize();
    mainWindow.show();
    surgirJanela(mainWindow);

    setTimeout(() => {
      if (!splash.isDestroyed()) splash.destroy();
    }, DURACAO_TRANSICAO + 120);
  };

  // O tempo mínimo conta de quando a splash aparece: antes disso ninguém viu a animação
  let splashVisivelDesde = null;
  let sistemaPronto = false;
  const abrirQuandoPuder = () => {
    if (!splashVisivelDesde || !sistemaPronto) return;
    setTimeout(abrirSistema, Math.max(0, TEMPO_MINIMO_SPLASH - (Date.now() - splashVisivelDesde)));
  };

  splash.once('show', () => {
    splashVisivelDesde = Date.now();
    abrirQuandoPuder();
  });
  mainWindow.once('ready-to-show', () => {
    sistemaPronto = true;
    abrirQuandoPuder();
  });
  setTimeout(abrirSistema, TEMPO_LIMITE_SPLASH);
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