// ==================== ESTADO GLOBAL ====================
let currentPage = 'home';
let tabs = [];
let activeTabId = 1;
let tabCounter = 1;
let isIncognito = false;
let wallpaper = null;
let history = [];
let recentSites = [];
let consoleLogs = {
    all: [],
    logs: [],
    errors: [],
    warnings: [],
    network: []
};
let consoleFilter = 'all';

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
    initializeBrowser();
    setupEventListeners();
    loadSettings();
    loadHistory();
    loadRecentSites();
});

function initializeBrowser() {
    tabs.push({
        id: 1,
        title: 'Nova Aba',
        url: '',
        history: [],
        currentIndex: -1
    });
    
    addConsoleLog('🎉 Neon Browser iniciado com sucesso!', 'log');
    addConsoleLog('💜 Versão 1.0.0 - Interface Multi-página', 'log');
}

// ==================== NAVEGAÇÃO ENTRE PÁGINAS ====================
function setupEventListeners() {
    // Navegação Sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        if (!item.classList.contains('sidebar-incognito')) {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) navigateToPage(page);
            });
        }
    });

    // Quick Actions da Home
    document.querySelectorAll('.home-quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            navigateToPage(action);
        });
    });

    // Modo Anônimo
    document.getElementById('sidebar-incognito').addEventListener('click', toggleIncognito);

    // Home Search
    const homeMainSearch = document.getElementById('home-main-search');
    homeMainSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = homeMainSearch.value;
            navigateToPage('browser');
            setTimeout(() => navigateToUrl(query), 100);
        }
    });

    // Browser Controls
    setupBrowserControls();
    
    // History
    setupHistoryControls();
    
    // Dev Tools
    setupDevToolsControls();
    
    // Settings
    setupSettingsControls();
}

function navigateToPage(page) {
    // Atualizar sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Atualizar páginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    
    currentPage = page;
    addConsoleLog(`📄 Navegou para: ${page}`, 'log');
}

// ==================== BROWSER CONTROLS ====================
function setupBrowserControls() {
    // Navegação
    document.getElementById('back-btn').addEventListener('click', goBack);
    document.getElementById('forward-btn').addEventListener('click', goForward);
    document.getElementById('reload-btn').addEventListener('click', reload);
    document.getElementById('home-btn-nav').addEventListener('click', () => navigateToPage('home'));
    document.getElementById('go-btn').addEventListener('click', navigate);
    
    // URL Bar
    const urlBar = document.getElementById('url-bar');
    urlBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') navigate();
    });
    
    // Abas
    document.getElementById('new-tab-btn').addEventListener('click', createNewTab);
    
    // WebView Setup
    setupWebViewListeners();
}

function navigate() {
    const urlBar = document.getElementById('url-bar');
    const input = urlBar.value.trim();
    navigateToUrl(input);
}

function navigateToUrl(input) {
    if (!input) return;
    
    let url;
    
    if (input.startsWith('http://') || input.startsWith('https://')) {
        url = input;
    } else if (input.includes('.') && !input.includes(' ')) {
        url = 'https://' + input;
    } else {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(input);
    }
    
    const webview = document.getElementById(`webview-${activeTabId}`);
    webview.src = url;
    
    // Esconder welcome
    document.getElementById('browser-welcome').style.display = 'none';
    
    // Atualizar histórico
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
        currentTab.history = currentTab.history.slice(0, currentTab.currentIndex + 1);
        currentTab.history.push(url);
        currentTab.currentIndex++;
        currentTab.url = url;
    }
    
    // Adicionar ao histórico global
    addToHistory(url, 'Nova Página');
    
    document.getElementById('url-bar').value = url;
    addConsoleLog(`🌐 Navegando: ${url}`, 'network');
}

function goBack() {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.currentIndex > 0) {
        currentTab.currentIndex--;
        const url = currentTab.history[currentTab.currentIndex];
        document.getElementById(`webview-${activeTabId}`).src = url;
        document.getElementById('url-bar').value = url;
        addConsoleLog(`⬅️ Voltando: ${url}`, 'network');
    }
}

