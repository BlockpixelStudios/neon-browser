// Neon Browser Web App - JavaScript (Sem Electron!)

let currentPage = 'home';
let history = [];
let browserHistory = [];
let isIncognito = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupBrowser();
    setupConsole();
    setupSettings();
    loadHistory();
    addConsoleLog('💜 Neon Browser iniciado!');
});

// ==================== NAVEGAÇÃO ENTRE PÁGINAS ====================
function setupNavigation() {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            if (page) navigateToPage(page);
        });
    });

    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            navigateToPage(action);
        });
    });

    // Modo Anônimo
    document.getElementById('incognito-btn')?.addEventListener('click', toggleIncognito);
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
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        addConsoleLog(`📄 Navegou para: ${page}`);
    }
}

// ==================== BROWSER ====================
function setupBrowser() {
    const homeSearchInput = document.getElementById('home-search-input');
    const homeSearchBtn = document.getElementById('home-search-btn');
    const urlBar = document.getElementById('url-bar');
    const goBtn = document.getElementById('go-btn');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const homeBtn = document.getElementById('home-btn');
    const frame = document.getElementById('browser-frame');

    // Home search
    const navigateFromHome = () => {
        const query = homeSearchInput.value.trim();
        if (query) {
            navigateToPage('browser');
            setTimeout(() => navigateToUrl(query), 100);
        }
    };

    homeSearchBtn?.addEventListener('click', navigateFromHome);
    homeSearchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') navigateFromHome();
    });

    // Browser navigation
    goBtn?.addEventListener('click', () => navigateToUrl(urlBar.value));
    urlBar?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') navigateToUrl(urlBar.value);
    });

    backBtn?.addEventListener('click', () => {
        if (browserHistory.length > 0) {
            frame.contentWindow.history.back();
        }
    });

    forwardBtn?.addEventListener('click', () => {
        frame.contentWindow.history.forward();
    });

    reloadBtn?.addEventListener('click', () => {
        if (frame.src) {
            frame.src = frame.src;
        }
    });

    homeBtn?.addEventListener('click', () => navigateToPage('home'));
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

    const frame = document.getElementById('browser-frame');
    const urlBar = document.getElementById('url-bar');
    
    try {
        frame.src = url;
        urlBar.value = url;
        browserHistory.push(url);
        addToHistory(url, 'Página Visitada');
        addConsoleLog(`🌐 Navegando: ${url}`, 'network');
    } catch (error) {
        addConsoleLog(`❌ Erro ao navegar: ${error.message}`, 'error');
        alert('⚠️ Não foi possível carregar esta URL. Alguns sites bloqueiam frames.');
    }
}

// ==================== HISTÓRICO ====================
function addToHistory(url, title) {
    if (isIncognito) {
        addConsoleLog('🕶️ Modo anônimo: histórico não salvo', 'warning');
        return;
    }

    const item = {
        url,
        title,
        timestamp: new Date().toISOString(),
        favicon: '🌐'
    };

    history.unshift(item);
    
    // Salvar no localStorage
    try {
        localStorage.setItem('neon-history', JSON.stringify(history.slice(0, 100)));
        updateRecentSites();
    } catch (error) {
        addConsoleLog(`❌ Erro ao salvar histórico: ${error.message}`, 'error');
    }
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('neon-history');
        if (saved) {
            history = JSON.parse(saved);
            updateRecentSites();
            renderHistory();
        }
    } catch (error) {
        addConsoleLog(`❌ Erro ao carregar histórico: ${error.message}`, 'error');
    }
}

