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
        create table public.queue_items (
            id uuid not null default gen_random_uuid (),
            queue_id uuid null,
            name character varying(255) not null,
            position integer not null,
            status character varying(20) null default 'waiting'::character varying,
            requested_by uuid null,
            created_at timestamp with time zone null default now(),
            constraint queue_items_pkey primary key (id),
            constraint queue_items_queue_id_fkey foreign KEY (queue_id) references queues (id) on delete CASCADE,
            constraint queue_items_requested_by_fkey foreign KEY (requested_by) references users (id) on delete CASCADE,
            constraint queue_items_status_check check (
                (
                (status)::text = any (
                    array[
                    ('waiting'::character varying)::text,
                    ('approved'::character varying)::text,
                    ('completed'::character varying)::text
                    ]
                )
                )
            )
        );
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