function goForward() {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.currentIndex < currentTab.history.length - 1) {
        currentTab.currentIndex++;
        const url = currentTab.history[currentTab.currentIndex];
        document.getElementById(`webview-${activeTabId}`).src = url;
        document.getElementById('url-bar').value = url;
        addConsoleLog(`➡️ Avançando: ${url}`, 'network');
    }
}

function reload() {
    const webview = document.getElementById(`webview-${activeTabId}`);
    webview.reload();
    addConsoleLog(`🔄 Recarregando página`, 'network');
}

// ==================== GERENCIAMENTO DE ABAS ====================
function createNewTab() {
    tabCounter++;
    const newTabId = tabCounter;
    
    tabs.push({
        id: newTabId,
        title: 'Nova Aba',
        url: '',
        history: [],
        currentIndex: -1
    });
    
    const tabsContainer = document.getElementById('tabs-container');
    const newTabBtn = document.getElementById('new-tab-btn');
    
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.dataset.tabId = newTabId;
    tabElement.innerHTML = `
        <span class="tab-title">Nova Aba</span>
        <button class="tab-close">×</button>
    `;
    
    tabsContainer.insertBefore(tabElement, newTabBtn);
    
    const contentArea = document.getElementById('browser-content-area');
    const webview = document.createElement('webview');
    webview.id = `webview-${newTabId}`;
    webview.className = 'webview';
    webview.src = '';
    webview.partition = isIncognito ? 'persist:incognito' : 'persist:main';
    
    contentArea.appendChild(webview);
    
    tabElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
            switchTab(newTabId);
        }
    });
    
    tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(newTabId);
    });
    
    switchTab(newTabId);
    addConsoleLog(`📑 Nova aba criada (ID: ${newTabId})`, 'log');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.webview').forEach(wv => wv.classList.remove('active'));
    
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const webview = document.getElementById(`webview-${tabId}`);
    
    if (tabElement) tabElement.classList.add('active');
    if (webview) webview.classList.add('active');
    
    activeTabId = tabId;
    
    const currentTab = tabs.find(t => t.id === tabId);
    if (currentTab) {
        document.getElementById('url-bar').value = currentTab.url || '';
    }
    
    if (!currentTab.url) {
        document.getElementById('browser-welcome').style.display = 'flex';
    } else {
        document.getElementById('browser-welcome').style.display = 'none';
    }
}

function closeTab(tabId) {
    if (tabs.length === 1) {
        addConsoleLog(`⚠️ Não pode fechar última aba`, 'warning');
        return;
    }
    
    tabs = tabs.filter(t => t.id !== tabId);
    
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    const webview = document.getElementById(`webview-${tabId}`);
    
    if (tabElement) tabElement.remove();
    if (webview) webview.remove();
    
    if (activeTabId === tabId) {
        switchTab(tabs[tabs.length - 1].id);
    }
    
    addConsoleLog(`❌ Aba fechada (ID: ${tabId})`, 'log');
}

function setupWebViewListeners() {
    const webview = document.getElementById('webview-1');
    
    webview.addEventListener('did-start-loading', () => {
        document.getElementById('reload-btn').textContent = '✕';
        addConsoleLog(`🔄 Carregando...`, 'network');
    });
    
    webview.addEventListener('did-stop-loading', () => {
        document.getElementById('reload-btn').textContent = '↻';
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.title = webview.getTitle() || 'Nova Aba';
            updateTabTitle(activeTabId, currentTab.title);
            addToRecentSite(currentTab.url, currentTab.title);
        }
        addConsoleLog(`✅ Página carregada`, 'network');
    });
    
    webview.addEventListener('page-title-updated', (e) => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab) {
            currentTab.title = e.title;
            updateTabTitle(activeTabId, e.title);
        }
    });

    webview.addEventListener('console-message', (e) => {
        const level = e.level === 0 ? 'log' : e.level === 1 ? 'warning' : 'error';
        addConsoleLog(e.message, level);
    });
}

function updateTabTitle(tabId, title) {
    const tabElement = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (tabElement) {
        const titleSpan = tabElement.querySelector('.tab-title');
        titleSpan.textContent = title;
    }
}

