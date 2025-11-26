const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;
let incognitoSession;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    frame: true,
    titleBarStyle: 'hiddenInset', // macOS
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../assets/logo.svg'),
    show: false // Não mostrar até estar pronto
  });

  // Carregar a aplicação
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Abrir DevTools em desenvolvimento (opcional)
  // mainWindow.webContents.openDevTools();

  // Criar sessão para modo anônimo
  incognitoSession = session.fromPartition('persist:incognito', {
    cache: false
  });

  // Configurar CSP para permitir PixelIA
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' https://thepixelia.vercel.app https://cdnjs.cloudflare.com data: blob:"]
      }
    });
  });
}

// Quando o Electron estiver pronto
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // No macOS, recriar janela quando clicar no dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Fechar quando todas as janelas forem fechadas (exceto macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== IPC HANDLERS ====================

// Handler para sessão anônima
ipcMain.handle('get-incognito-session', () => {
  return incognitoSession ? incognitoSession.id : null;
});

// Handler para limpar dados anônimos
ipcMain.handle('clear-incognito-data', async () => {
  if (incognitoSession) {
    try {
      await incognitoSession.clearStorageData();
      await incognitoSession.clearCache();
      return { success: true, message: 'Dados anônimos limpos com sucesso' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  return { success: false, message: 'Sessão anônima não encontrada' };
});

// Handler para salvar configurações
ipcMain.handle('save-settings', async (event, settings) => {
  // Aqui você pode salvar em um arquivo JSON local
  // ou integrar com Supabase no futuro
  try {
    // Por enquanto, apenas retornar sucesso
    // Você pode usar fs.writeFileSync para salvar em arquivo
    return { success: true, settings };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Handler para carregar configurações
ipcMain.handle('load-settings', async () => {
  // Aqui você carregaria as configurações salvas
  // Por enquanto, retornar defaults
  try {
    return { 
      wallpaper: null,
      theme: 'dark',
      aiEnabled: true,
      defaultIncognito: false
    };
  } catch (error) {
    return null;
  }
});

// Handler para salvar histórico
ipcMain.handle('save-history', async (event, historyData) => {
  try {
    // Integrar com Supabase ou salvar localmente
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Handler para carregar histórico
ipcMain.handle('load-history', async () => {
  try {
    // Carregar do Supabase ou arquivo local
    return { success: true, history: [] };
  } catch (error) {
    return { success: false, history: [] };
  }
});

// Handler para obter informações do sistema
ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node
  };
});

// ==================== LOGS ====================
console.log('🚀 Neon Browser iniciado!');
console.log('📁 Caminho da aplicação:', app.getAppPath());
console.log('💾 Caminho de dados do usuário:', app.getPath('userData'));
console.log('🌐 Versão do Electron:', process.versions.electron);
console.log('🎨 Versão do Chrome:', process.versions.chrome);
