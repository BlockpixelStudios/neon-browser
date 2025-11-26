// ==================== SUPABASE CONFIGURATION ====================
// Arquivo de configuração do Supabase para Neon Browser

// IMPORTANTE: Nunca commite este arquivo com suas credenciais reais!
// Use variáveis de ambiente em produção

const supabaseConfig = {
    // URL do seu projeto Supabase
    // Encontre em: Settings > API > Project URL
    url: process.env.SUPABASE_URL || 'https://iiwfvifwviuoohepjesx.supabase.co',
    
    // Chave pública (anon key)
    // Encontre em: Settings > API > Project API keys > anon public
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpd2Z2aWZ3dml1b29oZXBqZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTUzNjYsImV4cCI6MjA3OTc3MTM2Nn0.6qJ_OzjHsss98sV_FsvTBcDjiQrvzRgmjaH1h5dobhg',
    
    // Chave de serviço (service_role key) - NUNCA EXPONHA NO FRONTEND!
    // Encontre em: Settings > API > Project API keys > service_role
    // Use apenas no backend (main.js)
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpd2Z2aWZ3dml1b29oZXBqZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE5NTM2NiwiZXhwIjoyMDc5NzcxMzY2fQ.ESCcuRPowpDeHHFXRpi6y0FnRHP-D3RjUpLvpsR0ISk'
};

module.exports = supabaseConfig;

// ==================== COMO USAR ====================

/*
1. INSTALAR O CLIENTE SUPABASE:
   npm install @supabase/supabase-js

2. NO SEU CÓDIGO (renderer.js ou main.js):
   
   const { createClient } = require('@supabase/supabase-js');
   const config = require('./database/supabase-config');
   
   const supabase = createClient(config.url, config.anonKey);

3. EXEMPLOS DE USO:

   // INSERIR HISTÓRICO
   const { data, error } = await supabase
       .from('browsing_history')
       .insert([
           { 
               user_id: 'uuid-do-usuario',
               url: 'https://example.com',
               title: 'Example Site'
           }
       ]);
   
   // BUSCAR HISTÓRICO
   const { data, error } = await supabase
       .from('browsing_history')
       .select('*')
       .eq('user_id', 'uuid-do-usuario')
       .order('last_visit', { ascending: false })
       .limit(50);
   
   // SALVAR CONFIGURAÇÕES
   const { data, error } = await supabase
       .from('user_settings')
       .upsert({ 
           user_id: 'uuid-do-usuario',
           theme: 'dark',
           wallpaper_url: 'url-da-imagem'
       });
   
   // ADICIONAR BOOKMARK
   const { data, error } = await supabase
       .from('bookmarks')
       .insert([
           {
               user_id: 'uuid-do-usuario',
               url: 'https://github.com',
               title: 'GitHub',
               folder: 'Desenvolvimento'
           }
       ]);

4. AUTENTICAÇÃO (OPCIONAL):

   // Criar usuário
   const { user, error } = await supabase.auth.signUp({
       email: 'user@example.com',
       password: 'senha-segura'
   });
   
   // Login
   const { user, error } = await supabase.auth.signIn({
       email: 'user@example.com',
       password: 'senha-segura'
   });
   
   // Pegar usuário atual
   const user = supabase.auth.user();
   
   // Logout
   await supabase.auth.signOut();

*/
