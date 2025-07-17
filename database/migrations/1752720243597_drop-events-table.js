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
        create table public.drop_events (
            id uuid not null default gen_random_uuid (),
            queue_id uuid null,
            drop_count integer not null,
            created_at timestamp with time zone null default now(),
            created_by uuid null,
            constraint drop_events_pkey primary key (id),
            constraint drop_events_created_by_fkey foreign KEY (created_by) references users (id),
            constraint drop_events_queue_id_fkey foreign KEY (queue_id) references queues (id) on delete CASCADE,
            constraint drop_events_drop_count_check check (
                (
                (drop_count >= 0)
                and (drop_count <= 5)
                )
            )
        );

        create index IF not exists idx_drop_events_queue_id on public.drop_events using btree (queue_id);

        create index IF not exists idx_drop_events_created_by on public.drop_events using btree (created_by);
    `)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
