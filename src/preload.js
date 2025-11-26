const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs de forma segura para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // ==================== SESSÃO ANÔNIMA ====================
  getIncognitoSession: () => ipcRenderer.invoke('get-incognito-session'),
  clearIncognitoData: () => ipcRenderer.invoke('clear-incognito-data'),
  
  // ==================== CONFIGURAÇÕES ====================
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // ==================== HISTÓRICO ====================
  saveHistory: (historyData) => ipcRenderer.invoke('save-history', historyData),
  loadHistory: () => ipcRenderer.invoke('load-history'),
  
  // ==================== INFORMAÇÕES DO SISTEMA ====================
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
