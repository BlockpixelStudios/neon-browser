-- ==================== NEON BROWSER DATABASE ====================
-- Criado para: PostgreSQL (Supabase)
-- Versão: 1.0.0
-- Data: 2024-11-26

-- ==================== TABELA: USERS ====================
-- Armazena informações dos usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ==================== TABELA: USER_SETTINGS ====================
-- Configurações personalizadas do usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallpaper_url TEXT,
    theme VARCHAR(20) DEFAULT 'dark',
    default_incognito BOOLEAN DEFAULT false,
    ai_enabled BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'pt-BR',
    font_size INTEGER DEFAULT 14,
    auto_save_history BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==================== TABELA: BROWSING_HISTORY ====================
-- Histórico completo de navegação
CREATE TABLE IF NOT EXISTS browsing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(500),
    favicon_url TEXT,
    visit_count INTEGER DEFAULT 1,
    last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_incognito BOOLEAN DEFAULT false
);

-- Índices para busca rápida
CREATE INDEX idx_history_user_id ON browsing_history(user_id);
CREATE INDEX idx_history_url ON browsing_history(url);
CREATE INDEX idx_history_last_visit ON browsing_history(last_visit DESC);
CREATE INDEX idx_history_title ON browsing_history USING gin(to_tsvector('portuguese', title));

-- ==================== TABELA: BOOKMARKS ====================
-- Favoritos/Marcadores
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    favicon_url TEXT,
    folder VARCHAR(100) DEFAULT 'Geral',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_folder ON bookmarks(folder);
CREATE INDEX idx_bookmarks_tags ON bookmarks USING gin(tags);

-- ==================== TABELA: TABS ====================
-- Sincronização de abas abertas entre dispositivos
CREATE TABLE IF NOT EXISTS tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    title VARCHAR(500),
    position INTEGER,
    is_active BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tabs_user_id ON tabs(user_id);
CREATE INDEX idx_tabs_device_id ON tabs(device_id);

-- ==================== TABELA: EXTENSIONS ====================
-- Extensões instaladas pelo usuário
CREATE TABLE IF NOT EXISTS extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    extension_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20),
    icon_url TEXT,
    is_enabled BOOLEAN DEFAULT true,
    settings JSONB,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_extensions_user_id ON extensions(user_id);
CREATE INDEX idx_extensions_extension_id ON extensions(extension_id);

-- ==================== TABELA: DOWNLOAD_HISTORY ====================
-- Histórico de downloads
CREATE TABLE IF NOT EXISTS download_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    download_path TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_downloads_user_id ON download_history(user_id);
CREATE INDEX idx_downloads_created_at ON download_history(created_at DESC);

-- ==================== TABELA: SEARCH_HISTORY ====================
-- Histórico de buscas
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_engine VARCHAR(50) DEFAULT 'google',
    results_clicked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_search_user_id ON search_history(user_id);
CREATE INDEX idx_search_query ON search_history USING gin(to_tsvector('portuguese', query));
CREATE INDEX idx_search_created_at ON search_history(created_at DESC);

-- ==================== TABELA: CONSOLE_LOGS ====================
-- Logs do console (opcional, para debug)
CREATE TABLE IF NOT EXISTS console_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    log_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_logs_user_id ON console_logs(user_id);
CREATE INDEX idx_logs_type ON console_logs(log_type);
CREATE INDEX idx_logs_created_at ON console_logs(created_at DESC);

-- ==================== TABELA: DEVICES ====================
-- Dispositivos conectados do usuário
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    os VARCHAR(50),
    browser_version VARCHAR(20),
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);

-- ==================== FUNÇÕES E TRIGGERS ====================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tabs_updated_at BEFORE UPDATE ON tabs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON extensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== VIEWS ÚTEIS ====================

-- View: Sites mais visitados
CREATE OR REPLACE VIEW most_visited_sites AS
SELECT 
    user_id,
    url,
    title,
    favicon_url,
    visit_count,
    last_visit
FROM browsing_history
WHERE is_incognito = false
ORDER BY visit_count DESC, last_visit DESC;

-- View: Histórico recente (últimos 7 dias)
CREATE OR REPLACE VIEW recent_history AS
SELECT 
    user_id,
    url,
    title,
    favicon_url,
    visit_count,
    last_visit
FROM browsing_history
WHERE last_visit >= NOW() - INTERVAL '7 days'
    AND is_incognito = false
ORDER BY last_visit DESC;

-- View: Estatísticas do usuário
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT bh.id) as total_visits,
    COUNT(DISTINCT b.id) as total_bookmarks,
    COUNT(DISTINCT e.id) as total_extensions,
    COUNT(DISTINCT d.id) as total_devices
FROM users u
LEFT JOIN browsing_history bh ON u.id = bh.user_id
LEFT JOIN bookmarks b ON u.id = b.user_id
LEFT JOIN extensions e ON u.id = e.user_id
LEFT JOIN devices d ON u.id = d.user_id
GROUP BY u.id, u.username;

-- ==================== ROW LEVEL SECURITY (RLS) ====================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE console_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuário só acessa seus próprios dados
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own history" ON browsing_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tabs" ON tabs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own extensions" ON extensions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own downloads" ON download_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own searches" ON search_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON console_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own devices" ON devices
    FOR ALL USING (auth.uid() = user_id);

-- ==================== DADOS INICIAIS (OPCIONAL) ====================

-- Inserir usuário de exemplo (remover em produção)
-- INSERT INTO users (email, username, full_name) 
-- VALUES ('exemplo@neonbrowser.com', 'usuario_teste', 'Usuário Teste');

-- ==================== COMENTÁRIOS DAS TABELAS ====================

COMMENT ON TABLE users IS 'Usuários do Neon Browser';
COMMENT ON TABLE user_settings IS 'Configurações personalizadas de cada usuário';
COMMENT ON TABLE browsing_history IS 'Histórico completo de navegação';
COMMENT ON TABLE bookmarks IS 'Sites favoritos/marcadores';
COMMENT ON TABLE tabs IS 'Abas abertas sincronizadas entre dispositivos';
COMMENT ON TABLE extensions IS 'Extensões instaladas';
COMMENT ON TABLE download_history IS 'Histórico de downloads';
COMMENT ON TABLE search_history IS 'Histórico de buscas';
COMMENT ON TABLE console_logs IS 'Logs do console para debug';
COMMENT ON TABLE devices IS 'Dispositivos conectados';

-- ==================== FIM ====================
-- Database criado com sucesso! 🎉
-- Use o Supabase Dashboard para executar este SQL
