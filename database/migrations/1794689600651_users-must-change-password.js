/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Marca usuários que precisam trocar a senha no próximo login
 * (usuários criados pelo master nascem com senha = username).
 * Usuários existentes ficam com `false` e continuam funcionando como antes.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`
        ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.sql(`
        ALTER TABLE public.users DROP COLUMN IF EXISTS must_change_password;
    `);
};
