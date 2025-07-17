/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.sql(`
        create table public.queues (
            id uuid not null default gen_random_uuid (),
            title character varying(255) not null,
            created_by uuid null,
            created_at timestamp with time zone null default now(),
            item_name text null,
            image_url text null,
            constraint queues_pkey primary key (id),
            constraint queues_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE
        );
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
