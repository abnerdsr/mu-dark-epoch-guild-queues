/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const TABLES = [
    "users",
    "queues",
    "queue_items",
    "drop_events",
    "drop_participants",
    "pgmigrations",
];

/**
 * Fecha o banco para as chaves públicas do Supabase (anon/authenticated).
 *
 * Todo acesso a dados agora passa pelas rotas do Next.js (app/api), que usam a
 * service role key no servidor. A service role ignora RLS, então habilitar RLS
 * sem nenhuma policy bloqueia apenas o acesso direto pela API pública.
 *
 * IMPORTANTE: aplicar SOMENTE depois que a versão do app que usa as rotas de
 * servidor estiver publicada (a versão antiga fala direto com o Supabase).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    const statements = TABLES.map(
        (table) => `
        ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
        REVOKE ALL ON TABLE public.${table} FROM anon, authenticated;`
    ).join("\n");

    pgm.sql(`
        ${statements}

        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

        -- Tabelas/sequências criadas no futuro também nascem fechadas
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    `);
};

/**
 * Reabre o banco (volta ao comportamento antigo, inseguro).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    const statements = TABLES.map(
        (table) => `
        ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON TABLE public.${table} TO anon, authenticated;`
    ).join("\n");

    pgm.sql(`
        ${statements}

        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
    `);
};