// ==================== HISTÓRICO ====================
function setupHistoryControls() {
    document.getElementById('clear-all-history').addEventListener('click', clearAllHistory);
    
    document.querySelectorAll('.history-filter').forEach(filter => {
        filter.addEventListener('click', (e) => {
            document.querySelectorAll('.history-filter').forEach(f => f.classList.remove('active'));
            e.target.classList.add('active');
            filterHistory(e.target.dataset.filter);
        });
    });
    
    document.getElementById('history-search').addEventListener('input', searchHistory);
}

function addToHistory(url, title) {
    const historyItem = {
        url,
        title,
        timestamp: new Date(),
        favicon: '🌐'
    };
    
    history.unshift(historyItem);
    
    // Manter só últimos 1000
    if (history.length > 1000) {
        history = history.slice(0, 1000);
    }
    
    renderHistory();
}

function renderHistory(items = history) {
    const container = document.getElementById('history-content');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>Nenhum histórico</h3>
                <p>Seus sites visitados aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="recent-site-card" onclick="window.navigateToUrl('${item.url}'); window.navigateToPage('browser');">
            <div class="site-favicon">${item.favicon}</div>
            <div class="site-name">${item.title}</div>
            <div class="site-url">${item.url}</div>
            <div class="news-time">${formatTime(item.timestamp)}</div>
        </div>
    `).join('');
}

function filterHistory(filter) {
    const now = new Date();
    let filtered = history;
    
    if (filter === 'today') {
        filtered = history.filter(item => {
            const diff = now - item.timestamp;
            return diff < 24 * 60 * 60 * 1000;
        });
    } else if (filter === 'yesterday') {
        filtered = history.filter(item => {
            const diff = now - item.timestamp;
            return diff >= 24 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000;
        });
    } else if (filter === 'week') {
        filtered = history.filter(item => {
            const diff = now - item.timestamp;
            return diff < 7 * 24 * 60 * 60 * 1000;
        });
    } else if (filter === 'month') {
        filtered = history.filter(item => {
            const diff = now - item.timestamp;
            return diff < 30 * 24 * 60 * 60 * 1000;
        });
    }
    
    renderHistory(filtered);
}

function searchHistory(e) {
    const query = e.target.value.toLowerCase();
    const filtered = history.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.url.toLowerCase().includes(query)
    );
    renderHistory(filtered);
}

function clearAllHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        history = [];
        renderHistory();
        addConsoleLog('🗑️ Histórico limpo!', 'log');
    }
}

function loadHistory() {
    // Carregar do localStorage ou Supabase no futuro
    renderHistory();
}

function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
}

// ==================== SITES RECENTES ====================
function addToRecentSite(url, title) {
    const site = {
        url,
        title,
        favicon: '🌐',
        timestamp: new Date()
    };
    
    // Remover duplicatas
    recentSites = recentSites.filter(s => s.url !== url);
    recentSites.unshift(site);
    
    // Manter só 8
    if (recentSites.length > 8) {
        recentSites = recentSites.slice(0, 8);
    }
    
    renderRecentSites();
}

function renderRecentSites() {
    const container = document.getElementById('recent-sites');
    
    if (recentSites.length === 0) {
        container.innerHTML = `
            <div class="recent-site-card">
                <div class="site-favicon">🌐</div>
                <div class="site-name">Nenhum site visitado</div>
                <div class="site-url">Comece a navegar!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentSites.map(site => `
        <div class="recent-site-card" onclick="window.navigateToUrl('${site.url}'); window.navigateToPage('browser');">
            <div class="site-favicon">${site.favicon}</div>
            <div class="site-name">${site.title}</div>
            <div class="site-url">${site.url}</div>
        </div>
    `).join('');
}

function loadRecentSites() {
    renderRecentSites();
}

