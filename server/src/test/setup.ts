// Roda antes de cada arquivo de teste, antes dos imports da aplicação —
// garante que env.ts valide um ambiente de teste completo e offline.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'segredo-de-teste-nao-usar-em-producao';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'anon-de-teste';
