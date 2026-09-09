// Roda antes de cada arquivo de teste, antes dos imports da aplicação —
// garante que env.ts valide um ambiente de teste completo e offline.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'segredo-de-teste-nao-usar-em-producao';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'anon-de-teste';
// Marca as chaves de IA como presentes-porém-vazias: o dotenv em env.ts não as
// sobrescreve a partir de um .env local, e o filtro de vazios as trata como
// não configuradas — as rotas de IA seguem devolvendo 503 nos testes.
process.env.GEMINI_API_KEY = '';
process.env.ANTHROPIC_API_KEY = '';