// ==================== DEV TOOLS ====================
function setupDevToolsControls() {
    // Console
    const consoleInput = document.getElementById('console-input');
    consoleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeConsoleCommand(consoleInput.value);
            consoleInput.value = '';
        }
    });

    document.querySelectorAll('.console-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.console-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            filterConsoleLogs(e.target.dataset.tab);
        });
    });

    document.getElementById('dev-clear-console').addEventListener('click', clearConsole);
    document.getElementById('dev-export-logs').addEventListener('click', exportConsoleLogs);
    
    // Extensions
    document.getElementById('add-extension').addEventListener('click', () => {
        alert('🔌 Sistema de extensões em desenvolvimento!\nEm breve você poderá adicionar suas próprias extensões.');
    });
}

function addConsoleLog(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = {
        message,
        type,
        timestamp,
        id: Date.now() + Math.random()
    };
    
    consoleLogs.all.push(logEntry);
    
    if (type === 'error') {
        consoleLogs.errors.push(logEntry);
    } else if (type === 'warning') {
        consoleLogs.warnings.push(logEntry);
    } else if (type === 'network') {
        consoleLogs.network.push(logEntry);
    } else {
        consoleLogs.logs.push(logEntry);
    }
    
    if (consoleFilter === 'all' || consoleFilter === type + 's' || 
        (consoleFilter === 'logs' && type === 'log')) {
        renderConsoleLog(logEntry);
    }
    
    updateConsoleTabCounters();
}

function renderConsoleLog(logEntry) {
    const output = document.getElementById('console-output');
    const logElement = document.createElement('div');
    logElement.className = 'console-entry';
    
    let icon = '📝';
    let color = '#6bcf7f';
    let bgColor = 'rgba(107, 207, 127, 0.05)';
    
    if (logEntry.type === 'error') {
        icon = '❌';
        color = '#ff6b6b';
        bgColor = 'rgba(255, 107, 107, 0.1)';
    } else if (logEntry.type === 'warning') {
        icon = '⚠️';
        color = '#ffd93d';
        bgColor = 'rgba(255, 217, 61, 0.1)';
    } else if (logEntry.type === 'network') {
        icon = '🌐';
        color = '#00d4ff';
        bgColor = 'rgba(0, 212, 255, 0.05)';
    }
    
    logElement.style.cssText = `
        margin-bottom: 4px;
        padding: 10px 12px;
        border-radius: 6px;
        background: ${bgColor};
        border-left: 3px solid ${color};
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: ${color};
        display: flex;
        gap: 8px;
        align-items: flex-start;
        animation: slideIn 0.2s ease;
    `;
    
    logElement.innerHTML = `
        <span style="flex-shrink: 0;">${icon}</span>
        <span style="flex-shrink: 0; opacity: 0.6; font-size: 11px;">${logEntry.timestamp}</span>
        <span style="flex: 1; word-break: break-word;">${escapeHtml(logEntry.message)}</span>
    `;
    
    output.appendChild(logElement);
    output.scrollTop = output.scrollHeight;
    
    if (output.children.length > 500) {
        output.removeChild(output.firstChild);
    }
}

function executeConsoleCommand(command) {
    if (!command.trim()) return;
    
    addConsoleLog(`> ${command}`, 'log');
    
    if (command === 'clear' || command === 'cls') {
        clearConsole();
        return;
    }
    
    if (command === 'help') {
        showConsoleHelp();
        return;
    }
    
    try {
        const result = eval(command);
        addConsoleLog(`← ${JSON.stringify(result)}`, 'log');
    } catch (error) {
        addConsoleLog(`Erro: ${error.message}`, 'error');
    }
}

function filterConsoleLogs(filterType) {
    consoleFilter = filterType;
    const output = document.getElementById('console-output');
    output.innerHTML = '';
    
    let logsToShow = [];
    
    if (filterType === 'all') logsToShow = consoleLogs.all;
    else if (filterType === 'logs') logsToShow = consoleLogs.logs;
    else if (filterType === 'errors') logsToShow = consoleLogs.errors;
    else if (filterType === 'warnings') logsToShow = consoleLogs.warnings;
    else if (filterType === 'network') logsToShow = consoleLogs.network;
    
    logsToShow.forEach(log => renderConsoleLog(log));
}