function updateRecentSites() {
    const container = document.getElementById('recent-sites');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = `
            <div class="site-card">
                <div class="site-icon">🌐</div>
                <div class="site-name">Nenhum site ainda</div>
                <div class="site-url">Comece a navegar!</div>
            </div>
        `;
        return;
    }

    const recent = history.slice(0, 6);
    container.innerHTML = recent.map(item => `
        <div class="site-card" onclick="window.navigateToUrl('${item.url}'); window.navigateToPage('browser');">
            <div class="site-icon">${item.favicon}</div>
            <div class="site-name">${item.title}</div>
            <div class="site-url">${item.url}</div>
        </div>
    `).join('');
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum histórico ainda</p>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="site-card" onclick="window.navigateToUrl('${item.url}'); window.navigateToPage('browser');">
            <div class="site-icon">${item.favicon}</div>
            <div class="site-name">${item.title}</div>
            <div class="site-url">${item.url}</div>
            <div class="site-time">${formatTime(item.timestamp)}</div>
        </div>
    `).join('');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
}

// ==================== CONSOLE ====================
let consoleLogs = [];

function setupConsole() {
    const consoleInput = document.getElementById('console-input');
    if (!consoleInput) return;

    consoleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeCommand(consoleInput.value);
            consoleInput.value = '';
        }
    });
}

function addConsoleLog(message, type = 'log') {
    const output = document.getElementById('console-output');
    if (!output) return;

    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = { message, type, timestamp };
    consoleLogs.push(logEntry);

    const logElement = document.createElement('div');
    logElement.style.marginBottom = '8px';
    logElement.style.padding = '8px';
    logElement.style.borderRadius = '4px';
    logElement.style.fontFamily = 'Courier New, monospace';
    logElement.style.fontSize = '13px';

    let icon = '📝';
    let color = '#6bcf7f';
    let bg = 'rgba(107, 207, 127, 0.05)';

    if (type === 'error') {
        icon = '❌';
        color = '#ff6b6b';
        bg = 'rgba(255, 107, 107, 0.1)';
    } else if (type === 'warning') {
        icon = '⚠️';
        color = '#ffd93d';
        bg = 'rgba(255, 217, 61, 0.1)';
    } else if (type === 'network') {
        icon = '🌐';
        color = '#00d4ff';
        bg = 'rgba(0, 212, 255, 0.05)';
    }

    logElement.style.color = color;
    logElement.style.background = bg;
    logElement.style.borderLeft = `3px solid ${color}`;
    logElement.innerHTML = `${icon} [${timestamp}] ${message}`;

    output.appendChild(logElement);
    output.scrollTop = output.scrollHeight;
}

function executeCommand(command) {
    if (!command.trim()) return;

    addConsoleLog(`> ${command}`, 'log');

    if (command === 'clear' || command === 'cls') {
        document.getElementById('console-output').innerHTML = '';
        consoleLogs = [];
        addConsoleLog('🧹 Console limpo', 'log');
        return;
    }

    if (command === 'help') {
        addConsoleLog('Comandos: clear, help, history, about', 'log');
        return;
    }

    if (command === 'history') {
        addConsoleLog(`Histórico: ${history.length} itens`, 'log');
        return;
    }

    if (command === 'about') {
        addConsoleLog('Neon Browser v1.0.0 - PWA Edition', 'log');
        return;
    }

    try {
        const result = eval(command);
        addConsoleLog(`← ${JSON.stringify(result)}`, 'log');
    } catch (error) {
        addConsoleLog(`Erro: ${error.message}`, 'error');
    }
}

// ==================== CONFIGURAÇÕES ====================
function setupSettings() {
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Limpar todo o histórico?')) {
                history = [];
                localStorage.removeItem('neon-history');
                updateRecentSites();
                renderHistory();
                addConsoleLog('🗑️ Histórico limpo!', 'log');
            }
        });
    }

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            addConsoleLog(`🎨 Tema: ${e.target.value}`, 'log');
            // Implementar mudança de tema aqui
        });
    }
}

// ==================== MODO ANÔNIMO ====================
function toggleIncognito() {
    isIncognito = !isIncognito;
    const btn = document.getElementById('incognito-btn');

    if (isIncognito) {
        btn.style.background = 'rgba(176, 38, 255, 0.3)';
        btn.style.borderColor = 'var(--neon-purple)';
        addConsoleLog('🕶️ Modo Anônimo ATIVADO', 'log');
        alert('🕶️ Modo Anônimo ativado! Histórico não será salvo.');
    } else {
        btn.style.background = '';
        btn.style.borderColor = '';
        addConsoleLog('✅ Modo Normal', 'log');
    }
}

// ==================== FUNÇÕES GLOBAIS ====================
window.navigateToPage = navigateToPage;
window.navigateToUrl = navigateToUrl;

console.log('💜 Neon Browser Web carregado!');