function updateConsoleTabCounters() {
    const tabs = document.querySelectorAll('.console-tab');
    tabs.forEach(tab => {
        const type = tab.dataset.tab;
        let count = 0;
        
        if (type === 'logs') count = consoleLogs.logs.length;
        else if (type === 'errors') count = consoleLogs.errors.length;
        else if (type === 'warnings') count = consoleLogs.warnings.length;
        else if (type === 'network') count = consoleLogs.network.length;
        
        const currentText = tab.textContent.split('(')[0].trim();
        tab.textContent = count > 0 ? `${currentText} (${count})` : currentText;
    });
}

function clearConsole() {
    consoleLogs = {
        all: [],
        logs: [],
        errors: [],
        warnings: [],
        network: []
    };
    document.getElementById('console-output').innerHTML = '';
    updateConsoleTabCounters();
    addConsoleLog('🧹 Console limpo', 'log');
}

function showConsoleHelp() {
    const helpMessages = [
        '📖 Comandos Disponíveis:',
        '  • clear/cls - Limpa o console',
        '  • help - Mostra esta ajuda',
        '  • Qualquer JavaScript válido',
    ];
    helpMessages.forEach(msg => addConsoleLog(msg, 'log'));
}

function exportConsoleLogs() {
    const logsText = consoleLogs.all.map(log => 
        `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-console-${Date.now()}.txt`;
    a.click();
    
    addConsoleLog('💾 Logs exportados!', 'log');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== SETTINGS ====================
function setupSettingsControls() {
    document.getElementById('wallpaper-input').addEventListener('change', handleWallpaperUpload);
    document.getElementById('remove-wallpaper').addEventListener('click', removeWallpaper);
    document.getElementById('clear-data').addEventListener('click', clearBrowsingData);
    document.getElementById('clear-history').addEventListener('click', clearAllHistory);
}

async function loadSettings() {
    if (window.electronAPI) {
        const settings = await window.electronAPI.loadSettings();
        if (settings.wallpaper) {
            applyWallpaper(settings.wallpaper);
        }
    }
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            applyWallpaper(dataUrl);
            wallpaper = dataUrl;
            
            if (window.electronAPI) {
                window.electronAPI.saveSettings({ wallpaper: dataUrl });
            }
            
            addConsoleLog('🎨 Papel de parede atualizado!', 'log');
        };
        reader.readAsDataURL(file);
    }
}

function applyWallpaper(dataUrl) {
    const homeContainer = document.querySelector('.home-container');
    homeContainer.style.backgroundImage = `url(${dataUrl})`;
    homeContainer.style.backgroundSize = 'cover';
    homeContainer.style.backgroundPosition = 'center';
    homeContainer.style.backgroundAttachment = 'fixed';
    
    const preview = document.getElementById('wallpaper-preview');
    preview.style.backgroundImage = `url(${dataUrl})`;
    preview.style.display = 'block';
}

function removeWallpaper() {
    wallpaper = null;
    document.querySelector('.home-container').style.backgroundImage = 'none';
    document.getElementById('wallpaper-preview').style.display = 'none';
    
    if (window.electronAPI) {
        window.electronAPI.saveSettings({ wallpaper: null });
    }
    
    addConsoleLog('🗑️ Papel de parede removido', 'log');
}

async function clearBrowsingData() {
    if (confirm('Limpar todos os dados de navegação?')) {
        if (window.electronAPI) {
            await window.electronAPI.clearIncognitoData();
        }
        addConsoleLog('🧹 Dados limpos!', 'log');
        alert('✅ Dados de navegação limpos!');
    }
}

// ==================== MODO ANÔNIMO ====================
function toggleIncognito() {
    isIncognito = !isIncognito;
    const btn = document.getElementById('sidebar-incognito');
    
    if (isIncognito) {
        btn.classList.add('active');
        addConsoleLog('🕶️ Modo Anônimo ATIVADO', 'log');
        alert('🕶️ Modo Anônimo Ativado!');
    } else {
        btn.classList.remove('active');
        addConsoleLog('✅ Modo Normal', 'log');
        alert('✅ Modo Normal Ativado');
    }
}

// ==================== ANIMAÇÕES ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.navigateToPage = navigateToPage;
window.navigateToUrl = navigateToUrl;
